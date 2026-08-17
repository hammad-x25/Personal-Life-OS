import Expense from "../models/Expense.js";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import Habit from "../models/Habit.js";
import TimetableEvent from "../models/TimetableEvent.js";
import { ok, AppError } from "../utils/api.js";
const models = { expenses: Expense, tasks: Task, goals: Goal, habits: Habit, timetable: TimetableEvent };
export const list = (key) => async (req, res) =>
  ok(
    res,
    await models[key]
      .find({ userId: req.user._id, deletedAt: null })
      .sort({ createdAt: -1 }),
  );
export const create = (key) => async (req, res) =>
  ok(
    res,
    await models[key].create({ ...req.body, userId: req.user._id }),
    `${key} created`,
    201,
  );
export const update = (key) => async (req, res) => {
  const item = await models[key].findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, deletedAt: null },
    req.body,
    { new: true, runValidators: true },
  );
  if (!item) throw new AppError("Record not found", 404, "NOT_FOUND");
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
