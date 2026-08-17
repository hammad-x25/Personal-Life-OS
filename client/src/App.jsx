import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
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
  async function spending(path) {
    try {
      await api.post(`/spending-accountability/${dateKey}/${path}`);
      await refresh();
    } catch (e) {
      setError(e.response?.data?.message || "Could not save spending");
    }
  }
  if (!dateKey) return <div className="center">Loading requirements…</div>;
  const phoneNeeded =
    status.requirements.phoneUsage.requiredDates.includes(dateKey);
  const spendingNeeded =
    status.requirements.spending.requiredDates.includes(dateKey);
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
                <button onClick={() => spending("confirm")}>
                  Confirm recorded spending
                </button>
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

function Shell() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const nav = useNavigate();
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
          <Link to="/app/finance">Finance</Link>
          <Link to="/app/analytics">Analytics</Link>
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
          <div className="avatar">{user?.name?.[0] || "U"}</div>
        </header>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="finance" element={<PlaceholderPage title="Finance" />} />
          <Route
            path="analytics"
            element={<PlaceholderPage title="Analytics" />}
          />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </section>
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
