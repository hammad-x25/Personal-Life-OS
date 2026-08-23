import Budget from '../models/Budget.js';
import FinancialGoal from '../models/FinancialGoal.js';
import { ok, AppError } from '../utils/api.js';
import { dateKeyInTimezone } from '../utils/dates.js';

export const listBudgets = async (req, res) => ok(res, await Budget.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 }));
export const createBudget = async (req, res) => ok(res, await Budget.create({ ...req.body, userId: req.user._id, currency: req.body.currency || req.user.currency }), 'Budget created', 201);
export const updateBudget = async (req, res) => { const item = await Budget.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, deletedAt: null }, req.body, { new: true, runValidators: true }); if (!item) throw new AppError('Budget not found', 404, 'NOT_FOUND'); return ok(res, item, 'Budget updated'); };
export const deleteBudget = async (req, res) => { const item = await Budget.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, deletedAt: null }, { deletedAt: new Date(), active: false }, { new: true }); if (!item) throw new AppError('Budget not found', 404, 'NOT_FOUND'); return ok(res, null, 'Budget archived'); };

export const listFinancialGoals = async (req, res) => ok(res, await FinancialGoal.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 }));
export const createFinancialGoal = async (req, res) => ok(res, await FinancialGoal.create({ ...req.body, userId: req.user._id, currency: req.body.currency || req.user.currency }), 'Financial goal created', 201);
export const updateFinancialGoal = async (req, res) => { const item = await FinancialGoal.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, deletedAt: null }, req.body, { new: true, runValidators: true }); if (!item) throw new AppError('Financial goal not found', 404, 'NOT_FOUND'); return ok(res, item, 'Financial goal updated'); };
export const contribute = async (req, res) => { const amount = Number(req.body.amount); if (!amount || amount <= 0) throw new AppError('Contribution must be greater than zero', 422, 'VALIDATION_ERROR'); const item = await FinancialGoal.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null }); if (!item) throw new AppError('Financial goal not found', 404, 'NOT_FOUND'); item.currentAmount += amount; item.contributions.push({ amount, dateKey: req.body.dateKey || dateKeyInTimezone(new Date(), req.user.timezone), note: req.body.note }); if (item.currentAmount >= item.targetAmount) item.status = 'COMPLETED'; await item.save(); return ok(res, item, 'Contribution recorded'); };
export const deleteFinancialGoal = async (req, res) => { const item = await FinancialGoal.findOneAndUpdate({ _id: req.params.id, userId: req.user._id, deletedAt: null }, { deletedAt: new Date(), status: 'CANCELLED' }, { new: true }); if (!item) throw new AppError('Financial goal not found', 404, 'NOT_FOUND'); return ok(res, null, 'Financial goal archived'); };
