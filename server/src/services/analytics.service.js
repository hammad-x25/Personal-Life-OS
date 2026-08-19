import Expense from '../models/Expense.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import ExerciseLog from '../models/ExerciseLog.js';
import PhoneUsage from '../models/PhoneUsage.js';
import TimetableEvent from '../models/TimetableEvent.js';
import Project from '../models/Project.js';
import DailyPerformance from '../models/DailyPerformance.js';
import SpendingAccountability from '../models/SpendingAccountability.js';
import { dateKeyInTimezone, dateKeysBetween, shiftDateKey } from '../utils/dates.js';
import { calculateDailyScore } from './score.service.js';

export async function dashboardToday(user) {
  const dateKey = dateKeyInTimezone(new Date(), user.timezone);
  const [score, tasks, habits, exercise, timetable, phone, finance, goals, work] = await Promise.all([
    calculateDailyScore(user, dateKey),
    Task.find({ userId: user._id, dueDateKey: dateKey, deletedAt: null }).select('title status priority dueDateKey').sort({ priority: -1 }),
    Habit.find({ userId: user._id, status: 'ACTIVE' }).select('title dailyTarget targetUnit'),
    ExerciseLog.countDocuments({ userId: user._id, dateKey, completed: true }),
    TimetableEvent.find({ userId: user._id, dateKey, deletedAt: null }).select('title startTime endTime status'),
    PhoneUsage.findOne({ userId: user._id, dateKey }),
    Expense.aggregate([{ $match: { userId: user._id, dateKey, type: 'EXPENSE', deletedAt: null } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Goal.find({ userId: user._id, status: 'ACTIVE', deletedAt: null }).select('title currentProgress target unit').limit(6),
    Task.countDocuments({ userId: user._id, dueDateKey: dateKey, category: 'WORK', status: 'COMPLETED', deletedAt: null })
  ]);
  return { dateKey, score, tasks: { items: tasks, completed: tasks.filter(x => x.status === 'COMPLETED').length, total: tasks.length }, habits: { active: habits.length }, exercise: { completed: exercise > 0 }, timetable, phoneUsage: phone, finance: finance[0] || { total: 0, count: 0 }, goals, work: { completed: work } };
}

export async function growth(user, startDateKey, endDateKey) {
  const currentKeys = dateKeysBetween(startDateKey, endDateKey);
  const previousEnd = shiftDateKey(startDateKey, -1);
  const previousStart = shiftDateKey(previousEnd, -(currentKeys.length - 1));
  const rows = await DailyPerformance.find({ userId: user._id, dateKey: { $gte: previousStart, $lte: endDateKey } }).sort({ dateKey: 1 });
  const current = rows.filter(x => x.dateKey >= startDateKey).map(x => x.score);
  const previous = rows.filter(x => x.dateKey < startDateKey).map(x => x.score);
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const currentScore = average(current), previousScore = average(previous);
  return { startDateKey, endDateKey, currentScore, previousScore, growthPercentage: previousScore ? ((currentScore - previousScore) / previousScore) * 100 : null, history: rows };
}

export async function financeSummary(user, startDateKey, endDateKey) {
  const match = { userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey }, deletedAt: null };
  const [totals, categories, trend, accountability] = await Promise.all([
    Expense.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Expense.aggregate([{ $match: { ...match, type: 'EXPENSE' } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]),
    Expense.aggregate([{ $match: { ...match, type: 'EXPENSE' } }, { $group: { _id: '$dateKey', total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    SpendingAccountability.countDocuments({ userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey }, status: 'ACCOUNTED' })
  ]);
  return { totals, categories, trend, accountabilityDays: accountability };
}
