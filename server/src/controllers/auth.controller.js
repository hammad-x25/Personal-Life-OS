import { login, refresh, register, revokeRefreshToken } from '../services/auth.service.js'; import { ok } from '../utils/api.js';
import { env } from '../config/env.js';
const cookie = { httpOnly: true, sameSite: env.isProduction ? 'strict' : 'lax', secure: env.cookieSecure, path: '/' };
function send(res, result, message, status = 200) { res.cookie('accessToken', result.accessToken, { ...cookie, maxAge: 900000 }); res.cookie('refreshToken', result.refreshToken, { ...cookie, maxAge: 2592000000 }); return ok(res, { user: result.user }, message, status); }
export const registerUser = async (req, res) => send(res, await register(req.body), 'Account created', 201);
export const loginUser = async (req, res) => send(res, await login(req.body), 'Logged in');
export const refreshToken = async (req, res) => send(res, await refresh(req.cookies.refreshToken), 'Token refreshed');
export const logout = async (req, res) => { await revokeRefreshToken(req.cookies.refreshToken); res.clearCookie('accessToken'); res.clearCookie('refreshToken'); return ok(res, null, 'Logged out'); };
export const me = async (req, res) => ok(res, req.user);
