import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { signupSchema, loginSchema, googleAuthSchema, phoneOtpRequestSchema, phoneOtpVerifySchema } from "@shared/schema";
import { searchFoods } from "@shared/foods";
import { callHaiku } from "./ai/haiku";
import { callSonnet } from "./ai/sonnet";
import { callOpus } from "./ai/opus";
import { getUserContext, buildInsightSystemPrompt, buildChatSystemPrompt, buildMotivationPrompt, buildWeeklyReviewPrompt, buildHealthSummarySystemPrompt } from "./ai/prompts";
import { checkAndAwardBadges } from "./badges";
import { handleTelegramWebhook, isTelegramConfigured, sendReminders } from "./telegram";
import { isGoogleSheetsConfigured, getAuthUrl, handleOAuthCallback, syncDailyLog, fullSync } from "./google-sheets";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "vitallity-dev-secret-2026";

interface JwtPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

function signToken(user: { id: number; email?: string | null; phone?: string | null }): string {
  return jwt.sign({ userId: user.id, email: user.email || user.phone || "" }, JWT_SECRET, { expiresIn: "7d" });
}

function extractUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==================== AUTH ====================

  app.post("/api/auth/signup", (req: Request, res: Response) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
      }

      const { email, password } = parsed.data;
      const existing = storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }

      const passwordHash = bcrypt.hashSync(password, 12);
      const user = storage.createUser(email, passwordHash);
      const token = signToken({ id: user.id, email: user.email });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: parsed.error.errors[0].message });
        return;
      }

      const { email, password } = parsed.data;
      const user = storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const valid = bcrypt.compareSync(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = signToken({ id: user.id, email: user.email });
      const profile = storage.getProfile(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          name: profile?.name || null,
          tourCompleted: user.tourCompleted,
          telegramLinked: user.telegramLinked,
          googleSheetsConnected: user.googleSheetsConnected,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.get("/api/auth/me", extractUser, (req: Request, res: Response) => {
    const user = storage.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const profile = storage.getProfile(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        onboardingStep: user.onboardingStep,
        tourCompleted: user.tourCompleted,
        telegramLinked: user.telegramLinked,
        googleSheetsConnected: user.googleSheetsConnected,
      },
      profile: profile ? { name: profile.name } : null,
    });
  });

  // ==================== GOOGLE AUTH ====================

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const parsed = googleAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid credential" });
        return;
      }

      const { credential } = parsed.data;
      const googleClientId = process.env.GOOGLE_CLIENT_ID || "";

      // Verify Google ID token
      const tokenRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!tokenRes.ok) {
        res.status(401).json({ message: "Invalid Google token" });
        return;
      }

      const payload = await tokenRes.json();
      const { sub: googleId, email, name, picture } = payload;

      if (googleClientId && payload.aud !== googleClientId) {
        res.status(401).json({ message: "Token audience mismatch" });
        return;
      }

      // Find or create user
      let user = storage.findUserByGoogleId(googleId);
      if (!user && email) {
        user = storage.getUserByEmail(email);
      }
      if (!user) {
        user = storage.createGoogleUser(email || "", googleId, name || "", picture || undefined);
      }

      const token = signToken(user!);
      const profile = storage.getProfile(user!.id);

      res.json({
        token,
        user: {
          id: user!.id,
          email: user!.email,
          onboardingCompleted: user!.onboardingCompleted,
          onboardingStep: user!.onboardingStep,
          name: profile?.name,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Google auth failed" });
    }
  });

  // ==================== PHONE OTP AUTH ====================

  app.post("/api/auth/phone/send-otp", async (req: Request, res: Response) => {
    try {
      const parsed = phoneOtpRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid phone number" });
        return;
      }

      const { phone } = parsed.data;

      // Generate 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store OTP
      storage.cleanupExpiredOtps();
      storage.createPhoneOtp(phone, otp, expiresAt);

      // Send via Twilio
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (twilioSid && twilioToken && twilioPhone) {
        try {
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                To: phone,
                From: twilioPhone,
                Body: `Your Vitallity code is: ${otp}`,
              }).toString(),
            }
          );
        } catch (smsErr) {
          console.error("Twilio SMS error:", smsErr);
          // Still return success — OTP is stored, user can verify in dev mode
        }
      } else {
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
      }

      res.json({ success: true, message: "OTP sent" });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to send OTP" });
    }
  });

  app.post("/api/auth/phone/verify-otp", (req: Request, res: Response) => {
    try {
      const parsed = phoneOtpVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid phone or OTP format" });
        return;
      }

      const { phone, otp } = parsed.data;
      const latest = storage.getLatestPhoneOtp(phone);

      if (!latest) {
        res.status(401).json({ message: "No OTP found. Please request a new code." });
        return;
      }

      if (new Date(latest.expiresAt) < new Date()) {
        res.status(401).json({ message: "OTP expired. Please request a new code." });
        return;
      }

      if (latest.otp !== otp) {
        res.status(401).json({ message: "Incorrect code. Please try again." });
        return;
      }

      // Mark OTP as verified
      storage.markPhoneOtpVerified(phone);

      // Find or create user
      let user = storage.findUserByPhone(phone);
      if (!user) {
        user = storage.createPhoneUser(phone);
      }

      const token = signToken(user);
      const profile = storage.getProfile(user.id);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
          name: profile?.name,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "OTP verification failed" });
    }
  });

  // ==================== ONBOARDING ====================

  app.get("/api/onboarding/progress", extractUser, (req: Request, res: Response) => {
    const user = storage.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const data = storage.getFullOnboardingData(user.id);
    res.json({
      step: user.onboardingStep,
      completed: user.onboardingCompleted,
      data,
    });
  });

  app.post("/api/onboarding/step/:stepNumber", extractUser, (req: Request, res: Response) => {
    try {
      const stepNumber = parseInt(req.params.stepNumber as string);
      const userId = req.user!.id;
      const body = req.body;

      switch (stepNumber) {
        case 1: {
          // Basic Profile
          const bmi = body.weightKg && body.heightCm
            ? (body.weightKg / Math.pow(body.heightCm / 100, 2)).toFixed(1)
            : null;
          storage.saveProfile(userId, {
            name: body.name,
            age: body.age,
            gender: body.gender,
            heightCm: body.heightCm,
            weightKg: body.weightKg,
            bmi,
          });
          break;
        }
        case 2: {
          // Health History (merged: conditions + family history + medications)
          if (body.conditions) {
            storage.saveConditions(userId, body.conditions);
          }
          if (body.medications) {
            storage.saveMedications(userId, body.medications);
          }
          // Store family conditions and structured health data in profile
          storage.saveProfile(userId, {
            healthHistory: body.healthHistory || "",
            familyHistory: body.familyHistory || "",
          });
          break;
        }
        case 3: {
          // Pain Areas
          if (body.painAreas) {
            storage.savePainAreas(userId, body.painAreas);
          }
          break;
        }
        case 4: {
          // Exercise & Activity
          storage.saveProfile(userId, {
            activityLevel: body.occupationActivity || body.activityLevel || "",
            exerciseComfort: body.exerciseComfort || "",
            exerciseHistory: body.exerciseHistoryOption || body.exerciseHistory || "",
          });
          if (body.activities) {
            storage.saveActivities(userId, body.activities);
          }
          break;
        }
        case 5: {
          // Diet & Eating
          if (body.dietaryPrefs) {
            storage.saveDietaryPrefs(userId, body.dietaryPrefs);
          }
          storage.saveProfile(userId, {
            currentEating: body.currentEating || "",
            dietHistory: body.dietHistory || "",
          });
          break;
        }
        case 6: {
          // Sleep, Stress & Constraints
          storage.saveProfile(userId, {
            sleepStress: body.sleepStress || "",
            constraints: body.constraints || "",
          });
          break;
        }
        case 7: {
          // What Worked
          storage.saveProfile(userId, {
            pastAttemptsWorked: body.pastAttemptsWorked || "",
          });
          break;
        }
        case 8: {
          // Goals
          if (body.goals) {
            storage.saveGoals(userId, body.goals);
          }
          storage.saveProfile(userId, {
            customGoal: body.customGoal,
            targetWeightKg: body.targetWeightKg,
            weightTimeline: body.weightTimeline,
          });
          break;
        }
        case 9: {
          // Self-Assessment / Calibration
          storage.saveProfile(userId, {
            nutritionKnowledge: body.nutritionKnowledge,
            exerciseKnowledge: body.exerciseKnowledge,
            selfDiscipline: body.selfDiscipline,
            consistencyHistory: body.consistencyHistory,
            whyNow: body.whyNow,
          });
          break;
        }
        case 10: {
          // Milestones
          if (body.milestones) {
            storage.saveMilestones(userId, body.milestones);
          }
          break;
        }
        case 11: {
          // Review — no new data to save
          break;
        }
        default:
          res.status(400).json({ message: "Invalid step number" });
          return;
      }

      // Advance onboarding step
      const nextStep = Math.min(stepNumber + 1, 12);
      storage.updateOnboardingStep(userId, nextStep);

      res.json({ success: true, nextStep });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.post("/api/onboarding/complete", extractUser, (req: Request, res: Response) => {
    storage.completeOnboarding(req.user!.id);
    const badgeResult = checkAndAwardBadges(req.user!.id, { action: "onboarding_complete" });
    res.json({ success: true, ...badgeResult });
  });

  // ==================== PHASE 2: CHECK-IN ====================

  // Create or get today's check-in
  app.post("/api/checkin", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const existing = storage.getTodayCheckIn(userId);
      if (existing) {
        const foods = storage.getFoodLogs(existing.id);
        const water = storage.getWaterLogs(existing.id);
        res.json({ checkIn: existing, foods, water });
        return;
      }
      const hour = new Date().getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 21) timeOfDay = "evening";
      else if (hour >= 21) timeOfDay = "night";

      const checkIn = storage.createCheckIn(userId, { timeOfDay });
      const badgeResult = checkAndAwardBadges(userId, { action: "check_in" });
      res.status(201).json({ checkIn, foods: [], water: [], ...badgeResult });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Get today's check-in with food/water logs
  app.get("/api/checkin/today", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const checkIn = storage.getTodayCheckIn(userId);
      if (!checkIn) {
        res.json({ checkIn: null, foods: [], water: [] });
        return;
      }
      const foods = storage.getFoodLogs(checkIn.id);
      const water = storage.getWaterLogs(checkIn.id);
      res.json({ checkIn, foods, water });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Update check-in fields
  app.put("/api/checkin/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const checkIn = storage.getCheckIn(id);
      if (!checkIn || checkIn.userId !== req.user!.id) {
        res.status(404).json({ message: "Check-in not found" });
        return;
      }
      // Guard against empty updates (Drizzle .set({}) throws)
      if (req.body && Object.keys(req.body).length > 0) {
        storage.updateCheckIn(id, req.body);
      }
      const updated = storage.getCheckIn(id);
      res.json({ checkIn: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Get recent check-ins
  app.get("/api/checkins", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt((req.query.limit as string) || "5");
      const checkIns = storage.getCheckInsByUser(userId, limit);
      res.json({ checkIns });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Get food logs for check-in
  app.get("/api/checkin/:id/food", extractUser, (req: Request, res: Response) => {
    try {
      const checkInId = parseInt(req.params.id as string);
      const foods = storage.getFoodLogs(checkInId);
      res.json({ foods });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Add food log
  app.post("/api/checkin/:id/food", extractUser, (req: Request, res: Response) => {
    try {
      const checkInId = parseInt(req.params.id as string);
      const checkIn = storage.getCheckIn(checkInId);
      if (!checkIn || checkIn.userId !== req.user!.id) {
        res.status(404).json({ message: "Check-in not found" });
        return;
      }
      const food = storage.addFoodLog({
        checkInId,
        userId: req.user!.id,
        ...req.body,
      });
      res.status(201).json({ food });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Update food log
  app.put("/api/food/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      storage.updateFoodLog(id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Remove food log
  app.delete("/api/food/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      storage.removeFoodLog(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Add water log
  app.post("/api/checkin/:id/water", extractUser, (req: Request, res: Response) => {
    try {
      const checkInId = parseInt(req.params.id as string);
      const checkIn = storage.getCheckIn(checkInId);
      if (!checkIn || checkIn.userId !== req.user!.id) {
        res.status(404).json({ message: "Check-in not found" });
        return;
      }
      const water = storage.addWaterLog({
        checkInId,
        userId: req.user!.id,
        ...req.body,
      });
      res.status(201).json({ water });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Update water log
  app.put("/api/water/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      storage.updateWaterLog(id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Remove water log
  app.delete("/api/water/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      storage.removeWaterLog(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Dashboard data
  app.get("/api/dashboard", extractUser, (req: Request, res: Response) => {
    try {
      const data = storage.getDashboardData(req.user!.id);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Food search
  app.get("/api/foods/search", extractUser, (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || "";
      const results = searchFoods(q, 8);
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Finalize check-in with insights
  app.post("/api/checkin/:id/complete", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const checkIn = storage.getCheckIn(id);
      if (!checkIn || checkIn.userId !== req.user!.id) {
        res.status(404).json({ message: "Check-in not found" });
        return;
      }
      if (req.body && Object.keys(req.body).length > 0) {
        storage.updateCheckIn(id, req.body);
      }
      const updated = storage.getCheckIn(id);
      res.json({ checkIn: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== DAILY LOG ====================

  // GET /api/daily-log/:date — get log for a specific date
  app.get("/api/daily-log/:date", extractUser, (req: Request, res: Response) => {
    try {
      const date = req.params.date as string;
      const log = storage.getDailyLog(req.user!.id, date);
      res.json({ log: log || null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/daily-logs?start=YYYY-MM-DD&end=YYYY-MM-DD — get range
  app.get("/api/daily-logs", extractUser, (req: Request, res: Response) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;
      if (!start || !end) {
        res.status(400).json({ message: "start and end query params required" });
        return;
      }
      const logs = storage.getDailyLogs(req.user!.id, start, end);
      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/daily-log — upsert a daily log
  app.post("/api/daily-log", extractUser, (req: Request, res: Response) => {
    try {
      const { date, ...fields } = req.body;
      if (!date) {
        res.status(400).json({ message: "date is required" });
        return;
      }
      const log = storage.upsertDailyLog({ userId: req.user!.id, date, ...fields });
      const badgeResult = checkAndAwardBadges(req.user!.id, { action: "daily_log" });
      // Trigger Google Sheets sync in background
      syncDailyLog(req.user!.id, log).catch(err => console.error("[Sheets sync]", err));
      res.json({ log, ...badgeResult });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Settings — get full user settings/profile data
  app.get("/api/settings", extractUser, (req: Request, res: Response) => {
    try {
      const data = storage.getFullOnboardingData(req.user!.id);
      const user = storage.getUserById(req.user!.id);
      res.json({ ...data, user: { id: user!.id, email: user!.email } });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // Reset all user data
  app.post("/api/settings/reset", extractUser, (req: Request, res: Response) => {
    try {
      storage.resetAllData(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== PHASE 3: AI & CHAT ====================

  // Helper: detect illness mode from recent check-ins
  function detectIllnessMode(userId: number): { illnessMode: boolean; illnessDetails?: string } {
    const todayCheckIn = storage.getTodayCheckIn(userId);
    const recentCheckIns = storage.getCheckInsByUser(userId, 3);

    // Check pain notes for illness keywords
    const illnessKeywords = ["fever", "sick", "flu", "cold", "vomiting", "food poisoning", "infection"];
    if (todayCheckIn?.painNotes) {
      const notes = todayCheckIn.painNotes.toLowerCase();
      const found = illnessKeywords.find(k => notes.includes(k));
      if (found) {
        return { illnessMode: true, illnessDetails: `User reports: ${todayCheckIn.painNotes}` };
      }
    }

    // Check energy <= 3 AND pain >= 7 for 2+ consecutive check-ins
    if (recentCheckIns.length >= 2) {
      const consecutive = recentCheckIns.slice(0, 2).every(ci => (ci.energy || 10) <= 3 && (ci.painLevel || 0) >= 7);
      if (consecutive) {
        return { illnessMode: true, illnessDetails: "Low energy and high pain for consecutive days" };
      }
    }

    return { illnessMode: false };
  }

  // Helper: detect recovery and resume milestones
  function checkRecovery(userId: number): void {
    const recentCheckIns = storage.getCheckInsByUser(userId, 2);
    if (recentCheckIns.length >= 2) {
      const recovered = recentCheckIns.slice(0, 2).every(ci => (ci.energy || 0) >= 5 && (ci.painLevel || 10) <= 4);
      if (recovered) {
        const milestones = storage.getMilestones(userId);
        for (const m of milestones) {
          if (m.status === "paused") {
            storage.updateMilestoneStatus(m.id, "active");
          }
        }
      }
    }
  }

  // Helper: generate rule-based insights fallback
  function generateRuleBasedInsights(userId: number): { text: string; priority: string; category: string }[] {
    const ctx = getUserContext(userId);
    const ci = ctx.todayCheckIn;
    if (!ci) return [{ text: "Start your check-in to get personalized insights.", priority: "low", category: "general" }];

    const items: { text: string; priority: string; category: string }[] = [];
    const conditions = ctx.conditions.map(c => c.conditionName);
    const foods = ctx.todayFoods;
    const protein = foods.reduce((s: number, f: any) => s + (f.protein || 0) / 10, 0);
    const carbs = foods.reduce((s: number, f: any) => s + (f.carbs || 0) / 10, 0);
    const waterTotal = ci.totalWaterMl || ctx.todayWater.reduce((s: number, w: any) => s + w.amountMl * (w.quantity || 1), 0);
    const exerciseTypes: string[] = ci.exerciseTypes ? (() => { try { return JSON.parse(ci.exerciseTypes); } catch { return []; } })() : [];

    if ((ci.energy || 5) <= 3) items.push({ text: "Very low energy -- prioritize rest. Consider iron-rich foods if this persists.", priority: "high", category: "vitals" });
    if ((ci.stress || 5) >= 8) items.push({ text: "Stress is very high. Try box breathing (4-4-4-4) for 5 minutes.", priority: "high", category: "mental" });
    if ((ci.painLevel || 1) >= 7) items.push({ text: "Pain elevated. Skip intense exercise. Gentle stretching or warm compress.", priority: "high", category: "pain" });
    if ((ci.sleepQuality || 5) <= 3) items.push({ text: "Poor sleep. No caffeine after noon. Consider magnesium before bed.", priority: "medium", category: "sleep" });
    if ((ci.skinRating || 5) <= 3) items.push({ text: "Skin needs attention -- increase water, add antioxidant foods.", priority: "medium", category: "general" });
    if (waterTotal < 1000) items.push({ text: "Water intake low. Aim for 2-3L today.", priority: "medium", category: "hydration" });
    if (ci.traveling) items.push({ text: "Travel day -- pack nuts, fruits, water bottle.", priority: "low", category: "general" });
    if (conditions.includes("Type 2 Diabetes") && carbs > 160) items.push({ text: "Carbs high for diabetes -- consider swapping rice for dal-roti.", priority: "high", category: "condition" });
    if (conditions.includes("Fibromyalgia") && (ci.painLevel || 0) >= 5) items.push({ text: "Fibro flare -- be gentle. Rest is productive.", priority: "medium", category: "condition" });
    if (conditions.includes("IBS") && (ci.stress || 0) >= 7) items.push({ text: "High stress + IBS -- stick to simple, low-FODMAP foods.", priority: "medium", category: "condition" });
    if (conditions.includes("Chronic Migraine") && (ci.sleepQuality || 5) <= 4) items.push({ text: "Poor sleep triggers migraines. Prioritize rest tonight.", priority: "high", category: "condition" });
    if (conditions.includes("Compressed Nerve") && exerciseTypes.some(e => ["Gym (self)", "Strength (self)"].includes(e))) {
      items.push({ text: "With your nerve condition, avoid heavy lifting. Focus on core stability exercises.", priority: "medium", category: "condition" });
    }
    if (protein < 30 && foods.length > 0) items.push({ text: "Protein low. Add eggs, paneer, dal, or a protein shake.", priority: "medium", category: "nutrition" });
    if (items.length === 0) items.push({ text: "You're tracking well today. Keep listening to your body.", priority: "low", category: "general" });

    return items;
  }

  // POST /api/ai/insights
  app.post("/api/ai/insights", extractUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const ctx = getUserContext(userId);

      let insights: { text: string; priority: string; category: string }[];
      let motivation: string;
      let source: "ai" | "rules" = "ai";

      try {
        // AI insights
        const systemPrompt = buildInsightSystemPrompt(ctx);
        const aiResponse = await callSonnet(systemPrompt, [{ role: "user", content: "Generate insights for today's check-in." }]);

        // Parse JSON response — strip markdown code fences if present
        try {
          let cleaned = aiResponse.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
          }
          insights = JSON.parse(cleaned);
          if (!Array.isArray(insights)) {
            insights = [{ text: aiResponse, priority: "medium", category: "general" }];
          }
        } catch {
          insights = [{ text: aiResponse, priority: "medium", category: "general" }];
        }

        // AI motivation
        const ci = ctx.todayCheckIn;
        const motPrompt = buildMotivationPrompt(ci?.energy || 5, ci?.mood || 5, ci?.stress || 5, ci?.painLevel || 1);
        try {
          motivation = await callHaiku("You generate short motivational quotes for a wellness app. No emoji.", motPrompt);
        } catch {
          motivation = "Every healthy choice today is an investment in tomorrow's you.";
        }
      } catch (err) {
        console.error("[AI insights fallback]", err);
        insights = generateRuleBasedInsights(userId);
        source = "rules";
        motivation = "Every healthy choice today is an investment in tomorrow's you.";
      }

      // Check illness mode and handle milestones
      const { illnessMode } = detectIllnessMode(userId);
      if (illnessMode) {
        const milestones = storage.getMilestones(userId);
        for (const m of milestones) {
          if (m.status === "active" || m.status === "planned") {
            storage.updateMilestoneStatus(m.id, "paused");
          }
        }
      } else {
        checkRecovery(userId);
      }

      res.json({ insights, motivation, source });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/ai/health-summary
  app.post("/api/ai/health-summary", extractUser, async (req: Request, res: Response) => {
    try {
      const onboardingData = req.body;
      const systemPrompt = buildHealthSummarySystemPrompt();
      const userMessage = `Please analyze this health intake data and provide a structured health summary:\n${JSON.stringify(onboardingData, null, 2)}`;

      const aiResponse = await callSonnet(systemPrompt, [{ role: "user", content: userMessage }]);

      let summary: {
        profileSnapshot: string;
        observations: string[];
        healthConsiderations: string[];
        strengths: string[];
        focusAreas: string[];
        recommendedApproach: string;
        clarifyingQuestions: string[];
      };

      try {
        let cleaned = aiResponse.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        }
        summary = JSON.parse(cleaned);
      } catch {
        summary = {
          profileSnapshot: aiResponse,
          observations: [],
          healthConsiderations: [],
          strengths: [],
          focusAreas: [],
          recommendedApproach: "",
          clarifyingQuestions: [],
        };
      }

      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/chat/message
  app.post("/api/chat/message", extractUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { message, entryPoint, entryContext } = req.body;
      const today = new Date().toISOString().split("T")[0];

      const ctx = getUserContext(userId);
      const { illnessMode, illnessDetails } = detectIllnessMode(userId);
      const travelMode = ctx.todayCheckIn?.traveling || false;

      // Get today's chat history
      const history = storage.getChatMessages(userId, today);
      const chatHistory = history.map(m => ({ role: m.role, content: m.content }));

      // Add new user message
      chatHistory.push({ role: "user", content: message });

      // Build system prompt
      const systemPrompt = buildChatSystemPrompt(ctx, travelMode, illnessMode, illnessDetails);

      // Call Sonnet
      const aiResponse = await callSonnet(systemPrompt, chatHistory);

      // Parse for food log blocks
      let foodLogItems: any[] | undefined;
      const foodMatch = aiResponse.match(/\[FOOD_LOG\]([\s\S]*?)\[\/FOOD_LOG\]/);
      if (foodMatch) {
        try {
          foodLogItems = JSON.parse(foodMatch[1].trim());
        } catch {}
      }

      // Clean response (remove food log block from display text)
      const displayResponse = aiResponse.replace(/\[FOOD_LOG\][\s\S]*?\[\/FOOD_LOG\]/, "").trim();

      // Save messages
      const metadata = entryPoint ? JSON.stringify({ entryPoint, entryContext }) : undefined;
      storage.addChatMessage(userId, today, "user", message, metadata);
      storage.addChatMessage(userId, today, "assistant", displayResponse, foodLogItems ? JSON.stringify({ foodLogItems }) : undefined);

      const badgeResult = checkAndAwardBadges(userId, { action: "chat_message" });
      res.json({ response: displayResponse, foodLogItems, metadata: metadata ? JSON.parse(metadata) : undefined, ...badgeResult });
    } catch (err: any) {
      console.error("[Chat error]", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/chat/messages
  app.get("/api/chat/messages", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const messages = storage.getChatMessages(userId, date);
      res.json({ messages });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/chat/food/confirm
  app.post("/api/chat/food/confirm", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { items } = req.body;

      // Get or create today's check-in
      let checkIn = storage.getTodayCheckIn(userId);
      if (!checkIn) {
        const hour = new Date().getHours();
        let timeOfDay = "morning";
        if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
        else if (hour >= 17 && hour < 21) timeOfDay = "evening";
        else if (hour >= 21) timeOfDay = "night";
        checkIn = storage.createCheckIn(userId, { timeOfDay });
      }

      for (const item of items) {
        storage.addFoodLog({
          checkInId: checkIn.id,
          userId,
          foodName: item.name,
          mealType: item.meal || "snack",
          quantity: String(item.qty || 1),
          unit: item.unit || "serving",
          source: item.source || "Homemade",
          calories: item.calories || 0,
          protein: Math.round((item.protein || 0) * 10),
          carbs: Math.round((item.carbs || 0) * 10),
          fat: Math.round((item.fat || 0) * 10),
        });
      }

      // Recalculate totals
      const allFoods = storage.getFoodLogs(checkIn.id);
      const totalCalories = allFoods.reduce((s, f) => s + (f.calories || 0), 0);
      const totalProtein = allFoods.reduce((s, f) => s + Math.round((f.protein || 0) / 10), 0);
      const totalCarbs = allFoods.reduce((s, f) => s + Math.round((f.carbs || 0) / 10), 0);
      const totalFat = allFoods.reduce((s, f) => s + Math.round((f.fat || 0) / 10), 0);
      storage.updateCheckIn(checkIn.id, { totalCalories, totalProtein, totalCarbs, totalFat });

      res.json({ success: true, updatedTotals: { totalCalories, totalProtein, totalCarbs, totalFat } });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/ai/weekly-review
  app.post("/api/ai/weekly-review", extractUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const ctx = getUserContext(userId);

      // Get 7 days of check-in data
      const end = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const checkIns = storage.getCheckInsForDateRange(userId, start, end);

      if (checkIns.length === 0) {
        res.status(400).json({ message: "No check-ins found for the past week" });
        return;
      }

      const weeklyData = checkIns.map(ci => ({
        checkIn: ci,
        foods: storage.getFoodLogsForCheckIn(ci.id),
        water: storage.getWaterLogsForCheckIn(ci.id),
      }));

      const systemPrompt = buildWeeklyReviewPrompt(ctx, weeklyData);
      const aiResponse = await callOpus(systemPrompt, "Generate the weekly review now.");

      let reviewData: any;
      try {
        let cleanedReview = aiResponse.trim();
        if (cleanedReview.startsWith("```")) {
          cleanedReview = cleanedReview.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        }
        reviewData = JSON.parse(cleanedReview);
      } catch {
        reviewData = {
          summary: aiResponse,
          wins: [],
          improvements: [],
          milestoneSuggestion: null,
          nextWeekFocus: "Continue tracking consistently",
          calibrationUpdate: null,
        };
      }

      const review = storage.saveWeeklyReview(userId, start, end, JSON.stringify(reviewData));
      res.json({ review: { ...review, data: reviewData } });
    } catch (err: any) {
      console.error("[Weekly review error]", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/ai/weekly-review/latest
  app.get("/api/ai/weekly-review/latest", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const review = storage.getLatestWeeklyReview(userId);
      if (!review) {
        res.json({ review: null });
        return;
      }
      let data: any = null;
      try { data = JSON.parse(review.summaryJson); } catch {}
      res.json({ review: { ...review, data } });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== PHASE 4: MILESTONES, CALIBRATION, PROFILE ====================

  // GET /api/milestones/:id
  app.get("/api/milestones/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestone = storage.getMilestoneById(id);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      res.json({ milestone });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // PUT /api/milestones/:id
  app.put("/api/milestones/:id", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestone = storage.getMilestoneById(id);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      storage.updateMilestone(id, req.body);
      const updated = storage.getMilestoneById(id);
      res.json({ milestone: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/milestones/:id/adjust
  app.post("/api/milestones/:id/adjust", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestone = storage.getMilestoneById(id);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      const { newTarget, newTimeframe, reasonCategory, reasonText, newSteps } = req.body;

      storage.addMilestoneHistoryEntry(id, req.user!.id, "adjusted", {
        oldTarget: milestone.target,
        newTarget: newTarget || milestone.target,
        oldTimeframe: milestone.timeframe,
        newTimeframe: newTimeframe || milestone.timeframe,
        reasonCategory,
        reasonText,
      });

      const currentMoved = milestone.movedCount || 0;
      storage.updateMilestone(id, {
        target: newTarget || milestone.target,
        timeframe: newTimeframe || milestone.timeframe,
        movedCount: currentMoved + 1,
      });

      if (newSteps && Array.isArray(newSteps)) {
        const existingSteps = milestone.steps;
        for (const s of existingSteps) {
          storage.deleteMilestoneStep(s.id);
        }
        for (const s of newSteps) {
          storage.addMilestoneStep(id, s.weekNumber, s.description);
        }
      }

      const moved = currentMoved + 1;
      let normMessage = "Adjustment saved.";
      if (moved === 1) normMessage = "First adjustment -- totally normal. Plans change.";
      else if (moved === 2) normMessage = "Second adjustment. Real progress isn't a straight line.";
      else if (moved >= 3) normMessage = `${moved} adjustments -- that's not failure, that's adaptation. Keep going.`;

      const updated = storage.getMilestoneById(id);
      res.json({ milestone: updated, normalizationMessage: normMessage });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/milestones/:id/complete
  app.post("/api/milestones/:id/complete", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestone = storage.getMilestoneById(id);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      storage.completeMilestone(id, req.user!.id);
      const updated = storage.getMilestoneById(id);
      res.json({ milestone: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/milestones/:id/step/:stepId
  app.post("/api/milestones/:id/step/:stepId", extractUser, (req: Request, res: Response) => {
    try {
      const milestoneId = parseInt(req.params.id as string);
      const stepId = parseInt(req.params.stepId as string);
      const milestone = storage.getMilestoneById(milestoneId);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      const { status } = req.body;
      storage.updateMilestoneStep(stepId, status);
      if (status === "done" || status === "skipped") {
        storage.addMilestoneHistoryEntry(milestoneId, req.user!.id, status === "done" ? "step_done" : "step_skipped", {
          stepId,
          reasonText: req.body.reason,
        });
      }
      const updated = storage.getMilestoneById(milestoneId);
      res.json({ milestone: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/milestones/:id/discuss
  app.post("/api/milestones/:id/discuss", extractUser, (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const milestone = storage.getMilestoneById(id);
      if (!milestone || milestone.userId !== req.user!.id) {
        res.status(404).json({ message: "Milestone not found" });
        return;
      }
      const today = new Date().toISOString().split("T")[0];
      const contextMsg = `I want to discuss my milestone: "${milestone.title}" (target: ${milestone.target}, timeframe: ${milestone.timeframe}, status: ${milestone.status}, adjusted ${milestone.movedCount || 0} times). Steps completed: ${milestone.steps.filter(s => s.status === "done").length}/${milestone.steps.length}.`;
      storage.addChatMessage(req.user!.id, today, "user", contextMsg, JSON.stringify({ entryPoint: "milestone", milestoneId: id }));
      res.json({ message: contextMsg });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/calibration
  app.get("/api/calibration", extractUser, (req: Request, res: Response) => {
    try {
      const snapshot = storage.getLatestCalibration(req.user!.id);
      if (!snapshot) {
        res.json({ snapshot: null, gaps: [] });
        return;
      }
      let gaps: any[] = [];
      try { gaps = JSON.parse(snapshot.gapsJson || "[]"); } catch {}
      res.json({ snapshot, gaps });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/calibration/compute
  app.post("/api/calibration/compute", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const profile = storage.getProfile(userId);
      const end = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const recentCheckIns = storage.getCheckInsForDateRange(userId, startDate, end);

      const total = recentCheckIns.length;
      if (total === 0) {
        res.json({ snapshot: null, gaps: [], message: "Not enough data yet" });
        return;
      }

      const withFood = recentCheckIns.filter(ci => (ci.totalCalories || 0) > 0).length;
      const withExercise = recentCheckIns.filter(ci => (ci.exerciseDuration || 0) > 0).length;
      const foodLoggingPct = Math.round((withFood / total) * 100);
      const exerciseAdherencePct = Math.round((withExercise / total) * 100);

      const user = storage.getUserById(userId);
      const daysSinceOnboarding = user?.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))) : 14;
      const checkinConsistencyPct = Math.min(100, Math.round((total / Math.min(14, daysSinceOnboarding)) * 100));

      // Calorie accuracy
      let calTarget = 2000;
      if (profile) {
        const { weightKg, heightCm, age, gender, activityLevel } = profile;
        if (weightKg && heightCm && age) {
          let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
          bmr += (gender === "Male" || gender === "male") ? 5 : -161;
          const mult = activityLevel === "Sedentary" ? 1.2 : activityLevel === "Lightly Active" ? 1.375 : 1.55;
          calTarget = Math.round(bmr * mult - 500);
        }
      }
      const withFoodCIs = recentCheckIns.filter(ci => (ci.totalCalories || 0) > 0);
      const withinTarget = withFoodCIs.filter(ci => Math.abs((ci.totalCalories || 0) - calTarget) <= 200).length;
      const calorieAccuracyPct = withFoodCIs.length > 0 ? Math.round((withinTarget / withFoodCIs.length) * 100) : 0;

      // Gap detection
      const gaps: { type: string; message: string; statedScore: number; actualMetric: number }[] = [];
      const nk = profile?.nutritionKnowledge || 0;
      const ek = profile?.exerciseKnowledge || 0;
      const sd = profile?.selfDiscipline || 0;
      const ch = profile?.consistencyHistory || 0;

      if (nk >= 8 && foodLoggingPct < 50) {
        gaps.push({ type: "nutrition_gap", message: "You rated your nutrition knowledge highly, but food logging has been inconsistent. No judgement -- let's find what's blocking you.", statedScore: nk, actualMetric: foodLoggingPct });
      }
      if (ek >= 8 && exerciseAdherencePct < 40) {
        gaps.push({ type: "exercise_gap", message: "Your exercise knowledge is strong, but activity tracking shows a gap. Let's look at what's realistic right now.", statedScore: ek, actualMetric: exerciseAdherencePct });
      }
      if (sd >= 8 && ((foodLoggingPct + exerciseAdherencePct + checkinConsistencyPct) / 3) < 50) {
        gaps.push({ type: "discipline_gap", message: "Self-discipline is about systems, not willpower. Let's build routines that work with your life.", statedScore: sd, actualMetric: Math.round((foodLoggingPct + exerciseAdherencePct + checkinConsistencyPct) / 3) });
      }
      if (ch >= 8 && checkinConsistencyPct < 60) {
        gaps.push({ type: "consistency_gap", message: "Consistency is a skill that grows over time. Your check-in streak can be rebuilt.", statedScore: ch, actualMetric: checkinConsistencyPct });
      }

      const snapshot = storage.saveCalibrationSnapshot(userId, {
        foodLoggingPct,
        exerciseAdherencePct,
        checkinConsistencyPct,
        calorieAccuracyPct,
        gapsJson: JSON.stringify(gaps),
      });

      res.json({ snapshot, gaps });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // PUT /api/profile
  app.put("/api/profile", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const updates = { ...req.body };

      if (updates.weightKg && updates.heightCm) {
        updates.bmi = (updates.weightKg / Math.pow(updates.heightCm / 100, 2)).toFixed(1);
      } else if (updates.weightKg || updates.heightCm) {
        const profile = storage.getProfile(userId);
        const w = updates.weightKg || profile?.weightKg;
        const h = updates.heightCm || profile?.heightCm;
        if (w && h) updates.bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
      }

      storage.updateProfile(userId, updates);
      const profile = storage.getProfile(userId);
      res.json({ profile });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/profile/conditions
  app.post("/api/profile/conditions", extractUser, (req: Request, res: Response) => {
    try {
      const { name, isChronic } = req.body;
      const condition = storage.addCondition(req.user!.id, name, isChronic !== false);
      res.status(201).json({ condition });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // DELETE /api/profile/conditions/:id
  app.delete("/api/profile/conditions/:id", extractUser, (req: Request, res: Response) => {
    try {
      storage.removeCondition(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/profile/medications
  app.post("/api/profile/medications", extractUser, (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const medication = storage.addMedication(req.user!.id, name);
      res.status(201).json({ medication });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // DELETE /api/profile/medications/:id
  app.delete("/api/profile/medications/:id", extractUser, (req: Request, res: Response) => {
    try {
      storage.removeMedication(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/profile/goals
  app.post("/api/profile/goals", extractUser, (req: Request, res: Response) => {
    try {
      const { goalType, customDescription, targetValue, targetTimeline } = req.body;
      const goal = storage.addGoal(req.user!.id, goalType, customDescription, targetValue, targetTimeline);
      res.status(201).json({ goal });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // DELETE /api/profile/goals/:id
  app.delete("/api/profile/goals/:id", extractUser, (req: Request, res: Response) => {
    try {
      storage.removeGoal(parseInt(req.params.id as string));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/notifications/prefs
  app.get("/api/notifications/prefs", extractUser, (req: Request, res: Response) => {
    try {
      const prefs = storage.getNotificationPrefs(req.user!.id);
      res.json({ prefs: prefs || null });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // PUT /api/notifications/prefs
  app.put("/api/notifications/prefs", extractUser, (req: Request, res: Response) => {
    try {
      const prefs = storage.saveNotificationPrefs(req.user!.id, req.body);
      res.json({ prefs });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/export/json
  app.get("/api/export/json", extractUser, (req: Request, res: Response) => {
    try {
      const data = storage.getFullExportData(req.user!.id);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=vitallity-export.json");
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== BADGES & POINTS ====================

  // GET /api/badges — all badges with user's earned status
  app.get("/api/badges", extractUser, (req: Request, res: Response) => {
    try {
      const allBadges = storage.getAllBadges();
      const userBadges = storage.getUserBadges(req.user!.id);
      const earnedSlugs = new Set(userBadges.map(ub => ub.badge.slug));
      const badges = allBadges.map(b => ({
        ...b,
        earned: earnedSlugs.has(b.slug),
        earnedAt: userBadges.find(ub => ub.badge.slug === b.slug)?.earnedAt || null,
      }));
      res.json({ badges });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/badges/my — user's earned badges + total points + streak info
  app.get("/api/badges/my", extractUser, (req: Request, res: Response) => {
    try {
      const userBadges = storage.getUserBadges(req.user!.id);
      const totalPoints = storage.getTotalPoints(req.user!.id);
      const streak = storage.getDailyLogStreak(req.user!.id);

      // Check if streak was recently broken (yesterday has no log, but 2 days ago did)
      let streakBroken = false;
      let canUseShield = false;
      if (streak === 0) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const today = new Date();
        const logs = storage.getDailyLogs(req.user!.id, twoDaysAgo.toISOString().split("T")[0], today.toISOString().split("T")[0]);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];
        const hadYesterday = logs.some((l: any) => l.date === yesterdayStr);
        const hadTwoDaysAgo = logs.some((l: any) => l.date === twoDaysAgoStr);
        if (!hadYesterday && hadTwoDaysAgo && totalPoints >= 50) {
          streakBroken = true;
          canUseShield = true;
        }
      }

      res.json({
        badges: userBadges.map(ub => ({ ...ub.badge, earnedAt: ub.earnedAt })),
        totalPoints,
        streak,
        streakBroken,
        canUseShield,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/points — user's point history
  app.get("/api/points", extractUser, (req: Request, res: Response) => {
    try {
      const history = storage.getPointHistory(req.user!.id);
      res.json({ history });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/points/total — user's total points
  app.get("/api/points/total", extractUser, (req: Request, res: Response) => {
    try {
      const total = storage.getTotalPoints(req.user!.id);
      res.json({ total });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== TOUR ====================

  // POST /api/user/tour-complete
  app.post("/api/user/tour-complete", extractUser, (req: Request, res: Response) => {
    try {
      storage.completeTour(req.user!.id);
      const badgeResult = checkAndAwardBadges(req.user!.id, { action: "tour_complete" });
      res.json({ success: true, ...badgeResult });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== CHAT THREADS ====================

  // GET /api/chat/threads — list all chat threads for user
  app.get("/api/chat/threads", extractUser, (req: Request, res: Response) => {
    try {
      const threads = storage.getChatThreads(req.user!.id);
      res.json({ threads });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== TELEGRAM ====================

  // POST /api/telegram/generate-link — generate link token for Telegram
  app.post("/api/telegram/generate-link", extractUser, (req: Request, res: Response) => {
    try {
      if (!isTelegramConfigured()) {
        res.status(400).json({ message: "Telegram not configured" });
        return;
      }
      const token = "VIT-" + crypto.randomBytes(6).toString("hex").toUpperCase();
      storage.setTelegramLinkToken(req.user!.id, token);
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || "VitallityBot";
      res.json({
        token,
        deepLink: `https://t.me/${botUsername}?start=${token}`,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/telegram/webhook — receives Telegram updates
  app.post("/api/telegram/webhook", async (req: Request, res: Response) => {
    try {
      await handleTelegramWebhook(req.body);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[Telegram webhook error]", err);
      res.json({ ok: true }); // Always return 200 to Telegram
    }
  });

  // GET /api/telegram/status — check connection status
  app.get("/api/telegram/status", extractUser, (req: Request, res: Response) => {
    try {
      const user = storage.getUserById(req.user!.id);
      res.json({
        configured: isTelegramConfigured(),
        linked: user?.telegramLinked || false,
        chatId: user?.telegramChatId || null,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/telegram/unlink — unlink Telegram
  app.post("/api/telegram/unlink", extractUser, (req: Request, res: Response) => {
    try {
      storage.unlinkTelegram(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/telegram/send-reminders — trigger reminders (for cron/external)
  app.post("/api/telegram/send-reminders", async (_req: Request, res: Response) => {
    try {
      const sent = await sendReminders();
      res.json({ sent });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== GOOGLE SHEETS ====================

  // GET /api/google-sheets/auth-url — returns OAuth URL
  app.get("/api/google-sheets/auth-url", extractUser, (req: Request, res: Response) => {
    try {
      if (!isGoogleSheetsConfigured()) {
        res.status(400).json({ message: "Google Sheets not configured" });
        return;
      }
      const state = jwt.sign({ userId: req.user!.id }, JWT_SECRET, { expiresIn: "10m" });
      const url = getAuthUrl(state);
      res.json({ url });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // GET /api/google-sheets/callback — OAuth callback
  app.get("/api/google-sheets/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        res.status(400).send("Missing code or state");
        return;
      }
      const decoded = jwt.verify(state as string, JWT_SECRET) as JwtPayload;
      const spreadsheetId = await handleOAuthCallback(code as string, decoded.userId);
      checkAndAwardBadges(decoded.userId, { action: "sheets_connected" });
      // Redirect back to settings with success
      res.send(`<html><body><script>window.opener && window.opener.postMessage({type:'sheets-connected',spreadsheetId:'${spreadsheetId}'},'*');window.close();</script><p>Connected! You can close this window.</p></body></html>`);
    } catch (err: any) {
      console.error("[Sheets callback error]", err);
      res.status(500).send("Connection failed. Please try again.");
    }
  });

  // GET /api/google-sheets/status — connection status
  app.get("/api/google-sheets/status", extractUser, (req: Request, res: Response) => {
    try {
      const user = storage.getUserById(req.user!.id);
      res.json({
        configured: isGoogleSheetsConfigured(),
        connected: user?.googleSheetsConnected || false,
        spreadsheetId: user?.googleSheetsSpreadsheetId || null,
        spreadsheetUrl: user?.googleSheetsSpreadsheetId
          ? `https://docs.google.com/spreadsheets/d/${user.googleSheetsSpreadsheetId}`
          : null,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/google-sheets/sync — manual full sync
  app.post("/api/google-sheets/sync", extractUser, async (req: Request, res: Response) => {
    try {
      await fullSync(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // POST /api/google-sheets/disconnect — remove connection
  app.post("/api/google-sheets/disconnect", extractUser, (req: Request, res: Response) => {
    try {
      storage.disconnectGoogleSheets(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== HEALTH RECORDS ====================

  app.get("/api/health-records", extractUser, (req: Request, res: Response) => {
    try {
      const records = storage.getHealthRecords(req.user!.id);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.get("/api/health-records/:id", extractUser, (req: Request, res: Response) => {
    try {
      const record = storage.getHealthRecord(parseInt(req.params.id as string));
      if (!record || record.userId !== req.user!.id) {
        res.status(404).json({ message: "Record not found" });
        return;
      }
      const parameters = storage.getHealthParametersByRecord(record.id);
      res.json({ ...record, parametersList: parameters });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.post("/api/health-records", extractUser, (req: Request, res: Response) => {
    try {
      const { parameters: paramsList, ...recordData } = req.body;
      const record = storage.createHealthRecord({ ...recordData, userId: req.user!.id });

      if (paramsList && Array.isArray(paramsList)) {
        for (const param of paramsList) {
          storage.createHealthParameter({
            userId: req.user!.id,
            recordId: record.id,
            name: param.name,
            value: param.value,
            unit: param.unit || null,
            normalRange: param.normalRange || null,
            status: param.status || null,
            date: recordData.date,
          });
        }
      }

      const savedParams = storage.getHealthParametersByRecord(record.id);
      res.json({ ...record, parametersList: savedParams });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.put("/api/health-records/:id", extractUser, (req: Request, res: Response) => {
    try {
      const record = storage.getHealthRecord(parseInt(req.params.id as string));
      if (!record || record.userId !== req.user!.id) {
        res.status(404).json({ message: "Record not found" });
        return;
      }
      const { parameters: paramsList, parametersList: _ignore, ...updateData } = req.body;
      storage.updateHealthRecord(record.id, updateData);

      if (paramsList && Array.isArray(paramsList)) {
        storage.deleteHealthParametersByRecord(record.id);
        for (const param of paramsList) {
          storage.createHealthParameter({
            userId: req.user!.id,
            recordId: record.id,
            name: param.name,
            value: param.value,
            unit: param.unit || null,
            normalRange: param.normalRange || null,
            status: param.status || null,
            date: updateData.date || record.date,
          });
        }
      }

      const updated = storage.getHealthRecord(record.id);
      const savedParams = storage.getHealthParametersByRecord(record.id);
      res.json({ ...updated, parametersList: savedParams });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.delete("/api/health-records/:id", extractUser, (req: Request, res: Response) => {
    try {
      const record = storage.getHealthRecord(parseInt(req.params.id as string));
      if (!record || record.userId !== req.user!.id) {
        res.status(404).json({ message: "Record not found" });
        return;
      }
      storage.deleteHealthRecord(record.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  app.get("/api/health-parameters/trends", extractUser, (req: Request, res: Response) => {
    try {
      const name = req.query.name as string;
      if (!name) {
        res.status(400).json({ message: "Parameter name required" });
        return;
      }
      const params = storage.getHealthParameters(req.user!.id, name);
      res.json(params);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  // ==================== MORNING BRIEFING ====================

  app.get("/api/morning-briefing", extractUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const profile = storage.getProfile(userId);
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const yesterdayLog = storage.getDailyLog(userId, yesterday);
      const todayLog = storage.getDailyLog(userId, today);

      if (!yesterdayLog && !todayLog) {
        res.json({ briefing: null, cached: false });
        return;
      }

      const name = profile?.name || "there";
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

      const dataContext = JSON.stringify({
        yesterday: yesterdayLog || null,
        today: todayLog || null,
        profile: profile ? { name: profile.name, age: profile.age, targetWeightKg: profile.targetWeightKg } : null,
      });

      const systemPrompt = `You are a warm, concise wellness coach. Generate a morning briefing card.
Return ONLY valid JSON with this exact structure:
{
  "greeting": "${greeting}, ${name}",
  "insights": ["insight 1 based on data", "insight 2", "insight 3"],
  "focus": "Today's focus suggestion"
}
Keep each insight under 50 characters. Focus should be under 40 characters. Be encouraging but honest about areas to improve. Do not use emoji.`;

      const response = await callHaiku(systemPrompt, `User's recent data: ${dataContext}`);
      const briefing = JSON.parse(response);
      res.json({ briefing, cached: false });
    } catch (err: any) {
      console.error("[Morning briefing error]", err);
      res.json({
        briefing: {
          greeting: "Good Morning",
          insights: ["Start your day with a glass of water", "Log your meals to track progress", "Take a short walk today"],
          focus: "Hydration and gentle movement",
        },
        cached: false,
      });
    }
  });

  // ==================== MEAL PHOTO ANALYSIS ====================

  app.post("/api/meal-photo/analyze", extractUser, async (req: Request, res: Response) => {
    try {
      const { imageData } = req.body;
      if (!imageData) {
        res.status(400).json({ message: "Image data required" });
        return;
      }

      const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      const mediaType = imageData.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

      const client = (await import("./ai/client")).getClient();
      const response = await client.messages.create({
        model: "claude_haiku_4_5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: "Estimate the calories, protein (g), carbs (g), and fat (g) in this meal. Return ONLY valid JSON: {\"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number, \"description\": \"brief description of food\"}. Be realistic with portions shown.",
            },
          ],
        }],
      });

      const block = response.content[0];
      const text = block.type === "text" ? block.text : "{}";
      const nutrition = JSON.parse(text);
      res.json(nutrition);
    } catch (err: any) {
      console.error("[Meal photo analysis error]", err);
      res.status(500).json({ message: "Could not analyze meal photo" });
    }
  });

  // POST /api/streak-shield — use 50 points to restore broken streak
  app.post("/api/streak-shield", extractUser, (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const totalPoints = storage.getTotalPoints(userId);
      if (totalPoints < 50) {
        return res.status(400).json({ message: "Not enough points" });
      }
      // Create a log entry for yesterday to restore the streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      storage.upsertDailyLog({ userId, date: yesterdayStr });
      // Deduct 50 points
      storage.addPoints(userId, -50, "Streak Shield used");
      const newStreak = storage.getDailyLogStreak(userId);
      res.json({ success: true, streak: newStreak, pointsDeducted: 50 });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  });

  return httpServer;
}
