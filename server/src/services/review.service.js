import AIReview from '../models/AIReview.js';
import DailyPerformance from '../models/DailyPerformance.js';
import { dashboardPeriod, dashboardToday, growth } from './analytics.service.js';
import { generateReview } from './ai.service.js';
import { createTimelineEvent } from './timeline.service.js';
import { monthPeriod, weekPeriod } from '../utils/dates.js';

function periodFor(type, dateKey) {
  if (type === 'DAILY') return { periodKey: dateKey, startDateKey: dateKey, endDateKey: dateKey };
  return type === 'WEEKLY' ? weekPeriod(dateKey) : monthPeriod(dateKey);
}

export function buildReviewPayload({ type, period, score, growthPercentage, dashboard }) {
  const compact = type === 'DAILY' ? {
    tasks: { completed: dashboard.tasks.completed, total: dashboard.tasks.total, workCompleted: dashboard.work?.completed || 0 },
    habits: dashboard.habits,
    exercise: dashboard.exercise,
    timetable: { planned: dashboard.timetable.length, completed: dashboard.timetable.filter(item => item.status === 'COMPLETED').length },
    phoneUsage: dashboard.phoneUsage ? { recorded: true, minutes: dashboard.phoneUsage.phoneUsageMinutes } : { recorded: false },
    finance: dashboard.finance,
    goals: dashboard.goals.map(goal => ({ title: goal.title, currentProgress: goal.currentProgress, target: goal.target, unit: goal.unit })),
  } : {
    metrics: dashboard.metrics,
    tasks: dashboard.tasks,
    finance: { totals: dashboard.finance.totals, categories: dashboard.finance.categories },
    projects: dashboard.projects.map(project => ({ name: project.name, status: project.status, progressPercentage: project.progressPercentage, taskTotal: project.taskTotal, taskCompleted: project.taskCompleted })),
    performanceHistory: dashboard.performance.map(item => ({ dateKey: item.dateKey, score: item.score })),
  };
  return { type, period, score, growthPercentage, data: compact };
}

export async function generateScheduledReview(user, type, dateKey) {
  const period = periodFor(type, dateKey);
  const existing = await AIReview.findOne({ userId: user._id, reviewType: type, periodKey: period.periodKey });
  if (existing?.status === 'COMPLETED') return existing;
  const comparison = await growth(user, period.startDateKey, period.endDateKey);
  const dashboard = type === 'DAILY' ? await dashboardToday(user) : await dashboardPeriod(user, type);
  const daily = type === 'DAILY' ? await DailyPerformance.findOne({ userId: user._id, dateKey: period.startDateKey }) : null;
  const score = type === 'DAILY' ? daily?.score ?? dashboard.score?.score ?? 0 : dashboard.score ?? comparison.currentScore ?? 0;
  const generated = await generateReview(buildReviewPayload({ type, period, score, growthPercentage: comparison.growthPercentage, dashboard }), type);
  const review = await AIReview.findOneAndUpdate({ userId: user._id, reviewType: type, periodKey: period.periodKey }, { userId: user._id, ...period, ...generated, score, growthPercentage: comparison.growthPercentage, status: 'COMPLETED', generatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await createTimelineEvent({ userId: user._id, type: `${type}_REVIEW_GENERATED`, title: `${type.toLowerCase()} review generated`, entityId: review._id, entityType: 'AIReview', timezone: user.timezone, metadata: { periodKey: period.periodKey, score } });
  return review;
}
