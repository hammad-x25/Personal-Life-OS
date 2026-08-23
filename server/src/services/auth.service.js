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
import RefreshToken from '../models/RefreshToken.js';
import crypto from 'crypto';

function expiryDate(value) {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 30 * 86400000);
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + Number(match[1]) * units[match[2]]);
}

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
async function issue(user, familyId = crypto.randomUUID()) {
  const accessToken = signAccess(user._id),
    refreshToken = signRefresh(user._id);
  user.lastActiveAt = new Date();
  await user.save();
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(refreshToken), familyId, expiresAt: expiryDate(process.env.REFRESH_TOKEN_EXPIRY || '30d') });
  const safeUser = user.toObject();
  delete safeUser.passwordHash;
  delete safeUser.refreshTokenHash;
  return { user: safeUser, accessToken, refreshToken };
}
export async function refresh(token) {
  const payload = verifyRefresh(token);
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  const user = await User.findById(payload.userId);
  if (!user || !stored || stored.userId.toString() !== user._id.toString() || stored.revokedAt || stored.expiresAt <= new Date()) throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  stored.revokedAt = new Date();
  const result = await issue(user, stored.familyId);
  const replacement = await RefreshToken.findOne({ tokenHash: hashToken(result.refreshToken) });
  stored.replacedByTokenId = replacement?._id;
  await stored.save();
  return result;
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { $set: { revokedAt: new Date() } });
}
