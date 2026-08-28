import app from "./app.js";
import { connectDatabase } from "./db.js";
import { env } from "./config/env.js";
import { runAutomation } from "./services/automation.service.js";
import mongoose from 'mongoose';
let server;
let automationTimer;
try {
  await connectDatabase();
  server = app.listen(env.port, () =>
    console.log(`Life OS API listening on http://localhost:${env.port}`),
  );
  if (env.jobsEnabled) {
    const run = () => runAutomation().catch(error => console.error('Automation job failed:', error.message));
    run();
    automationTimer = setInterval(run, 60 * 60 * 1000);
  }
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE")
      console.error(
        `Port ${env.port} is already in use. Stop the existing API process or choose another PORT.`,
      );
    else console.error("API server failed to start:", error);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(
    "API startup failed. Check MongoDB and MONGODB_URI.",
    error.message,
  );
  process.exitCode = 1;
}

async function shutdown(signal) { console.log(`Received ${signal}; shutting down gracefully`); if (automationTimer) clearInterval(automationTimer); if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); process.exit(0); }
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
