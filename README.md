# Personal Life OS

A local-first MERN personal operating system for planning, recording, measuring, reviewing, and improving daily life.

## Current foundation

- React + Vite client with responsive dark UI
- Express + Mongoose API
- Local MongoDB configuration
- JWT access and refresh cookies
- Timezone-aware registration date and accountability dates
- Mandatory phone usage and spending accountability gate
- Multi-day catch-up when the user returns after an absence
- Expenses, tasks, goals, and habits API models
- Soft deletion for historical integrity
- Seed data for a demo account
- Backend dashboard aggregation and deterministic daily score snapshots
- Finance summaries, projects, project milestones, timeline events, and historical analytics APIs
- Daily, weekly, monthly, and yearly performance snapshots with growth comparisons
- Historical analytics explorer with preset, custom, and all-time date ranges
- Server-side AI review service with local fallback and validated structured output
- Search across tasks, goals, habits, projects, expenses, and timeline events
- Rotating, revocable refresh-token sessions with MongoDB TTL cleanup
- Configurable profile, timezone, currency, score weights, accountability, and theme settings
- Scheduled reminders and 14-day analytics seed data
- Retryable startup/accountability states and an in-app API/database outage banner

## Requirements

- Node.js 20+
- Local MongoDB running on `mongodb://127.0.0.1:27017`

## Setup

```powershell
Copy-Item .env.example .env
npm run install:all
npm run seed
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Containerized run

For a production-like local stack with MongoDB, API, and Nginx frontend:

```powershell
docker compose up --build
```

The frontend is served at `http://localhost`, the API at `http://localhost:5000`, and MongoDB uses the `lifeos-mongo` named volume. Replace the example production secrets before deploying anywhere public.

Health endpoints:

```text
GET /health/live
GET /health/ready
```

To enable hourly local automation for daily snapshots, period summaries, and reminders:

```powershell
$env:ENABLE_JOBS="true"
npm.cmd run dev:server
```

Demo credentials after seeding:

```text
Email: demo@lifeos.local
Password: password123
```

MongoDB Compass can connect to the URI in `.env`; the default database is `life_os`.

## Accountability behavior

The first registration day is not blocked. Starting on subsequent days, the backend calculates all required dates in the user's timezone. Normal productivity CRUD routes remain locked until phone usage and spending are explicitly accounted for. Existing expenses are aggregated during confirmation; a missing expense is never interpreted as zero. The explicit zero-spending action creates a separate acknowledgement record.

## Tests

```powershell
npm.cmd --prefix server test
```

The test suite covers timezone boundaries, multi-day accountability, score weighting, expense validation, and timetable validation.

## API starting points

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/access/status
POST /api/check-ins/phone
GET  /api/spending-accountability/:dateKey/preview
POST /api/spending-accountability/:dateKey/confirm
POST /api/spending-accountability/:dateKey/no-spending
GET/POST/PATCH/DELETE /api/expenses
GET/POST/PATCH/DELETE /api/tasks
GET/POST/PATCH/DELETE /api/goals
GET/POST/PATCH/DELETE /api/habits
GET  /api/dashboard/yearly
GET  /api/analytics/yearly
GET  /api/analytics/history?startDateKey=2026-01-01&endDateKey=2026-03-31
GET  /api/analytics/history?allTime=true
```

## Architecture direction

Business rules belong in backend services and middleware. Date-only concepts use `dateKey` values such as `2026-08-17`; timestamps remain UTC. Deterministic analytics snapshots, timeline events, background jobs, and the isolated server-side AI service keep secrets and calculations out of the browser.

## Troubleshooting

- If the API cannot connect, start the MongoDB service and verify `MONGODB_URI`.
- If the browser reports CORS errors, verify `CLIENT_URL` matches the Vite URL.
- If the app is locked, use the accountability screen; direct API calls are intentionally subject to the same backend gate.

When the API or local MongoDB becomes unavailable after login, the client shows a service-status banner instead of failing silently. Startup and accountability checks provide a `Try again` action. The banner is cleared automatically after a successful API response.
