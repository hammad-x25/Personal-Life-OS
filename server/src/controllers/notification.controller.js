import Notification from '../models/Notification.js';
import { ok, AppError } from '../utils/api.js';

export const list = async (req, res) => ok(res, await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100));
export const unreadCount = async (req, res) => ok(res, { count: await Notification.countDocuments({ userId: req.user._id, readAt: null, status: { $ne: 'DISMISSED' } }) });
export const markRead = async (req, res) => { const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { readAt: new Date(), status: 'SENT' }, { new: true }); if (!item) throw new AppError('Notification not found', 404, 'NOT_FOUND'); return ok(res, item); };
export const dismiss = async (req, res) => { const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { status: 'DISMISSED', readAt: new Date() }, { new: true }); if (!item) throw new AppError('Notification not found', 404, 'NOT_FOUND'); return ok(res, item); };
