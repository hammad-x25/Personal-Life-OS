import { dateKeysBetween } from '../utils/dates.js';

const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export function calculateAccountabilityMetrics(rows, startDateKey, endDateKey) {
  const dates = dateKeysBetween(startDateKey, endDateKey);
  const accounted = new Map(rows.map(row => [row.dateKey, row]));
  const accountedRows = dates.filter(dateKey => accounted.has(dateKey)).map(dateKey => accounted.get(dateKey));
  const spendingValues = accountedRows.map(row => Number(row.totalSpent || 0));
  const highest = accountedRows.reduce((result, row) => !result || row.totalSpent > result.totalSpent ? row : result, null);
  let currentStreak = 0;
  for (let index = dates.length - 1; index >= 0 && accounted.has(dates[index]); index -= 1) currentStreak += 1;
  let longestStreak = 0;
  let streak = 0;
  for (const dateKey of dates) {
    if (accounted.has(dateKey)) streak += 1;
    else streak = 0;
    longestStreak = Math.max(longestStreak, streak);
  }
  return {
    startDateKey,
    endDateKey,
    totalDays: dates.length,
    accountedDays: accountedRows.length,
    missedDays: dates.length - accountedRows.length,
    accountabilityRate: dates.length ? Math.round(accountedRows.length / dates.length * 1000) / 10 : 0,
    currentStreak,
    longestStreak,
    averageDailySpending: dates.length ? average(spendingValues) : 0,
    zeroSpendingDays: accountedRows.filter(row => Number(row.totalSpent || 0) === 0).length,
    highestSpendingDay: highest ? { dateKey: highest.dateKey, totalSpent: highest.totalSpent, expenseCount: highest.expenseCount } : null
  };
}
