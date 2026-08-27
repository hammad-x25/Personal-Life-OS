import Expense from '../models/Expense.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import ExerciseLog from '../models/ExerciseLog.js';
import PhoneUsage from '../models/PhoneUsage.js';
import TimetableEvent from '../models/TimetableEvent.js';
import Project from '../models/Project.js';
import Budget from '../models/Budget.js';
import FinancialGoal from '../models/FinancialGoal.js';
import DailyPerformance from '../models/DailyPerformance.js';
import SpendingAccountability from '../models/SpendingAccountability.js';
import HabitLog from '../models/HabitLog.js';
import { isHabitScheduledDate } from '../utils/habit-schedule.js';
import { dateKeyInTimezone, dateKeysBetween, shiftDateKey, weekPeriod, monthPeriod } from '../utils/dates.js';
import { calculateDailyScore } from './score.service.js';

export async function dashboardToday(user) {
  const dateKey = dateKeyInTimezone(new Date(), user.timezone);
  const [score, tasks, habits, exercise, timetable, phone, finance, goals, work] = await Promise.all([
    calculateDailyScore(user, dateKey),
    Task.find({ userId: user._id, dueDateKey: dateKey, deletedAt: null }).select('title status priority dueDateKey').sort({ priority: -1 }),
    Habit.find({ userId: user._id, status: 'ACTIVE' }).select('title dailyTarget targetUnit'),
    ExerciseLog.countDocuments({ userId: user._id, dateKey, completed: true }),
    TimetableEvent.find({ userId: user._id, dateKey, deletedAt: null }).select('title startTime endTime status'),
    PhoneUsage.findOne({ userId: user._id, dateKey }),
    Expense.aggregate([{ $match: { userId: user._id, dateKey, type: 'EXPENSE', deletedAt: null } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Goal.find({ userId: user._id, status: 'ACTIVE', deletedAt: null }).select('title currentProgress target unit').limit(6),
    Task.countDocuments({ userId: user._id, dueDateKey: dateKey, category: 'WORK', status: 'COMPLETED', deletedAt: null })
  ]);
  return { dateKey, score, tasks: { items: tasks, completed: tasks.filter(x => x.status === 'COMPLETED').length, total: tasks.length }, habits: { active: habits.length }, exercise: { completed: exercise > 0 }, timetable, phoneUsage: phone, finance: finance[0] || { total: 0, count: 0 }, goals, work: { completed: work } };
}

export async function growth(user, startDateKey, endDateKey) {
  const currentKeys = dateKeysBetween(startDateKey, endDateKey);
  const previousEnd = shiftDateKey(startDateKey, -1);
  const previousStart = shiftDateKey(previousEnd, -(currentKeys.length - 1));
  const rows = await DailyPerformance.find({ userId: user._id, dateKey: { $gte: previousStart, $lte: endDateKey } }).sort({ dateKey: 1 });
  const current = rows.filter(x => x.dateKey >= startDateKey).map(x => x.score);
  const previous = rows.filter(x => x.dateKey < startDateKey).map(x => x.score);
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const currentScore = average(current), previousScore = average(previous);
  return { startDateKey, endDateKey, currentScore, previousScore, growthPercentage: previousScore ? ((currentScore - previousScore) / previousScore) * 100 : null, history: rows };
}

export async function financeSummary(user, startDateKey, endDateKey) {
  const match = { userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey }, deletedAt: null };
  const [totals, categories, trend, accountability, budgets, financialGoals] = await Promise.all([
    Expense.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Expense.aggregate([{ $match: { ...match, type: 'EXPENSE' } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]),
    Expense.aggregate([{ $match: { ...match, type: 'EXPENSE' } }, { $group: { _id: '$dateKey', total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    SpendingAccountability.countDocuments({ userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey }, status: 'ACCOUNTED' }),
    Budget.find({ userId: user._id, active: true, deletedAt: null }).select('name category amount currency periodType'),
    FinancialGoal.find({ userId: user._id, status: { $in: ['ACTIVE', 'COMPLETED'] }, deletedAt: null }).select('title targetAmount currentAmount currency deadlineKey status')
  ]);
  const expenseTotal = totals.find(item => item._id === 'EXPENSE')?.total || 0;
  const incomeTotal = totals.find(item => item._id === 'INCOME')?.total || 0;
  const highestSpendingDay = trend.reduce((highest, item) => !highest || item.total > highest.total ? item : highest, null);
  const budgetRows = budgets.map(budget => { const spent = budget.category ? (categories.find(item => item._id === budget.category)?.total || 0) : expenseTotal; return { ...budget.toObject(), spent, remaining: budget.amount - spent, usagePercentage: budget.amount ? spent / budget.amount * 100 : 0 }; });
  return { totals, categories, trend, accountabilityDays: accountability, budgets: budgetRows, financialGoals, netBalance: incomeTotal - expenseTotal, averageDailySpending: trend.length ? expenseTotal / trend.length : 0, highestSpendingDay, highestSpendingCategory: categories[0] || null };
}

export async function dashboardPeriod(user, type) {
  const dateKey = dateKeyInTimezone(new Date(), user.timezone);
  const period = type === 'WEEKLY' ? weekPeriod(dateKey) : monthPeriod(dateKey);
  const [performance, finance, tasks, goals, projects, habits, habitLogs, workouts, timetable, phones, projectTasks] = await Promise.all([
    DailyPerformance.find({ userId: user._id, dateKey: { $gte: period.startDateKey, $lte: period.endDateKey } }).sort({ dateKey: 1 }),
    financeSummary(user, period.startDateKey, period.endDateKey),
    Task.aggregate([{ $match: { userId: user._id, dueDateKey: { $gte: period.startDateKey, $lte: period.endDateKey }, deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Goal.find({ userId: user._id, status: 'ACTIVE', deletedAt: null }).select('title currentProgress target unit'),
    Project.find({ userId: user._id, status: { $in: ['ACTIVE', 'COMPLETED'] }, deletedAt: null }).select('name status deadlineKey')
    ,Habit.find({ userId: user._id, status: 'ACTIVE' }).select('_id planStartDateKey planEndDateKey frequencyType weekdays')
    ,HabitLog.find({ userId: user._id, dateKey: { $gte: period.startDateKey, $lte: period.endDateKey } }).select('habitId dateKey completionPercentage')
    ,ExerciseLog.find({ userId: user._id, dateKey: { $gte: period.startDateKey, $lte: period.endDateKey }, completed: true }).select('dateKey durationMinutes')
    ,TimetableEvent.find({ userId: user._id, dateKey: { $gte: period.startDateKey, $lte: period.endDateKey }, deletedAt: null }).select('dateKey status adherencePercentage')
    ,PhoneUsage.find({ userId: user._id, dateKey: { $gte: period.startDateKey, $lte: period.endDateKey } }).select('phoneUsageMinutes')
    ,Task.aggregate([{ $match: { userId: user._id, projectId: { $ne: null }, deletedAt: null } }, { $group: { _id: '$projectId', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } } } }])
  ]);
  const score = performance.length ? performance.reduce((sum, item) => sum + item.score, 0) / performance.length : null;
  const taskTotal = tasks.reduce((sum, item) => sum + item.count, 0);
  const taskCompleted = tasks.find(item => item._id === 'COMPLETED')?.count || 0;
  const expectedHabitDates = dateKeysBetween(period.startDateKey, period.endDateKey).flatMap(dateKey => habits.filter(habit => (!habit.planStartDateKey || dateKey >= habit.planStartDateKey) && (!habit.planEndDateKey || dateKey <= habit.planEndDateKey) && isHabitScheduledDate(habit, dateKey)).map(habit => `${habit._id}:${dateKey}`));
  const completedHabitDates = new Set(habitLogs.filter(item => item.completionPercentage >= 100).map(item => `${item.habitId}:${item.dateKey}`));
  const adherenceValues = timetable.filter(item => item.adherencePercentage != null).map(item => item.adherencePercentage);
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const projectTaskMap = new Map(projectTasks.map(item => [String(item._id), item]));
  const projectMetrics = projects.map(project => { const taskMetric = projectTaskMap.get(String(project._id)); return { ...project.toObject(), progressPercentage: taskMetric?.total ? Math.round(taskMetric.completed / taskMetric.total * 100) : project.status === 'COMPLETED' ? 100 : 0, taskTotal: taskMetric?.total || 0, taskCompleted: taskMetric?.completed || 0 }; });
  const periodGrowth = await growth(user, period.startDateKey, period.endDateKey);
  return { type, period, score, performance, growth: periodGrowth, finance, tasks, goals, projects: projectMetrics, metrics: { tasks: { total: taskTotal, completed: taskCompleted, completionRate: taskTotal ? taskCompleted / taskTotal * 100 : null }, habits: { expected: expectedHabitDates.length, completed: completedHabitDates.size, completionRate: expectedHabitDates.length ? completedHabitDates.size / expectedHabitDates.length * 100 : null }, exercise: { workoutDays: new Set(workouts.map(item => item.dateKey)).size, totalDurationMinutes: workouts.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) }, timetable: { planned: timetable.length, completed: timetable.filter(item => item.status === 'COMPLETED').length, adherencePercentage: average(adherenceValues) }, phoneUsage: { averageMinutes: average(phones.map(item => item.phoneUsageMinutes)) }, projects: projectMetrics } };
}

export async function correlations(user, startDateKey, endDateKey) {
  const [scores, phones, workouts] = await Promise.all([
    DailyPerformance.find({ userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey } }).select('dateKey score'),
    PhoneUsage.find({ userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey } }).select('dateKey phoneUsageMinutes'),
    ExerciseLog.find({ userId: user._id, dateKey: { $gte: startDateKey, $lte: endDateKey }, completed: true }).select('dateKey')
  ]);
  const scoreMap = new Map(scores.map(item => [item.dateKey, item.score]));
  const phonePairs = phones.filter(item => scoreMap.has(item.dateKey)).map(item => ({ phone: item.phoneUsageMinutes, score: scoreMap.get(item.dateKey) }));
  const workoutDates = new Set(workouts.map(item => item.dateKey));
  const withWorkout = scores.filter(item => workoutDates.has(item.dateKey)).map(item => item.score);
  const withoutWorkout = scores.filter(item => !workoutDates.has(item.dateKey)).map(item => item.score);
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const lowPhone = phonePairs.filter(item => item.phone < 180).map(item => item.score);
  const highPhone = phonePairs.filter(item => item.phone >= 300).map(item => item.score);
  return { period: { startDateKey, endDateKey }, observations: [
    { type: 'PHONE_USAGE', message: 'Lower-phone-usage days averaged higher productivity.', lowUsageAverage: average(lowPhone), highUsageAverage: average(highPhone), sampleSize: phonePairs.length },
    { type: 'EXERCISE', message: 'Days with exercise are compared with days without exercise.', exerciseAverage: average(withWorkout), noExerciseAverage: average(withoutWorkout), sampleSize: scores.length }
  ] };
}
