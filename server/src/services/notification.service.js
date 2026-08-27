import Notification from "../models/Notification.js";
import { getAccessStatus } from "../middleware/accountability.js";
import Task from "../models/Task.js";
import { dateKeyInTimezone } from "../utils/dates.js";

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
}
