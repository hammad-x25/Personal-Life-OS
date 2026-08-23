import { dateKeyInTimezone, shiftDateKey } from '../utils/dates.js';
import { syncRecurringTasks } from '../services/recurrence.service.js';
import { ok } from '../utils/api.js';

export const syncTasks = async (req, res) => { const today = dateKeyInTimezone(new Date(), req.user.timezone); return ok(res, await syncRecurringTasks(req.user, today, shiftDateKey(today, 30)), 'Recurring tasks synchronized'); };
