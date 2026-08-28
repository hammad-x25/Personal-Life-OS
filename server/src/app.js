import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from 'mongoose';
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { requestContext } from './middleware/request-context.js';
const app = express();
if (env.trustProxy) app.set('trust proxy', 1);
app.use(requestContext);
app.use((req, res, next) => { res.setHeader('x-content-type-options', 'nosniff'); res.setHeader('x-frame-options', 'DENY'); res.setHeader('referrer-policy', 'same-origin'); res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()'); next(); });
app.use(cors({ origin: (origin, callback) => { if (!origin || env.clientUrls.includes(origin)) return callback(null, true); return callback(new Error('CORS origin not allowed')); }, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60000, limit: 120 }));
app.get("/health", (req, res) =>
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  }),
);
app.get('/health/live', (req, res) => res.json({ success: true, data: { status: 'alive', timestamp: new Date().toISOString(), requestId: req.requestId } }));
app.get('/health/ready', (req, res) => { const ready = mongoose.connection.readyState === 1; return res.status(ready ? 200 : 503).json({ success: ready, code: ready ? undefined : 'DATABASE_NOT_READY', data: { status: ready ? 'ready' : 'not_ready', databaseState: mongoose.connection.readyState, timestamp: new Date().toISOString(), requestId: req.requestId } }); });
app.use("/api", routes);
app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.path}`,
      details: null,
    }),
);
app.use(errorHandler);
export default app;
