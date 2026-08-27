export function isHabitScheduledDate(habit, dateKey) {
  const weekday = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  if (habit.frequencyType === 'DAILY' || !habit.frequencyType) return true;
  if (habit.frequencyType === 'CUSTOM') return Array.isArray(habit.weekdays) && habit.weekdays.includes(weekday);
  if (habit.frequencyType === 'WEEKLY') return Array.isArray(habit.weekdays) && habit.weekdays.length ? habit.weekdays.includes(weekday) : weekday === new Date(`${habit.planStartDateKey || dateKey}T12:00:00Z`).getUTCDay();
  return true;
}
