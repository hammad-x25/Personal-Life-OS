import DailyPerformance from '../models/DailyPerformance.js';
import WeeklyPerformance from '../models/WeeklyPerformance.js';
import MonthlyPerformance from '../models/MonthlyPerformance.js';
import TimelineEvent from '../models/TimelineEvent.js';
import { dateKeyInTimezone, monthPeriod, weekPeriod, shiftDateKey } from '../utils/dates.js';
import { dashboardToday, financeSummary, growth } from '../services/analytics.service.js';
import { calculateDailyScore } from '../services/score.service.js';
import { ok } from '../utils/api.js';

export const today = async (req, res) => ok(res, await dashboardToday(req.user));
export const timeline = async (req, res) => ok(res, await TimelineEvent.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(Math.min(Number(req.query.limit) || 100, 250)));
export const daily = async (req, res) => { const end = req.query.endDateKey || dateKeyInTimezone(new Date(), req.user.timezone); const start = req.query.startDateKey || shiftDateKey(end, -6); await calculateDailyScore(req.user, end); return ok(res, await DailyPerformance.find({ userId: req.user._id, dateKey: { $gte: start, $lte: end } }).sort({ dateKey: 1 })); };
export const weekly = async (req, res) => ok(res, await WeeklyPerformance.find({ userId: req.user._id }).sort({ startDateKey: -1 }).limit(52));
export const monthly = async (req, res) => ok(res, await MonthlyPerformance.find({ userId: req.user._id }).sort({ startDateKey: -1 }).limit(24));
export const growthData = async (req, res) => { const end = req.query.endDateKey || dateKeyInTimezone(new Date(), req.user.timezone); return ok(res, await growth(req.user, req.query.startDateKey || shiftDateKey(end, -29), end)); };
export const finance = async (req, res) => { const end = req.query.endDateKey || dateKeyInTimezone(new Date(), req.user.timezone); return ok(res, await financeSummary(req.user, req.query.startDateKey || shiftDateKey(end, -29), end)); };
export const currentPeriods = async (req, res) => { const dateKey = dateKeyInTimezone(new Date(), req.user.timezone); return ok(res, { week: weekPeriod(dateKey), month: monthPeriod(dateKey) }); };
