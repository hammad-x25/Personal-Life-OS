import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import ExerciseLog from '../models/ExerciseLog.js';
import TimetableEvent from '../models/TimetableEvent.js';
import PhoneUsage from '../models/PhoneUsage.js';
import DailyPerformance from '../models/DailyPerformance.js';

const defaults = { task: 20, habit: 15, goal: 15, exercise: 10, timetable: 15, phone: 10, work: 15 };
const clamp = value => Math.max(0, Math.min(100, Math.round(value || 0)));
const ratio = (done, total) => total ? clamp(done / total * 100) : null;

export async function calculateDailyScore(user, dateKey, { persist = true } = {}) {
  const [tasks, habits, workouts, timetable, phone] = await Promise.all([
    Task.find({ userId: user._id, dueDateKey: dateKey, deletedAt: null }).select('status'),
    Habit.find({ userId: user._id, status: 'ACTIVE' }).select('dailyTarget minimumAcceptable'),
    ExerciseLog.find({ userId: user._id, dateKey, completed: true }).select('_id'),
    TimetableEvent.find({ userId: user._id, dateKey, deletedAt: null }).select('status'),
    PhoneUsage.findOne({ userId: user._id, dateKey }).select('phoneUsageMinutes')
  ]);
  const weights = { ...defaults, ...(user.settings?.scoreWeights ? Object.fromEntries(user.settings.scoreWeights) : {}) };
  const components = {
    task: ratio(tasks.filter(x => x.status === 'COMPLETED').length, tasks.length),
    habit: habits.length ? 100 : null,
    goal: null,
    exercise: workouts.length ? 100 : null,
    timetable: ratio(timetable.filter(x => x.status === 'COMPLETED').length, timetable.length),
    phone: phone ? (user.settings?.phoneTargetMinutes ? clamp(100 - Math.max(0, phone.phoneUsageMinutes - user.settings.phoneTargetMinutes) / user.settings.phoneTargetMinutes * 100) : 100) : null,
    work: null
  };
  const available = Object.entries(components).filter(([, value]) => value !== null);
  const weightTotal = available.reduce((sum, [key]) => sum + (weights[key] || 0), 0) || 1;
  const score = clamp(available.reduce((sum, [key, value]) => sum + value * (weights[key] || 0), 0) / weightTotal);
  const snapshot = { userId: user._id, dateKey, score, components, weights, generatedAt: new Date(), isFinal: true };
  if (persist) await DailyPerformance.findOneAndUpdate({ userId: user._id, dateKey }, { $setOnInsert: snapshot }, { upsert: true, new: true });
  return snapshot;
}

export { defaults };
