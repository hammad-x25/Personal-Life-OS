import Expense from '../models/Expense.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import Project from '../models/Project.js';
import TimelineEvent from '../models/TimelineEvent.js';
import { ok } from '../utils/api.js';

export const search = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return ok(res, []);
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [tasks, goals, habits, projects, expenses, timeline] = await Promise.all([
    Task.find({ userId: req.user._id, deletedAt: null, $or: [{ title: regex }, { description: regex }] }).limit(10),
    Goal.find({ userId: req.user._id, deletedAt: null, $or: [{ title: regex }, { description: regex }] }).limit(10),
    Habit.find({ userId: req.user._id, $or: [{ title: regex }, { description: regex }] }).limit(10),
    Project.find({ userId: req.user._id, deletedAt: null, $or: [{ name: regex }, { description: regex }] }).limit(10),
    Expense.find({ userId: req.user._id, deletedAt: null, $or: [{ category: regex }, { description: regex }] }).limit(10),
    TimelineEvent.find({ userId: req.user._id, $or: [{ title: regex }, { description: regex }] }).limit(10)
  ]);
  return ok(res, [
    ...tasks.map(item => ({ type: 'TASK', title: item.title, id: item._id })),
    ...goals.map(item => ({ type: 'GOAL', title: item.title, id: item._id })),
    ...habits.map(item => ({ type: 'HABIT', title: item.title, id: item._id })),
    ...projects.map(item => ({ type: 'PROJECT', title: item.name, id: item._id })),
    ...expenses.map(item => ({ type: 'EXPENSE', title: `${item.category} · ${item.amount}`, id: item._id })),
    ...timeline.map(item => ({ type: 'TIMELINE', title: item.title, id: item._id }))
  ]);
};
