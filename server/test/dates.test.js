import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKeyInTimezone, requiredDates, shiftDateKey, weekPeriod, monthPeriod } from '../src/utils/dates.js';

test('date keys use the requested timezone', () => {
  const instant = new Date('2026-08-17T20:30:00.000Z');
  assert.equal(dateKeyInTimezone(instant, 'Asia/Karachi'), '2026-08-18');
});

test('accountability excludes the registration day and includes all missed prior days', () => {
  assert.deepEqual(requiredDates({ timezone: 'Asia/Karachi', registeredDateKey: '2026-08-17' }, new Date('2026-08-20T12:00:00Z')), ['2026-08-17', '2026-08-18', '2026-08-19']);
});

test('period helpers are stable date-key calculations', () => {
  assert.equal(shiftDateKey('2026-08-17', 1), '2026-08-18');
  assert.equal(weekPeriod('2026-08-19').startDateKey, '2026-08-17');
  assert.equal(monthPeriod('2026-08-19').endDateKey, '2026-08-31');
});
