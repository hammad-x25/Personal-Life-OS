import Habit from '../models/Habit.js';
import HabitInstance from '../models/HabitInstance.js';
import TimetableEvent from '../models/TimetableEvent.js';
import { dateKeysBetween } from '../utils/dates.js';
import { isHabitScheduledDate } from '../utils/habit-schedule.js';

export function matchesRecurrence(rule, rootDateKey, candidateDateKey) {
  if (!rule || rule.type === 'NONE' || candidateDateKey < rootDateKey) return false;
  if (rule.endDateKey && candidateDateKey > rule.endDateKey) return false;
  if (rule.type === 'DAILY') return true;
  const weekday = new Date(`${candidateDateKey}T12:00:00Z`).getUTCDay();
  if (rule.type === 'WEEKLY') return weekday === new Date(`${rootDateKey}T12:00:00Z`).getUTCDay();
  return Array.isArray(rule.weekdays) && rule.weekdays.includes(weekday);
}

export async function syncRecurringTimetable(user, startDateKey, endDateKey) {
  const roots = await TimetableEvent.find({ userId: user._id, recurrenceRootId: null, 'recurrence.type': { $in: ['DAILY', 'WEEKLY', 'CUSTOM'] }, dateKey: { $lte: endDateKey }, deletedAt: null });
  let created = 0;
  for (const root of roots) {
    for (const dateKey of dateKeysBetween(startDateKey, endDateKey)) {
      if (dateKey === root.dateKey || !matchesRecurrence(root.recurrence, root.dateKey, dateKey)) continue;
      const result = await TimetableEvent.updateOne({ userId: user._id, recurrenceRootId: root._id, dateKey }, { $setOnInsert: { userId: user._id, recurrenceRootId: root._id, title: root.title, category: root.category, dateKey, startTime: root.startTime, endTime: root.endTime, priority: root.priority, color: root.color, notes: root.notes, status: 'PLANNED', recurrence: { type: 'NONE' } } }, { upsert: true });
      if (result.upsertedCount) created += 1;
    }
  }
  return { created, range: { startDateKey, endDateKey } };
}

export async function syncHabitInstances(user, startDateKey, endDateKey) {
  const habits = await Habit.find({ userId: user._id, status: 'ACTIVE', $or: [{ planStartDateKey: { $lte: endDateKey } }, { planStartDateKey: null }] }).select('_id dailyTarget planStartDateKey planEndDateKey frequencyType weekdays');
  let created = 0;
  for (const habit of habits) {
    const start = habit.planStartDateKey > startDateKey ? habit.planStartDateKey : startDateKey;
    const end = habit.planEndDateKey && habit.planEndDateKey < endDateKey ? habit.planEndDateKey : endDateKey;
    if (start > end) continue;
    for (const dateKey of dateKeysBetween(start, end)) {
      if (!isHabitScheduledDate(habit, dateKey)) continue;
      const result = await HabitInstance.updateOne({ userId: user._id, habitId: habit._id, dateKey }, { $setOnInsert: { userId: user._id, habitId: habit._id, dateKey, targetValue: habit.dailyTarget || 0, status: 'PLANNED' } }, { upsert: true });
      if (result.upsertedCount) created += 1;
    }
  }
  return { created, range: { startDateKey, endDateKey } };
}
