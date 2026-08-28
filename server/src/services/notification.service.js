import Notification from "../models/Notification.js";
import { getAccessStatus } from "../middleware/accountability.js";
import Task from "../models/Task.js";
import Habit from "../models/Habit.js";
import ExercisePlan from "../models/ExercisePlan.js";
import TimetableEvent from "../models/TimetableEvent.js";
import Goal from "../models/Goal.js";
import { dateKeyInTimezone } from "../utils/dates.js";
import { isHabitScheduledDate } from "../utils/habit-schedule.js";

export async function createNotification({
  userId,
  type,
  title,
  message,
  entityId,
  scheduledFor = new Date(),
}) {
  const slot = new Date(scheduledFor);
  slot.setMinutes(0, 0, 0);
  return Notification.findOneAndUpdate(
    { userId, type, title, scheduledFor: slot },
    { userId, type, title, message, entityId, scheduledFor: slot },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function createDailyReminders(user) {
  const access = await getAccessStatus(user);
  const dateKey = dateKeyInTimezone(new Date(), user.timezone);
  if (access.requirements.phoneUsage.requiredDates.length)
    await createNotification({
      userId: user._id,
      type: "PHONE_USAGE",
      title: "Record phone usage",
      message:
        "Complete your phone usage check-in to close the accountability loop.",
    });
  if (access.requirements.spending.requiredDates.length)
    await createNotification({
      userId: user._id,
      type: "SPENDING_ACCOUNTABILITY",
      title: "Account for spending",
      message: "Review and confirm your previous spending before continuing.",
    });
  const due = await Task.find({
    userId: user._id,
    dueDateKey: dateKey,
    status: { $in: ["TODO", "IN_PROGRESS"] },
    deletedAt: null,
  })
    .select("_id title")
    .limit(5);
  for (const task of due)
    await createNotification({
      userId: user._id,
      type: "TASK_DUE",
      title: `Task due: ${task.title}`,
      message: "This task is scheduled for today.",
      entityId: task._id,
    });
  const [habits, exercisePlans, timetableEvents, goals] = await Promise.all([
    Habit.find({ userId: user._id, status: 'ACTIVE' }).select('_id title frequencyType weekdays planStartDateKey planEndDateKey'),
    ExercisePlan.find({ userId: user._id, status: 'ACTIVE' }).select('_id name schedule'),
    TimetableEvent.find({ userId: user._id, dateKey, status: 'PLANNED', deletedAt: null }).select('_id title startTime'),
    Goal.find({ userId: user._id, status: 'ACTIVE', deadlineKey: { $in: [dateKey] }, deletedAt: null }).select('_id title')
  ]);
  for (const habit of habits) if (isHabitScheduledDate(habit, dateKey)) await createNotification({ userId: user._id, type: 'HABIT_DUE', title: `Habit due: ${habit.title}`, message: 'Record today\'s habit performance.', entityId: habit._id });
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  for (const plan of exercisePlans) if (plan.schedule?.some(item => item.weekday === weekday)) await createNotification({ userId: user._id, type: 'EXERCISE_DUE', title: `Workout planned: ${plan.name}`, message: 'Log your planned exercise session.', entityId: plan._id });
  for (const event of timetableEvents) await createNotification({ userId: user._id, type: 'TIMETABLE_DUE', title: `Routine block: ${event.title}`, message: `${event.startTime} is scheduled today.`, entityId: event._id });
  for (const goal of goals) await createNotification({ userId: user._id, type: 'GOAL_DEADLINE', title: `Goal deadline: ${goal.title}`, message: 'Review the progress needed to close this goal.', entityId: goal._id });
}
