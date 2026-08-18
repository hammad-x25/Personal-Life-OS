import Project from '../models/Project.js';
import ProjectMilestone from '../models/ProjectMilestone.js';
import Task from '../models/Task.js';
import { ok, AppError } from '../utils/api.js';
import { createTimelineEvent } from '../services/timeline.service.js';

const owned = (model, id, userId) => model.findOne({ _id: id, userId, deletedAt: null });
export const list = async (req, res) => ok(res, await Project.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 }));
export const create = async (req, res) => { const item = await Project.create({ ...req.body, userId: req.user._id }); await createTimelineEvent({ userId: req.user._id, type: 'PROJECT_CREATED', title: `Created project: ${item.name}`, entityId: item._id, entityType: 'Project', timezone: req.user.timezone }); return ok(res, item, 'Project created', 201); };
export const update = async (req, res) => { const item = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, deletedAt: null }, req.body, { new: true, runValidators: true }); if (!item) throw new AppError('Project not found', 404, 'NOT_FOUND'); return ok(res, item, 'Project updated'); };
export const remove = async (req, res) => { const item = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { deletedAt: new Date(), status: 'ARCHIVED' }, { new: true }); if (!item) throw new AppError('Project not found', 404, 'NOT_FOUND'); return ok(res, null, 'Project archived'); };
export const milestones = async (req, res) => { if (!(await owned(Project, req.params.id, req.user._id))) throw new AppError('Project not found', 404, 'NOT_FOUND'); return ok(res, await ProjectMilestone.find({ projectId: req.params.id, userId: req.user._id }).sort({ dateKey: 1 })); };
export const createMilestone = async (req, res) => { const project = await owned(Project, req.params.id, req.user._id); if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND'); return ok(res, await ProjectMilestone.create({ ...req.body, projectId: project._id, userId: req.user._id }), 'Milestone created', 201); };
export const projectTimeline = async (req, res) => { const project = await owned(Project, req.params.id, req.user._id); if (!project) throw new AppError('Project not found', 404, 'NOT_FOUND'); const [events, tasks, milestones] = await Promise.all([TimelineEvent.find({ userId: req.user._id, entityId: project._id }).sort({ timestamp: 1 }), Task.find({ userId: req.user._id, projectId: project._id, deletedAt: null }).select('title status dueDateKey completedAt'), ProjectMilestone.find({ userId: req.user._id, projectId: project._id }).sort({ dateKey: 1 })]); return ok(res, { project, events, tasks, milestones }); };
