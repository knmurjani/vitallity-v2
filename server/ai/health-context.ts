import { storage } from "../storage";
import type { HealthRecord, HealthParameter } from "@shared/schema";

// Format a date string (YYYY-MM-DD) to a short human-readable label (e.g. "Jan 2026")
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// Format a single health parameter with status flag
function formatParameter(p: HealthParameter): string {
  const status = p.status ? ` (${p.status.toUpperCase()})` : "";
  const unit = p.unit ? ` ${p.unit}` : "";
  return `${p.name}: ${p.value}${unit}${status}`;
}

// Format a health record (blood report, prescription, lab test, etc.)
function formatRecord(record: HealthRecord, params: HealthParameter[]): string {
  const dateLabel = formatDate(record.date);
  const typeLabel =
    record.type === "blood_report"
      ? "Blood Report"
      : record.type === "prescription"
      ? "Prescription"
      : record.type === "lab_test"
      ? "Lab Test"
      : record.type === "scan"
      ? "Scan"
      : record.title;

  let line = `- ${typeLabel} (${dateLabel})`;

  if (params.length > 0) {
    line += ": " + params.map(formatParameter).join(", ");
  } else if (record.notes) {
    line += ": " + record.notes;
  } else if (record.title && record.type !== "blood_report" && record.type !== "lab_test") {
    line += ": " + record.title;
  }

  return line;
}

/**
 * Build a concise health context string suitable for AI system prompts.
 * Returns an empty string if no health data is available.
 */
export function getHealthContext(userId: number): string {
  const records = storage.getHealthRecords(userId);
  const conditions = storage.getConditions(userId);
  const medications = storage.getMedications(userId);

  // If there's nothing to report, return empty
  if (records.length === 0 && conditions.length === 0 && medications.length === 0) {
    return "";
  }

  const lines: string[] = ["HEALTH RECORDS:"];

  // --- Health Records (blood reports, prescriptions, lab tests) ---
  if (records.length > 0) {
    // Take the 5 most recent records (already ordered by date desc from storage)
    const recent = records.slice(0, 5);
    for (const record of recent) {
      const params = storage.getHealthParametersByRecord(record.id);
      lines.push(formatRecord(record, params));
    }
  }

  // --- Conditions ---
  if (conditions.length > 0) {
    const condStr = conditions
      .map((c) => `${c.conditionName}${c.isChronic ? " (chronic)" : ""}`)
      .join(", ");
    lines.push(`- Conditions: ${condStr}`);
  }

  // --- Medications ---
  if (medications.length > 0) {
    const medStr = medications.map((m) => m.medicationName).join(", ");
    lines.push(`- Medications: ${medStr}`);
  }

  return lines.join("\n");
}

/**
 * Compute calibration adjustment data by comparing claimed self-assessment
 * scores against actual behavioral metrics from the last 14 days.
 */
export interface CalibrationAdjustment {
  disciplineGap: number;
  consistencyGap: number;
  sleepGap: number;
  tone: "encouraging" | "calibrating" | "celebrating";
  message: string;
  claimedDiscipline: number | null;
  actualLogFrequency: number; // percent of last-14-days with a daily log
  claimedConsistency: number | null;
  actualStreak: number;
  claimedSleepHours: number | null;
  actualAvgSleep: number | null;
}

