import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { ok, AppError } from '../utils/api.js';
import { assertDateKey } from '../utils/dates.js';

export const log = async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) throw new AppError('Habit not found', 404, 'NOT_FOUND');
  const { dateKey, actualValue, notes } = req.body; assertDateKey(dateKey);
  const target = Number(habit.dailyTarget || 1); const actual = Number(actualValue); const completionPercentage = Math.min(100, Math.round(actual / target * 100));
  const status = completionPercentage >= 100 ? 'COMPLETED' : completionPercentage > 0 ? 'PARTIAL' : 'SKIPPED';
  return ok(res, await HabitLog.findOneAndUpdate({ userId: req.user._id, habitId: habit._id, dateKey }, { userId: req.user._id, habitId: habit._id, dateKey, targetValue: target, actualValue: actual, completionPercentage, status, notes }, { upsert: true, new: true, runValidators: true }), 'Habit logged');
};
export const history = async (req, res) => ok(res, await HabitLog.find({ userId: req.user._id, habitId: req.params.id }).sort({ dateKey: -1 }).limit(180));
