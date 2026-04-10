import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull().default(""),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
  onboardingStep: integer("onboarding_step").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  googleId: text("google_id").unique(),
  phone: text("phone").unique(),
  authProvider: text("auth_provider").default("email"),
  avatarUrl: text("avatar_url"),
  tourCompleted: integer("tour_completed", { mode: "boolean" }).default(false),
  telegramChatId: text("telegram_chat_id"),
  telegramLinked: integer("telegram_linked", { mode: "boolean" }).default(false),
  telegramLinkToken: text("telegram_link_token"),
  googleSheetsRefreshToken: text("google_sheets_refresh_token"),
  googleSheetsSpreadsheetId: text("google_sheets_spreadsheet_id"),
  googleSheetsConnected: integer("google_sheets_connected", { mode: "boolean" }).default(false),
});

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name"),
  age: integer("age"),
  gender: text("gender"),
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  targetWeightKg: integer("target_weight_kg"),
  bmi: text("bmi"),
  healthHistory: text("health_history"),
  familyHistory: text("family_history"),
  exerciseHistory: text("exercise_history"),
  dietHistory: text("diet_history"),
  pastAttemptsWorked: text("past_attempts_worked"),
  activityLevel: text("activity_level"),
  exerciseComfort: text("exercise_comfort"),
  currentEating: text("current_eating"),
  sleepStress: text("sleep_stress"),
  constraints: text("constraints"),
  nutritionKnowledge: integer("nutrition_knowledge"),
  exerciseKnowledge: integer("exercise_knowledge"),
  selfDiscipline: integer("self_discipline"),
  consistencyHistory: integer("consistency_history"),
  whyNow: text("why_now"),
  customGoal: text("custom_goal"),
  weightTimeline: text("weight_timeline"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const userConditions = sqliteTable("user_conditions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  conditionName: text("condition_name").notNull(),
  isChronic: integer("is_chronic", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const userPainAreas = sqliteTable("user_pain_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  areaName: text("area_name").notNull(),
  autoSuggested: integer("auto_suggested", { mode: "boolean" }).default(false),
});

export const userMedications = sqliteTable("user_medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  medicationName: text("medication_name").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const userDietaryPrefs = sqliteTable("user_dietary_prefs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  preferenceName: text("preference_name").notNull(),
});

export const userActivities = sqliteTable("user_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  activityName: text("activity_name").notNull(),
});

export const userGoals = sqliteTable("user_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  goalType: text("goal_type").notNull(),
  customDescription: text("custom_description"),
  targetValue: text("target_value"),
  targetTimeline: text("target_timeline"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id"),
  title: text("title").notNull(),
  target: text("target"),
  timeframe: text("timeframe"),
  status: text("status").default("planned"),
  movedCount: integer("moved_count").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const milestoneSteps = sqliteTable("milestone_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  milestoneId: integer("milestone_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending"),
});

// ==================== PHASE 2: CHECK-IN TABLES ====================

export const checkIns = sqliteTable("check_ins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  timeOfDay: text("time_of_day"), // "morning" | "afternoon" | "evening" | "night"
  energy: integer("energy"), // 1-10
  mood: integer("mood"), // 1-10
  stress: integer("stress"), // 1-10
  sleepQuality: integer("sleep_quality"), // 1-10
  weight: integer("weight"), // in kg (stored as integer * 10 for decimal precision)
  painLevel: integer("pain_level"), // 1-10
  skinRating: integer("skin_rating"), // 1-10
  painNotes: text("pain_notes"),
  helpRequest: text("help_request"),
  exerciseTypes: text("exercise_types"), // JSON array of strings
  exerciseDuration: integer("exercise_duration"), // minutes
  traveling: integer("traveling", { mode: "boolean" }).default(false),
  plans: text("plans"),
  notes: text("notes"),
  totalCalories: integer("total_calories"),
  totalProtein: integer("total_protein"),
  totalCarbs: integer("total_carbs"),
  totalFat: integer("total_fat"),
  totalWaterMl: integer("total_water_ml"),
  insightsJson: text("insights_json"), // JSON array of generated insights
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const foodLogs = sqliteTable("food_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkInId: integer("check_in_id").notNull(),
  userId: integer("user_id").notNull(),
  foodName: text("food_name").notNull(),
  mealType: text("meal_type").notNull(), // "breakfast" | "lunch" | "snack" | "dinner"
  quantity: text("quantity").notNull(), // stored as string to handle 0.5 etc
  unit: text("unit").notNull(),
  source: text("source").default("Homemade"), // Homemade | Restaurant | Packaged | Street Food | Canteen
  calories: integer("calories"),
  protein: integer("protein"), // stored as value * 10 for decimal precision
  carbs: integer("carbs"),
  fat: integer("fat"),
});

export const waterLogs = sqliteTable("water_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkInId: integer("check_in_id").notNull(),
  userId: integer("user_id").notNull(),
  label: text("label").notNull(), // "Glass (250ml)", "Bottle (500ml)", "Custom", etc.
  amountMl: integer("amount_ml").notNull(),
  quantity: integer("quantity").default(1),
});

