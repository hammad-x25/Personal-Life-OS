import Goal from '../models/Goal.js';
import { ok, AppError } from '../utils/api.js';
import { createTimelineEvent } from '../services/timeline.service.js';

const owned = (id, userId) => Goal.findOne({ _id: id, userId, deletedAt: null });

export const addMilestone = async (req, res) => {
  const goal = await owned(req.params.id, req.user._id);
  if (!goal) throw new AppError('Goal not found', 404, 'NOT_FOUND');
  goal.milestones.push({ ...req.body, completed: false });
  const milestone = goal.milestones[goal.milestones.length - 1];
  await goal.save();
  return ok(res, milestone, 'Goal milestone created', 201);
};

export const updateMilestone = async (req, res) => {
  const goal = await owned(req.params.id, req.user._id);
  if (!goal) throw new AppError('Goal not found', 404, 'NOT_FOUND');
  const milestone = goal.milestones.id(req.params.milestoneId);
  if (!milestone) throw new AppError('Goal milestone not found', 404, 'NOT_FOUND');
  const wasCompleted = milestone.completed;
  Object.assign(milestone, req.body);
  if (req.body.completed === true && !milestone.completedAt) milestone.completedAt = new Date();
  if (req.body.completed === false) milestone.completedAt = null;
  await goal.save();
  if (!wasCompleted && milestone.completed) await createTimelineEvent({ userId: req.user._id, type: 'GOAL_MILESTONE_COMPLETED', title: `Completed goal milestone: ${milestone.title}`, entityId: goal._id, entityType: 'Goal', timezone: req.user.timezone, metadata: { milestoneId: milestone._id } });
  return ok(res, milestone, 'Goal milestone updated');
};
