import {
  type User,
  type Profile,
  type UserCondition,
  type UserPainArea,
  type UserMedication,
  type UserDietaryPref,
  type UserActivity,
  type UserGoal,
  type Milestone,
  type MilestoneStep,
  type CheckIn,
  type FoodLog,
  type WaterLog,
  type ChatMessage,
  type WeeklyReview,
  type MilestoneHistoryEntry,
  type CalibrationSnapshot,
  type NotificationPref,
  type PhoneOtp,
  type DailyLog,
  type Badge,
  type UserBadge,
  type UserPoint,
  type HealthRecord,
  type HealthParameter,
  dailyLogs,
  badges,
  userBadges,
  userPoints,
  users,
  profiles,
  userConditions,
  userPainAreas,
  userMedications,
  userDietaryPrefs,
  userActivities,
  userGoals,
  milestones,
  milestoneSteps,
  checkIns,
  foodLogs,
  waterLogs,
  chatMessages,
  weeklyReviews,
  milestoneHistory,
  calibrationSnapshots,
  notificationPrefs,
  phoneOtps,
  healthRecords,
  healthParameters,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, between, asc, lt, sql as dsql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);
export const rawDb = sqlite;
export const dbFilePath = "data.db";

// Auto-create tables on startup
function ensureTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      onboarding_completed INTEGER DEFAULT 0,
      onboarding_step INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      google_id TEXT UNIQUE,
      phone TEXT UNIQUE,
      auth_provider TEXT DEFAULT 'email',
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT,
      age INTEGER,
      gender TEXT,
      height_cm INTEGER,
      weight_kg INTEGER,
      target_weight_kg INTEGER,
      bmi TEXT,
      health_history TEXT,
      family_history TEXT,
      exercise_history TEXT,
      diet_history TEXT,
      past_attempts_worked TEXT,
      activity_level TEXT,
      exercise_comfort TEXT,
      current_eating TEXT,
      sleep_stress TEXT,
      constraints TEXT,
      nutrition_knowledge INTEGER,
      exercise_knowledge INTEGER,
      self_discipline INTEGER,
      consistency_history INTEGER,
      why_now TEXT,
      custom_goal TEXT,
      weight_timeline TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      condition_name TEXT NOT NULL,
      is_chronic INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_pain_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      area_name TEXT NOT NULL,
      auto_suggested INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medication_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_dietary_prefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preference_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_type TEXT NOT NULL,
      custom_description TEXT,
      target_value TEXT,
      target_timeline TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER,
      title TEXT NOT NULL,
      target TEXT,
      timeframe TEXT,
      status TEXT DEFAULT 'planned',
      moved_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestone_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_of_day TEXT,
      energy INTEGER,
      mood INTEGER,
      stress INTEGER,
      sleep_quality INTEGER,
      weight INTEGER,
      pain_level INTEGER,
      skin_rating INTEGER,
      pain_notes TEXT,
      help_request TEXT,
      exercise_types TEXT,
      exercise_duration INTEGER,
      traveling INTEGER DEFAULT 0,
      plans TEXT,
      notes TEXT,
      total_calories INTEGER,
      total_protein INTEGER,
      total_carbs INTEGER,
      total_fat INTEGER,
      total_water_ml INTEGER,
      insights_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_in_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      food_name TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      quantity TEXT NOT NULL,
      unit TEXT NOT NULL,
      source TEXT DEFAULT 'Homemade',
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_in_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      amount_ml INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start_date TEXT NOT NULL,
      week_end_date TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestone_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      old_target TEXT,
      new_target TEXT,
      old_timeframe TEXT,
      new_timeframe TEXT,
      reason_category TEXT,
      reason_text TEXT,
      step_id INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calibration_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      food_logging_pct INTEGER,
      exercise_adherence_pct INTEGER,
      checkin_consistency_pct INTEGER,
      calorie_accuracy_pct INTEGER,
      gaps_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_prefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      morning_reminder INTEGER DEFAULT 1,
      morning_time TEXT DEFAULT '08:00',
      lunch_reminder INTEGER DEFAULT 1,
      lunch_time TEXT DEFAULT '12:30',
      water_reminder INTEGER DEFAULT 1,
      water_time TEXT DEFAULT '15:00',
      evening_reminder INTEGER DEFAULT 1,
      evening_time TEXT DEFAULT '18:00',
      medication_reminder INTEGER DEFAULT 0,
      medication_time TEXT,
      max_per_day INTEGER DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS phone_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      sugar INTEGER,
      fiber INTEGER,
      water_ml INTEGER,
      steps INTEGER,
      active_minutes INTEGER,
      activity_type TEXT,
      medication TEXT,
      sleep_hours REAL,
      sleep_quality INTEGER,
      stress_level INTEGER,
      mood INTEGER,
      energy_level INTEGER,
      pain_level INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_type TEXT NOT NULL,
      category TEXT NOT NULL,
      points_awarded INTEGER NOT NULL DEFAULT 10,
      requirement TEXT,
      tier TEXT NOT NULL DEFAULT 'bronze'
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      badge_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      provider TEXT,
      notes TEXT,
      image_data TEXT,
      parameters TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      record_id INTEGER,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      unit TEXT,
      normal_range TEXT,
      status TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add columns to users if missing (for upgrades)
  const addCol = (col: string, type: string) => {
    try { sqlite.exec(`ALTER TABLE users ADD COLUMN ${col} ${type}`); } catch {}
  };
  addCol("tour_completed", "INTEGER DEFAULT 0");
  addCol("telegram_chat_id", "TEXT");
  addCol("telegram_linked", "INTEGER DEFAULT 0");
  addCol("telegram_link_token", "TEXT");
  addCol("google_sheets_refresh_token", "TEXT");
  addCol("google_sheets_spreadsheet_id", "TEXT");
  addCol("google_sheets_connected", "INTEGER DEFAULT 0");
}

