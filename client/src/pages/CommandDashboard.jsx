import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

function ErrorBox({ error }) {
  return error ? (
    <div className="error-box">
      {error.response?.data?.message || error.message || "Something went wrong"}
    </div>
  ) : null;
}

export function CommandDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/today")
      .then((response) => setData(response.data.data))
      .catch(setError);
  }, []);

  if (error) {
    return (
      <div>
        <div className="page-header">
          <div>
            <span className="eyebrow">MEASURE</span>
            <h1>Today</h1>
            <p className="muted">Your command center could not load.</p>
          </div>
        </div>
        <ErrorBox error={error} />
      </div>
    );
  }

  if (!data) return <div className="center">Loading today...</div>;

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
        <Link className="button" to="/app/tasks">
          + Add a task
        </Link>
      </div>
      <div className="grid">
        <div className="card">
          <span className="eyebrow">PRODUCTIVITY</span>
          <strong>{score}%</strong>
          <p className="muted">Backend-calculated today</p>
        </div>
        <div className="card">
          <span className="eyebrow">TASKS</span>
          <strong>{data.tasks.completed} / {data.tasks.total}</strong>
          <p className="muted">Completed today</p>
        </div>
        <div className="card">
          <span className="eyebrow">SPENDING</span>
          <strong>Rs. {Number(data.finance.total || 0).toLocaleString()}</strong>
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
              <span className={`dot ${task.status === "COMPLETED" ? "green" : ""}`} />
              <span>{task.title}</span>
              <small>{task.status.replace("_", " ")}</small>
            </div>
          ))}
          {!data.tasks.items.length && <p className="muted">No tasks scheduled for today.</p>}
        </section>
        <section className="panel">
          <span className="eyebrow">GOALS IN MOTION</span>
          {data.goals.map((goal) => {
            const pct = Math.min(100, Math.round(((goal.currentProgress || 0) / (goal.target || 1)) * 100));
            return (
              <div className="goal-row" key={goal._id}>
                <div>
                  <strong>{goal.title}</strong>
                  <small>{goal.currentProgress || 0} / {goal.target || 0} {goal.unit || ""}</small>
                </div>
                <div className="progress"><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {!data.goals.length && <p className="muted">Create a goal to see progress here.</p>}
        </section>
      </div>
    </div>
  );
}
