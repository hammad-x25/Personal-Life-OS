import AIReview from '../models/AIReview.js';
import { ok, AppError } from '../utils/api.js';
import { dashboardToday, growth } from '../services/analytics.service.js';
import { generateReview } from '../services/ai.service.js';
import { dateKeyInTimezone, monthPeriod, weekPeriod } from '../utils/dates.js';

export const list = async (req, res) => ok(res, await AIReview.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100));
export const generate = type => async (req, res) => {
  const dateKey = dateKeyInTimezone(new Date(), req.user.timezone);
  const period = type === 'DAILY' ? { periodKey: dateKey, startDateKey: dateKey, endDateKey: dateKey } : type === 'WEEKLY' ? weekPeriod(dateKey) : monthPeriod(dateKey);
  const score = await dashboardToday(req.user);
  const comparison = await growth(req.user, period.startDateKey, period.endDateKey);
  const existing = await AIReview.findOne({ userId: req.user._id, reviewType: type, periodKey: period.periodKey });
  if (existing?.status === 'COMPLETED' && !req.body?.regenerate) return ok(res, existing);
  const payload = { score: type === 'DAILY' ? score.score.score : comparison.currentScore, growthPercentage: comparison.growthPercentage, dashboard: score };
  try { const generated = await generateReview(payload, type); const review = await AIReview.findOneAndUpdate({ userId: req.user._id, reviewType: type, periodKey: period.periodKey }, { ...period, ...generated, score: payload.score, growthPercentage: payload.growthPercentage, status: 'COMPLETED', generatedAt: new Date(), userId: req.user._id }, { upsert: true, new: true, setDefaultsOnInsert: true }); return ok(res, review, 'Review generated'); } catch (error) { await AIReview.findOneAndUpdate({ userId: req.user._id, reviewType: type, periodKey: period.periodKey }, { ...period, userId: req.user._id, status: 'FAILED', errorMessage: error.message }, { upsert: true }); throw new AppError('AI review could not be generated', 502, 'AI_REVIEW_FAILED'); }
};
