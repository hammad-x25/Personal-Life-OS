import User from '../models/User.js';
import { ok, AppError } from '../utils/api.js';

const allowedThemes = new Set(['dark', 'light', 'system']);
export const updateProfile = async (req, res) => {
  const { name, timezone, currency, weekStartsOn, theme, phoneUsageRequired, spendingAccountabilityRequired, phoneTargetMinutes, scoreWeights } = req.body;
  if (timezone) { try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); } catch { throw new AppError('Invalid timezone', 422, 'INVALID_TIMEZONE'); } }
  if (theme && !allowedThemes.has(theme)) throw new AppError('Invalid theme', 422, 'INVALID_THEME');
  const update = {};
  if (name !== undefined) update.name = name;
  if (timezone !== undefined) update.timezone = timezone;
  if (currency !== undefined) update.currency = currency;
  if (weekStartsOn !== undefined) update['settings.weekStartsOn'] = weekStartsOn;
  if (theme !== undefined) update['settings.theme'] = theme;
  if (phoneUsageRequired !== undefined) update['settings.phoneUsageRequired'] = phoneUsageRequired;
  if (spendingAccountabilityRequired !== undefined) update['settings.spendingAccountabilityRequired'] = spendingAccountabilityRequired;
  if (phoneTargetMinutes !== undefined) update['settings.phoneTargetMinutes'] = phoneTargetMinutes;
  if (scoreWeights !== undefined) update['settings.scoreWeights'] = scoreWeights;
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true }).select('-passwordHash -refreshTokenHash');
  return ok(res, user, 'Settings updated');
};