// ==================== PHASE 3: CHAT & WEEKLY REVIEW ====================

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // ISO date YYYY-MM-DD (each day = new thread)
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON: food_log_data, entry_point context, etc.
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const weeklyReviews = sqliteTable("weekly_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(),
  weekEndDate: text("week_end_date").notNull(),
  summaryJson: text("summary_json").notNull(), // Full review JSON from Opus
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ==================== PHASE 4: MILESTONES, CALIBRATION & NOTIFICATIONS ====================

export const milestoneHistory = sqliteTable("milestone_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  milestoneId: integer("milestone_id").notNull(),
  userId: integer("user_id").notNull(),
  eventType: text("event_type").notNull(), // "created" | "adjusted" | "paused" | "resumed" | "completed" | "step_done" | "step_skipped"
  oldTarget: text("old_target"),
  newTarget: text("new_target"),
  oldTimeframe: text("old_timeframe"),
  newTimeframe: text("new_timeframe"),
  reasonCategory: text("reason_category"),
  reasonText: text("reason_text"),
  stepId: integer("step_id"),
  metadata: text("metadata"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const calibrationSnapshots = sqliteTable("calibration_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  foodLoggingPct: integer("food_logging_pct"),
  exerciseAdherencePct: integer("exercise_adherence_pct"),
  checkinConsistencyPct: integer("checkin_consistency_pct"),
  calorieAccuracyPct: integer("calorie_accuracy_pct"),
  gapsJson: text("gaps_json"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const notificationPrefs = sqliteTable("notification_prefs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  morningReminder: integer("morning_reminder", { mode: "boolean" }).default(true),
  morningTime: text("morning_time").default("08:00"),
  lunchReminder: integer("lunch_reminder", { mode: "boolean" }).default(true),
  lunchTime: text("lunch_time").default("12:30"),
  waterReminder: integer("water_reminder", { mode: "boolean" }).default(true),
  waterTime: text("water_time").default("15:00"),
  eveningReminder: integer("evening_reminder", { mode: "boolean" }).default(true),
  eveningTime: text("evening_time").default("18:00"),
  medicationReminder: integer("medication_reminder", { mode: "boolean" }).default(false),
  medicationTime: text("medication_time"),
  maxPerDay: integer("max_per_day").default(3),
});

// ==================== DAILY LOG ====================

export const dailyLogs = sqliteTable("daily_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  sugar: integer("sugar"),
  fiber: integer("fiber"),
  waterMl: integer("water_ml"),
  steps: integer("steps"),
  activeMinutes: integer("active_minutes"),
  activityType: text("activity_type"),
  medication: text("medication"),
  sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality"),
  stressLevel: integer("stress_level"),
  mood: integer("mood"),
  energyLevel: integer("energy_level"),
  painLevel: integer("pain_level"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== BADGES & POINTS ====================

export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconType: text("icon_type").notNull(),
  category: text("category").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(10),
  requirement: text("requirement"),
  tier: text("tier").notNull().default("bronze"),
});

export const userBadges = sqliteTable("user_badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: text("earned_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userPoints = sqliteTable("user_points", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  badgeId: integer("badge_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ==================== AUTH: PHONE OTP ====================

export const phoneOtps = sqliteTable("phone_otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: text("expires_at").notNull(),
  verified: integer("verified", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ==================== HEALTH RECORDS ====================

export const healthRecords = sqliteTable("health_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "blood_report", "prescription", "scan", "lab_test", "other"
  title: text("title").notNull(),
  date: text("date").notNull(),
  provider: text("provider"),
  notes: text("notes"),
  imageData: text("image_data"),
  parameters: text("parameters"), // JSON string
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const healthParameters = sqliteTable("health_parameters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  recordId: integer("record_id"),
  name: text("name").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  normalRange: text("normal_range"),
  status: text("status"), // "normal", "borderline", "high", "low"
  date: text("date").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserCondition = typeof userConditions.$inferSelect;
export type UserPainArea = typeof userPainAreas.$inferSelect;
export type UserMedication = typeof userMedications.$inferSelect;
export type UserDietaryPref = typeof userDietaryPrefs.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;
export type UserGoal = typeof userGoals.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type MilestoneStep = typeof milestoneSteps.$inferSelect;

// Phase 2 types
export const insertCheckInSchema = createInsertSchema(checkIns).omit({ id: true, createdAt: true });
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type FoodLog = typeof foodLogs.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;

// Phase 3 types
export type ChatMessage = typeof chatMessages.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;

// Phase 4 types
export type MilestoneHistoryEntry = typeof milestoneHistory.$inferSelect;
export type CalibrationSnapshot = typeof calibrationSnapshots.$inferSelect;
export type NotificationPref = typeof notificationPrefs.$inferSelect;

// Daily Log types
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true });
export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;

// Badge & Points types
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type UserPoint = typeof userPoints.$inferSelect;

// Auth types
export type PhoneOtp = typeof phoneOtps.$inferSelect;

export const phoneOtpRequestSchema = z.object({
  phone: z.string().min(10).max(15),
});

export const phoneOtpVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

export const googleAuthSchema = z.object({
  credential: z.string(),
});

// Health Records types
export type HealthRecord = typeof healthRecords.$inferSelect;
export type HealthParameter = typeof healthParameters.$inferSelect;

// ==================== COACHING THREADS ====================

export const coachingThreads = sqliteTable("coaching_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  topic: text("topic").notNull(), // "weight", "pain", "sleep", "stress", "nutrition", "fitness", "general", "goal_adjustment"
  goalId: integer("goal_id"), // optional link to specific goal
  title: text("title").notNull(), // display title like "Weight Loss Journey" or "Managing Back Pain"
  status: text("status").default("active"), // "active" | "resolved" | "archived"
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  lastMessageAt: text("last_message_at").default(sql`CURRENT_TIMESTAMP`),
});

export const coachingMessages = sqliteTable("coaching_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON: goal_adjustment proposals, etc.
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Glidepath snapshots track actual vs planned progress over time
export const glidepathSnapshots = sqliteTable("glidepath_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  date: text("date").notNull(), // ISO date
  plannedValue: real("planned_value"), // where they should be on the glidepath
  actualValue: real("actual_value"), // where they actually are
  metric: text("metric").notNull(), // "weight_kg", "pain_level", "sleep_hours", "stress_level", etc.
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type CoachingThread = typeof coachingThreads.$inferSelect;
export type CoachingMessage = typeof coachingMessages.$inferSelect;
export type GlidepathSnapshot = typeof glidepathSnapshots.$inferSelect;

// ==================== WEEKLY PLAN ====================

export const weeklyPlans = sqliteTable("weekly_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(),
  planData: text("plan_data").notNull(), // JSON
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const weeklyPlanLogs = sqliteTable("weekly_plan_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(),
  dayIndex: integer("day_index").notNull(), // 0=Mon ... 6=Sun
  sectionKey: text("section_key").notNull(), // "exercise"|"nutrition"|"stress"|"pain"
  itemKey: text("item_key").notNull(), // unique key of the checked item
  completedAt: text("completed_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans).omit({ id: true, createdAt: true });
export const insertWeeklyPlanLogSchema = createInsertSchema(weeklyPlanLogs).omit({ id: true, completedAt: true });

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = z.infer<typeof insertWeeklyPlanSchema>;
export type WeeklyPlanLog = typeof weeklyPlanLogs.$inferSelect;
export type InsertWeeklyPlanLog = z.infer<typeof insertWeeklyPlanLogSchema>;
