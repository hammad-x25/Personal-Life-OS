import mongoose from "mongoose";
import { env } from "./config/env.js";
export async function connectDatabase() {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
