import TimelineEvent from '../models/TimelineEvent.js';
import { dateKeyInTimezone } from '../utils/dates.js';

export async function createTimelineEvent({ userId, type, title, description, entityId, entityType, timestamp = new Date(), timezone = 'Asia/Karachi', metadata = {} }) {
  return TimelineEvent.create({ userId, type, title, description, entityId, entityType, timestamp, dateKey: dateKeyInTimezone(timestamp, timezone), metadata });
}
