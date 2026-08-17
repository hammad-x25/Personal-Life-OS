import jwt from 'jsonwebtoken'; import crypto from 'crypto'; import { env } from '../config/env.js';
export const signAccess = id => jwt.sign({ userId: id }, env.accessSecret, { expiresIn: env.accessExpiry });
export const signRefresh = id => jwt.sign({ userId: id }, env.refreshSecret, { expiresIn: env.refreshExpiry });
export const verifyAccess = token => jwt.verify(token, env.accessSecret);
export const verifyRefresh = token => jwt.verify(token, env.refreshSecret);
export const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
