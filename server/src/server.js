import app from "./app.js";
import { connectDatabase } from "./db.js";
import { env } from "./config/env.js";
try {
  await connectDatabase();
  const server = app.listen(env.port, () =>
    console.log(`Life OS API listening on http://localhost:${env.port}`),
  );
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
