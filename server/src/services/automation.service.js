import User from '../models/User.js';
import DailyPerformance from '../models/DailyPerformance.js';
import { calculateDailyScore } from './score.service.js';
import { finalizePeriod } from './performance.service.js';
import { createDailyReminders } from './notification.service.js';
import { createTimelineEvent } from './timeline.service.js';
import { dateKeyInTimezone, shiftDateKey, weekPeriod, monthPeriod } from '../utils/dates.js';

export async function runAutomation(now = new Date()) {
  const users = await User.find({}).select('_id timezone settings');
  for (const user of users) {
    const today = dateKeyInTimezone(now, user.timezone);
    const yesterday = shiftDateKey(today, -1);
    const snapshot = await calculateDailyScore(user, yesterday, { persist: true });
    if (snapshot) await createTimelineEvent({ userId: user._id, type: 'DAILY_PERFORMANCE_GENERATED', title: `Daily performance recorded: ${snapshot.score}%`, timezone: user.timezone, metadata: { dateKey: yesterday } });
    await finalizePeriod(user, 'WEEKLY', weekPeriod(yesterday));
    await finalizePeriod(user, 'MONTHLY', monthPeriod(yesterday));
    await createDailyReminders(user);
  }
  return { users: users.length };
}
