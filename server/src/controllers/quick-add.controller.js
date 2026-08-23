import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import ExerciseLog from '../models/ExerciseLog.js';
import PhoneUsage from '../models/PhoneUsage.js';
import { taskSchema, expenseSchema, goalSchema, habitSchema, exerciseLogSchema, phoneSchema } from '../validators/schemas.js';
import { createTimelineEvent } from '../services/timeline.service.js';
import { ok, AppError } from '../utils/api.js';
import { dateKeyInTimezone } from '../utils/dates.js';

const config = {
  task: { Model: Task, schema: taskSchema, type: 'TASK_CREATED', entityType: 'Task', title: data => `Created task: ${data.title}` },
  expense: { Model: Expense, schema: expenseSchema, type: 'EXPENSE_CREATED', entityType: 'Expense', title: data => `Recorded expense: ${data.category}` },
  goal: { Model: Goal, schema: goalSchema, type: 'GOAL_CREATED', entityType: 'Goal', title: data => `Created goal: ${data.title}` },
  habit: { Model: Habit, schema: habitSchema, type: 'HABIT_CREATED', entityType: 'Habit', title: data => `Started habit: ${data.title}` },
  workout: { Model: ExerciseLog, schema: exerciseLogSchema, type: 'WORKOUT_COMPLETED', entityType: 'ExerciseLog', title: data => `Logged workout: ${data.workoutType}` },
  phoneUsage: { Model: PhoneUsage, schema: phoneSchema, type: 'PHONE_USAGE_RECORDED', entityType: 'PhoneUsage', title: data => `Recorded phone usage: ${data.phoneUsageMinutes} minutes` }
};

export const quickAdd = async (req, res) => {
  const type = String(req.body.type || '');
  const definition = config[type];
  if (!definition) throw new AppError('Unsupported quick-add type', 422, 'INVALID_QUICK_ADD_TYPE');
  const parsed = definition.schema.safeParse(req.body.payload || {});
  if (!parsed.success) throw new AppError('Quick-add validation failed', 422, 'VALIDATION_ERROR', parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })));
  const data = { ...parsed.data, userId: req.user._id };
  if (type === 'expense') data.source = 'MANUAL';
  if (type === 'habit') { data.planStartDateKey ||= dateKeyInTimezone(new Date(), req.user.timezone); data.status ||= 'ACTIVE'; }
  const item = await definition.Model.create(data);
  await createTimelineEvent({ userId: req.user._id, type: definition.type, title: definition.title(parsed.data), entityId: item._id, entityType: definition.entityType, timezone: req.user.timezone });
  return ok(res, { type, item }, 'Quick item added', 201);
};
