import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightedScore } from '../src/services/score.service.js';
import { expenseSchema, timetableSchema, budgetSchema, financialGoalSchema } from '../src/validators/schemas.js';
import { matchesRecurrence } from '../src/services/recurrence.service.js';
import { calculateAdherence } from '../src/controllers/timetable.controller.js';
import { generateReview, parseAndNormalize } from '../src/services/ai.service.js';
import { isHabitScheduledDate, habitLogStatus } from '../src/controllers/habit.controller.js';
import { isExercisePlanScheduled } from '../src/controllers/exercise.controller.js';
import { taskFilterForView } from '../src/controllers/crud.controller.js';
import { financialGoalProgress } from '../src/services/finance-goal.service.js';
import { calculateAccountabilityMetrics } from '../src/services/accountability.service.js';

test('weighted score ignores non-applicable components and normalizes weights', () => {
  assert.equal(calculateWeightedScore({ task: 100, exercise: null }, { task: 20, exercise: 10 }), 100);
  assert.equal(calculateWeightedScore({ task: 80, habit: 40 }, { task: 20, habit: 20 }), 60);
});

test('expense validation rejects zero and negative amounts', () => {
  assert.equal(expenseSchema.safeParse({ amount: 0, category: 'Food', dateKey: '2026-08-18' }).success, false);
  assert.equal(expenseSchema.safeParse({ amount: 500, category: 'Food', dateKey: '2026-08-18' }).success, true);
});

test('timetable validation rejects reversed time ranges', () => {
  assert.equal(timetableSchema.safeParse({ title: 'Study', dateKey: '2026-08-18', startTime: '20:00', endTime: '19:00' }).success, false);
});

test('budget and financial goal validation require positive targets', () => {
  assert.equal(budgetSchema.safeParse({ name: 'Food', amount: 0 }).success, false);
  assert.equal(financialGoalSchema.safeParse({ title: 'Laptop', targetAmount: 200000 }).success, true);
});

test('recurrence matching is deterministic by date', () => {
  assert.equal(matchesRecurrence({ type: 'DAILY' }, '2026-08-20', '2026-08-23'), true);
  assert.equal(matchesRecurrence({ type: 'WEEKLY' }, '2026-08-20', '2026-08-27'), true);
  assert.equal(matchesRecurrence({ type: 'WEEKLY' }, '2026-08-20', '2026-08-28'), false);
  assert.equal(matchesRecurrence({ type: 'CUSTOM', weekdays: [1] }, '2026-08-20', '2026-08-24'), true);
});

test('timetable adherence rewards punctual full-duration execution', () => {
  assert.equal(calculateAdherence('09:00', '10:00', '09:00', '10:00'), 100);
  assert.ok(calculateAdherence('09:00', '10:00', '09:15', '10:00') < 100);
});

test('AI review has a safe local fallback when no provider is configured', async () => {
  const result = await generateReview({ score: 80 }, 'DAILY');
  assert.equal(typeof result.summary, 'string');
  assert.ok(Array.isArray(result.recommendations));
});

test('AI response normalization safely falls back on invalid JSON and bounds growth', () => {
  const invalid = parseAndNormalize('{not-json', { score: 70 });
  assert.equal(invalid.validationStatus, 'INVALID_PROVIDER_RESPONSE');
  const normalized = parseAndNormalize(JSON.stringify({ summary: 'ok', recommendations: ['next'], estimatedGrowth: 900 }), { score: 70 });
  assert.equal(normalized.validationStatus, 'VALIDATED');
  assert.equal(normalized.estimatedGrowth, 100);
});

test('habit schedules honor weekdays and minimum acceptable performance', () => {
  const habit = { frequencyType: 'CUSTOM', weekdays: [1, 3, 5], planStartDateKey: '2026-08-17' };
  assert.equal(isHabitScheduledDate(habit, '2026-08-17'), true);
  assert.equal(isHabitScheduledDate(habit, '2026-08-18'), false);
  assert.equal(habitLogStatus(60, 60, 20), 'COMPLETED');
  assert.equal(habitLogStatus(30, 60, 20), 'PARTIAL');
  assert.equal(habitLogStatus(10, 60, 20), 'SKIPPED');
});

test('exercise plans match scheduled weekdays', () => {
  const plan = { schedule: [{ weekday: 1, exercises: [{ name: 'Run' }] }] };
  assert.equal(isExercisePlanScheduled(plan, '2026-08-24'), true);
  assert.equal(isExercisePlanScheduled(plan, '2026-08-25'), false);
});

test('task views build timezone-aware inbox filters', () => {
  assert.deepEqual(taskFilterForView('TODAY', '2026-08-24'), { dueDateKey: '2026-08-24', status: { $nin: ['COMPLETED', 'CANCELLED'] } });
  assert.deepEqual(taskFilterForView('OVERDUE', '2026-08-24'), { dueDateKey: { $lt: '2026-08-24' }, status: { $nin: ['COMPLETED', 'CANCELLED'] } });
  assert.deepEqual(taskFilterForView('COMPLETED', '2026-08-24'), { status: 'COMPLETED' });
  assert.throws(() => taskFilterForView('INVALID', '2026-08-24'), { code: 'INVALID_FILTER' });
});

test('financial goal progress calculates remaining contributions and history', () => {
  const progress = financialGoalProgress({
    targetAmount: 200000,
    currentAmount: 75000,
    deadlineKey: '2026-12-31',
    contributions: [
      { amount: 25000, dateKey: '2026-08-20' },
      { amount: 50000, dateKey: '2026-08-25' }
    ]
  }, '2026-08-28');
  assert.equal(progress.percentageComplete, 37.5);
  assert.equal(progress.amountRemaining, 125000);
  assert.equal(progress.progressHistory[1].cumulativeAmount, 75000);
  assert.ok(progress.requiredWeeklyContribution > 0);
  assert.ok(progress.requiredMonthlyContribution > 0);
});

test('financial goal progress marks unfinished past-deadline goals overdue', () => {
  const progress = financialGoalProgress({ targetAmount: 100, currentAmount: 20, deadlineKey: '2026-08-20' }, '2026-08-28');
  assert.equal(progress.overdue, true);
  assert.equal(progress.requiredWeeklyContribution, null);
  assert.equal(progress.requiredMonthlyContribution, null);
});

test('accountability metrics distinguish missing days from explicit zero spending', () => {
  const metrics = calculateAccountabilityMetrics([
    { dateKey: '2026-08-25', totalSpent: 0, expenseCount: 0 },
    { dateKey: '2026-08-26', totalSpent: 800, expenseCount: 2 },
    { dateKey: '2026-08-28', totalSpent: 1200, expenseCount: 1 }
  ], '2026-08-25', '2026-08-29');
  assert.equal(metrics.accountedDays, 3);
  assert.equal(metrics.missedDays, 2);
  assert.equal(metrics.zeroSpendingDays, 1);
  assert.equal(metrics.accountabilityRate, 60);
  assert.equal(metrics.longestStreak, 2);
  assert.equal(metrics.currentStreak, 0);
  assert.equal(metrics.highestSpendingDay.dateKey, '2026-08-28');
});

test('date schemas reject impossible calendar dates', () => {
  assert.equal(expenseSchema.safeParse({ amount: 100, category: 'Food', dateKey: '2026-02-30' }).success, false);
});
