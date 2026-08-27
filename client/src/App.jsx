import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api.js";
import { setAccess, setUser, clearUser } from "./store.js";
import {
  Dashboard,
  TasksPage,
  GoalsPage,
  HabitsPage,
  TimetablePage,
  PlaceholderPage,
} from "./pages/CorePages.jsx";
import { ExercisePage, PhoneUsagePage } from "./pages/Phase3Pages.jsx";
import { CommandDashboard, FinancePage, ProjectsPage, WorkPage, AnalyticsPage, TimelinePage, ReviewsPage, SettingsPage, AccountabilityHistoryPage, NotificationsPage } from "./pages/ExtendedPages.jsx";

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );

function Auth({ mode }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const r = await api.post(`/auth/${mode}`, form);
      dispatch(setUser(r.data.data.user));
      nav("/app");
    } catch (e) {
      const response = e.response?.data;
      setError(
        response?.message ||
          (e.code === "ERR_NETWORK"
            ? "The API is not running. Start it with: npm.cmd run dev:server"
            : "Unable to continue"),
      );
    }
  }
  return (
    <main className="auth">
      <div className="auth-card">
        <span className="eyebrow">PERSONAL LIFE OS</span>
        <h1>
          {mode === "login" ? "Welcome back." : "Start your operating system."}
        </h1>
        <p className="muted">Plan clearly. Record honestly. Improve visibly.</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              placeholder="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            minLength="8"
            placeholder="Password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button>{mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        {error && <p className="error">{error}</p>}
        <Link to={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Create an account" : "Already have an account?"}
        </Link>
      </div>
    </main>
  );
}

