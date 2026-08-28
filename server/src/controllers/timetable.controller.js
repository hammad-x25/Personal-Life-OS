import TimetableEvent from '../models/TimetableEvent.js';
import { ok, AppError } from '../utils/api.js';
import { createTimelineEvent } from '../services/timeline.service.js';
import { syncRecurringTimetable } from '../services/schedule.service.js';
import { dateKeyInTimezone, shiftDateKey } from '../utils/dates.js';

const minutes = value => { const [hours, mins] = value.split(':').map(Number); return hours * 60 + mins; };
export function calculateAdherence(plannedStart, plannedEnd, actualStart, actualEnd) { const plannedDuration = Math.max(1, minutes(plannedEnd) - minutes(plannedStart)); const actualDuration = Math.max(1, minutes(actualEnd) - minutes(actualStart)); const startDelay = Math.max(0, minutes(actualStart) - minutes(plannedStart)); const durationScore = Math.min(100, actualDuration / plannedDuration * 100); const punctualityScore = Math.max(0, 100 - startDelay / plannedDuration * 100); return Math.round((durationScore * 0.7) + (punctualityScore * 0.3)); }
export const complete = async (req, res) => {
  const event = await TimetableEvent.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
  if (!event) throw new AppError('Timetable event not found', 404, 'NOT_FOUND');
  const adherencePercentage = calculateAdherence(event.startTime, event.endTime, req.body.actualStartTime, req.body.actualEndTime);
  event.actualStartTime = req.body.actualStartTime; event.actualEndTime = req.body.actualEndTime; event.adherencePercentage = adherencePercentage; event.status = req.body.status; await event.save();
  await createTimelineEvent({ userId: req.user._id, type: 'TIMETABLE_COMPLETED', title: `Completed timetable block: ${event.title}`, entityId: event._id, entityType: 'TimetableEvent', timezone: req.user.timezone, metadata: { adherencePercentage } });
  return ok(res, event, 'Timetable adherence recorded');
};

export const adherence = async (req, res) => ok(res, await TimetableEvent.aggregate([{ $match: { userId: req.user._id, dateKey: { $gte: req.query.startDateKey, $lte: req.query.endDateKey }, deletedAt: null, adherencePercentage: { $exists: true } } }, { $group: { _id: '$dateKey', adherencePercentage: { $avg: '$adherencePercentage' }, completed: { $sum: 1 } } }, { $sort: { _id: 1 } }]));
export const syncRecurring = async (req, res) => { const today = dateKeyInTimezone(new Date(), req.user.timezone); return ok(res, await syncRecurringTimetable(req.user, today, shiftDateKey(today, 30)), 'Recurring timetable synchronized'); };
