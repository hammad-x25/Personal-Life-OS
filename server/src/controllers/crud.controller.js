import Expense from "../models/Expense.js";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import Habit from "../models/Habit.js";
import TimetableEvent from "../models/TimetableEvent.js";
import { ok, AppError } from "../utils/api.js";
import { createTimelineEvent } from '../services/timeline.service.js';
import { dateKeyInTimezone } from '../utils/dates.js';
const models = { expenses: Expense, tasks: Task, goals: Goal, habits: Habit, timetable: TimetableEvent };
export const list = (key) => async (req, res) =>
  ok(
    res,
    await models[key]
      .find({ userId: req.user._id, deletedAt: null })
      .sort({ createdAt: -1 }),
  );
export const create = (key) => async (req, res) => {
  const item = await models[key].create({ ...req.body, userId: req.user._id });
  const title = item.title || item.description || `${key} record created`;
  await createTimelineEvent({ userId: req.user._id, type: `${key.slice(0, -1).toUpperCase()}_CREATED`, title: `Created: ${title}`, entityId: item._id, entityType: key, timezone: req.user.timezone, metadata: { dateKey: item.dateKey || item.dueDateKey || dateKeyInTimezone(new Date(), req.user.timezone) } });
  return ok(res, item, `${key} created`, 201);
};
export const update = (key) => async (req, res) => {
  const item = await models[key].findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, deletedAt: null },
    req.body,
    { new: true, runValidators: true },
  );
  if (!item) throw new AppError("Record not found", 404, "NOT_FOUND");
  if (key === 'tasks' && req.body.status === 'COMPLETED') await createTimelineEvent({ userId: req.user._id, type: 'TASK_COMPLETED', title: `Completed: ${item.title}`, entityId: item._id, entityType: 'Task', timezone: req.user.timezone });
  return ok(res, item, "Updated");
};
export const remove = (key) => async (req, res) => {
  const item = await models[key].findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { deletedAt: new Date() },
    { new: true },
  );
  if (!item) throw new AppError("Record not found", 404, "NOT_FOUND");
  return ok(res, null, "Deleted");
};
