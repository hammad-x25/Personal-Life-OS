import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../api.js";
import { setUser as setAuthUser } from "../store.js";
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
const shiftDateKey = (dateKey, days) => {
  const date = new Date(dateKey + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const DEFAULT_FINANCE_CATEGORIES = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Subscriptions', 'Family', 'Travel', 'Other'];
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
  const [customCategories, setCustomCategories] = useState([]);
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    dateKey: today(),
    type: "EXPENSE",
    subcategory: "",
    paymentMethod: "",
    notes: "",
    isRecurring: false,
  });
  const [error, setError] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ name: "Monthly spending", category: "", amount: "" });
  const [goalForm, setGoalForm] = useState({ title: "", targetAmount: "", deadlineKey: "" });
  const [contributionForms, setContributionForms] = useState({});
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "EXPENSE" });
  const [filters, setFilters] = useState({ startDateKey: `${today().slice(0, 7)}-01`, endDateKey: today(), type: "" });
  async function load() {
    try {
      const params = { ...filters, type: filters.type || undefined };
      const [expenses, finance, categories] = await Promise.all([
        api.get("/finance/transactions", { params }),
        api.get("/analytics/finance", { params }),
        api.get("/finance/categories"),
      ]);
      setItems(expenses.data.data.items);
      setSummary(finance.data.data);
      setCustomCategories(categories.data.data);
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
  async function createCategory(e) { e.preventDefault(); try { const response = await api.post('/finance/categories', categoryForm); setCustomCategories(current => [...current, response.data.data]); setForm(current => ({ ...current, category: response.data.data.name, type: response.data.data.type })); setCategoryForm({ name: '', type: 'EXPENSE' }); } catch (e) { setError(e); } }
  async function createBudget(e) { e.preventDefault(); try { await api.post('/budgets', { ...budgetForm, amount: Number(budgetForm.amount), category: budgetForm.category || null, periodType: 'MONTHLY' }); setBudgetForm({ name: 'Monthly spending', category: '', amount: '' }); await load(); } catch (e) { setError(e); } }
  async function createGoal(e) { e.preventDefault(); try { await api.post('/finance-goals', { ...goalForm, targetAmount: Number(goalForm.targetAmount) }); setGoalForm({ title: '', targetAmount: '', deadlineKey: '' }); await load(); } catch (e) { setError(e); } }
  async function addContribution(goal) { const form = contributionForms[goal._id] || {}; try { await api.post(`/finance-goals/${goal._id}/contributions`, { amount: Number(form.amount), dateKey: form.dateKey || today(), note: form.note || undefined }); setContributionForms(current => ({ ...current, [goal._id]: { amount: '', dateKey: today(), note: '' } })); await load(); } catch (e) { setError(e); } }
  const total = summary?.totals?.find((x) => x._id === "EXPENSE")?.total || 0;
  const income = summary?.totals?.find((x) => x._id === "INCOME")?.total || 0;
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
          <span className="eyebrow">NET BALANCE</span>
          <strong>Rs. {Number(summary?.netBalance || 0).toLocaleString()}</strong>
          <p className="muted">Income minus expenses</p>
        </div>
        <div className="card">
          <span className="eyebrow">DAILY AVERAGE</span>
          <strong>Rs. {Math.round(summary?.averageDailySpending || 0).toLocaleString()}</strong>
          <p className="muted">Average spending day</p>
        </div>
        <div className="card">
          <span className="eyebrow">TOP CATEGORY</span>
          <strong>{summary?.categories?.[0]?._id || "—"}</strong>
          <p className="muted">Highest spending category</p>
        </div>
      </div>
      <section className="panel form-panel">
        <span className="eyebrow">ADD TRANSACTION</span>
        <form className="grid-form" onSubmit={submit}>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select>
          <input
            type="number"
            min="0"
            required
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{DEFAULT_FINANCE_CATEGORIES.map(category => <option key={category}>{category}</option>)}{customCategories.filter(item => item.type === form.type).map(category => <option key={category._id}>{category.name}</option>)}</select>
          <input placeholder="Subcategory" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} />
          <input placeholder="Payment method" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} />
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
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <label className="check-label"><input type="checkbox" checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} /> Recurring</label>
          <button>Record</button>
        </form>
      </section>
      <div className="dashboard-columns"><section className="panel"><span className="eyebrow">OPTIONAL BUDGET</span><form className="grid-form" onSubmit={createBudget}><input required placeholder="Budget name" value={budgetForm.name} onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })} /><input placeholder="Category or blank for all" value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })} /><input type="number" min="0.01" required placeholder="Monthly amount" value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })} /><button>Set budget</button></form>{summary?.budgets?.map(item => <div className="goal-row" key={item._id}><div><strong>{item.name}</strong><small>Rs. {Number(item.spent).toLocaleString()} / {Number(item.amount).toLocaleString()}</small></div><div className="progress"><span style={{ width: `${Math.min(100, item.usagePercentage)}%` }} /></div></div>)}</section><section className="panel"><span className="eyebrow">CUSTOM CATEGORY</span><form className="grid-form" onSubmit={createCategory}><input required placeholder="Category name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} /><select value={categoryForm.type} onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select><button>Create category</button></form><small>{customCategories.length} custom categories</small></section></div>
      <section className="panel finance-goals-panel"><div className="row-between"><div><span className="eyebrow">FINANCIAL GOALS</span><p className="muted">Turn a target into a contribution plan and a visible history.</p></div><span className="muted">{summary?.financialGoals?.length || 0} goals</span></div><form className="grid-form" onSubmit={createGoal}><input required placeholder="Goal title, e.g. Buy laptop" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} /><input type="number" min="0.01" required placeholder="Target amount" value={goalForm.targetAmount} onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })} /><input type="date" value={goalForm.deadlineKey} onChange={e => setGoalForm({ ...goalForm, deadlineKey: e.target.value })} /><button>Create goal</button></form>{summary?.financialGoals?.map(goal => { const progress = goal.progress || {}; const contribution = contributionForms[goal._id] || { amount: '', dateKey: today(), note: '' }; return <article className="finance-goal" key={goal._id}><div className="row-between"><div><strong>{goal.title}</strong><small>{goal.status} {goal.deadlineKey ? `· due ${goal.deadlineKey}` : '· no deadline'}</small></div><strong>{progress.percentageComplete || 0}%</strong></div><div className="progress"><span style={{ width: `${Math.min(100, progress.percentageComplete || 0)}%` }} /></div><div className="mini-row"><span>Saved</span><strong>Rs. {Number(progress.currentAmount || 0).toLocaleString()} / {Number(progress.targetAmount || goal.targetAmount || 0).toLocaleString()}</strong><small>{progress.amountRemaining > 0 ? `Rs. ${Number(progress.amountRemaining).toLocaleString()} remaining` : 'Target reached'}</small></div><div className="goal-metrics"><span>{progress.requiredWeeklyContribution == null ? 'Weekly plan unavailable' : `Rs. ${Math.round(progress.requiredWeeklyContribution).toLocaleString()}/week`}</span><span>{progress.requiredMonthlyContribution == null ? (progress.overdue ? 'Past deadline' : 'Monthly plan unavailable') : `Rs. ${Math.round(progress.requiredMonthlyContribution).toLocaleString()}/month`}</span><span>{progress.daysRemaining == null ? 'No days remaining' : `${progress.daysRemaining} days left`}</span></div><div className="inline-form goal-contribution-form"><input type="number" min="0.01" placeholder="Contribution" value={contribution.amount} onChange={e => setContributionForms(current => ({ ...current, [goal._id]: { ...contribution, amount: e.target.value } }))} /><input type="date" value={contribution.dateKey || today()} onChange={e => setContributionForms(current => ({ ...current, [goal._id]: { ...contribution, dateKey: e.target.value } }))} /><input placeholder="Note (optional)" value={contribution.note || ''} onChange={e => setContributionForms(current => ({ ...current, [goal._id]: { ...contribution, note: e.target.value } }))} /><button type="button" onClick={() => addContribution(goal)}>Add contribution</button></div>{progress.progressHistory?.length ? <div className="goal-history"><small className="eyebrow">CONTRIBUTION HISTORY</small>{progress.progressHistory.slice(-5).reverse().map(item => <div className="mini-row" key={item._id || `${item.dateKey}-${item.amount}`}><span>{item.dateKey}</span><strong>+Rs. {Number(item.amount).toLocaleString()}</strong><small>Rs. {Number(item.cumulativeAmount).toLocaleString()} total</small></div>)}</div> : <small className="muted">No contributions recorded yet.</small>}</article>; })}{!summary?.financialGoals?.length && <p className="muted">Create a savings target to start measuring financial progress.</p>}</section>
      <section className="panel"><div className="row-between"><span className="eyebrow">FILTER TRANSACTIONS</span><strong>Income Rs. {income.toLocaleString()}</strong></div><div className="inline-form"><input type="date" value={filters.startDateKey} onChange={e => setFilters({ ...filters, startDateKey: e.target.value })} /><input type="date" value={filters.endDateKey} onChange={e => setFilters({ ...filters, endDateKey: e.target.value })} /><select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}><option value="">All types</option><option value="EXPENSE">Expenses</option><option value="INCOME">Income</option></select><button onClick={load}>Apply</button></div></section>
      <section className="panel"><div className="row-between"><span className="eyebrow">SPENDING TREND</span><small>{summary?.highestSpendingDay ? `Highest: ${summary.highestSpendingDay._id}` : "No spending yet"}</small></div><Chart data={summary?.trend || []} dataKey="total" color="#f1c36b" /></section>
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

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detail, setDetail] = useState(null);
  const [milestone, setMilestone] = useState({ title: '', dateKey: '' });
  const [projectTaskTitle, setProjectTaskTitle] = useState('');
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
  async function openProject(project) { setSelectedProject(project); try { setDetail((await api.get(`/projects/${project._id}/timeline`)).data.data); } catch (e) { setError(e); } }
  async function addMilestone(e) { e.preventDefault(); if (!selectedProject || !milestone.title.trim()) return; try { await api.post(`/projects/${selectedProject._id}/milestones`, milestone); setMilestone({ title: '', dateKey: '' }); await openProject(selectedProject); } catch (e) { setError(e); } }
  async function addProjectTask(e) { e.preventDefault(); if (!selectedProject || !projectTaskTitle.trim()) return; try { await api.post('/tasks', { title: projectTaskTitle, category: 'WORK', projectId: selectedProject._id, priority: 'MEDIUM' }); setProjectTaskTitle(''); await openProject(selectedProject); } catch (e) { setError(e); } }
  async function toggleMilestone(item) { try { await api.patch(`/projects/${selectedProject._id}/milestones/${item._id}`, { completed: !item.completed }); await openProject(selectedProject); } catch (e) { setError(e); } }
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
            <button className="secondary" onClick={() => openProject(project)}>Open timeline</button>
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
      {selectedProject && <section className="panel project-detail"><div className="row-between"><div><span className="eyebrow">PROJECT TIMELINE</span><h3>{selectedProject.name}</h3></div><button className="icon-button" onClick={() => { setSelectedProject(null); setDetail(null); }}>Close</button></div><form className="inline-form" onSubmit={addMilestone}><input required placeholder="Milestone title" value={milestone.title} onChange={e => setMilestone({ ...milestone, title: e.target.value })} /><input type="date" value={milestone.dateKey} onChange={e => setMilestone({ ...milestone, dateKey: e.target.value })} /><button>Add milestone</button></form><form className="inline-form" onSubmit={addProjectTask}><input required placeholder="Add linked work task" value={projectTaskTitle} onChange={e => setProjectTaskTitle(e.target.value)} /><button className="secondary">Add task</button></form><div className="dashboard-columns"><div><span className="eyebrow">MILESTONES</span>{detail?.milestones?.map(item => <div className="mini-row" key={item._id}><button className="icon-button" onClick={() => toggleMilestone(item)}>{item.completed ? 'Undo' : 'Done'}</button><span className={`dot ${item.completed ? 'green' : ''}`} /><span>{item.title}</span><small>{item.dateKey || 'No date'}</small></div>)}</div><div><span className="eyebrow">LINKED TASKS</span>{detail?.tasks?.map(item => <div className="mini-row" key={item._id}><span className={`dot ${item.status === 'COMPLETED' ? 'green' : ''}`} /><span>{item.title}</span><small>{item.status}</small></div>)}</div></div></section>}
    </div>
  );
}

