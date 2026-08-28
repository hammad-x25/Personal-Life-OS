import bcrypt from 'bcryptjs';
import { connectDatabase } from './db.js';
import { dateKeyInTimezone, shiftDateKey } from './utils/dates.js';
import User from './models/User.js';
import Task from './models/Task.js';
import Goal from './models/Goal.js';
import Habit from './models/Habit.js';
import HabitLog from './models/HabitLog.js';
import HabitInstance from './models/HabitInstance.js';
import Expense from './models/Expense.js';
import PhoneUsage from './models/PhoneUsage.js';
import SpendingAccountability from './models/SpendingAccountability.js';
import Project from './models/Project.js';
import ProjectMilestone from './models/ProjectMilestone.js';
import ExercisePlan from './models/ExercisePlan.js';
import ExerciseLog from './models/ExerciseLog.js';
import TimetableEvent from './models/TimetableEvent.js';
import DailyPerformance from './models/DailyPerformance.js';
import YearlyPerformance from './models/YearlyPerformance.js';
import TimelineEvent from './models/TimelineEvent.js';
import Budget from './models/Budget.js';
import FinancialGoal from './models/FinancialGoal.js';

await connectDatabase();
const timezone = 'Asia/Karachi';
const today = dateKeyInTimezone(new Date(), timezone);
const user = await User.findOneAndUpdate(
  { email: 'demo@lifeos.local' },
  { $setOnInsert: { name: 'Demo User', email: 'demo@lifeos.local', passwordHash: await bcrypt.hash('password123', 12), registeredDateKey: shiftDateKey(today, -14), timezone, currency: 'PKR' } },
  { upsert: true, new: true }
);

const owned = [Task, Goal, Habit, HabitLog, HabitInstance, Expense, PhoneUsage, SpendingAccountability, Project, ProjectMilestone, ExercisePlan, ExerciseLog, TimetableEvent, DailyPerformance, YearlyPerformance, TimelineEvent, Budget, FinancialGoal];
for (const Model of owned) await Model.deleteMany({ userId: user._id });

const dates = Array.from({ length: 14 }, (_, index) => shiftDateKey(today, -13 + index));
const habit = await Habit.create({ userId: user._id, title: 'Read', dailyTarget: 30, targetUnit: 'minutes', minimumAcceptable: 10, preferredTime: '20:00', planStartDateKey: dates[0], status: 'ACTIVE' });
const project = await Project.create({ userId: user._id, name: 'Personal Life OS', description: 'Build a measurable personal operating system.', status: 'ACTIVE', priority: 'HIGH', startDateKey: dates[0], deadlineKey: shiftDateKey(today, 30) });
await ProjectMilestone.create([{ userId: user._id, projectId: project._id, title: 'Foundation complete', dateKey: dates[3], completed: true, completedAt: new Date() }, { userId: user._id, projectId: project._id, title: 'Analytics complete', dateKey: shiftDateKey(today, 7), completed: false }]);
await Goal.create({ userId: user._id, title: 'Build Personal Life OS', target: 100, currentProgress: 42, unit: '%', priority: 'HIGH', deadlineKey: shiftDateKey(today, 30) });
await Budget.create({ userId: user._id, name: 'Monthly essentials', category: null, periodType: 'MONTHLY', amount: 25000, currency: 'PKR', active: true });
await FinancialGoal.create({ userId: user._id, title: 'Buy a laptop', targetAmount: 200000, currentAmount: 75000, currency: 'PKR', deadlineKey: shiftDateKey(today, 120), status: 'ACTIVE', contributions: [{ amount: 75000, dateKey: dates[0], note: 'Seed starting balance' }] });
await Task.insertMany([
  { userId: user._id, title: 'Review backend architecture', status: 'COMPLETED', priority: 'HIGH', dueDateKey: today, category: 'WORK', completedAt: new Date() },
  { userId: user._id, title: 'Plan tomorrow', status: 'TODO', priority: 'MEDIUM', dueDateKey: today },
  { userId: user._id, title: 'Write analytics notes', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDateKey: today, category: 'WORK' }
]);
await HabitLog.insertMany(dates.map((dateKey, index) => ({ userId: user._id, habitId: habit._id, dateKey, targetValue: 30, actualValue: index % 4 === 0 ? 10 : 30, completionPercentage: index % 4 === 0 ? 33 : 100, status: index % 4 === 0 ? 'PARTIAL' : 'COMPLETED' })));
await Expense.insertMany(dates.map((dateKey, index) => ({ userId: user._id, type: 'EXPENSE', amount: 450 + index * 25, category: index % 2 ? 'Transport' : 'Food', description: 'Seed transaction', dateKey, source: 'MANUAL' })));
await PhoneUsage.insertMany(dates.map((dateKey, index) => ({ userId: user._id, dateKey, phoneUsageMinutes: 210 + index * 4, submittedAt: new Date() })));
await SpendingAccountability.insertMany(dates.map((dateKey, index) => ({ userId: user._id, dateKey, totalSpent: 450 + index * 25, expenseCount: 1, status: 'ACCOUNTED', source: 'EXPENSES_CONFIRMED', submittedAt: new Date() })));
await ExercisePlan.create({ userId: user._id, name: 'Beginner Fitness', schedule: [{ weekday: 1, exercises: [{ name: 'Pushups', sets: 3, repetitions: 10 }, { name: 'Squats', sets: 3, repetitions: 15 }] }] });
await ExerciseLog.insertMany(dates.filter((_, index) => index % 3 !== 0).map(dateKey => ({ userId: user._id, dateKey, workoutType: 'Home workout', completed: true, notes: 'Seed workout' })));
await TimetableEvent.insertMany(dates.slice(-4).flatMap(dateKey => [{ userId: user._id, title: 'Focus work', dateKey, startTime: '09:00', endTime: '10:00', category: 'Work', status: 'COMPLETED' }, { userId: user._id, title: 'Reading', dateKey, startTime: '20:00', endTime: '20:30', category: 'Growth', status: 'PLANNED' }]));
await DailyPerformance.insertMany(dates.map((dateKey, index) => ({ userId: user._id, dateKey, score: 58 + index * 2, components: { task: 70, habit: 80, goal: 42, exercise: index % 3 ? 100 : 0, timetable: 75, phone: 80, work: 70 }, weights: { task: 20, habit: 15, goal: 15, exercise: 10, timetable: 15, phone: 10, work: 15 }, generatedAt: new Date() })));
await TimelineEvent.insertMany(dates.slice(-5).map((dateKey, index) => ({ userId: user._id, type: 'TASK_COMPLETED', title: `Completed seed milestone ${index + 1}`, dateKey, timestamp: new Date(), entityType: 'Task' })));
console.log('Seeded demo@lifeos.local / password123 with 14 days of data');
process.exit(0);
