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
  const [adherence, setAdherence] = useState(null);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState({ name: "", description: "", weekday: 1, exerciseName: "", sets: 3, repetitions: 10 });
  const [log, setLog] = useState({
    dateKey: today(),
    workoutType: "",
    notes: "",
    completed: true,
    planId: "",
    durationMinutes: "",
    calories: "",
  });
  async function load() {
    try {
      const [p, l, a] = await Promise.all([
        api.get("/exercise/plans"),
        api.get("/exercise/logs"),
        api.get("/exercise/adherence"),
      ]);
      setPlans(p.data.data);
      setLogs(l.data.data);
      setAdherence(a.data.data);
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
      await api.post("/exercise/plans", { name: plan.name, description: plan.description, schedule: [{ weekday: Number(plan.weekday), exercises: [{ name: plan.exerciseName || 'Custom workout', sets: Number(plan.sets), repetitions: Number(plan.repetitions) }] }] });
      setPlan({ name: "", description: "", weekday: 1, exerciseName: "", sets: 3, repetitions: 10 });
      await load();
    } catch (e) {
      setError(e);
    }
  }
  async function createLog(e) {
    e.preventDefault();
    try {
      await api.post("/exercise/logs", { ...log, planId: log.planId || undefined, durationMinutes: log.durationMinutes ? Number(log.durationMinutes) : undefined, calories: log.calories ? Number(log.calories) : undefined });
      setLog({ ...log, workoutType: "", notes: "", planId: "" });
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
            <select value={plan.weekday} onChange={(e) => setPlan({ ...plan, weekday: e.target.value })}><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
            <input placeholder="First exercise" value={plan.exerciseName} onChange={(e) => setPlan({ ...plan, exerciseName: e.target.value })} />
            <div className="inline-form"><input type="number" min="0" placeholder="Sets" value={plan.sets} onChange={(e) => setPlan({ ...plan, sets: e.target.value })} /><input type="number" min="0" placeholder="Reps" value={plan.repetitions} onChange={(e) => setPlan({ ...plan, repetitions: e.target.value })} /></div>
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
              <small>{item.status} · {item.schedule?.[0]?.exercises?.[0]?.name || "Custom exercises"}</small>
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
            <input type="number" min="0" placeholder="Duration minutes" value={log.durationMinutes} onChange={(e) => setLog({ ...log, durationMinutes: e.target.value })} />
            <input type="number" min="0" placeholder="Calories (optional)" value={log.calories} onChange={(e) => setLog({ ...log, calories: e.target.value })} />
            <select value={log.planId} onChange={e => setLog({ ...log, planId: e.target.value })}><option value="">Unplanned / custom workout</option>{plans.filter(item => item.status === "ACTIVE").map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
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
      <section className="panel"><div className="row-between"><span className="eyebrow">7-DAY PLAN ADHERENCE</span><strong>{adherence?.adherencePercentage == null ? "—" : `${adherence.adherencePercentage}%`}</strong></div><p className="muted">{adherence?.plannedDays || 0} planned workout days · {adherence?.completedDays || 0} completed days</p><div className="habit-heatmap">{adherence?.rows?.map(row => <i key={row.dateKey} title={`${row.dateKey}: ${row.completed}/${row.planned}`} className={row.completed > 0 ? "complete" : row.planned > 0 ? "partial" : ""} />)}</div></section>
    </div>
  );
}
