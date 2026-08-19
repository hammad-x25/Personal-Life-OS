import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeightedScore } from '../src/services/score.service.js';
import { expenseSchema, timetableSchema, budgetSchema, financialGoalSchema } from '../src/validators/schemas.js';

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