export function computeCalibrationAdjustment(userId: number): CalibrationAdjustment {
  const profile = storage.getProfile(userId);

  // Claimed values from onboarding (1-10 scale where applicable)
  const claimedDiscipline: number | null = profile?.selfDiscipline ?? null;
  const claimedConsistency: number | null = profile?.consistencyHistory ?? null;

  // Sleep: parse from sleepStress field if present, otherwise null
  let claimedSleepHours: number | null = null;
  if (profile?.sleepStress) {
    // sleepStress may encode hours in a text like "6-7 hrs" or just a number
    const match = profile.sleepStress.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      claimedSleepHours = parseFloat(match[1]);
    }
  }

  // Actual log frequency: count daily logs in last 14 days
  const end = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const recentLogs = storage.getDailyLogs(userId, startDate, end);
  const actualLogFrequency = Math.round((recentLogs.length / 14) * 100);

  // Actual streak: current consecutive daily log streak
  const actualStreak = storage.getDailyLogStreak(userId);

  // Actual avg sleep from daily logs that have sleepHours recorded
  const logsWithSleep = recentLogs.filter((l) => l.sleepHours != null && l.sleepHours > 0);
  const actualAvgSleep =
    logsWithSleep.length > 0
      ? Math.round((logsWithSleep.reduce((s, l) => s + (l.sleepHours || 0), 0) / logsWithSleep.length) * 10) / 10
      : null;

  // Convert claimed discipline (1-10) to an "expected" log frequency (1=10%, 10=100%)
  const expectedLogFrequency = claimedDiscipline !== null ? claimedDiscipline * 10 : null;
  const disciplineGap =
    expectedLogFrequency !== null ? Math.round(expectedLogFrequency - actualLogFrequency) : 0;

  // Convert claimed consistency (1-10) to an "expected" streak (1=1day, 10=14days)
  const expectedStreak = claimedConsistency !== null ? Math.round((claimedConsistency / 10) * 14) : null;
  const consistencyGap = expectedStreak !== null ? expectedStreak - actualStreak : 0;

  // Sleep gap: claimed hours - actual avg hours
  const sleepGap =
    claimedSleepHours !== null && actualAvgSleep !== null
      ? Math.round((claimedSleepHours - actualAvgSleep) * 10) / 10
      : 0;

  // Determine tone based on discipline gap (primary indicator)
  let tone: "encouraging" | "calibrating" | "celebrating";
  let message: string;

  if (disciplineGap > 3) {
    tone = "encouraging";
    message =
      "Your estimates were optimistic about your discipline. That is okay -- building small, consistent habits matters more than hitting a number. Focus on one win at a time.";
  } else if (disciplineGap < -2) {
    tone = "celebrating";
    message =
      "You are doing better than you expected. Your actual consistency is outpacing your self-assessment. Keep the momentum and consider stretching your goals.";
  } else {
    tone = "calibrating";
    message =
      "Your self-assessment is close to reality. You have a clear picture of your habits, which makes it easier to plan and improve.";
  }

  // Override with sleep message if sleep gap is significant and discipline gap is neutral
  if (Math.abs(disciplineGap) <= 3 && Math.abs(sleepGap) > 1.5 && actualAvgSleep !== null) {
    if (sleepGap > 1.5) {
      message = `You estimated sleeping ${claimedSleepHours} hours, but your logs show an average of ${actualAvgSleep} hours. Closing this gap could help your energy and consistency scores.`;
    } else if (sleepGap < -1.5) {
      message = `You are sleeping more than you estimated (${actualAvgSleep} hrs vs ${claimedSleepHours} hrs claimed). Good sleep is a foundation -- keep it up.`;
    }
  }

  return {
    disciplineGap,
    consistencyGap,
    sleepGap,
    tone,
    message,
    claimedDiscipline,
    actualLogFrequency,
    claimedConsistency,
    actualStreak,
    claimedSleepHours,
    actualAvgSleep,
  };
}

/**
 * Build a short calibration context string for AI system prompts.
 */
export function getCalibrationContext(userId: number): string {
  const adj = computeCalibrationAdjustment(userId);

  if (adj.disciplineGap > 3) {
    return "CALIBRATION NOTE: The user tends to overestimate their discipline. Be gentle, focus on small wins, and do not suggest aggressive plans.";
  } else if (adj.disciplineGap < -2) {
    return "CALIBRATION NOTE: The user is doing better than they expected. Celebrate their progress and suggest stretching their goals.";
  } else {
    return "CALIBRATION NOTE: The user's self-assessment matches reality well. You can suggest moderate improvements.";
  }
}
