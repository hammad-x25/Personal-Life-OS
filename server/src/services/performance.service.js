import DailyPerformance from "../models/DailyPerformance.js";
import WeeklyPerformance from "../models/WeeklyPerformance.js";
import MonthlyPerformance from "../models/MonthlyPerformance.js";
import YearlyPerformance from "../models/YearlyPerformance.js";
import User from "../models/User.js";
import {
  dateKeyInTimezone,
  dateKeysBetween,
  monthPeriod,
  yearPeriod,
  shiftDateKey,
  weekPeriod,
} from "../utils/dates.js";

const average = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export async function finalizePeriod(user, type, period) {
  const daily = await DailyPerformance.find({
    userId: user._id,
    dateKey: { $gte: period.startDateKey, $lte: period.endDateKey },
  }).sort({ dateKey: 1 });
  const score = average(daily.map((x) => x.score));
  const previousStart = shiftDateKey(
    period.startDateKey,
    -dateKeysBetween(period.startDateKey, period.endDateKey).length,
  );
  const previous = await DailyPerformance.find({
    userId: user._id,
    dateKey: { $gte: previousStart, $lt: period.startDateKey },
  });
  const previousScore = average(previous.map((x) => x.score));
  const growthPercentage = previousScore
    ? ((score - previousScore) / previousScore) * 100
    : null;
  const components = {};
  for (const item of daily)
    for (const [key, value] of Object.entries(item.components || {}))
      if (value !== null) {
        components[key] ||= [];
        components[key].push(value);
      }
  const componentAverages = Object.fromEntries(
    Object.entries(components).map(([key, values]) => [key, average(values)]),
  );
  const payload = {
    userId: user._id,
    periodKey: period.periodKey,
    startDateKey: period.startDateKey,
    endDateKey: period.endDateKey,
    score,
    previousScore: previous.length ? previousScore : null,
    growthPercentage,
    generatedAt: new Date(),
  };
  if (type === "WEEKLY") payload.componentAverages = componentAverages;
  if (type === "MONTHLY")
    payload.summaryMetrics = { daysRecorded: daily.length, componentAverages };
  if (type === "YEARLY")
    payload.summaryMetrics = { daysRecorded: daily.length, componentAverages };
  const Model = type === "WEEKLY" ? WeeklyPerformance : type === "MONTHLY" ? MonthlyPerformance : YearlyPerformance;
  return Model.findOneAndUpdate(
    { userId: user._id, periodKey: period.periodKey },
    { $set: payload },
    { upsert: true, new: true },
  );
}

export async function finalizeAllUsers(date = new Date()) {
  const users = await User.find({}).select("_id timezone");
  for (const user of users) {
    const dateKey = dateKeyInTimezone(date, user.timezone);
    await finalizePeriod(user, "WEEKLY", weekPeriod(dateKey));
    await finalizePeriod(user, "MONTHLY", monthPeriod(dateKey));
    await finalizePeriod(user, "YEARLY", yearPeriod(dateKey));
  }
}
