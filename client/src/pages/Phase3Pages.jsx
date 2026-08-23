import { useEffect, useState } from "react";
import { api } from "../api.js";

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
function Header({ title, description }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">LIFESTYLE</span>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
    </div>
  );
}
function ErrorBox({ error }) {
  if (!error) return null;
  const details = error.response?.data?.details;
  return (
    <div className="error-box">
      <strong>
        {error.response?.data?.message ||
          error.message ||
          "Something went wrong"}
      </strong>
      {Array.isArray(details) && (
        <ul>
          {details.map((item, i) => (
            <li key={i}>
              {item.field}: {item.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PhoneUsagePage() {
  const [form, setForm] = useState({
    dateKey: today(),
    phoneUsageMinutes: "",
    mood: "",
    energyLevel: "",
    sleepMinutes: "",
    notes: "",
  });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  async function load() {
    try {
      const r = await api.get("/check-ins/history");
      setHistory(r.data.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.post("/check-ins/phone", {
        ...form,
        phoneUsageMinutes: Number(form.phoneUsageMinutes),
        mood: form.mood ? Number(form.mood) : undefined,
        energyLevel: form.energyLevel ? Number(form.energyLevel) : undefined,
        sleepMinutes: form.sleepMinutes ? Number(form.sleepMinutes) : undefined,
      });
      setSaved(true);
      await load();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <Header
        title="Phone & check-in"
        description="Record the data that makes your attention visible."
      />
      <section className="panel">
        <form className="grid-form" onSubmit={submit}>
          <input
            type="date"
            value={form.dateKey}
            onChange={(e) => setForm({ ...form, dateKey: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Phone minutes *"
            required
            value={form.phoneUsageMinutes}
            onChange={(e) =>
              setForm({ ...form, phoneUsageMinutes: e.target.value })
            }
          />
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Mood 1–5"
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
          />
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Energy 1–5"
            value={form.energyLevel}
            onChange={(e) => setForm({ ...form, energyLevel: e.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Sleep minutes"
            value={form.sleepMinutes}
            onChange={(e) => setForm({ ...form, sleepMinutes: e.target.value })}
          />
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button>Save check-in</button>
        </form>
        {saved && <p className="success">Check-in saved.</p>}
        <ErrorBox error={error} />
      </section>
      <section className="panel">
        <span className="eyebrow">RECENT CHECK-INS</span>
        {history.map((item) => (
          <div className="list-row" key={item._id}>
            <div className="time-mark">{item.dateKey}</div>
            <div className="row-main">
              <strong>
                {Math.floor(item.phoneUsageMinutes / 60)}h{" "}
                {item.phoneUsageMinutes % 60}m phone usage
              </strong>
              <small>
                {item.mood ? `Mood ${item.mood}/5` : "No mood recorded"} ·{" "}
                {item.sleepMinutes
                  ? `${Math.floor(item.sleepMinutes / 60)}h sleep`
                  : "No sleep recorded"}
              </small>
            </div>
          </div>
        ))}
        {!history.length && <p className="muted">No check-ins recorded yet.</p>}
      </section>
    </div>
  );
}

export function ExercisePage() {
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState({ name: "", description: "" });
  const [log, setLog] = useState({
    dateKey: today(),
    workoutType: "",
    notes: "",
    completed: true,
  });
  async function load() {
    try {
      const [p, l] = await Promise.all([
        api.get("/exercise/plans"),
        api.get("/exercise/logs"),
      ]);
      setPlans(p.data.data);
      setLogs(l.data.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function createPlan(e) {
    e.preventDefault();
    try {
      await api.post("/exercise/plans", { ...plan, schedule: [] });
      setPlan({ name: "", description: "" });
      await load();
    } catch (e) {
      setError(e);
    }
  }
  async function createLog(e) {
    e.preventDefault();
    try {
      await api.post("/exercise/logs", log);
      setLog({ ...log, workoutType: "", notes: "" });
      await load();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div>
      <Header
        title="Exercise"
        description="Track planned routines and what you actually completed."
      />
      <ErrorBox error={error} />
      <div className="dashboard-columns">
        <section className="panel">
          <span className="eyebrow">NEW PLAN</span>
          <form onSubmit={createPlan}>
            <input
              placeholder="Plan name"
              required
              value={plan.name}
              onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            />
            <input
              placeholder="Description"
              value={plan.description}
              onChange={(e) =>
                setPlan({ ...plan, description: e.target.value })
              }
            />
            <button>Create exercise plan</button>
          </form>
          {plans.map((item) => (
            <div className="mini-row" key={item._id}>
              <span className="dot green" />
              <span>{item.name}</span>
              <small>{item.status}</small>
            </div>
          ))}
          {!plans.length && <p className="muted">No exercise plans yet.</p>}
        </section>
        <section className="panel">
          <span className="eyebrow">LOG WORKOUT</span>
          <form onSubmit={createLog}>
            <input
              type="date"
              value={log.dateKey}
              onChange={(e) => setLog({ ...log, dateKey: e.target.value })}
            />
            <input
              placeholder="Workout type"
              required
              value={log.workoutType}
              onChange={(e) => setLog({ ...log, workoutType: e.target.value })}
            />
            <input
              placeholder="Notes"
              value={log.notes}
              onChange={(e) => setLog({ ...log, notes: e.target.value })}
            />
            <button>Log completed workout</button>
          </form>
          {logs.slice(0, 8).map((item) => (
            <div className="mini-row" key={item._id}>
              <span className="dot green" />
              <span>{item.workoutType}</span>
              <small>{item.dateKey}</small>
            </div>
          ))}
          {!logs.length && (
            <p className="muted">Your completed workouts will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
