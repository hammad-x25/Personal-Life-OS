import Expense from "../models/Expense.js";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import Habit from "../models/Habit.js";
import TimetableEvent from "../models/TimetableEvent.js";
import Project from "../models/Project.js";
import { ok, AppError } from "../utils/api.js";
import { createTimelineEvent } from '../services/timeline.service.js';
import { dateKeyInTimezone } from '../utils/dates.js';
const models = { expenses: Expense, tasks: Task, goals: Goal, habits: Habit, timetable: TimetableEvent };
export function taskFilterForView(view = "ALL", today, status) {
  const normalizedView = String(view).toUpperCase();
  const validViews = ["ALL", "OVERDUE", "TODAY", "UPCOMING", "COMPLETED"];
  if (!validViews.includes(normalizedView)) throw new AppError("Invalid task view", 400, "INVALID_FILTER");
  const filter = {};
  if (normalizedView === "OVERDUE") filter.dueDateKey = { $lt: today };
  if (normalizedView === "TODAY") filter.dueDateKey = today;
  if (normalizedView === "UPCOMING") filter.dueDateKey = { $gt: today };
  if (normalizedView === "COMPLETED") filter.status = "COMPLETED";
  if (["OVERDUE", "TODAY", "UPCOMING"].includes(normalizedView)) filter.status = { $nin: ["COMPLETED", "CANCELLED"] };
  if (status !== undefined) {
    const statuses = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DEFERRED"];
    const normalizedStatus = String(status).toUpperCase();
    if (!statuses.includes(normalizedStatus)) throw new AppError("Invalid task status filter", 400, "INVALID_FILTER");
    filter.status = normalizedStatus;
  }
  return filter;
}
export const list = (key) => async (req, res) => {
  const filter = { userId: req.user._id, deletedAt: null };
  let sort = { createdAt: -1 };
  if (key === "tasks") {
    const today = dateKeyInTimezone(new Date(), req.user.timezone);
    Object.assign(filter, taskFilterForView(req.query.view, today, req.query.status));
    sort = { dueDateKey: 1, priority: -1, createdAt: -1 };
  }
  const limit = key === "tasks" ? Math.min(200, Math.max(1, Number(req.query.limit) || 100)) : null;
  let query = models[key].find(filter).sort(sort);
  if (limit) query = query.limit(limit);
  return ok(res, await query);
};
export const create = (key) => async (req, res) => {
  if (key === "tasks" && req.body.projectId) {
    const project = await Project.findOne({ _id: req.body.projectId, userId: req.user._id, deletedAt: null }).select("_id");
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  }
  const item = await models[key].create({ ...req.body, userId: req.user._id });
  const title = item.title || item.description || `${key} record created`;
  await createTimelineEvent({ userId: req.user._id, type: `${key.slice(0, -1).toUpperCase()}_CREATED`, title: `Created: ${title}`, entityId: item._id, entityType: key, timezone: req.user.timezone, metadata: { dateKey: item.dateKey || item.dueDateKey || dateKeyInTimezone(new Date(), req.user.timezone) } });
  return ok(res, item, `${key} created`, 201);
};
export const update = (key) => async (req, res) => {
  if (key === "tasks" && req.body.projectId) {
    const project = await Project.findOne({ _id: req.body.projectId, userId: req.user._id, deletedAt: null }).select("_id");
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  }
  const update = { ...req.body };
  if (key === "tasks" && req.body.status === "COMPLETED") update.completedAt = new Date();
  if (key === "tasks" && req.body.status && req.body.status !== "COMPLETED") update.completedAt = null;
  const item = await models[key].findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, deletedAt: null },
    update,
    { new: true, runValidators: true },
  );
  if (!item) throw new AppError("Record not found", 404, "NOT_FOUND");
  if (key === "goals" && req.body.currentProgress !== undefined && item.target > 0 && item.currentProgress >= item.target && item.status !== "COMPLETED") {
    item.status = "COMPLETED";
    await item.save();
    await createTimelineEvent({ userId: req.user._id, type: "GOAL_COMPLETED", title: `Completed goal: ${item.title}`, entityId: item._id, entityType: "Goal", timezone: req.user.timezone });
  }
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