export function WorkPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDateKey, setDueDateKey] = useState("");
  const [error, setError] = useState(null);
  async function load() {
    try { const [taskResponse, projectResponse] = await Promise.all([api.get("/tasks"), api.get("/projects")]); setTasks(taskResponse.data.data.filter(item => item.category === "WORK")); setProjects(projectResponse.data.data); } catch (e) { setError(e); }
  }
  useEffect(() => {
    load();
  }, []);
  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try { await api.post("/tasks", { title, category: "WORK", priority: "MEDIUM", projectId: projectId || undefined, dueDateKey: dueDateKey || undefined }); } catch (e) { setError(e); return; }
    setTitle("");
    setDueDateKey("");
    load();
  }
  return (
    <div>
      <Header
        eyebrow="DELIVER"
        title="Work"
        description="Keep professional execution visible without mixing it into every personal task."
      />
      <ErrorBox error={error} />
      <section className="panel form-panel">
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="Work item"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">No project</option>{projects.map(project => <option key={project._id} value={project._id}>{project.name}</option>)}</select>
          <input type="date" value={dueDateKey} onChange={e => setDueDateKey(e.target.value)} />
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
              <small>{task.status}{task.projectId ? ` · ${projects.find(project => project._id === task.projectId)?.name || 'Project'}` : ''}{task.dueDateKey ? ` · due ${task.dueDateKey}` : ''}</small>
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
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(30);
  async function load() { try { const end = shiftDateKey(today(), -1); const [history, summary] = await Promise.all([api.get("/spending-accountability/history"), api.get("/spending-accountability/summary", { params: { startDateKey: shiftDateKey(end, -(range - 1)), endDateKey: end } })]); setItems(history.data.data); setMetrics(summary.data.data.metrics); setError(null); } catch (e) { setError(e); } }
  useEffect(() => { load(); }, [range]);
  return (
    <div>
      <Header
        eyebrow="ACCOUNTABILITY"
        title="Spending history"
        description="A record of the days you explicitly accounted for, including zero-spending days."
      />
      {error && <ErrorBox error={error} />}
      <div className="grid accountability-metrics"><div className="card"><span className="eyebrow">ACCOUNTABILITY</span><strong>{metrics?.accountabilityRate ?? 0}%</strong><p className="muted">{metrics?.accountedDays || 0} of {metrics?.totalDays || 0} days</p></div><div className="card"><span className="eyebrow">CURRENT STREAK</span><strong>{metrics?.currentStreak || 0}</strong><p className="muted">Consecutive accounted days</p></div><div className="card"><span className="eyebrow">LONGEST STREAK</span><strong>{metrics?.longestStreak || 0}</strong><p className="muted">Best run in this window</p></div><div className="card"><span className="eyebrow">ZERO-SPEND DAYS</span><strong>{metrics?.zeroSpendingDays || 0}</strong><p className="muted">Explicitly recorded as zero</p></div></div>
      <div className="actions"><select value={range} onChange={e => setRange(Number(e.target.value))}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select><span className="muted">Average: Rs. {Math.round(metrics?.averageDailySpending || 0).toLocaleString()} per calendar day{metrics?.highestSpendingDay ? ` · Highest: Rs. ${Number(metrics.highestSpendingDay.totalSpent).toLocaleString()} on ${metrics.highestSpendingDay.dateKey}` : ''}</span></div>
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
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);
  async function load() {
    try { setItems((await api.get("/notifications")).data.data); setError(null); } catch (e) { setError(e); }
  }
  useEffect(() => {
    load();
  }, []);
  async function mark(id) {
    try { await api.patch(`/notifications/${id}/read`); await load(); } catch (e) { setError(e); }
  }
  async function dismiss(id) { try { await api.patch(`/notifications/${id}/dismiss`); await load(); } catch (e) { setError(e); } }
  async function markAll() { try { await api.patch('/notifications/read-all'); await load(); } catch (e) { setError(e); } }
  const visibleItems = filter === 'UNREAD' ? items.filter(item => !item.readAt && item.status !== 'DISMISSED') : filter === 'DISMISSED' ? items.filter(item => item.status === 'DISMISSED') : items.filter(item => item.status !== 'DISMISSED');
  return (
    <div>
      <Header
        eyebrow="REMINDERS"
        title="Notifications"
        description="Small prompts that help the operating loop stay closed."
      />
      <ErrorBox error={error} />
      <div className="actions"><select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">Active</option><option value="UNREAD">Unread</option><option value="DISMISSED">Dismissed</option></select><button className="secondary" onClick={markAll}>Mark all read</button></div>
      <section className="list">
        {visibleItems.map((item) => (
          <div className="list-row" key={item._id}>
            <div className={`dot ${item.readAt ? '' : 'green'}`} />
            <div className="row-main">
              <strong>{item.title}</strong>
              <small>{item.message} · {item.type} · {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : 'Now'}</small>
            </div>
            {!item.readAt && (
              <button className="secondary" onClick={() => mark(item._id)}>
                Mark read
              </button>
            )}
            {item.status !== 'DISMISSED' && <button className="icon-button" onClick={() => dismiss(item._id)}>Dismiss</button>}
          </div>
        ))}
        {!visibleItems.length && (
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
  const [period, setPeriod] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [range, setRange] = useState('WEEKLY');
  const [historyStart, setHistoryStart] = useState(() => shiftDateKey(today(), -29));
  const [historyEnd, setHistoryEnd] = useState(() => today());
  const [allTime, setAllTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const historyMode = range === 'HISTORY';
  useEffect(() => {
    const params = historyMode ? { startDateKey: historyStart, endDateKey: historyEnd, ...(allTime ? { allTime: 'true' } : {}) } : undefined;
    setLoading(true);
    setError(null);
    const periodRequest = historyMode ? api.get('/analytics/history', { params }) : api.get('/dashboard/' + range.toLowerCase());
    Promise.all([api.get("/analytics/daily", { params }), api.get("/analytics/growth", { params }), periodRequest, api.get("/analytics/correlations", { params })])
      .then(([d, g, p, c]) => { setDaily(d.data.data); setGrowth(p.data.data.growth || g.data.data); setPeriod(p.data.data); setCorrelation(c.data.data); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [range, historyStart, historyEnd, historyMode, allTime]);
  function selectHistoryPreset(days) {
    const end = today();
    setAllTime(false);
    setHistoryEnd(end);
    setHistoryStart(shiftDateKey(end, -(days - 1)));
    setRange('HISTORY');
  }
  function selectAllTime() {
    const start = user?.registeredDateKey || historyStart;
    setAllTime(true);
    setHistoryStart(start);
    setHistoryEnd(today());
    setRange('HISTORY');
  }
  return (
    <div>
      <Header
        title="Analytics"
        description="See what you planned, what happened, and how the trend is moving."
      />
      <ErrorBox error={error} />
      <div className="actions"><button className={range === 'WEEKLY' ? '' : 'secondary'} onClick={() => setRange('WEEKLY')}>Weekly</button><button className={range === 'MONTHLY' ? '' : 'secondary'} onClick={() => setRange('MONTHLY')}>Monthly</button><button className={range === 'YEARLY' ? '' : 'secondary'} onClick={() => setRange('YEARLY')}>Yearly</button><button className={historyMode ? '' : 'secondary'} onClick={() => setRange('HISTORY')}>History</button></div>
      {historyMode && <div className="history-controls"><div className="actions"><button className="secondary" onClick={() => selectHistoryPreset(7)}>7 days</button><button className="secondary" onClick={() => selectHistoryPreset(30)}>30 days</button><button className="secondary" onClick={() => selectHistoryPreset(90)}>90 days</button><button className="secondary" onClick={() => selectHistoryPreset(365)}>1 year</button><button className="secondary" onClick={selectAllTime}>All time</button></div><label>From<input type="date" value={historyStart} max={historyEnd} onChange={e => { setAllTime(false); setHistoryStart(e.target.value); }} /></label><label>To<input type="date" value={historyEnd} min={historyStart} max={today()} onChange={e => { setAllTime(false); setHistoryEnd(e.target.value); }} /></label></div>}
      {loading && <p className="muted">Refreshing analytics...</p>}
      <div className="grid">
        <div className="card">
          <span className="eyebrow">CURRENT AVERAGE</span>
          <strong>
            {growth?.currentScore ? `${Math.round(growth.currentScore)}%` : "—"}
          </strong>
          <p className="muted">{historyMode ? (allTime ? 'Since registration' : historyStart + " to " + historyEnd) : 'Selected period'}</p>
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
        <div className="card"><span className="eyebrow">PERIOD SCORE</span><strong>{period?.score == null ? '—' : `${Math.round(period.score)}%`}</strong><p className="muted">{historyMode ? 'historical performance' : range.toLowerCase() + ' performance'}</p></div>
      </div>
      <section className="grid"><div className="card"><span className="eyebrow">TASKS</span><strong>{period?.metrics?.tasks?.completionRate == null ? "—" : `${Math.round(period.metrics.tasks.completionRate)}%`}</strong><p className="muted">{period?.metrics?.tasks?.completed || 0} of {period?.metrics?.tasks?.total || 0} completed</p></div><div className="card"><span className="eyebrow">HABITS</span><strong>{period?.metrics?.habits?.completionRate == null ? "—" : `${Math.round(period.metrics.habits.completionRate)}%`}</strong><p className="muted">Scheduled habit consistency</p></div><div className="card"><span className="eyebrow">EXERCISE</span><strong>{period?.metrics?.exercise?.workoutDays || 0}</strong><p className="muted">Workout days</p></div><div className="card"><span className="eyebrow">PHONE</span><strong>{period?.metrics?.phoneUsage?.averageMinutes == null ? "—" : `${Math.round(period.metrics.phoneUsage.averageMinutes)}m`}</strong><p className="muted">Average daily usage</p></div></section>
      <section className="panel">
        <span className="eyebrow">PRODUCTIVITY OVER TIME</span>
        <Chart data={period?.performance?.length ? period.performance : daily} />
      </section>
      <section className="panel"><span className="eyebrow">PERIOD EXECUTION</span><div className="mini-row"><span>Timetable adherence</span><strong>{period?.metrics?.timetable?.adherencePercentage == null ? "—" : `${Math.round(period.metrics.timetable.adherencePercentage)}%`}</strong></div>{period?.metrics?.projects?.map(project => <div className="mini-row" key={project._id}><span>{project.name}</span><strong>{project.progressPercentage}%</strong><small>{project.taskCompleted}/{project.taskTotal} tasks</small></div>)}</section>
      <section className="panel"><span className="eyebrow">CORRELATION OBSERVATIONS</span>{correlation?.observations?.map(item => <div className="mini-row" key={item.type}><span className="dot green" /><span>{item.message}</span><small>{item.type === 'PHONE_USAGE' ? `${item.lowUsageAverage == null ? '—' : Math.round(item.lowUsageAverage)}% vs ${item.highUsageAverage == null ? '—' : Math.round(item.highUsageAverage)}%` : `${item.exerciseAverage == null ? '—' : Math.round(item.exerciseAverage)}% with exercise`}</small></div>)}</section>
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
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
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
  const visibleReviews = filter === 'ALL' ? reviews : reviews.filter(review => review.reviewType === filter);
  return (
    <div>
      <Header
        eyebrow="REFLECT"
        title="AI reviews"
        description="Qualitative coaching based on your deterministic performance records."
      />
      <ErrorBox error={error} />
      <div className="actions">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">All reviews</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select>
        <button onClick={() => generate("daily")}>Generate daily review</button>
        <button className="secondary" onClick={() => generate("weekly")}>
          Generate weekly
        </button>
        <button className="secondary" onClick={() => generate("monthly")}>
          Generate monthly
        </button>
      </div>
      <section className="list">
        {visibleReviews.map((review) => (
          <article className="panel review-card" key={review._id} onClick={() => setSelected(review)}>
            <span className="eyebrow">
              {review.reviewType} · {review.periodKey}
            </span>
            <h3>{review.summary}</h3>
            <p className="muted">
              Priority: {review.priority || "Not specified"}
            </p>
            <small className="muted">{review.model || "local"} · {review.validationStatus || "legacy review"}</small>
            <strong>Recommendations</strong>
            <ul>
              {review.recommendations?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
        {!visibleReviews.length && (
          <div className="panel">
            <p className="muted">
              Generate a review after recording a little data.
            </p>
          </div>
        )}
      </section>
      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><article className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="row-between"><div><span className="eyebrow">{selected.reviewType} REVIEW</span><h2>{selected.periodKey}</h2></div><button className="icon-button" onClick={() => setSelected(null)}>Close</button></div><p>{selected.summary}</p><div className="dashboard-columns"><div><strong>Strengths</strong><ul>{selected.strengths?.map((item, i) => <li key={i}>{item}</li>)}</ul></div><div><strong>Weaknesses</strong><ul>{selected.weaknesses?.map((item, i) => <li key={i}>{item}</li>)}</ul></div></div><strong>Recommendations</strong><ul>{selected.recommendations?.map((item, i) => <li key={i}>{item}</li>)}</ul></article></div>}
    </div>
  );
}

export function SettingsPage() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [weights, setWeights] = useState({ task: 20, habit: 15, goal: 15, exercise: 10, timetable: 15, phone: 10, work: 15 });
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
          weekStartsOn: r.data.data.settings?.weekStartsOn ?? "",
        });
        const savedWeights = r.data.data.settings?.scoreWeights || {};
        setWeights({ task: 20, habit: 15, goal: 15, exercise: 10, timetable: 15, phone: 10, work: 15, ...(savedWeights instanceof Map ? Object.fromEntries(savedWeights) : savedWeights) });
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
        weekStartsOn: form.weekStartsOn === "" || form.weekStartsOn === undefined ? undefined : Number(form.weekStartsOn),
        scoreWeights: Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Number(value)])),
      });
      setUser(r.data.data);
      dispatch(setAuthUser(r.data.data));
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
          <input type="number" min="0" max="6" placeholder="Week starts on (0 Sunday - 6 Saturday)" value={form.weekStartsOn ?? ""} onChange={e => setForm({ ...form, weekStartsOn: e.target.value })} />
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
        <div className="settings-weights"><div className="row-between"><div><span className="eyebrow">PRODUCTIVITY WEIGHTS</span><p className="muted">The backend normalizes these weights when a component has no applicable data.</p></div><strong>{Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0)}%</strong></div><div className="weight-grid">{Object.entries(weights).map(([key, value]) => <label key={key}>{key}<input type="number" min="0" max="100" value={value} onChange={e => setWeights(current => ({ ...current, [key]: e.target.value }))} /></label>)}</div></div>
        {saved && <p className="success">Settings saved.</p>}
        <p className="muted">
          Accountability requirements remain backend-enforced.
        </p>
      </section>
    </div>
  );
}
