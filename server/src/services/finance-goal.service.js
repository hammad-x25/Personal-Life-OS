import { dateKeysBetween } from '../utils/dates.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function round(value, decimals = 2) {
  if (value == null || !Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function daySpan(startDateKey, endDateKey) {
  if (!startDateKey || !endDateKey || endDateKey <= startDateKey) return 0;
  return Math.max(0, dateKeysBetween(startDateKey, endDateKey).length - 1);
}

/**
 * Returns deterministic financial-goal metrics. Contributions are kept as
 * embedded ledger entries on the goal; this function only derives a view of
 * that data and never changes the stored historical amounts.
 */
export function financialGoalProgress(goal, todayDateKey) {
  const source = goal?.toObject ? goal.toObject() : goal || {};
  const targetAmount = Number(source.targetAmount || 0);
  const currentAmount = Number(source.currentAmount || 0);
  const amountRemaining = Math.max(0, targetAmount - currentAmount);
  const percentageComplete = targetAmount > 0
    ? round(Math.min(100, Math.max(0, currentAmount / targetAmount * 100)), 1)
    : 0;
  const daysRemaining = source.deadlineKey && todayDateKey
    ? daySpan(todayDateKey, source.deadlineKey)
    : 0;
  const weeksRemaining = daysRemaining > 0 ? Math.ceil(daysRemaining / 7) : null;
  const monthsRemaining = daysRemaining > 0 ? Math.max(1, Math.ceil(daysRemaining / 30.4375)) : null;
  const contributions = [...(source.contributions || [])].sort((a, b) =>
    String(a.dateKey || '').localeCompare(String(b.dateKey || ''))
  );
  let cumulative = 0;
  const progressHistory = contributions.map((contribution) => {
    cumulative += Number(contribution.amount || 0);
    return {
      _id: contribution._id,
      dateKey: contribution.dateKey,
      amount: Number(contribution.amount || 0),
      cumulativeAmount: round(cumulative),
      percentageComplete: targetAmount > 0 ? round(Math.min(100, cumulative / targetAmount * 100), 1) : 0,
      note: contribution.note || ''
    };
  });

  return {
    targetAmount,
    currentAmount,
    amountRemaining: round(amountRemaining),
    percentageComplete,
    daysRemaining: daysRemaining || null,
    weeksRemaining,
    monthsRemaining,
    overdue: Boolean(source.deadlineKey && todayDateKey && source.deadlineKey < todayDateKey && amountRemaining > 0),
    requiredWeeklyContribution: weeksRemaining ? round(amountRemaining / weeksRemaining) : null,
    requiredMonthlyContribution: monthsRemaining ? round(amountRemaining / monthsRemaining) : null,
    progressHistory
  };
}

export function financialGoalWithProgress(goal, todayDateKey) {
  const source = goal?.toObject ? goal.toObject() : goal;
  return { ...source, progress: financialGoalProgress(source, todayDateKey) };
}
