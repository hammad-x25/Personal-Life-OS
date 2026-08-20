import { Router } from "express";
import { asyncHandler } from "../utils/api.js";
import { authenticate } from "../middleware/auth.js";
import { requireAccountability } from "../middleware/accountability.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  phoneSchema,
  expenseSchema,
  taskSchema,
  goalSchema,
  habitSchema,
  timetableSchema,
  timetableUpdateSchema,
  exercisePlanSchema,
  exerciseLogSchema,
  projectSchema,
  milestoneSchema,
  habitLogSchema,
  settingsSchema,
  budgetSchema,
  financialGoalSchema,
  contributionSchema,
} from "../validators/schemas.js";
import * as auth from "../controllers/auth.controller.js";
import * as access from "../controllers/access.controller.js";
import * as crud from "../controllers/crud.controller.js";
import * as exercise from "../controllers/exercise.controller.js";
import * as analytics from "../controllers/analytics.controller.js";
import * as project from "../controllers/project.controller.js";
import * as review from "../controllers/review.controller.js";
import * as search from "../controllers/search.controller.js";
import * as habit from "../controllers/habit.controller.js";
import * as settings from "../controllers/settings.controller.js";
import * as notification from "../controllers/notification.controller.js";
import * as finance from "../controllers/finance.controller.js";
import * as quickAdd from "../controllers/quick-add.controller.js";
import * as recurrence from "../controllers/recurrence.controller.js";
const router = Router();
router.post(
  "/auth/register",
  validate(registerSchema),
  asyncHandler(auth.registerUser),
);
router.post("/auth/login", validate(loginSchema), asyncHandler(auth.loginUser));
router.post("/auth/refresh", asyncHandler(auth.refreshToken));
router.post("/auth/logout", asyncHandler(auth.logout));
router.use(authenticate);
router.get("/auth/me", asyncHandler(auth.me));
router.patch("/auth/profile", validate(settingsSchema), asyncHandler(settings.updateProfile));
router.post("/quick-add", requireAccountability, asyncHandler(quickAdd.quickAdd));
router.post("/tasks/sync-recurring", requireAccountability, asyncHandler(recurrence.syncTasks));
router.get("/access/status", asyncHandler(access.accessStatus));
router.post(
  "/check-ins/phone",
  validate(phoneSchema),
  asyncHandler(access.submitPhoneUsage),
);
router.get("/check-ins/history", asyncHandler(access.phoneHistory));
router.get("/spending-accountability/history", asyncHandler(access.spendingHistory));
router.get(
  "/spending-accountability/:dateKey/preview",
  asyncHandler(access.spendingPreview),
);
router.post(
  "/spending-accountability/:dateKey/confirm",
  asyncHandler(access.confirmSpending),
);
router.post(
  "/spending-accountability/:dateKey/no-spending",
  asyncHandler(access.confirmNoSpending),
);
router.post(
  "/spending-accountability/:dateKey/add-expense",
  validate(expenseSchema.omit({ type: true, dateKey: true })),
  asyncHandler(access.addMissingExpense),
);
const resourceSchemas = {
  expenses: expenseSchema,
  tasks: taskSchema,
  goals: goalSchema,
  habits: habitSchema,
  timetable: { create: timetableSchema, update: timetableUpdateSchema },
};
for (const [path, key] of [
  ["expenses", "expenses"],
  ["tasks", "tasks"],
  ["goals", "goals"],
  ["habits", "habits"],
  ["timetable", "timetable"],
]) {
  router.get(`/${path}`, requireAccountability, asyncHandler(crud.list(key)));
  router.post(
    `/${path}`,
    requireAccountability,
    validate(resourceSchemas[key].create || resourceSchemas[key]),
    asyncHandler(crud.create(key)),
  );
  router.patch(
    `/${path}/:id`,
    requireAccountability,
    validate(resourceSchemas[key].update || resourceSchemas[key].partial()),
    asyncHandler(crud.update(key)),
  );
  router.delete(
    `/${path}/:id`,
    requireAccountability,
    asyncHandler(crud.remove(key)),
  );
}
router.post("/habits/:id/log", requireAccountability, validate(habitLogSchema), asyncHandler(habit.log));
router.get("/habits/:id/history", requireAccountability, asyncHandler(habit.history));
router.get(
  "/exercise/plans",
  requireAccountability,
  asyncHandler(exercise.listPlans),
);
router.post(
  "/exercise/plans",
  requireAccountability,
  validate(exercisePlanSchema),
  asyncHandler(exercise.createPlan),
);
router.patch(
  "/exercise/plans/:id",
  requireAccountability,
  validate(exercisePlanSchema.partial()),
  asyncHandler(exercise.updatePlan),
);
router.delete(
  "/exercise/plans/:id",
  requireAccountability,
  asyncHandler(exercise.deletePlan),
);
router.get(
  "/exercise/logs",
  requireAccountability,
  asyncHandler(exercise.listLogs),
);
router.post(
  "/exercise/logs",
  requireAccountability,
  validate(exerciseLogSchema),
  asyncHandler(exercise.createLog),
);
router.get("/dashboard/today", requireAccountability, asyncHandler(analytics.today));
router.get("/dashboard/weekly", requireAccountability, asyncHandler(analytics.weeklyDashboard));
router.get("/dashboard/monthly", requireAccountability, asyncHandler(analytics.monthlyDashboard));
router.get("/analytics/daily", requireAccountability, asyncHandler(analytics.daily));
router.get("/analytics/weekly", requireAccountability, asyncHandler(analytics.weekly));
router.get("/analytics/monthly", requireAccountability, asyncHandler(analytics.monthly));
router.get("/analytics/growth", requireAccountability, asyncHandler(analytics.growthData));
router.get("/analytics/finance", requireAccountability, asyncHandler(analytics.finance));
router.get("/analytics/periods", requireAccountability, asyncHandler(analytics.currentPeriods));
router.get("/analytics/correlations", requireAccountability, asyncHandler(analytics.correlationData));
router.get("/budgets", requireAccountability, asyncHandler(finance.listBudgets));
router.post("/budgets", requireAccountability, validate(budgetSchema), asyncHandler(finance.createBudget));
router.patch("/budgets/:id", requireAccountability, validate(budgetSchema.partial()), asyncHandler(finance.updateBudget));
router.delete("/budgets/:id", requireAccountability, asyncHandler(finance.deleteBudget));
router.get("/finance-goals", requireAccountability, asyncHandler(finance.listFinancialGoals));
router.post("/finance-goals", requireAccountability, validate(financialGoalSchema), asyncHandler(finance.createFinancialGoal));
router.patch("/finance-goals/:id", requireAccountability, validate(financialGoalSchema.partial()), asyncHandler(finance.updateFinancialGoal));
router.post("/finance-goals/:id/contributions", requireAccountability, validate(contributionSchema), asyncHandler(finance.contribute));
router.delete("/finance-goals/:id", requireAccountability, asyncHandler(finance.deleteFinancialGoal));
router.get("/timeline", requireAccountability, asyncHandler(analytics.timeline));
router.get("/search", requireAccountability, asyncHandler(search.search));
router.get("/notifications", requireAccountability, asyncHandler(notification.list));
router.get("/notifications/unread-count", requireAccountability, asyncHandler(notification.unreadCount));
router.patch("/notifications/:id/read", requireAccountability, asyncHandler(notification.markRead));
router.patch("/notifications/:id/dismiss", requireAccountability, asyncHandler(notification.dismiss));
router.get("/projects", requireAccountability, asyncHandler(project.list));
router.post("/projects", requireAccountability, validate(projectSchema), asyncHandler(project.create));
router.patch("/projects/:id", requireAccountability, validate(projectSchema.partial()), asyncHandler(project.update));
router.delete("/projects/:id", requireAccountability, asyncHandler(project.remove));
router.get("/projects/:id/milestones", requireAccountability, asyncHandler(project.milestones));
router.post("/projects/:id/milestones", requireAccountability, validate(milestoneSchema), asyncHandler(project.createMilestone));
router.get("/projects/:id/timeline", requireAccountability, asyncHandler(project.projectTimeline));
router.get("/ai/reviews", requireAccountability, asyncHandler(review.list));
router.post("/ai/daily-review", requireAccountability, asyncHandler(review.generate('DAILY')));
router.post("/ai/weekly-review", requireAccountability, asyncHandler(review.generate('WEEKLY')));
router.post("/ai/monthly-review", requireAccountability, asyncHandler(review.generate('MONTHLY')));
export default router;
