import { AppError } from "./api.js";
export function dateKeyInTimezone(
  date = new Date(),
  timezone = "Asia/Karachi",
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function requiredDates(user, now = new Date()) {
  const today = dateKeyInTimezone(now, user.timezone);
  if (today <= user.registeredDateKey) return [];
  const dates = [];
  let cursor = shiftDateKey(today, -1);
  while (cursor >= user.registeredDateKey) {
    dates.push(cursor);
    cursor = shiftDateKey(cursor, -1);
  }
  return dates.reverse();
}
export function assertDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new AppError("Invalid date", 400, "INVALID_DATE");
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  )
    throw new AppError("Invalid date", 400, "INVALID_DATE");
}
export function dateKeysBetween(startKey, endKey) {
  const result = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    result.push(cursor);
    cursor = shiftDateKey(cursor, 1);
  }
  return result;
}
export function weekPeriod(dateKey) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = shiftDateKey(dateKey, mondayOffset);
  return {
    periodKey: `${start}-W`,
    startDateKey: start,
    endDateKey: shiftDateKey(start, 6),
  };
}
export function monthPeriod(dateKey) {
  const start = `${dateKey.slice(0, 7)}-01`;
  const next = new Date(`${start}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return {
    periodKey: start.slice(0, 7),
    startDateKey: start,
    endDateKey: new Date(next.getTime() - 86400000).toISOString().slice(0, 10),
  };
}

export function yearPeriod(dateKey) {
  const year = dateKey.slice(0, 4);
  return {
    periodKey: year,
    startDateKey: `${year}-01-01`,
    endDateKey: `${year}-12-31`,
  };
}