function Gate({ children }) {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.access.status);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/access/status")
      .then((r) => dispatch(setAccess(r.data.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);
  if (loading || !status)
    return <div className="center">Checking today’s accountability…</div>;
  if (!status.unlocked) return <Accountability status={status} />;
  return children;
}
function Accountability({ status }) {
  const [dateIndex, setDateIndex] = useState(0);
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [missingExpense, setMissingExpense] = useState({ amount: "", category: "Food", description: "" });
  const dispatch = useDispatch();
  const dates = [
    ...new Set([
      ...(status.requirements.phoneUsage.requiredDates || []),
      ...(status.requirements.spending.requiredDates || []),
    ]),
  ].sort();
  const dateKey = dates[dateIndex];
  async function refresh() {
    const r = await api.get("/access/status");
    dispatch(setAccess(r.data.data));
  }
  async function phone() {
    try {
      await api.post("/check-ins/phone", {
        dateKey,
        phoneUsageMinutes: Number(minutes),
      });
      setMinutes("");
      await refresh();
    } catch (e) {
      setError(e.response?.data?.message || "Could not save phone usage");
    }
  }
  const phoneNeeded = status.requirements.phoneUsage.requiredDates.includes(dateKey);
  const spendingNeeded = status.requirements.spending.requiredDates.includes(dateKey);
  useEffect(() => {
    if (dateKey && spendingNeeded) api.get(`/spending-accountability/${dateKey}/preview`).then(r => setPreview(r.data.data)).catch(() => setPreview(null));
  }, [dateKey, spendingNeeded]);
  async function spending(path) {
    try {
      await api.post(`/spending-accountability/${dateKey}/${path}`);
      await refresh();
    } catch (e) {
      setError(e.response?.data?.message || "Could not save spending");
    }
  }
  if (!dateKey) return <div className="center">Loading requirements…</div>;
  async function addMissingExpense() {
    try {
      await api.post(`/spending-accountability/${dateKey}/add-expense`, { ...missingExpense, amount: Number(missingExpense.amount) });
      setMissingExpense({ amount: "", category: "Food", description: "" });
      const r = await api.get(`/spending-accountability/${dateKey}/preview`); setPreview(r.data.data);
    } catch (e) { setError(e.response?.data?.message || "Could not add missing expense"); }
  }
  return (
    <main className="auth">
      <div className="gate-card">
        <span className="eyebrow">DAILY ACCOUNTABILITY</span>
        <h1>Close the loop.</h1>
        <p className="muted">Before continuing, account for {dateKey}.</p>
        <div className="requirements">
          <div className={phoneNeeded ? "requirement" : "requirement done"}>
            {phoneNeeded ? "○" : "✓"} Phone usage{" "}
            {phoneNeeded && (
              <>
                <input
                  type="number"
                  min="0"
                  placeholder="Minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
                <button onClick={phone}>Save</button>
              </>
            )}
          </div>
          <div className={spendingNeeded ? "requirement" : "requirement done"}>
            {spendingNeeded ? "○" : "✓"} Spending{" "}
            {spendingNeeded && (
              <div className="actions">
                <p className="muted">Recorded total: Rs. {Number(preview?.totalSpent || 0).toLocaleString()} ({preview?.expenseCount || 0} transactions)</p>
                <button onClick={() => spending("confirm")}>
                  Confirm recorded spending
                </button>
                <div className="inline-form">
                  <input type="number" min="0.01" placeholder="Missing amount" value={missingExpense.amount} onChange={e => setMissingExpense({ ...missingExpense, amount: e.target.value })} />
                  <input placeholder="Category" value={missingExpense.category} onChange={e => setMissingExpense({ ...missingExpense, category: e.target.value })} />
                  <button className="secondary" onClick={addMissingExpense}>Add missing expense</button>
                </div>
                <button
                  className="secondary"
                  onClick={() => spending("no-spending")}
                >
                  I spent nothing
                </button>
              </div>
            )}
          </div>
        </div>
        {dates.length > 1 && (
          <div className="pager">
            <button
              className="secondary"
              disabled={dateIndex === 0}
              onClick={() => setDateIndex(dateIndex - 1)}
            >
              Previous
            </button>
            <span>
              {dateIndex + 1} / {dates.length}
            </span>
            <button
              className="secondary"
              disabled={dateIndex === dates.length - 1}
              onClick={() => setDateIndex(dateIndex + 1)}
            >
              Next
            </button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button className="secondary" onClick={refresh}>
          Refresh status
        </button>
      </div>
    </main>
  );
}

function QuickAdd({ onClose, onSaved }) {
  const [type, setType] = useState('task');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', description: '', phoneUsageMinutes: '', workoutType: '', dateKey: today(), target: 100, unit: '%', dailyTarget: 30, targetUnit: 'minutes' });
  const [error, setError] = useState('');
  function update(field, value) { setForm(current => ({ ...current, [field]: value })); }
  async function submit(e) {
    e.preventDefault(); setError('');
    const payload = type === 'expense' ? { amount: Number(form.amount), category: form.category, description: form.description, dateKey: form.dateKey } : type === 'goal' ? { title: form.title, target: Number(form.target), currentProgress: 0, unit: form.unit } : type === 'habit' ? { title: form.title, dailyTarget: Number(form.dailyTarget), targetUnit: form.targetUnit, planStartDateKey: form.dateKey } : type === 'workout' ? { dateKey: form.dateKey, workoutType: form.workoutType, completed: true } : type === 'phoneUsage' ? { dateKey: form.dateKey, phoneUsageMinutes: Number(form.phoneUsageMinutes) } : { title: form.title, dueDateKey: form.dateKey };
    try { await api.post('/quick-add', { type, payload }); onSaved?.(type); onClose(); } catch (e) { setError(e.response?.data?.message || 'Could not add item'); }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="quick-add modal" onMouseDown={e => e.stopPropagation()}><div className="row-between"><div><span className="eyebrow">COMMAND CENTER</span><h2>Quick add</h2></div><button className="icon-button" onClick={onClose}>Close</button></div><select value={type} onChange={e => setType(e.target.value)}><option value="task">Task</option><option value="expense">Expense</option><option value="goal">Goal</option><option value="habit">Habit</option><option value="workout">Workout</option><option value="phoneUsage">Phone usage</option></select><form onSubmit={submit}>{type === 'task' && <><input required placeholder="Task title" value={form.title} onChange={e => update('title', e.target.value)} /><input type="date" value={form.dateKey} onChange={e => update('dateKey', e.target.value)} /></>}{type === 'expense' && <><input required type="number" min="0.01" placeholder="Amount" value={form.amount} onChange={e => update('amount', e.target.value)} /><input required placeholder="Category" value={form.category} onChange={e => update('category', e.target.value)} /><input placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)} /><input type="date" value={form.dateKey} onChange={e => update('dateKey', e.target.value)} /></>}{type === 'goal' && <><input required placeholder="Goal title" value={form.title} onChange={e => update('title', e.target.value)} /><input required type="number" min="0.01" placeholder="Target" value={form.target} onChange={e => update('target', e.target.value)} /><input placeholder="Unit" value={form.unit} onChange={e => update('unit', e.target.value)} /></>}{type === 'habit' && <><input required placeholder="Habit title" value={form.title} onChange={e => update('title', e.target.value)} /><input type="number" min="0" placeholder="Daily target" value={form.dailyTarget} onChange={e => update('dailyTarget', e.target.value)} /><input placeholder="Unit" value={form.targetUnit} onChange={e => update('targetUnit', e.target.value)} /></>}{type === 'workout' && <><input required placeholder="Workout type" value={form.workoutType} onChange={e => update('workoutType', e.target.value)} /><input type="date" value={form.dateKey} onChange={e => update('dateKey', e.target.value)} /></>}{type === 'phoneUsage' && <><input required type="number" min="0" placeholder="Minutes" value={form.phoneUsageMinutes} onChange={e => update('phoneUsageMinutes', e.target.value)} /><input type="date" value={form.dateKey} onChange={e => update('dateKey', e.target.value)} /></>}<button>Add to Life OS</button></form>{error && <p className="error">{error}</p>}</div></div>;
}

function Shell() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const quickAddPaths = { task: '/app/tasks', expense: '/app/finance', goal: '/app/goals', habit: '/app/habits', workout: '/app/exercise', phoneUsage: '/app/phone-usage' };
  useEffect(() => { const theme = user?.settings?.theme || 'dark'; document.body.dataset.theme = theme; return () => { delete document.body.dataset.theme; }; }, [user]);
  useEffect(() => { let active = true; const loadUnread = () => api.get('/notifications/unread-count').then(response => { if (active) setUnreadNotifications(response.data.data.count); }).catch(() => {}); loadUnread(); const timer = setInterval(loadUnread, 60000); return () => { active = false; clearInterval(timer); }; }, []);
  function runSearch(value) { setSearch(value); }
  useEffect(() => { let active = true; if (search.trim().length < 2) { setResults([]); return () => { active = false; }; } const timer = setTimeout(() => api.get(`/search?q=${encodeURIComponent(search.trim())}`).then(response => { if (active) setResults(response.data.data); }).catch(() => { if (active) setResults([]); }), 250); return () => { active = false; clearTimeout(timer); }; }, [search]);
  const searchPath = item => ({ TASK: '/app/tasks', GOAL: '/app/goals', HABIT: '/app/habits', PROJECT: '/app/projects', EXPENSE: '/app/finance', TIMELINE: '/app/timeline' }[item.type] || '/app');
  const location = useLocation();
  async function logout() {
    await api.post("/auth/logout");
    dispatch(clearUser());
    nav("/login");
  }
  return (
    <div className="shell">
      <aside>
        <Link className="brand" to="/app">
          LIFE<span>OS</span>
        </Link>
        <p className="muted small">Your personal operating system</p>
        <nav>
          <Link to="/app">Overview</Link>
          <Link to="/app/tasks">Tasks</Link>
          <Link to="/app/goals">Goals</Link>
          <Link to="/app/habits">Habits</Link>
          <Link to="/app/timetable">Timetable</Link>
          <Link to="/app/exercise">Exercise</Link>
          <Link to="/app/phone-usage">Phone & check-in</Link>
          <Link to="/app/finance">Finance</Link>
          <Link to="/app/projects">Projects</Link>
          <Link to="/app/work">Work</Link>
          <Link to="/app/analytics">Analytics</Link>
          <Link to="/app/timeline">Timeline</Link>
          <Link to="/app/reviews">AI reviews</Link>
          <Link to="/app/settings">Settings</Link>
          <Link to="/app/accountability-history">Spending history</Link>
          <Link to="/app/notifications">Notifications {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}</Link>
        </nav>
        <button className="logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <section className="content">
        <header>
          <div>
            <span className="eyebrow">{today()}</span>
            <h2>Good morning, {user?.name?.split(" ")[0] || "friend"}.</h2>
          </div>
          <div className="search-box"><input placeholder="Search Life OS" value={search} onChange={e => runSearch(e.target.value)} />{results.length > 0 && <div className="search-results">{results.map(item => <Link to={searchPath(item)} key={`${item.type}-${item.id}`} onClick={() => { setSearch(''); setResults([]); }}><small>{item.type}</small> {item.title}</Link>)}</div>}</div>
          <button className="quick-add-trigger" onClick={() => setQuickAddOpen(true)}>+ Quick add</button>
          <div className="avatar">{user?.name?.[0] || "U"}</div>
        </header>
        <Routes location={location} key={location.key}>
          <Route index element={<CommandDashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="exercise" element={<ExercisePage />} />
          <Route path="phone-usage" element={<PhoneUsagePage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="work" element={<WorkPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="accountability-history" element={<AccountabilityHistoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </section>
      {quickAddOpen && <QuickAdd onClose={() => setQuickAddOpen(false)} onSaved={(type) => nav(`${quickAddPaths[type] || '/app'}?quickAdd=${Date.now()}`, { replace: true })} />}
    </div>
  );
}
function Protected() {
  const user = useSelector((s) => s.auth.user);
  return user ? (
    <Gate>
      <Shell />
    </Gate>
  ) : (
    <Navigate to="/login" replace />
  );
}
export default function App() {
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => dispatch(setUser(r.data.data)))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [dispatch]);
  if (checking) return <div className="center">Loading Life OS…</div>;
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/app/*" element={<Protected />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
