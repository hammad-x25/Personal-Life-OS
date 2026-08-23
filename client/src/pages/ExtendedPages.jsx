import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
function Header({ eyebrow = "MEASURE", title, description, children }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
function ErrorBox({ error }) {
  return error ? (
    <div className="error-box">
      {error.response?.data?.message || error.message || "Something went wrong"}
    </div>
  ) : null;
}
function Chart({ data, dataKey = "score", color = "#a4f17d" }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#263648" strokeDasharray="3 3" />
          <XAxis dataKey="dateKey" stroke="#8493a5" />
          <YAxis domain={[0, 100]} stroke="#8493a5" />
          <Tooltip
            contentStyle={{
              background: "#111a25",
              border: "1px solid #29384a",
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FinancePage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    dateKey: today(),
    type: "EXPENSE",
  });
  const [error, setError] = useState(null);
  async function load() {
    try {
      const [expenses, finance] = await Promise.all([
        api.get("/expenses"),
        api.get("/analytics/finance"),
      ]);
      setItems(expenses.data.data);
      setSummary(finance.data.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      setForm({ ...form, amount: "", description: "" });
      await load();
    } catch (e) {
      setError(e);
    }
  }
  const total = summary?.totals?.find((x) => x._id === "EXPENSE")?.total || 0;
  return (
    <div>
      <Header
        eyebrow="MONEY"
        title="Finance"
        description="Record spending clearly, then understand the pattern."
      />
      <ErrorBox error={error} />
      <div className="grid">
        <div className="card">
          <span className="eyebrow">PERIOD SPENDING</span>
          <strong>Rs. {total.toLocaleString()}</strong>
          <p className="muted">Current selected window</p>
        </div>
        <div className="card">
          <span className="eyebrow">TOP CATEGORY</span>
          <strong>{summary?.categories?.[0]?._id || "—"}</strong>
          <p className="muted">Highest spending category</p>
        </div>
      </div>
      <section className="panel form-panel">
        <span className="eyebrow">QUICK EXPENSE</span>
        <form className="grid-form" onSubmit={submit}>
          <input
            type="number"
            min="0"
            required
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            required
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="date"
            value={form.dateKey}
            onChange={(e) => setForm({ ...form, dateKey: e.target.value })}
          />
          <button>Record</button>
        </form>
      </section>
      <section className="panel">
        <span className="eyebrow">RECENT RECORDS</span>
        {items.slice(0, 20).map((x) => (
          <div className="list-row" key={x._id}>
            <div className="time-mark">Rs.</div>
            <div className="row-main">
              <strong>
                {x.amount.toLocaleString()} · {x.category}
              </strong>
              <small>
                {x.dateKey} · {x.description || "No description"}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={async () => {
                await api.delete(`/expenses/${x._id}`);
                load();
              }}
            >
              Delete
            </button>
          </div>
        ))}
        {!items.length && <p className="muted">No financial records yet.</p>}
      </section>
    </div>
  );
}

export function CommandDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api
      .get("/dashboard/today")
      .then((r) => setData(r.data.data))
      .catch(setError);
  }, []);
  if (error)
    return (
      <div>
        <Header
          title="Today"
          description="Your command center could not load."
        />
        <ErrorBox error={error} />
      </div>
    );
  if (!data) return <div className="center">Loading today…</div>;
  const score = data.score?.score ?? 0;
  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">TODAY'S COMMAND CENTER</span>
          <h1>Make the day count.</h1>
          <p className="muted">
            A live view of the plan, the record, and the next useful action.
          </p>
        </div>
        <a className="button" href="/app/tasks">
          + Add a task
        </a>
      </div>
      <div className="grid">
        <div className="card">
          <span className="eyebrow">PRODUCTIVITY</span>
          <strong>{score}%</strong>
          <p className="muted">Backend-calculated today</p>
        </div>
        <div className="card">
          <span className="eyebrow">TASKS</span>
          <strong>
            {data.tasks.completed} / {data.tasks.total}
          </strong>
          <p className="muted">Completed today</p>
        </div>
        <div className="card">
          <span className="eyebrow">SPENDING</span>
          <strong>
            Rs. {Number(data.finance.total || 0).toLocaleString()}
          </strong>
          <p className="muted">Recorded today</p>
        </div>
        <div className="card">
          <span className="eyebrow">PHONE</span>
          <strong>
            {data.phoneUsage
              ? `${Math.floor(data.phoneUsage.phoneUsageMinutes / 60)}h ${data.phoneUsage.phoneUsageMinutes % 60}m`
              : "—"}
          </strong>
          <p className="muted">Daily check-in</p>
        </div>
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <span className="eyebrow">TODAY'S PLAN</span>
          {data.tasks.items.map((task) => (
            <div className="mini-row" key={task._id}>
              <span
                className={`dot ${task.status === "COMPLETED" ? "green" : ""}`}
              />
              <span>{task.title}</span>
              <small>{task.status.replace("_", " ")}</small>
            </div>
          ))}
          {!data.tasks.items.length && (
            <p className="muted">No tasks scheduled for today.</p>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow">GOALS IN MOTION</span>
          {data.goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round(
                ((goal.currentProgress || 0) / (goal.target || 1)) * 100,
              ),
            );
            return (
              <div className="goal-row" key={goal._id}>
                <div>
                  <strong>{goal.title}</strong>
                  <small>
                    {goal.currentProgress || 0} / {goal.target || 0}{" "}
                    {goal.unit || ""}
                  </small>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!data.goals.length && (
            <p className="muted">Create a goal to see progress here.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    deadlineKey: "",
  });
  const [error, setError] = useState(null);
  async function load() {
    try {
      setProjects((await api.get("/projects")).data.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/projects", form);
      setForm({ name: "", description: "", deadlineKey: "" });
      load();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <Header
        eyebrow="WORK"
        title="Projects"
        description="Give meaningful work a home, a deadline, and a visible history."
      />
      <ErrorBox error={error} />
      <section className="panel form-panel">
        <form className="grid-form" onSubmit={submit}>
          <input
            required
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="date"
            value={form.deadlineKey}
            onChange={(e) => setForm({ ...form, deadlineKey: e.target.value })}
          />
          <button>Create project</button>
        </form>
      </section>
      <section className="goal-grid">
        {projects.map((project) => (
          <div className="panel goal-card" key={project._id}>
            <span className="eyebrow">{project.status}</span>
            <h3>{project.name}</h3>
            <p className="muted">
              {project.description || "No description yet."}
            </p>
            <small>
              {project.deadlineKey
                ? `Deadline ${project.deadlineKey}`
                : "No deadline"}
            </small>
            <button
              className="secondary"
              onClick={async () => {
                await api.delete(`/projects/${project._id}`);
                load();
              }}
            >
              Archive
            </button>
          </div>
        ))}
        {!projects.length && (
          <div className="panel">
            <p className="muted">
              Create a project to connect tasks, milestones, and timelines.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export function WorkPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  async function load() {
    setTasks(
      (await api.get("/tasks")).data.data.filter(
        (item) => item.category === "WORK",
      ),
    );
  }
  useEffect(() => {
    load();
  }, []);
  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/tasks", { title, category: "WORK", priority: "MEDIUM" });
    setTitle("");
    load();
  }
  return (
    <div>
      <Header
        eyebrow="DELIVER"
        title="Work"
        description="Keep professional execution visible without mixing it into every personal task."
      />
      <section className="panel form-panel">
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="Work item"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button>Add work task</button>
        </form>
      </section>
      <section className="list">
        {tasks.map((task) => (
          <div className="list-row" key={task._id}>
            <button
              className="check"
              onClick={async () => {
                await api.patch(`/tasks/${task._id}`, {
                  status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
                });
                load();
              }}
            >
              {task.status === "COMPLETED" ? "✓" : ""}
            </button>
            <div className="row-main">
              <strong>{task.title}</strong>
              <small>{task.status}</small>
            </div>
          </div>
        ))}
        {!tasks.length && (
          <div className="panel">
            <p className="muted">No work items yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function AccountabilityHistoryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api
      .get("/spending-accountability/history")
      .then((r) => setItems(r.data.data));
  }, []);
  return (
    <div>
      <Header
        eyebrow="ACCOUNTABILITY"
        title="Spending history"
        description="A record of the days you explicitly accounted for, including zero-spending days."
      />
      <section className="list">
        {items.map((item) => (
          <div className="list-row" key={item._id}>
            <div className="time-mark">{item.dateKey}</div>
            <div className="row-main">
              <strong>Rs. {Number(item.totalSpent).toLocaleString()}</strong>
              <small>
                {item.expenseCount} transactions ·{" "}
                {item.source === "NO_SPENDING"
                  ? "Explicit zero spending"
                  : "Expenses confirmed"}
              </small>
            </div>
            <span className="success">✓</span>
          </div>
        ))}
        {!items.length && (
          <div className="panel">
            <p className="muted">No accountability history yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function NotificationsPage() {
  const [items, setItems] = useState([]);
  async function load() {
    setItems((await api.get("/notifications")).data.data);
  }
  useEffect(() => {
    load();
  }, []);
  async function mark(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }
  return (
    <div>
      <Header
        eyebrow="REMINDERS"
        title="Notifications"
        description="Small prompts that help the operating loop stay closed."
      />
      <section className="list">
        {items.map((item) => (
          <div className="list-row" key={item._id}>
            <div className="dot" />
            <div className="row-main">
              <strong>{item.title}</strong>
              <small>{item.message}</small>
            </div>
            {!item.readAt && (
              <button className="secondary" onClick={() => mark(item._id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
        {!items.length && (
          <div className="panel">
            <p className="muted">No reminders right now.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function AnalyticsPage() {
  const [daily, setDaily] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/analytics/daily"), api.get("/analytics/growth")])
      .then(([d, g]) => {
        setDaily(d.data.data);
        setGrowth(g.data.data);
      })
      .catch(setError);
  }, []);
  return (
    <div>
      <Header
        title="Analytics"
        description="See what you planned, what happened, and how the trend is moving."
      />
      <ErrorBox error={error} />
      <div className="grid">
        <div className="card">
          <span className="eyebrow">CURRENT AVERAGE</span>
          <strong>
            {growth?.currentScore ? `${Math.round(growth.currentScore)}%` : "—"}
          </strong>
          <p className="muted">Selected period</p>
        </div>
        <div className="card">
          <span className="eyebrow">GROWTH</span>
          <strong>
            {growth?.growthPercentage == null
              ? "—"
              : `${growth.growthPercentage >= 0 ? "+" : ""}${growth.growthPercentage.toFixed(1)}%`}
          </strong>
          <p className="muted">Compared with previous period</p>
        </div>
      </div>
      <section className="panel">
        <span className="eyebrow">PRODUCTIVITY OVER TIME</span>
        <Chart data={daily} />
      </section>
    </div>
  );
}

export function TimelinePage() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    api.get("/timeline").then((r) => setEvents(r.data.data));
  }, []);
  return (
    <div>
      <Header
        eyebrow="HISTORY"
        title="Timeline"
        description="A chronological record of the choices and completions that shaped your days."
      />
      <section className="panel">
        {events.map((event) => (
          <div className="list-row" key={event._id}>
            <div className="time-mark">{event.dateKey}</div>
            <div className="row-main">
              <strong>{event.title}</strong>
              <small>
                {event.type} ·{" "}
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          </div>
        ))}
        {!events.length && (
          <p className="muted">Your important events will appear here.</p>
        )}
      </section>
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  async function load() {
    try {
      setReviews((await api.get("/ai/reviews")).data.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function generate(type) {
    try {
      await api.post(`/ai/${type.toLowerCase()}-review`);
      load();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <Header
        eyebrow="REFLECT"
        title="AI reviews"
        description="Qualitative coaching based on your deterministic performance records."
      />
      <ErrorBox error={error} />
      <div className="actions">
        <button onClick={() => generate("daily")}>Generate daily review</button>
        <button className="secondary" onClick={() => generate("weekly")}>
          Generate weekly
        </button>
        <button className="secondary" onClick={() => generate("monthly")}>
          Generate monthly
        </button>
      </div>
      <section className="list">
        {reviews.map((review) => (
          <article className="panel" key={review._id}>
            <span className="eyebrow">
              {review.reviewType} · {review.periodKey}
            </span>
            <h3>{review.summary}</h3>
            <p className="muted">
              Priority: {review.priority || "Not specified"}
            </p>
            <strong>Recommendations</strong>
            <ul>
              {review.recommendations?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
        {!reviews.length && (
          <div className="panel">
            <p className="muted">
              Generate a review after recording a little data.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export function SettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => {
        setUser(r.data.data);
        setForm({
          name: r.data.data.name,
          timezone: r.data.data.timezone,
          currency: r.data.data.currency,
          theme: r.data.data.settings?.theme || "dark",
          phoneUsageRequired: r.data.data.settings?.phoneUsageRequired ?? true,
          spendingAccountabilityRequired:
            r.data.data.settings?.spendingAccountabilityRequired ?? true,
          phoneTargetMinutes: r.data.data.settings?.phoneTargetMinutes || "",
        });
      })
      .catch(setError);
  }, []);
  async function save(e) {
    e.preventDefault();
    try {
      const r = await api.patch("/auth/profile", {
        ...form,
        phoneTargetMinutes: form.phoneTargetMinutes
          ? Number(form.phoneTargetMinutes)
          : undefined,
      });
      setUser(r.data.data);
      setSaved(true);
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <Header
        eyebrow="CONFIGURE"
        title="Settings"
        description="Tune the system to your actual life, timezone, and attention budget."
      />
      <ErrorBox error={error} />
      <section className="panel">
        <form className="grid-form" onSubmit={save}>
          <input
            placeholder="Name"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Timezone"
            value={form.timezone || ""}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          />
          <input
            placeholder="Currency"
            value={form.currency || ""}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Phone target minutes"
            value={form.phoneTargetMinutes || ""}
            onChange={(e) =>
              setForm({ ...form, phoneTargetMinutes: e.target.value })
            }
          />
          <select
            value={form.theme || "dark"}
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={form.phoneUsageRequired ?? true}
              onChange={(e) =>
                setForm({ ...form, phoneUsageRequired: e.target.checked })
              }
            />{" "}
            Require phone usage
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.spendingAccountabilityRequired ?? true}
              onChange={(e) =>
                setForm({
                  ...form,
                  spendingAccountabilityRequired: e.target.checked,
                })
              }
            />{" "}
            Require spending accountability
          </label>
          <button>Save settings</button>
        </form>
        {saved && <p className="success">Settings saved.</p>}
        <p className="muted">
          Accountability requirements remain backend-enforced.
        </p>
      </section>
    </div>
  );
}
