import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

const dateKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );

function useResource(endpoint) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try {
      const r = await api.get(endpoint);
      setItems(r.data.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not load records");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [endpoint]);
  async function create(data) {
    await api.post(endpoint, data);
    await load();
  }
  async function update(id, data) {
    await api.patch(`${endpoint}/${id}`, data);
    await load();
  }
  async function remove(id) {
    await api.delete(`${endpoint}/${id}`);
    await load();
  }
  return { items, loading, error, create, update, remove, reload: load };
}

function PageHeader({ eyebrow, title, description, children }) {
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
function Empty({ children }) {
  return (
    <div className="empty">
      <span className="eyebrow">NOTHING HERE YET</span>
      <p className="muted">{children}</p>
    </div>
  );
}
function ErrorMessage({ error }) {
  return error ? <p className="error">{error}</p> : null;
}

export function Dashboard() {
  const tasks = useResource("/tasks"),
    goals = useResource("/goals"),
    habits = useResource("/habits"),
    timetable = useResource("/timetable");
  const today = dateKey();
  const todayEvents = timetable.items.filter((x) => x.dateKey === today);
  const doneTasks = tasks.items.filter((x) => x.status === "COMPLETED").length;
  const activeGoals = goals.items.filter((x) => x.status === "ACTIVE");
  return (
    <div>
      <div className="hero">
        <div>
          <span className="eyebrow">TODAY’S COMMAND CENTER</span>
          <h1>Make the day count.</h1>
          <p className="muted">
            Your plan becomes useful when it becomes a record.
          </p>
        </div>
        <a className="button" href="/app/tasks">
          + Add a task
        </a>
      </div>
      <div className="grid">
        <Card
          label="PRODUCTIVITY"
          value="—"
          detail="Historical score arrives after review"
        />
        <Card
          label="TASKS"
          value={`${doneTasks} / ${tasks.items.length}`}
          detail="Completed tasks"
        />
        <Card
          label="HABITS"
          value={habits.items.length}
          detail="Active routines"
        />
        <Card
          label="TIMETABLE"
          value={todayEvents.length}
          detail="Events planned today"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <span className="eyebrow">TODAY’S PLAN</span>
          {tasks.loading ? (
            <p className="muted">Loading…</p>
          ) : (
            tasks.items.slice(0, 5).map((task) => (
              <div className="mini-row" key={task._id}>
                <span
                  className={`dot ${task.status === "COMPLETED" ? "green" : ""}`}
                />
                <span>{task.title}</span>
                <small>{task.status.replace("_", " ")}</small>
              </div>
            ))
          )}
          {!tasks.loading && !tasks.items.length && (
            <Empty>Add your first task to start shaping the day.</Empty>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow">ACTIVE GOALS</span>
          {activeGoals.slice(0, 4).map((goal) => (
            <div className="goal-row" key={goal._id}>
              <div>
                <strong>{goal.title}</strong>
                <small>
                  {goal.currentProgress || 0} / {goal.target || 0}{" "}
                  {goal.unit || ""}
                </small>
              </div>
              <div className="progress">
                <span
                  style={{
                    width: `${Math.min(100, ((goal.currentProgress || 0) / (goal.target || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {!activeGoals.length && (
            <Empty>Create a measurable goal for your next milestone.</Empty>
          )}
        </section>
      </div>
    </div>
  );
}
function Card({ label, value, detail }) {
  return (
    <div className="card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <p className="muted">{detail}</p>
    </div>
  );
}

export function TasksPage() {
  const resource = useResource("/tasks");
    const [form, setForm] = useState({
      title: "",
      priority: "MEDIUM",
      dueDateKey: dateKey(),
      recurrenceType: "NONE",
    });
    async function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
      await resource.create({ title: form.title, priority: form.priority, dueDateKey: form.dueDateKey, recurrence: { type: form.recurrenceType } });
      setForm({ ...form, title: "" });
    }
  return (
    <div>
      <PageHeader
        eyebrow="EXECUTE"
        title="Tasks"
        description="Turn intentions into visible, finishable work."
      />
      <section className="panel form-panel">
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
          </select>
            <input
              type="date"
            value={form.dueDateKey}
            onChange={(e) => setForm({ ...form, dueDateKey: e.target.value })}
            />
            <select value={form.recurrenceType} onChange={(e) => setForm({ ...form, recurrenceType: e.target.value })}>
              <option value="NONE">One time</option>
              <option value="DAILY">Every day</option>
              <option value="WEEKLY">Every week</option>
            </select>
            <button>Add task</button>
        </form>
      </section>
      <ErrorMessage error={resource.error} />
      <section className="list">
        {resource.loading ? (
          <p className="muted">Loading tasks…</p>
        ) : (
          resource.items.map((task) => (
            <div
              className={`list-row ${task.status === "COMPLETED" ? "is-done" : ""}`}
              key={task._id}
            >
              <button
                className="check"
                onClick={() =>
                  resource.update(task._id, {
                    status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
                    completedAt:
                      task.status === "COMPLETED" ? null : new Date(),
                  })
                }
              >
                {task.status === "COMPLETED" ? "✓" : ""}
              </button>
              <div className="row-main">
                <strong>{task.title}</strong>
                <small>
                  {task.priority} · Due {task.dueDateKey || "—"}
                </small>
              </div>
              <button
                className="icon-button"
                onClick={() => resource.remove(task._id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
        {!resource.loading && !resource.items.length && (
          <Empty>Capture the first concrete action for today.</Empty>
        )}
      </section>
    </div>
  );
}

export function GoalsPage() {
  const resource = useResource("/goals");
  const [form, setForm] = useState({
    title: "",
    target: 100,
    currentProgress: 0,
    unit: "%",
    deadlineKey: "",
  });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressValue, setProgressValue] = useState("");
  const [milestone, setMilestone] = useState({ title: "", description: "", deadlineKey: "" });
  async function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await resource.create({
      ...form,
      target: Number(form.target),
      currentProgress: Number(form.currentProgress),
    });
    setForm({ ...form, title: "" });
  }
  async function updateProgress(goal) {
    await resource.update(goal._id, { currentProgress: Number(progressValue) });
    setProgressValue("");
    setSelectedGoal(null);
  }
  async function addMilestone(e) {
    e.preventDefault();
    if (!selectedGoal || !milestone.title.trim()) return;
    const response = await api.post(`/goals/${selectedGoal._id}/milestones`, milestone);
    setSelectedGoal({ ...selectedGoal, milestones: [...(selectedGoal.milestones || []), response.data.data] });
    setMilestone({ title: "", description: "", deadlineKey: "" });
  }
  async function toggleMilestone(item) {
    const response = await api.patch(`/goals/${selectedGoal._id}/milestones/${item._id}`, { completed: !item.completed });
    setSelectedGoal({ ...selectedGoal, milestones: selectedGoal.milestones.map(current => current._id === item._id ? response.data.data : current) });
  }
  return (
    <div>
      <PageHeader
        eyebrow="DIRECTION"
        title="Goals"
        description="Make progress measurable without losing the bigger picture."
      />
      <section className="panel form-panel">
        <form className="grid-form" onSubmit={add}>
          <input
            placeholder="Goal title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="number"
            placeholder="Target"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          />
          <input
            placeholder="Unit, e.g. hours"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <input
            type="date"
            value={form.deadlineKey}
            onChange={(e) => setForm({ ...form, deadlineKey: e.target.value })}
          />
          <button>Add goal</button>
        </form>
      </section>
      <section className="goal-grid">
        {resource.items.map((goal) => {
          const pct = Math.min(
            100,
            Math.round(
              ((goal.currentProgress || 0) / (goal.target || 1)) * 100,
            ),
          );
          return (
            <div className="panel goal-card" key={goal._id}>
              <div className="row-between">
                <span className="eyebrow">{goal.status}</span>
                <button
                  className="icon-button"
                  onClick={() => resource.remove(goal._id)}
                >
                  Delete
                </button>
              </div>
              <h3>{goal.title}</h3>
              <strong>{pct}%</strong>
              <div className="progress">
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="muted">
                {goal.currentProgress || 0} / {goal.target || 0}{" "}
                {goal.unit || ""}
                {goal.deadlineKey && ` · due ${goal.deadlineKey}`}
              </p>
              <div className="inline-form">
                <input type="number" min="0" value={selectedGoal?._id === goal._id ? progressValue : ""} placeholder="New progress" onChange={e => { setSelectedGoal(goal); setProgressValue(e.target.value); }} />
                <button className="secondary" onClick={() => updateProgress(goal)}>Save progress</button>
                <button className="secondary" onClick={() => { setSelectedGoal(goal); setProgressValue(String(goal.currentProgress || 0)); }}>Milestones</button>
              </div>
            </div>
          );
        })}
        {!resource.loading && !resource.items.length && (
          <Empty>
            Choose one outcome that would make the next season meaningful.
          </Empty>
        )}
      </section>
      {selectedGoal && <section className="panel project-detail"><div className="row-between"><div><span className="eyebrow">GOAL MILESTONES</span><h3>{selectedGoal.title}</h3></div><button className="icon-button" onClick={() => setSelectedGoal(null)}>Close</button></div><form className="grid-form" onSubmit={addMilestone}><input required placeholder="Milestone title" value={milestone.title} onChange={e => setMilestone({ ...milestone, title: e.target.value })} /><input placeholder="Description" value={milestone.description} onChange={e => setMilestone({ ...milestone, description: e.target.value })} /><input type="date" value={milestone.deadlineKey} onChange={e => setMilestone({ ...milestone, deadlineKey: e.target.value })} /><button>Add milestone</button></form><div className="list">{(selectedGoal.milestones || []).map(item => <div className="list-row" key={item._id}><button className="icon-button" onClick={() => toggleMilestone(item)}>{item.completed ? "Undo" : "Done"}</button><span className={`dot ${item.completed ? "green" : ""}`} /><strong>{item.title}</strong><small>{item.deadlineKey || "No deadline"}</small></div>)}</div></section>}
    </div>
  );
}

export function HabitsPage() {
    const resource = useResource("/habits");
    const [stats, setStats] = useState({});
  const [instances, setInstances] = useState([]);
  const [form, setForm] = useState({
    title: "",
    dailyTarget: 30,
    targetUnit: "minutes",
    minimumAcceptable: 10,
    preferredTime: "20:00",
    frequencyType: "DAILY",
    weekdays: [1, 2, 3, 4, 5],
    planEndDateKey: "",
  });
  const [logValues, setLogValues] = useState({});
  async function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await resource.create({
      ...form,
      dailyTarget: Number(form.dailyTarget),
      minimumAcceptable: Number(form.minimumAcceptable),
      planStartDateKey: dateKey(),
      planEndDateKey: form.planEndDateKey || undefined,
      frequencyType: form.frequencyType,
      weekdays: form.weekdays,
      status: "ACTIVE",
    });
    setForm({ ...form, title: "" });
  }
    async function log(habit) {
    const actual = logValues[habit._id];
    if (actual === undefined || actual === "") return;
    await api.post(`/habits/${habit._id}/log`, {
      dateKey: dateKey(),
      actualValue: Number(actual),
    });
      setLogValues(current => ({ ...current, [habit._id]: "" }));
      await resource.reload();
    }
    useEffect(() => { Promise.all([Promise.all(resource.items.map(async habit => [habit._id, (await api.get(`/habits/${habit._id}/stats`)).data.data])), api.get('/habits/instances')]).then(([entries, response]) => { setStats(Object.fromEntries(entries)); setInstances(response.data.data); }).catch(() => {}); }, [resource.items]);
  return (
    <div>
      <PageHeader
        eyebrow="CONSISTENCY"
        title="Habits"
        description="Build plans that are forgiving enough to survive real life."
      />
      <section className="panel form-panel">
        <form className="grid-form" onSubmit={add}>
          <input
            placeholder="Habit name"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="number"
            placeholder="Daily target"
            value={form.dailyTarget}
            onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
          />
          <input
            placeholder="Unit"
            value={form.targetUnit}
            onChange={(e) => setForm({ ...form, targetUnit: e.target.value })}
          />
          <input
            type="time"
            value={form.preferredTime}
            onChange={(e) =>
              setForm({ ...form, preferredTime: e.target.value })
            }
          />
          <select value={form.frequencyType} onChange={e => setForm({ ...form, frequencyType: e.target.value })}>
            <option value="DAILY">Every day</option>
            <option value="WEEKLY">Weekly</option>
            <option value="CUSTOM">Selected days</option>
          </select>
          <input type="date" value={form.planEndDateKey} onChange={e => setForm({ ...form, planEndDateKey: e.target.value })} />
          {form.frequencyType !== "DAILY" && <div className="weekday-picker">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, day) => <button type="button" className={form.weekdays.includes(day) ? "selected" : "secondary"} key={label} onClick={() => setForm({ ...form, weekdays: form.weekdays.includes(day) ? form.weekdays.filter(value => value !== day) : [...form.weekdays, day].sort() })}>{label}</button>)}</div>}
          <button>Start habit</button>
        </form>
      </section>
      <section className="panel"><div className="row-between"><span className="eyebrow">GENERATED HABIT INSTANCES</span><small>{instances.length} scheduled records</small></div>{instances.slice(0, 10).map(item => <div className="mini-row" key={item._id}><span className={`dot ${item.status === 'COMPLETED' ? 'green' : ''}`} /><span>{item.habitId?.title || 'Habit'}</span><small>{item.dateKey} · {item.status}</small></div>)}{!instances.length && <p className="muted">Scheduled habit instances will appear here.</p>}</section>
      <section className="list">
        {resource.items.map((habit) => (
          <div className="list-row" key={habit._id}>
            <div className="habit-mark">↻</div>
            <div className="row-main">
              <strong>{habit.title}</strong>
              <small>
                {habit.dailyTarget} {habit.targetUnit} daily · minimum{" "}
                {habit.minimumAcceptable} · {habit.preferredTime}
              </small>
              {stats[habit._id] && <div className="habit-stats"><span>{stats[habit._id].currentStreak} day streak</span><span>{Math.round(stats[habit._id].completionRate)}% complete</span><div className="habit-heatmap">{stats[habit._id].heatmap.slice(-35).map(day => <i key={day.dateKey} title={`${day.dateKey}: ${day.completionPercentage}%`} className={day.completionPercentage >= 100 ? 'complete' : day.completionPercentage > 0 ? 'partial' : ''} />)}</div></div>}
            </div>
            <div className="inline-form">
              <input type="number" min="0" placeholder={`Actual ${habit.targetUnit || "value"}`} value={logValues[habit._id] || ""} onChange={e => setLogValues(current => ({ ...current, [habit._id]: e.target.value }))} />
              <button className="secondary" onClick={() => log(habit)}>Log today</button>
            </div>
            <button
              className="icon-button"
              onClick={() => resource.remove(habit._id)}
            >
              Delete
            </button>
          </div>
        ))}
        {!resource.loading && !resource.items.length && (
          <Empty>Start one habit with a clear target and preferred time.</Empty>
        )}
      </section>
    </div>
  );
}

export function TimetablePage() {
  const resource = useResource("/timetable");
  const [completion, setCompletion] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    dateKey: dateKey(),
    startTime: "09:00",
    endTime: "10:00",
    category: "Focus",
    recurrenceType: "NONE",
    weekdays: [1, 2, 3, 4, 5],
    recurrenceEndDateKey: "",
  });
  async function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { recurrenceType, weekdays, recurrenceEndDateKey, ...event } = form;
    await resource.create({ ...event, recurrence: recurrenceType === "NONE" ? { type: "NONE" } : { type: recurrenceType, weekdays: recurrenceType === "CUSTOM" ? weekdays : undefined, endDateKey: recurrenceEndDateKey || undefined } });
    if (recurrenceType !== "NONE") { await api.post("/timetable/sync-recurring"); await resource.reload(); }
    setForm({ ...form, title: "" });
  }
  async function complete(e) { e.preventDefault(); try { await api.post(`/timetable/${completion.id}/complete`, { actualStartTime: completion.actualStartTime, actualEndTime: completion.actualEndTime, status: completion.status }); setCompletion(null); setError(""); await resource.reload(); } catch (e) { setError(e.response?.data?.message || "Could not record timetable adherence"); } }
  return (
    <div>
      <PageHeader
        eyebrow="FOLLOW THE PLAN"
        title="Timetable"
        description="Give important work a place to happen."
      />
      <ErrorMessage error={error || resource.error} />
      <section className="panel form-panel">
        <form className="grid-form" onSubmit={add}>
          <input
            placeholder="Activity"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="date"
            value={form.dateKey}
            onChange={(e) => setForm({ ...form, dateKey: e.target.value })}
          />
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
          <select value={form.recurrenceType} onChange={e => setForm({ ...form, recurrenceType: e.target.value })}><option value="NONE">One time</option><option value="DAILY">Every day</option><option value="WEEKLY">Weekly</option><option value="CUSTOM">Selected weekdays</option></select>
          {form.recurrenceType !== "NONE" && <input type="date" value={form.recurrenceEndDateKey} onChange={e => setForm({ ...form, recurrenceEndDateKey: e.target.value })} />}
          {form.recurrenceType === "CUSTOM" && <div className="weekday-picker">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, day) => <button type="button" className={form.weekdays.includes(day) ? "selected" : "secondary"} key={label} onClick={() => setForm({ ...form, weekdays: form.weekdays.includes(day) ? form.weekdays.filter(value => value !== day) : [...form.weekdays, day].sort() })}>{label}</button>)}</div>}
          <button>Add event</button>
        </form>
      </section>
      <section className="list">
        {resource.items.map((event) => (
          <div className="list-row" key={event._id}>
            <div className="time-mark">{event.startTime}</div>
            <div className="row-main">
              <strong>{event.title}</strong>
              <small>
                {event.dateKey} · {event.startTime}–{event.endTime} ·{" "}
                {event.category}{event.recurrence?.type && event.recurrence.type !== 'NONE' ? ` · ${event.recurrence.type.toLowerCase()}` : ''}
              </small>
            </div>
              {event.adherencePercentage != null && <small className="success">Adherence {Math.round(event.adherencePercentage)}%</small>}
              {event.status !== 'COMPLETED' && (completion?.id === event._id ? <form className="inline-form" onSubmit={complete}><input type="time" required value={completion.actualStartTime} onChange={e => setCompletion({ ...completion, actualStartTime: e.target.value })} /><input type="time" required value={completion.actualEndTime} onChange={e => setCompletion({ ...completion, actualEndTime: e.target.value })} /><select value={completion.status} onChange={e => setCompletion({ ...completion, status: e.target.value })}><option value="COMPLETED">Completed</option><option value="PARTIAL">Partial</option><option value="MISSED">Missed</option></select><button>Save</button><button type="button" className="secondary" onClick={() => setCompletion(null)}>Cancel</button></form> : <button className="secondary" onClick={() => setCompletion({ id: event._id, actualStartTime: event.startTime, actualEndTime: event.endTime, status: 'COMPLETED' })}>Record actual</button>)}
              <button
              className="icon-button"
              onClick={() => resource.remove(event._id)}
            >
              Delete
            </button>
          </div>
        ))}
        {!resource.loading && !resource.items.length && (
          <Empty>Schedule the first block you want to protect today.</Empty>
        )}
      </section>
    </div>
  );
}

export function PlaceholderPage({ title }) {
  return (
    <div>
      <PageHeader
        eyebrow="COMING NEXT"
        title={title}
        description="This module is part of the next expansion of your Life OS."
      />
      <div className="panel">
        <Empty>
          Core planning is ready. This area will be connected to analytics and
          historical reviews next.
        </Empty>
      </div>
    </div>
  );
}
