import { storage } from "./storage";
import type { Badge } from "@shared/schema";

interface AwardResult {
  newBadges: Badge[];
  pointsEarned: number;
}

type BadgeAction =
  | "daily_log"
  | "check_in"
  | "onboarding_complete"
  | "tour_complete"
  | "chat_message"
  | "milestone_complete"
  | "milestone_created"
  | "telegram_linked"
  | "sheets_connected";

export function checkAndAwardBadges(
  userId: number,
  context: { action: BadgeAction }
): AwardResult {
  const newBadges: Badge[] = [];
  let pointsEarned = 0;

  const tryAward = (slug: string): boolean => {
    if (storage.hasUserBadge(userId, slug)) return false;
    const badge = storage.getBadgeBySlug(slug);
    if (!badge) return false;
    storage.awardBadge(userId, badge.id);
    storage.addPoints(userId, badge.pointsAwarded, `badge:${slug}`, badge.id);
    newBadges.push(badge);
    pointsEarned += badge.pointsAwarded;
    return true;
  };

  switch (context.action) {
    case "daily_log": {
      // Action points
      storage.addPoints(userId, 5, "daily_log");
      pointsEarned += 5;

      // First log badge
      tryAward("first-log");

      // Streak badges
      const streak = storage.getDailyLogStreak(userId);
      if (streak >= 7) tryAward("week-warrior");
      if (streak >= 14) tryAward("fortnight-focus");
      if (streak >= 30) tryAward("monthly-master");

      // Total count badge
      const count = storage.getDailyLogCount(userId);
      if (count >= 100) tryAward("century-club");
      break;
    }

    case "check_in": {
      storage.addPoints(userId, 5, "check_in");
      pointsEarned += 5;

      tryAward("first-checkin");

      const ciStreak = storage.getCheckInStreak(userId);
      if (ciStreak >= 7) tryAward("checkin-streak-7");
      break;
    }

    case "onboarding_complete": {
      tryAward("profile-pioneer");
      break;
    }

    case "tour_complete": {
      tryAward("first-steps");
      break;
    }

    case "chat_message": {
      storage.addPoints(userId, 2, "chat_message");
      pointsEarned += 2;
      tryAward("chat-starter");
      break;
    }

    case "milestone_created": {
      tryAward("first-milestone");
      break;
    }

    case "milestone_complete": {
      storage.addPoints(userId, 3, "milestone_step");
      pointsEarned += 3;
      tryAward("milestone-complete");
      break;
    }

    case "telegram_linked": {
      tryAward("telegram-linked");
      break;
    }

    case "sheets_connected": {
      tryAward("data-exporter");
      break;
    }
  }

  return { newBadges, pointsEarned };
}