const SEED_BADGES = [
  { slug: "profile-pioneer", name: "Profile Pioneer", description: "Completed your health profile", iconType: "trophy", category: "onboarding", pointsAwarded: 100, tier: "gold" },
  { slug: "first-steps", name: "First Steps", description: "Completed the app tour", iconType: "star", category: "onboarding", pointsAwarded: 10, tier: "bronze" },
  { slug: "first-log", name: "First Log", description: "Logged your first daily entry", iconType: "zap", category: "logging", pointsAwarded: 20, tier: "bronze" },
  { slug: "week-warrior", name: "Week Warrior", description: "Logged 7 days in a row", iconType: "flame", category: "streak", pointsAwarded: 50, tier: "silver" },
  { slug: "fortnight-focus", name: "Fortnight Focus", description: "Logged 14 days in a row", iconType: "flame", category: "streak", pointsAwarded: 100, tier: "gold" },
  { slug: "monthly-master", name: "Monthly Master", description: "Logged 30 days in a row", iconType: "crown", category: "streak", pointsAwarded: 200, tier: "platinum" },
  { slug: "century-club", name: "Century Club", description: "Logged 100 total entries", iconType: "target", category: "logging", pointsAwarded: 150, tier: "gold" },
  { slug: "first-checkin", name: "First Check-in", description: "Completed your first check-in", iconType: "heart", category: "logging", pointsAwarded: 15, tier: "bronze" },
  { slug: "checkin-streak-7", name: "Consistent Checker", description: "7-day check-in streak", iconType: "flame", category: "streak", pointsAwarded: 50, tier: "silver" },
  { slug: "first-milestone", name: "Goal Setter", description: "Created your first milestone", iconType: "target", category: "milestone", pointsAwarded: 25, tier: "bronze" },
  { slug: "milestone-complete", name: "Goal Crusher", description: "Completed a milestone", iconType: "trophy", category: "milestone", pointsAwarded: 75, tier: "gold" },
  { slug: "chat-starter", name: "Chat Starter", description: "Had your first AI coach conversation", iconType: "star", category: "social", pointsAwarded: 10, tier: "bronze" },
  { slug: "data-exporter", name: "Data Explorer", description: "Connected Google Sheets", iconType: "zap", category: "social", pointsAwarded: 25, tier: "silver" },
  { slug: "telegram-linked", name: "Stay Connected", description: "Linked Telegram for reminders", iconType: "shield", category: "social", pointsAwarded: 25, tier: "silver" },
];

