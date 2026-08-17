import { AppError } from './api.js';
export function dateKeyInTimezone(date = new Date(), timezone = 'Asia/Karachi') { return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
export function shiftDateKey(dateKey, days) { const date = new Date(`${dateKey}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
export function requiredDates(user, now = new Date()) { const today = dateKeyInTimezone(now, user.timezone); if (today <= user.registeredDateKey) return []; const dates = []; let cursor = shiftDateKey(today, -1); while (cursor >= user.registeredDateKey) { dates.push(cursor); cursor = shiftDateKey(cursor, -1); } return dates.reverse(); }
export function assertDateKey(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError('Invalid date', 400, 'INVALID_DATE'); }
