import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { ok, AppError } from '../utils/api.js';
import { assertDateKey } from '../utils/dates.js';
import { dateKeyInTimezone, dateKeysBetween, shiftDateKey } from '../utils/dates.js';
import HabitInstance from '../models/HabitInstance.js';
import { isHabitScheduledDate } from '../utils/habit-schedule.js';
import { syncHabitInstances } from '../services/schedule.service.js';
export { isHabitScheduledDate } from '../utils/habit-schedule.js';
export function habitLogStatus(actual, target, minimum) {
  if (actual >= target) return 'COMPLETED';
  if (actual > 0 && actual >= minimum) return 'PARTIAL';
  return 'SKIPPED';
}

export const log = async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) throw new AppError('Habit not found', 404, 'NOT_FOUND');
  const { dateKey, actualValue, notes } = req.body; assertDateKey(dateKey);
  if (habit.planStartDateKey && dateKey < habit.planStartDateKey) throw new AppError('Habit log is before the plan start date', 422, 'INVALID_DATE');
  if (habit.planEndDateKey && dateKey > habit.planEndDateKey) throw new AppError('Habit log is after the plan end date', 422, 'INVALID_DATE');
  if (!isHabitScheduledDate(habit, dateKey)) throw new AppError('This habit is not scheduled for that day', 422, 'HABIT_NOT_SCHEDULED');
  const target = Number(habit.dailyTarget || 1); const minimum = Number(habit.minimumAcceptable || 0); const actual = Number(actualValue); const completionPercentage = Math.min(100, Math.round(actual / target * 100));
  const status = habitLogStatus(actual, target, minimum);
  const item = await HabitLog.findOneAndUpdate({ userId: req.user._id, habitId: habit._id, dateKey }, { userId: req.user._id, habitId: habit._id, dateKey, targetValue: target, actualValue: actual, completionPercentage, status, notes }, { upsert: true, new: true, runValidators: true });
  await HabitInstance.findOneAndUpdate({ userId: req.user._id, habitId: habit._id, dateKey }, { targetValue: target, actualValue: actual, completionPercentage, status, loggedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return ok(res, item, 'Habit logged');
};
export const instances = async (req, res) => { const today = dateKeyInTimezone(new Date(), req.user.timezone); const startDateKey = req.query.startDateKey || shiftDateKey(today, -6); const endDateKey = req.query.endDateKey || shiftDateKey(today, 30); await syncHabitInstances(req.user, startDateKey, endDateKey); return ok(res, await HabitInstance.find({ userId: req.user._id, dateKey: { $gte: startDateKey, $lte: endDateKey } }).populate('habitId', 'title targetUnit').sort({ dateKey: 1 })); };
export const history = async (req, res) => ok(res, await HabitLog.find({ userId: req.user._id, habitId: req.params.id }).sort({ dateKey: -1 }).limit(180));

export const stats = async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) throw new AppError('Habit not found', 404, 'NOT_FOUND');
  const today = dateKeyInTimezone(new Date(), req.user.timezone);
  const start = habit.planStartDateKey || shiftDateKey(today, -89);
  const end = habit.planEndDateKey && habit.planEndDateKey < today ? habit.planEndDateKey : today;
  const logs = await HabitLog.find({ userId: req.user._id, habitId: habit._id, dateKey: { $gte: start, $lte: end } }).sort({ dateKey: 1 });
  const logMap = new Map(logs.map(logItem => [logItem.dateKey, logItem]));
  const expectedDates = dateKeysBetween(start, end).filter(dateKey => isHabitScheduledDate(habit, dateKey));
  const completedDates = expectedDates.filter(dateKey => (logMap.get(dateKey)?.completionPercentage || 0) >= 100);
  const activeDates = expectedDates.filter(dateKey => (logMap.get(dateKey)?.completionPercentage || 0) > 0);
  let cursor = expectedDates.at(-1) || today;
  while (cursor > today && expectedDates.length) cursor = expectedDates[expectedDates.indexOf(cursor) - 1];
  let currentStreak = 0;
  while (expectedDates.includes(cursor) && (logMap.get(cursor)?.completionPercentage || 0) > 0) { currentStreak += 1; const index = expectedDates.indexOf(cursor); cursor = expectedDates[index - 1]; }
  let longestStreak = 0; let running = 0;
  for (const dateKey of expectedDates) { if ((logMap.get(dateKey)?.completionPercentage || 0) > 0) { running += 1; longestStreak = Math.max(longestStreak, running); } else running = 0; }
  return ok(res, { habit, startDateKey: start, endDateKey: end, currentStreak, longestStreak, completionRate: expectedDates.length ? completedDates.length / expectedDates.length * 100 : 0, activeRate: expectedDates.length ? activeDates.length / expectedDates.length * 100 : 0, completedDays: completedDates.length, partialOrCompletedDays: activeDates.length, heatmap: expectedDates.map(dateKey => ({ dateKey, completionPercentage: logMap.get(dateKey)?.completionPercentage || 0, status: logMap.get(dateKey)?.status || 'MISSED' })) });
};

export const heatmap = async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id, status: { $ne: 'ARCHIVED' } }).select('_id title');
  const logs = await HabitLog.find({ userId: req.user._id, dateKey: { $gte: req.query.startDateKey || shiftDateKey(dateKeyInTimezone(new Date(), req.user.timezone), -89), $lte: req.query.endDateKey || dateKeyInTimezone(new Date(), req.user.timezone) } }).select('habitId dateKey completionPercentage status');
  return ok(res, { habits, logs });
};
