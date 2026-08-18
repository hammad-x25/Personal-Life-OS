import ExercisePlan from '../models/ExercisePlan.js';
import ExerciseLog from '../models/ExerciseLog.js';
import { ok, AppError } from '../utils/api.js';

export const listPlans = async (req, res) => ok(res, await ExercisePlan.find({ userId: req.user._id }).sort({ createdAt: -1 }));
export const createPlan = async (req, res) => ok(res, await ExercisePlan.create({ ...req.body, userId: req.user._id }), 'Exercise plan created', 201);
export const updatePlan = async (req, res) => { const item = await ExercisePlan.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true, runValidators: true }); if (!item) throw new AppError('Exercise plan not found', 404, 'NOT_FOUND'); return ok(res, item, 'Exercise plan updated'); };
export const deletePlan = async (req, res) => { const item = await ExercisePlan.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { status: 'ARCHIVED' }, { new: true }); if (!item) throw new AppError('Exercise plan not found', 404, 'NOT_FOUND'); return ok(res, item, 'Exercise plan archived'); };
export const listLogs = async (req, res) => ok(res, await ExerciseLog.find({ userId: req.user._id }).sort({ dateKey: -1, createdAt: -1 }).limit(100));
export const createLog = async (req, res) => { if (req.body.planId && !(await ExercisePlan.exists({ _id: req.body.planId, userId: req.user._id }))) throw new AppError('Exercise plan not found', 404, 'NOT_FOUND'); return ok(res, await ExerciseLog.create({ ...req.body, userId: req.user._id }), 'Workout logged', 201); };
