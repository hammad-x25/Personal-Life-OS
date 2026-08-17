import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { AppError } from "../utils/api.js";
import { dateKeyInTimezone } from "../utils/dates.js";
import {
  signAccess,
  signRefresh,
  hashToken,
  verifyRefresh,
} from "./token.service.js";

export async function register({
  name,
  email,
  password,
  timezone = "Asia/Karachi",
}) {
  email = email.toLowerCase();
  if (await User.exists({ email }))
    throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
  const user = await User.create({
    name,
    email,
    timezone,
    registeredDateKey: dateKeyInTimezone(new Date(), timezone),
    passwordHash: await bcrypt.hash(password, 12),
  });
  return issue(user);
}
export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  return issue(user);
}
async function issue(user) {
  const accessToken = signAccess(user._id),
    refreshToken = signRefresh(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastActiveAt = new Date();
  await user.save();
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.refreshTokenHash;
  return { user: safeUser, accessToken, refreshToken };
}
export async function refresh(token) {
  const payload = verifyRefresh(token),
    user = await User.findById(payload.userId);
  if (!user || user.refreshTokenHash !== hashToken(token))
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  return issue(user);
}
