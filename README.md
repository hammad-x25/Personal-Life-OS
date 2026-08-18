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
- Server-side AI review service with local fallback and validated structured output
- Search across tasks, goals, habits, projects, expenses, and timeline events

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

Demo credentials after seeding:

```text
Email: demo@lifeos.local
Password: password123
```

MongoDB Compass can connect to the URI in `.env`; the default database is `life_os`.

## Accountability behavior

The first registration day is not blocked. Starting on subsequent days, the backend calculates all required dates in the user's timezone. Normal productivity CRUD routes remain locked until phone usage and spending are explicitly accounted for. Existing expenses are aggregated during confirmation; a missing expense is never interpreted as zero. The explicit zero-spending action creates a separate acknowledgement record.

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
```

## Architecture direction

Business rules belong in backend services and middleware. Date-only concepts use `dateKey` values such as `2026-08-17`; timestamps remain UTC. Future phases add deterministic analytics snapshots, timeline events, background jobs, and the isolated server-side AI service without moving secrets to the browser.

## Troubleshooting

- If the API cannot connect, start the MongoDB service and verify `MONGODB_URI`.
- If the browser reports CORS errors, verify `CLIENT_URL` matches the Vite URL.
- If the app is locked, use the accountability screen; direct API calls are intentionally subject to the same backend gate.
