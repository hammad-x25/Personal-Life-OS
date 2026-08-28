import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import ExerciseLog from '../models/ExerciseLog.js';
import TimetableEvent from '../models/TimetableEvent.js';
import PhoneUsage from '../models/PhoneUsage.js';
import Goal from '../models/Goal.js';
import HabitLog from '../models/HabitLog.js';
import DailyPerformance from '../models/DailyPerformance.js';
import { isHabitScheduledDate } from '../utils/habit-schedule.js';

const defaults = { task: 20, habit: 15, goal: 15, exercise: 10, timetable: 15, phone: 10, work: 15 };
const clamp = value => Math.max(0, Math.min(100, Math.round(value || 0)));
const ratio = (done, total) => total ? clamp(done / total * 100) : null;
export function calculateWeightedScore(components, weights = defaults) {
  const available = Object.entries(components).filter(([, value]) => value !== null && value !== undefined);
  const total = available.reduce((sum, [key]) => sum + (weights[key] || 0), 0) || 1;
  return clamp(available.reduce((sum, [key, value]) => sum + value * (weights[key] || 0), 0) / total);
}

export async function calculateDailyScore(user, dateKey, { persist = true } = {}) {
  const [tasks, habits, workouts, timetable, phone, goals, habitLogs] = await Promise.all([
    Task.find({ userId: user._id, dueDateKey: dateKey, deletedAt: null }).select('status category'),
    Habit.find({ userId: user._id, status: 'ACTIVE' }).select('_id dailyTarget minimumAcceptable frequencyType weekdays planStartDateKey planEndDateKey'),
    ExerciseLog.find({ userId: user._id, dateKey, completed: true }).select('_id'),
    TimetableEvent.find({ userId: user._id, dateKey, deletedAt: null }).select('status adherencePercentage'),
    PhoneUsage.findOne({ userId: user._id, dateKey }).select('phoneUsageMinutes'),
    Goal.find({ userId: user._id, status: 'ACTIVE', deletedAt: null }).select('currentProgress target'),
    HabitLog.find({ userId: user._id, dateKey }).select('habitId completionPercentage')
  ]);
  const weights = { ...defaults, ...(user.settings?.scoreWeights ? Object.fromEntries(user.settings.scoreWeights) : {}) };
  const components = {
    task: ratio(tasks.filter(x => x.status === 'COMPLETED').length, tasks.length),
    habit: (() => { const scheduled = habits.filter(habit => (!habit.planStartDateKey || dateKey >= habit.planStartDateKey) && (!habit.planEndDateKey || dateKey <= habit.planEndDateKey) && isHabitScheduledDate(habit, dateKey)); if (!scheduled.length) return null; const logs = new Map(habitLogs.map(item => [String(item.habitId), item.completionPercentage])); return scheduled.reduce((sum, habit) => sum + (logs.get(String(habit._id)) || 0), 0) / scheduled.length; })(),
    goal: goals.length ? goals.reduce((sum, item) => sum + Math.min(100, (item.currentProgress || 0) / (item.target || 1) * 100), 0) / goals.length : null,
    exercise: workouts.length ? 100 : null,
    timetable: timetable.length ? timetable.some(x => x.adherencePercentage !== undefined) ? timetable.reduce((sum, item) => sum + (item.adherencePercentage ?? (item.status === 'COMPLETED' ? 100 : 0)), 0) / timetable.length : ratio(timetable.filter(x => x.status === 'COMPLETED').length, timetable.length) : null,
    phone: phone ? (user.settings?.phoneTargetMinutes ? clamp(100 - Math.max(0, phone.phoneUsageMinutes - user.settings.phoneTargetMinutes) / user.settings.phoneTargetMinutes * 100) : 100) : null,
    work: ratio(tasks.filter(x => x.category === 'WORK' && x.status === 'COMPLETED').length, tasks.filter(x => x.category === 'WORK').length)
  };
  const score = calculateWeightedScore(components, weights);
  const snapshot = { userId: user._id, dateKey, score, components, weights, generatedAt: new Date(), isFinal: true };
  if (persist) await DailyPerformance.findOneAndUpdate({ userId: user._id, dateKey }, { $setOnInsert: snapshot }, { upsert: true, new: true });
  return snapshot;
}

export { defaults };