function seedBadges() {
  const stmt = sqlite.prepare(
    `INSERT OR IGNORE INTO badges (slug, name, description, icon_type, category, points_awarded, tier)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const b of SEED_BADGES) {
    stmt.run(b.slug, b.name, b.description, b.iconType, b.category, b.pointsAwarded, b.tier);
  }
}

ensureTables();
seedBadges();

export interface IStorage {
  // Users
  createUser(email: string, passwordHash: string): User;
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  updateOnboardingStep(userId: number, step: number): void;
  completeOnboarding(userId: number): void;

  // Profile
  saveProfile(userId: number, data: Partial<Profile>): void;
  getProfile(userId: number): Profile | undefined;

  // Conditions
  saveConditions(userId: number, conditions: { conditionName: string; isChronic: boolean }[]): void;
  getConditions(userId: number): UserCondition[];

  // Pain areas
  savePainAreas(userId: number, areas: { areaName: string; autoSuggested: boolean }[]): void;
  getPainAreas(userId: number): UserPainArea[];

  // Medications
  saveMedications(userId: number, meds: string[]): void;
  getMedications(userId: number): UserMedication[];

  // Dietary preferences
  saveDietaryPrefs(userId: number, prefs: string[]): void;
  getDietaryPrefs(userId: number): UserDietaryPref[];

  // Activities
  saveActivities(userId: number, activities: string[]): void;
  getActivities(userId: number): UserActivity[];

  // Goals
  saveGoals(userId: number, goals: { goalType: string; customDescription?: string; targetValue?: string; targetTimeline?: string }[]): void;
  getGoals(userId: number): UserGoal[];

  // Milestones
  saveMilestones(userId: number, milestonesData: { title: string; target?: string; timeframe?: string; steps: { weekNumber: number; description: string }[] }[]): void;
  getMilestones(userId: number): (Milestone & { steps: MilestoneStep[] })[];

  // Full onboarding data
  getFullOnboardingData(userId: number): any;

  // Check-ins
  createCheckIn(userId: number, data: any): CheckIn;
  getCheckIn(id: number): CheckIn | undefined;
  getCheckInsByUser(userId: number, limit?: number): CheckIn[];
  getTodayCheckIn(userId: number): CheckIn | undefined;
  updateCheckIn(id: number, data: Partial<CheckIn>): void;

  // Food logs
  addFoodLog(data: any): FoodLog;
  getFoodLogs(checkInId: number): FoodLog[];
  removeFoodLog(id: number): void;
  updateFoodLog(id: number, data: Partial<FoodLog>): void;

  // Water logs
  addWaterLog(data: any): WaterLog;
  getWaterLogs(checkInId: number): WaterLog[];
  removeWaterLog(id: number): void;
  updateWaterLog(id: number, data: Partial<WaterLog>): void;

  // Dashboard data
  getDashboardData(userId: number): any;

  // Chat messages
  addChatMessage(userId: number, date: string, role: string, content: string, metadata?: string): ChatMessage;
  getChatMessages(userId: number, date: string): ChatMessage[];
  getRecentChatHistory(userId: number, limit?: number): ChatMessage[];
  getChatThreads(userId: number): { date: string; messageCount: number; lastMessage: string }[];

  // Weekly reviews
  saveWeeklyReview(userId: number, weekStart: string, weekEnd: string, summaryJson: string): WeeklyReview;
  getLatestWeeklyReview(userId: number): WeeklyReview | undefined;

  // Enhanced queries for AI context
  getCheckInsForDateRange(userId: number, startDate: string, endDate: string): CheckIn[];
  getFoodLogsForCheckIn(checkInId: number): FoodLog[];
  getWaterLogsForCheckIn(checkInId: number): WaterLog[];

  // Milestone status update (for illness mode)
  updateMilestoneStatus(id: number, status: string): void;

  // Phase 4: Milestone history
  addMilestoneHistoryEntry(milestoneId: number, userId: number, eventType: string, data?: Partial<MilestoneHistoryEntry>): MilestoneHistoryEntry;
  getMilestoneHistory(milestoneId: number): MilestoneHistoryEntry[];

  // Phase 4: Milestone detail
  getMilestoneById(id: number): (Milestone & { steps: MilestoneStep[]; history: MilestoneHistoryEntry[] }) | undefined;
  updateMilestone(id: number, updates: Partial<Milestone>): void;
  updateMilestoneStep(stepId: number, status: string): void;
  addMilestoneStep(milestoneId: number, weekNumber: number, description: string): MilestoneStep;
  deleteMilestoneStep(stepId: number): void;
  completeMilestone(milestoneId: number, userId: number): void;

  // Phase 4: Calibration
  saveCalibrationSnapshot(userId: number, data: Partial<CalibrationSnapshot>): CalibrationSnapshot;
  getLatestCalibration(userId: number): CalibrationSnapshot | undefined;
  getCalibrationHistory(userId: number, limit?: number): CalibrationSnapshot[];

  // Phase 4: Profile editing
  updateProfile(userId: number, updates: Partial<Profile>): void;
  addCondition(userId: number, name: string, isChronic: boolean): UserCondition;
  removeCondition(conditionId: number): void;
  addMedication(userId: number, name: string): UserMedication;
  removeMedication(medicationId: number): void;
  addGoal(userId: number, goalType: string, customDesc?: string, targetValue?: string, targetTimeline?: string): UserGoal;
  removeGoal(goalId: number): void;

  // Phase 4: Notification prefs
  getNotificationPrefs(userId: number): NotificationPref | undefined;
  saveNotificationPrefs(userId: number, prefs: Partial<NotificationPref>): NotificationPref;

  // Phase 4: Data export
  getFullExportData(userId: number): any;

  // Daily Logs
  getDailyLog(userId: number, date: string): DailyLog | undefined;
  getDailyLogs(userId: number, startDate: string, endDate: string): DailyLog[];
  getAllDailyLogs(userId: number): DailyLog[];
  upsertDailyLog(data: Partial<DailyLog> & { userId: number; date: string }): DailyLog;

  // Auth: Google + Phone
  findUserByGoogleId(googleId: string): User | undefined;
  findUserByPhone(phone: string): User | undefined;
  createGoogleUser(email: string, googleId: string, name: string, avatarUrl?: string): User;
  createPhoneUser(phone: string): User;

  // Phone OTP
  createPhoneOtp(phone: string, otp: string, expiresAt: string): void;
  getLatestPhoneOtp(phone: string): { otp: string; expiresAt: string; verified: boolean | null } | undefined;
  markPhoneOtpVerified(phone: string): void;
  cleanupExpiredOtps(): void;

  // Badges & Points
  getAllBadges(): Badge[];
  getBadgeBySlug(slug: string): Badge | undefined;
  getUserBadges(userId: number): (UserBadge & { badge: Badge })[];
  hasUserBadge(userId: number, badgeSlug: string): boolean;
  awardBadge(userId: number, badgeId: number): UserBadge;
  addPoints(userId: number, amount: number, reason: string, badgeId?: number): void;
  getTotalPoints(userId: number): number;
  getPointHistory(userId: number): UserPoint[];
  getDailyLogStreak(userId: number): number;
  getDailyLogCount(userId: number): number;
  getCheckInStreak(userId: number): number;

  // Tour
  completeTour(userId: number): void;

  // Telegram
  setTelegramLinkToken(userId: number, token: string): void;
  findUserByTelegramToken(token: string): User | undefined;
  linkTelegram(userId: number, chatId: string): void;
  unlinkTelegram(userId: number): void;
  getLinkedTelegramUsers(): User[];

  // Google Sheets
  setGoogleSheetsConnection(userId: number, refreshToken: string, spreadsheetId: string): void;
  disconnectGoogleSheets(userId: number): void;

  // Context for AI
  getUserContextData(userId: number): any;

  // Health Records
  getHealthRecords(userId: number): HealthRecord[];
  getHealthRecord(id: number): HealthRecord | undefined;
  createHealthRecord(data: Omit<HealthRecord, "id" | "createdAt">): HealthRecord;
  updateHealthRecord(id: number, data: Partial<Omit<HealthRecord, "id" | "createdAt">>): void;
  deleteHealthRecord(id: number): void;

  // Health Parameters
  getHealthParameters(userId: number, name?: string): HealthParameter[];
  getHealthParametersByRecord(recordId: number): HealthParameter[];
  createHealthParameter(data: Omit<HealthParameter, "id" | "createdAt">): HealthParameter;
  deleteHealthParametersByRecord(recordId: number): void;
}

export class DatabaseStorage implements IStorage {
  createUser(email: string, passwordHash: string): User {
    return db.insert(users).values({ email, passwordHash }).returning().get();
  }

  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  updateOnboardingStep(userId: number, step: number): void {
    db.update(users).set({ onboardingStep: step }).where(eq(users.id, userId)).run();
  }

  completeOnboarding(userId: number): void {
    db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, userId)).run();
  }

  saveProfile(userId: number, data: Partial<Profile>): void {
    const existing = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
    if (existing) {
      db.update(profiles)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(profiles.userId, userId))
        .run();
    } else {
      db.insert(profiles)
        .values({ ...data, userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .run();
    }
  }

  getProfile(userId: number): Profile | undefined {
    return db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  }

  saveConditions(userId: number, conditions: { conditionName: string; isChronic: boolean }[]): void {
    db.delete(userConditions).where(eq(userConditions.userId, userId)).run();
    for (const c of conditions) {
      db.insert(userConditions).values({ userId, conditionName: c.conditionName, isChronic: c.isChronic }).run();
    }
  }

  getConditions(userId: number): UserCondition[] {
    return db.select().from(userConditions).where(eq(userConditions.userId, userId)).all();
  }

  savePainAreas(userId: number, areas: { areaName: string; autoSuggested: boolean }[]): void {
    db.delete(userPainAreas).where(eq(userPainAreas.userId, userId)).run();
    for (const a of areas) {
      db.insert(userPainAreas).values({ userId, areaName: a.areaName, autoSuggested: a.autoSuggested }).run();
    }
  }

  getPainAreas(userId: number): UserPainArea[] {
    return db.select().from(userPainAreas).where(eq(userPainAreas.userId, userId)).all();
  }

  saveMedications(userId: number, meds: string[]): void {
    db.delete(userMedications).where(eq(userMedications.userId, userId)).run();
    for (const m of meds) {
      db.insert(userMedications).values({ userId, medicationName: m }).run();
    }
  }

  getMedications(userId: number): UserMedication[] {
    return db.select().from(userMedications).where(eq(userMedications.userId, userId)).all();
  }

  saveDietaryPrefs(userId: number, prefs: string[]): void {
    db.delete(userDietaryPrefs).where(eq(userDietaryPrefs.userId, userId)).run();
    for (const p of prefs) {
      db.insert(userDietaryPrefs).values({ userId, preferenceName: p }).run();
    }
  }

  getDietaryPrefs(userId: number): UserDietaryPref[] {
    return db.select().from(userDietaryPrefs).where(eq(userDietaryPrefs.userId, userId)).all();
  }

  saveActivities(userId: number, activities: string[]): void {
    db.delete(userActivities).where(eq(userActivities.userId, userId)).run();
    for (const a of activities) {
      db.insert(userActivities).values({ userId, activityName: a }).run();
    }
  }

  getActivities(userId: number): UserActivity[] {
    return db.select().from(userActivities).where(eq(userActivities.userId, userId)).all();
  }

  saveGoals(userId: number, goals: { goalType: string; customDescription?: string; targetValue?: string; targetTimeline?: string }[]): void {
    db.delete(userGoals).where(eq(userGoals.userId, userId)).run();
    for (const g of goals) {
      db.insert(userGoals).values({ userId, goalType: g.goalType, customDescription: g.customDescription, targetValue: g.targetValue, targetTimeline: g.targetTimeline }).run();
    }
  }

  getGoals(userId: number): UserGoal[] {
    return db.select().from(userGoals).where(eq(userGoals.userId, userId)).all();
  }

  saveMilestones(userId: number, milestonesData: { title: string; target?: string; timeframe?: string; steps: { weekNumber: number; description: string }[] }[]): void {
    // Delete existing milestones and their steps
    const existingMilestones = db.select().from(milestones).where(eq(milestones.userId, userId)).all();
    for (const m of existingMilestones) {
      db.delete(milestoneSteps).where(eq(milestoneSteps.milestoneId, m.id)).run();
    }
    db.delete(milestones).where(eq(milestones.userId, userId)).run();

    for (const md of milestonesData) {
      const milestone = db.insert(milestones).values({
        userId,
        title: md.title,
        target: md.target,
        timeframe: md.timeframe,
      }).returning().get();

      for (const step of md.steps) {
        db.insert(milestoneSteps).values({
          milestoneId: milestone.id,
          weekNumber: step.weekNumber,
          description: step.description,
        }).run();
      }
    }
  }

  getMilestones(userId: number): (Milestone & { steps: MilestoneStep[] })[] {
    const ms = db.select().from(milestones).where(eq(milestones.userId, userId)).all();
    return ms.map(m => {
      const steps = db.select().from(milestoneSteps).where(eq(milestoneSteps.milestoneId, m.id)).all();
      return { ...m, steps };
    });
  }

  getFullOnboardingData(userId: number): any {
    return {
      profile: this.getProfile(userId),
      conditions: this.getConditions(userId),
      painAreas: this.getPainAreas(userId),
      medications: this.getMedications(userId),
      dietaryPrefs: this.getDietaryPrefs(userId),
      activities: this.getActivities(userId),
      goals: this.getGoals(userId),
      milestones: this.getMilestones(userId),
    };
  }

  // ==================== PHASE 2: CHECK-INS ====================

  createCheckIn(userId: number, data: any): CheckIn {
    const today = new Date().toISOString().split("T")[0];
    return db.insert(checkIns).values({
      userId,
      date: today,
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  getCheckIn(id: number): CheckIn | undefined {
    return db.select().from(checkIns).where(eq(checkIns.id, id)).get();
  }

  getCheckInsByUser(userId: number, limit: number = 5): CheckIn[] {
    return db.select().from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.date))
      .limit(limit)
      .all();
  }

  getTodayCheckIn(userId: number): CheckIn | undefined {
    const today = new Date().toISOString().split("T")[0];
    return db.select().from(checkIns)
      .where(and(eq(checkIns.userId, userId), eq(checkIns.date, today)))
      .get();
  }

  updateCheckIn(id: number, data: Partial<CheckIn>): void {
    db.update(checkIns).set(data).where(eq(checkIns.id, id)).run();
  }

  // ==================== FOOD LOGS ====================

  addFoodLog(data: any): FoodLog {
    return db.insert(foodLogs).values(data).returning().get();
  }

  getFoodLogs(checkInId: number): FoodLog[] {
    return db.select().from(foodLogs).where(eq(foodLogs.checkInId, checkInId)).all();
  }

  removeFoodLog(id: number): void {
    db.delete(foodLogs).where(eq(foodLogs.id, id)).run();
  }

  updateFoodLog(id: number, data: Partial<FoodLog>): void {
    db.update(foodLogs).set(data).where(eq(foodLogs.id, id)).run();
  }

  // ==================== WATER LOGS ====================

  addWaterLog(data: any): WaterLog {
    return db.insert(waterLogs).values(data).returning().get();
  }

  getWaterLogs(checkInId: number): WaterLog[] {
    return db.select().from(waterLogs).where(eq(waterLogs.checkInId, checkInId)).all();
  }

  removeWaterLog(id: number): void {
    db.delete(waterLogs).where(eq(waterLogs.id, id)).run();
  }

  updateWaterLog(id: number, data: Partial<WaterLog>): void {
    db.update(waterLogs).set(data).where(eq(waterLogs.id, id)).run();
  }

  // ==================== DASHBOARD DATA ====================

  getDashboardData(userId: number): any {
    const profile = this.getProfile(userId);
    const goals = this.getGoals(userId);
    const milestonesData = this.getMilestones(userId);
    const recentCheckIns = this.getCheckInsByUser(userId, 14);
    const conditions = this.getConditions(userId);
    const medications = this.getMedications(userId);

    return {
      profile,
      goals,
      milestones: milestonesData,
      recentCheckIns,
      conditions,
      medications,
      stats: {
        checkInCount: db.select().from(checkIns).where(eq(checkIns.userId, userId)).all().length,
        activeMilestones: milestonesData.filter(m => m.status === "planned" || m.status === "active").length,
      },
    };
  }

  // ==================== PHASE 3: CHAT & WEEKLY REVIEW ====================

  addChatMessage(userId: number, date: string, role: string, content: string, metadata?: string): ChatMessage {
    return db.insert(chatMessages).values({
      userId,
      date,
      role,
      content,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  getChatMessages(userId: number, date: string): ChatMessage[] {
    return db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, userId), eq(chatMessages.date, date)))
      .orderBy(asc(chatMessages.createdAt))
      .all();
  }

  getRecentChatHistory(userId: number, limit: number = 20): ChatMessage[] {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .all();
  }

  getChatThreads(userId: number): { date: string; messageCount: number; lastMessage: string }[] {
    const rows = db.select({
      date: chatMessages.date,
      messageCount: dsql<number>`COUNT(*)`,
      lastMessage: dsql<string>`MAX(${chatMessages.content})`,
    }).from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .groupBy(chatMessages.date)
      .orderBy(desc(chatMessages.date))
      .all();
    return rows.map(r => ({
      date: r.date,
      messageCount: r.messageCount,
      lastMessage: r.lastMessage || "",
    }));
  }

  saveWeeklyReview(userId: number, weekStart: string, weekEnd: string, summaryJson: string): WeeklyReview {
    return db.insert(weeklyReviews).values({
      userId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      summaryJson,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  getLatestWeeklyReview(userId: number): WeeklyReview | undefined {
    return db.select().from(weeklyReviews)
      .where(eq(weeklyReviews.userId, userId))
      .orderBy(desc(weeklyReviews.createdAt))
      .limit(1)
      .get();
  }

  getCheckInsForDateRange(userId: number, startDate: string, endDate: string): CheckIn[] {
    return db.select().from(checkIns)
      .where(and(
        eq(checkIns.userId, userId),
        between(checkIns.date, startDate, endDate)
      ))
      .orderBy(asc(checkIns.date))
      .all();
  }

  getFoodLogsForCheckIn(checkInId: number): FoodLog[] {
    return db.select().from(foodLogs).where(eq(foodLogs.checkInId, checkInId)).all();
  }

  getWaterLogsForCheckIn(checkInId: number): WaterLog[] {
    return db.select().from(waterLogs).where(eq(waterLogs.checkInId, checkInId)).all();
  }

  updateMilestoneStatus(id: number, status: string): void {
    db.update(milestones).set({ status }).where(eq(milestones.id, id)).run();
  }

  // ==================== PHASE 4: MILESTONE HISTORY ====================

  addMilestoneHistoryEntry(milestoneId: number, userId: number, eventType: string, data?: Partial<MilestoneHistoryEntry>): MilestoneHistoryEntry {
    return db.insert(milestoneHistory).values({
      milestoneId,
      userId,
      eventType,
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  getMilestoneHistory(milestoneId: number): MilestoneHistoryEntry[] {
    return db.select().from(milestoneHistory)
      .where(eq(milestoneHistory.milestoneId, milestoneId))
      .orderBy(desc(milestoneHistory.createdAt))
      .all();
  }

  getMilestoneById(id: number): (Milestone & { steps: MilestoneStep[]; history: MilestoneHistoryEntry[] }) | undefined {
    const m = db.select().from(milestones).where(eq(milestones.id, id)).get();
    if (!m) return undefined;
    const steps = db.select().from(milestoneSteps).where(eq(milestoneSteps.milestoneId, id)).all();
    const history = this.getMilestoneHistory(id);
    return { ...m, steps, history };
  }

  updateMilestone(id: number, updates: Partial<Milestone>): void {
    db.update(milestones).set(updates).where(eq(milestones.id, id)).run();
  }

  updateMilestoneStep(stepId: number, status: string): void {
    db.update(milestoneSteps).set({ status }).where(eq(milestoneSteps.id, stepId)).run();
  }

  addMilestoneStep(milestoneId: number, weekNumber: number, description: string): MilestoneStep {
    return db.insert(milestoneSteps).values({ milestoneId, weekNumber, description }).returning().get();
  }

  deleteMilestoneStep(stepId: number): void {
    db.delete(milestoneSteps).where(eq(milestoneSteps.id, stepId)).run();
  }

  completeMilestone(milestoneId: number, userId: number): void {
    db.update(milestones).set({ status: "completed" }).where(eq(milestones.id, milestoneId)).run();
    this.addMilestoneHistoryEntry(milestoneId, userId, "completed");
  }

  // ==================== PHASE 4: CALIBRATION ====================

  saveCalibrationSnapshot(userId: number, data: Partial<CalibrationSnapshot>): CalibrationSnapshot {
    return db.insert(calibrationSnapshots).values({
      userId,
      date: new Date().toISOString().split("T")[0],
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  getLatestCalibration(userId: number): CalibrationSnapshot | undefined {
    return db.select().from(calibrationSnapshots)
      .where(eq(calibrationSnapshots.userId, userId))
      .orderBy(desc(calibrationSnapshots.createdAt))
      .limit(1)
      .get();
  }

  getCalibrationHistory(userId: number, limit: number = 10): CalibrationSnapshot[] {
    return db.select().from(calibrationSnapshots)
      .where(eq(calibrationSnapshots.userId, userId))
      .orderBy(desc(calibrationSnapshots.createdAt))
      .limit(limit)
      .all();
  }

  // ==================== PHASE 4: PROFILE EDITING ====================

  updateProfile(userId: number, updates: Partial<Profile>): void {
    db.update(profiles).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, userId)).run();
  }

  addCondition(userId: number, name: string, isChronic: boolean): UserCondition {
    return db.insert(userConditions).values({ userId, conditionName: name, isChronic }).returning().get();
  }

  removeCondition(conditionId: number): void {
    db.delete(userConditions).where(eq(userConditions.id, conditionId)).run();
  }

  addMedication(userId: number, name: string): UserMedication {
    return db.insert(userMedications).values({ userId, medicationName: name }).returning().get();
  }

  removeMedication(medicationId: number): void {
    db.delete(userMedications).where(eq(userMedications.id, medicationId)).run();
  }

  addGoal(userId: number, goalType: string, customDesc?: string, targetValue?: string, targetTimeline?: string): UserGoal {
    return db.insert(userGoals).values({ userId, goalType, customDescription: customDesc, targetValue, targetTimeline }).returning().get();
  }

  removeGoal(goalId: number): void {
    db.delete(userGoals).where(eq(userGoals.id, goalId)).run();
  }

  // ==================== PHASE 4: NOTIFICATION PREFS ====================

  getNotificationPrefs(userId: number): NotificationPref | undefined {
    return db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).get();
  }

  saveNotificationPrefs(userId: number, prefs: Partial<NotificationPref>): NotificationPref {
    const existing = db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).get();
    if (existing) {
      db.update(notificationPrefs).set(prefs).where(eq(notificationPrefs.userId, userId)).run();
      return db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).get()!;
    }
    return db.insert(notificationPrefs).values({ userId, ...prefs }).returning().get();
  }

  // ==================== PHASE 4: DATA EXPORT ====================

  getFullExportData(userId: number): any {
    const user = this.getUserById(userId);
    const profile = this.getProfile(userId);
    const conditions = this.getConditions(userId);
    const painAreas = this.getPainAreas(userId);
    const medications = this.getMedications(userId);
    const dietaryPrefs = this.getDietaryPrefs(userId);
    const activities = this.getActivities(userId);
    const goals = this.getGoals(userId);
    const allMilestones = this.getMilestones(userId);
    const allCheckIns = db.select().from(checkIns).where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.date)).all();
    const allFoodLogs = allCheckIns.flatMap(ci => this.getFoodLogsForCheckIn(ci.id));
    const allWaterLogs = allCheckIns.flatMap(ci => this.getWaterLogsForCheckIn(ci.id));
    const chatMsgs = this.getRecentChatHistory(userId, 1000);
    const reviews = db.select().from(weeklyReviews).where(eq(weeklyReviews.userId, userId)).all();
    const calibrations = this.getCalibrationHistory(userId, 100);
    const notifPrefs = this.getNotificationPrefs(userId);

    return {
      exportedAt: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email, createdAt: user.createdAt } : null,
      profile,
      conditions,
      painAreas,
      medications,
      dietaryPrefs,
      activities,
      goals,
      milestones: allMilestones,
      checkIns: allCheckIns,
      foodLogs: allFoodLogs,
      waterLogs: allWaterLogs,
      chatMessages: chatMsgs,
      weeklyReviews: reviews,
      calibrationSnapshots: calibrations,
      notificationPrefs: notifPrefs,
    };
  }

  // ==================== DAILY LOGS ====================

  getDailyLog(userId: number, date: string): DailyLog | undefined {
    return db.select().from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, date)))
      .get();
  }

  getDailyLogs(userId: number, startDate: string, endDate: string): DailyLog[] {
    return db.select().from(dailyLogs)
      .where(and(
        eq(dailyLogs.userId, userId),
        between(dailyLogs.date, startDate, endDate)
      ))
      .orderBy(desc(dailyLogs.date))
      .all();
  }

  getAllDailyLogs(userId: number): DailyLog[] {
    return db.select().from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(asc(dailyLogs.date))
      .all();
  }

  upsertDailyLog(data: Partial<DailyLog> & { userId: number; date: string }): DailyLog {
    const existing = this.getDailyLog(data.userId, data.date);
    if (existing) {
      const { userId, date, id, createdAt, ...updates } = data as any;
      db.update(dailyLogs).set(updates).where(eq(dailyLogs.id, existing.id)).run();
      return this.getDailyLog(data.userId, data.date)!;
    }
    return db.insert(dailyLogs).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  }

  // ==================== AUTH: GOOGLE + PHONE ====================

  findUserByGoogleId(googleId: string): User | undefined {
    return db.select().from(users).where(eq(users.googleId, googleId)).get();
  }

  findUserByPhone(phone: string): User | undefined {
    return db.select().from(users).where(eq(users.phone, phone)).get();
  }

  createGoogleUser(email: string, googleId: string, name: string, avatarUrl?: string): User {
    const user = db.insert(users).values({
      email,
      passwordHash: "",
      googleId,
      authProvider: "google",
      avatarUrl: avatarUrl || null,
    }).returning().get();

    // Create profile with name
    db.insert(profiles).values({
      userId: user.id,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).run();

    return user;
  }

  createPhoneUser(phone: string): User {
    return db.insert(users).values({
      phone,
      passwordHash: "",
      authProvider: "phone",
    }).returning().get();
  }

  createPhoneOtp(phone: string, otp: string, expiresAt: string): void {
    db.insert(phoneOtps).values({
      phone,
      otp,
      expiresAt,
      createdAt: new Date().toISOString(),
    }).run();
  }

  getLatestPhoneOtp(phone: string): { otp: string; expiresAt: string; verified: boolean | null } | undefined {
    return db.select({ otp: phoneOtps.otp, expiresAt: phoneOtps.expiresAt, verified: phoneOtps.verified })
      .from(phoneOtps)
      .where(eq(phoneOtps.phone, phone))
      .orderBy(desc(phoneOtps.createdAt))
      .limit(1)
      .get();
  }

  markPhoneOtpVerified(phone: string): void {
    db.update(phoneOtps).set({ verified: true }).where(eq(phoneOtps.phone, phone)).run();
  }

  cleanupExpiredOtps(): void {
    const now = new Date().toISOString();
    db.delete(phoneOtps).where(lt(phoneOtps.expiresAt, now)).run();
  }

  // ==================== BADGES & POINTS ====================

  getAllBadges(): Badge[] {
    return db.select().from(badges).all();
  }

  getBadgeBySlug(slug: string): Badge | undefined {
    return db.select().from(badges).where(eq(badges.slug, slug)).get();
  }

  getUserBadges(userId: number): (UserBadge & { badge: Badge })[] {
    const rows = db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt)).all();
    return rows.map(ub => {
      const badge = db.select().from(badges).where(eq(badges.id, ub.badgeId)).get()!;
      return { ...ub, badge };
    });
  }

  hasUserBadge(userId: number, badgeSlug: string): boolean {
    const badge = this.getBadgeBySlug(badgeSlug);
    if (!badge) return false;
    return !!db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)))
      .get();
  }

  awardBadge(userId: number, badgeId: number): UserBadge {
    return db.insert(userBadges).values({
      userId, badgeId, earnedAt: new Date().toISOString(),
    }).returning().get();
  }

  addPoints(userId: number, amount: number, reason: string, badgeId?: number): void {
    db.insert(userPoints).values({
      userId, amount, reason,
      badgeId: badgeId || null,
      createdAt: new Date().toISOString(),
    }).run();
  }

  getTotalPoints(userId: number): number {
    const result = db.select({ total: dsql<number>`COALESCE(SUM(${userPoints.amount}), 0)` })
      .from(userPoints).where(eq(userPoints.userId, userId)).get();
    return result?.total || 0;
  }

  getPointHistory(userId: number): UserPoint[] {
    return db.select().from(userPoints).where(eq(userPoints.userId, userId)).orderBy(desc(userPoints.createdAt)).all();
  }

  getDailyLogStreak(userId: number): number {
    const logs = db.select({ date: dailyLogs.date }).from(dailyLogs)
      .where(eq(dailyLogs.userId, userId)).orderBy(desc(dailyLogs.date)).all();
    if (logs.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < logs.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (logs[i].date === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  getDailyLogCount(userId: number): number {
    const result = db.select({ count: dsql<number>`COUNT(*)` })
      .from(dailyLogs).where(eq(dailyLogs.userId, userId)).get();
    return result?.count || 0;
  }

  getCheckInStreak(userId: number): number {
    const cis = db.select({ date: checkIns.date }).from(checkIns)
      .where(eq(checkIns.userId, userId)).orderBy(desc(checkIns.date)).all();
    if (cis.length === 0) return 0;
    // Deduplicate by date
    const uniqueDates = Array.from(new Set(cis.map(c => c.date)));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (uniqueDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // ==================== TOUR ====================

  completeTour(userId: number): void {
    db.update(users).set({ tourCompleted: true }).where(eq(users.id, userId)).run();
  }

  // ==================== TELEGRAM ====================

  setTelegramLinkToken(userId: number, token: string): void {
    db.update(users).set({ telegramLinkToken: token }).where(eq(users.id, userId)).run();
  }

  findUserByTelegramToken(token: string): User | undefined {
    return db.select().from(users).where(eq(users.telegramLinkToken, token)).get();
  }

  linkTelegram(userId: number, chatId: string): void {
    db.update(users).set({
      telegramChatId: chatId,
      telegramLinked: true,
      telegramLinkToken: null,
    }).where(eq(users.id, userId)).run();
  }

  unlinkTelegram(userId: number): void {
    db.update(users).set({
      telegramChatId: null,
      telegramLinked: false,
      telegramLinkToken: null,
    }).where(eq(users.id, userId)).run();
  }

  getLinkedTelegramUsers(): User[] {
    return db.select().from(users).where(eq(users.telegramLinked, true)).all();
  }

  // ==================== GOOGLE SHEETS ====================

  setGoogleSheetsConnection(userId: number, refreshToken: string, spreadsheetId: string): void {
    db.update(users).set({
      googleSheetsRefreshToken: refreshToken,
      googleSheetsSpreadsheetId: spreadsheetId,
      googleSheetsConnected: true,
    }).where(eq(users.id, userId)).run();
  }

  disconnectGoogleSheets(userId: number): void {
    db.update(users).set({
      googleSheetsRefreshToken: null,
      googleSheetsSpreadsheetId: null,
      googleSheetsConnected: false,
    }).where(eq(users.id, userId)).run();
  }

  // ==================== AI CONTEXT ====================

  getUserContextData(userId: number): any {
    const profile = this.getProfile(userId);
    const conditions = this.getConditions(userId);
    const goals = this.getGoals(userId);
    const meds = this.getMedications(userId);
    const today = new Date().toISOString().split("T")[0];
    const todayLog = this.getDailyLog(userId, today);
    const streak = this.getDailyLogStreak(userId);
    const recentCheckins = this.getCheckInsByUser(userId, 7);
    const moodTrend = recentCheckins
      .filter(c => c.mood != null)
      .map(c => ({ date: c.date, mood: c.mood }));
    return {
      profile,
      conditions: conditions.map(c => c.conditionName),
      goals: goals.map(g => g.goalType),
      medications: meds.map(m => m.medicationName),
      todayLog,
      streak,
      moodTrend,
    };
  }

  // ==================== SETTINGS / RESET ====================

  resetAllData(userId: number): void {
    // Delete check-in related data
    const userCheckIns = db.select().from(checkIns).where(eq(checkIns.userId, userId)).all();
    for (const ci of userCheckIns) {
      db.delete(foodLogs).where(eq(foodLogs.checkInId, ci.id)).run();
      db.delete(waterLogs).where(eq(waterLogs.checkInId, ci.id)).run();
    }
    db.delete(checkIns).where(eq(checkIns.userId, userId)).run();

    // Delete chat messages and weekly reviews
    db.delete(chatMessages).where(eq(chatMessages.userId, userId)).run();
    db.delete(weeklyReviews).where(eq(weeklyReviews.userId, userId)).run();

    // Delete milestones, steps, and history
    const existingMilestones = db.select().from(milestones).where(eq(milestones.userId, userId)).all();
    for (const m of existingMilestones) {
      db.delete(milestoneSteps).where(eq(milestoneSteps.milestoneId, m.id)).run();
      db.delete(milestoneHistory).where(eq(milestoneHistory.milestoneId, m.id)).run();
    }
    db.delete(milestones).where(eq(milestones.userId, userId)).run();

    // Delete calibration snapshots and notification prefs
    db.delete(calibrationSnapshots).where(eq(calibrationSnapshots.userId, userId)).run();
    db.delete(notificationPrefs).where(eq(notificationPrefs.userId, userId)).run();

    // Delete all user data
    db.delete(userGoals).where(eq(userGoals.userId, userId)).run();
    db.delete(userActivities).where(eq(userActivities.userId, userId)).run();
    db.delete(userDietaryPrefs).where(eq(userDietaryPrefs.userId, userId)).run();
    db.delete(userMedications).where(eq(userMedications.userId, userId)).run();
    db.delete(userPainAreas).where(eq(userPainAreas.userId, userId)).run();
    db.delete(userConditions).where(eq(userConditions.userId, userId)).run();
    db.delete(profiles).where(eq(profiles.userId, userId)).run();

    // Delete badges and points
    db.delete(userBadges).where(eq(userBadges.userId, userId)).run();
    db.delete(userPoints).where(eq(userPoints.userId, userId)).run();

    // Reset onboarding
    db.update(users).set({ onboardingCompleted: false, onboardingStep: 0, tourCompleted: false }).where(eq(users.id, userId)).run();
  }

  // ==================== HEALTH RECORDS ====================

  getHealthRecords(userId: number): HealthRecord[] {
    return db.select().from(healthRecords).where(eq(healthRecords.userId, userId)).orderBy(desc(healthRecords.date)).all();
  }

  getHealthRecord(id: number): HealthRecord | undefined {
    return db.select().from(healthRecords).where(eq(healthRecords.id, id)).get();
  }

  createHealthRecord(data: Omit<HealthRecord, "id" | "createdAt">): HealthRecord {
    return db.insert(healthRecords).values(data).returning().get();
  }

  updateHealthRecord(id: number, data: Partial<Omit<HealthRecord, "id" | "createdAt">>): void {
    db.update(healthRecords).set(data).where(eq(healthRecords.id, id)).run();
  }

  deleteHealthRecord(id: number): void {
    db.delete(healthParameters).where(eq(healthParameters.recordId, id)).run();
    db.delete(healthRecords).where(eq(healthRecords.id, id)).run();
  }

  // ==================== HEALTH PARAMETERS ====================

  getHealthParameters(userId: number, name?: string): HealthParameter[] {
    if (name) {
      return db.select().from(healthParameters)
        .where(and(eq(healthParameters.userId, userId), eq(healthParameters.name, name)))
        .orderBy(asc(healthParameters.date)).all();
    }
    return db.select().from(healthParameters).where(eq(healthParameters.userId, userId)).orderBy(desc(healthParameters.date)).all();
  }

  getHealthParametersByRecord(recordId: number): HealthParameter[] {
    return db.select().from(healthParameters).where(eq(healthParameters.recordId, recordId)).all();
  }

  createHealthParameter(data: Omit<HealthParameter, "id" | "createdAt">): HealthParameter {
    return db.insert(healthParameters).values(data).returning().get();
  }

  deleteHealthParametersByRecord(recordId: number): void {
    db.delete(healthParameters).where(eq(healthParameters.recordId, recordId)).run();
  }
}

export const storage = new DatabaseStorage();
