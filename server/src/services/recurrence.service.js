import crypto from 'crypto';
import Task from '../models/Task.js';
import { dateKeysBetween, shiftDateKey } from '../utils/dates.js';

export function matchesRecurrence(rule, rootDateKey, candidateDateKey) {
  if (!rule || rule.type === 'NONE' || candidateDateKey < rootDateKey) return false;
  if (rule.endDateKey && candidateDateKey > rule.endDateKey) return false;
  if (rule.type === 'DAILY') return true;
  const weekday = new Date(`${candidateDateKey}T12:00:00Z`).getUTCDay();
  if (rule.type === 'WEEKLY') return weekday === new Date(`${rootDateKey}T12:00:00Z`).getUTCDay();
  return Array.isArray(rule.weekdays) && rule.weekdays.includes(weekday);
}

export async function syncRecurringTasks(user, startDateKey, endDateKey) {
  const roots = await Task.find({ userId: user._id, recurrenceRootId: null, 'recurrence.type': { $in: ['DAILY', 'WEEKLY', 'CUSTOM'] }, dueDateKey: { $lte: endDateKey }, deletedAt: null });
  let created = 0;
  for (const root of roots) {
    const rootId = root._id;
    for (const dateKey of dateKeysBetween(startDateKey, endDateKey)) {
      if (dateKey === root.dueDateKey || !matchesRecurrence(root.recurrence, root.dueDateKey, dateKey)) continue;
      const result = await Task.updateOne({ userId: user._id, recurrenceRootId: rootId, dueDateKey: dateKey }, { $setOnInsert: { userId: user._id, recurrenceRootId: rootId, title: root.title, description: root.description, priority: root.priority, category: root.category, tags: root.tags, estimatedMinutes: root.estimatedMinutes, dueDateKey: dateKey, status: 'TODO' } }, { upsert: true });
      if (result.upsertedCount) created += 1;
    }
  }
  return { created, range: { startDateKey, endDateKey } };
}
