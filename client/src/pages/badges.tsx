import { useState, useEffect, useCallback } from "react";
import { useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  ArrowLeft, Trophy, Flame, Star, Heart, Target, Zap, Crown, Shield,
  Lock, Gift, Sparkles, TrendingUp, ShieldCheck,
} from "lucide-react";

const LEVELS = [
  { name: "Beginner", minPoints: 0, color: "#9CA3AF" },
  { name: "Explorer", minPoints: 200, color: "#60A5FA" },
  { name: "Committed", minPoints: 500, color: "#34D399" },
  { name: "Warrior", minPoints: 1000, color: "#F59E0B" },
  { name: "Master", minPoints: 2500, color: "#8B5CF6" },
  { name: "Legend", minPoints: 5000, color: "#EF4444" },
];

function getLevel(points: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) level = l;
  }
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  const progress = next
    ? ((points - level.minPoints) / (next.minPoints - level.minPoints)) * 100
    : 100;
  return { ...level, progress: Math.min(100, progress), next };
}

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const TIER_GLOW: Record<string, string> = {
  bronze: "0 0 12px rgba(205,127,50,0.3)",
  silver: "0 0 12px rgba(192,192,192,0.3)",
  gold: "0 0 16px rgba(255,215,0,0.35)",
  platinum: "0 0 20px rgba(229,228,226,0.4)",
};

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  heart: Heart,
  target: Target,
  zap: Zap,
  crown: Crown,
  shield: Shield,
};

interface BadgeItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  iconType: string;
  category: string;
  pointsAwarded: number;
  tier: string;
  earned: boolean;
  earnedAt: string | null;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showStreakShield, setShowStreakShield] = useState(false);
  const [shieldLoading, setShieldLoading] = useState(false);
  const [, setLocation] = useLocation();
  const authFetch = useAuthFetch();

  const load = useCallback(async () => {
    try {
      const [badgesRes, myRes] = await Promise.all([
        authFetch("GET", "/api/badges"),
        authFetch("GET", "/api/badges/my"),
      ]);
      const badgesData = await badgesRes.json();
      const myData = await myRes.json();
      setBadges(badgesData.badges || []);
      setTotalPoints(myData.totalPoints || 0);
      setStreak(myData.streak || 0);
      if (myData.streakBroken && myData.canUseShield) {
        setShowStreakShield(true);
      }
    } catch {}
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  const useStreakShield = async () => {
    setShieldLoading(true);
    try {
      const res = await authFetch("POST", "/api/streak-shield");
      if (res.ok) {
        setShowStreakShield(false);
        load();
      }
    } catch {} finally {
      setShieldLoading(false);
    }
  };

  const earned = badges.filter(b => b.earned);
  const unearned = badges.filter(b => !b.earned);
  const level = getLevel(totalPoints);

  return (
    <div className="min-h-screen bg-background" data-testid="badges-page">
      {/* Premium gradient hero */}
      <div
        className="px-5 pt-6 pb-8"
        style={{
          background: "linear-gradient(to bottom, hsl(152 37% 16%), hsl(152 32% 24%), hsl(var(--background)))",
          borderRadius: "0 0 28px 28px",
        }}
      >
        <div className="max-w-[560px] mx-auto">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-5">
            <button
              data-testid="badges-back"
              onClick={() => setLocation("/")}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div
              data-testid="badges-points-pill"
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-sm font-semibold text-white">{totalPoints.toLocaleString()} pts</span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="font-display text-2xl font-bold text-white text-center animate-fade-in-up"
            data-testid="badges-title"
          >
            Achievements
          </h1>
          <p className="text-center text-white/60 text-sm mt-1">
            {earned.length} of {badges.length} badges earned
          </p>

          {/* Level progress */}
          <div className="glass-card-dark p-4 mt-5" data-testid="badges-level-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${level.color}20`, color: level.color }}
                >
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{level.name}</p>
                  <p className="text-white/50 text-xs">Level {LEVELS.indexOf(LEVELS.find(l => l.name === level.name)!) + 1}</p>
                </div>
              </div>
              {level.next && (
                <p className="text-white/50 text-xs">
                  {level.next.minPoints - totalPoints} pts to {level.next.name}
                </p>
              )}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${level.progress}%`,
                  backgroundColor: level.color,
                }}
              />
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4" data-testid="badges-streak">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-white/80 text-sm font-medium">{streak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Streak Shield Dialog */}
      {showStreakShield && (
        <div className="max-w-[560px] mx-auto px-4 -mt-3 mb-4" data-testid="streak-shield-dialog">
          <div className="glass-card p-4 border border-amber-200/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Streak Shield</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You missed yesterday! Use a Streak Shield to keep your streak alive?
                </p>
                <p className="text-xs text-amber-600 font-medium mt-1">Costs 50 points</p>
                <div className="flex gap-2 mt-3">
                  <button
                    data-testid="streak-shield-use"
                    onClick={useStreakShield}
                    disabled={shieldLoading || totalPoints < 50}
                    className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                  >
                    {shieldLoading ? "Saving..." : "Use Shield"}
                  </button>
                  <button
                    data-testid="streak-shield-dismiss"
                    onClick={() => setShowStreakShield(false)}
                    className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg"
                  >
                    Skip
                  </button>
                </div>
                {totalPoints < 50 && (
                  <p className="text-xs text-rose-500 mt-1">Not enough points</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Grid */}
      <div className="max-w-[560px] mx-auto px-4 pb-8 mt-2">
        {/* Earned */}
        {earned.length > 0 && (
          <div className="mb-6" data-testid="badges-earned-section">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Earned</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {earned.map((b, i) => (
                <BadgeCard key={b.id} badge={b} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Locked */}
        {unearned.length > 0 && (
          <div className="mb-6" data-testid="badges-locked-section">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Locked</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {unearned.map((b, i) => (
                <BadgeCard key={b.id} badge={b} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Rewards Store Coming Soon */}
        <div className="glass-card p-5 text-center mt-4" data-testid="rewards-store-coming-soon">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold font-display">Rewards Store</h3>
          <p className="text-xs text-muted-foreground mt-1">Coming Soon -- redeem points for rewards</p>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, index }: { badge: BadgeItem; index: number }) {
  const Icon = ICON_MAP[badge.iconType] || Trophy;
  const tierColor = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;
  const tierGlow = TIER_GLOW[badge.tier] || TIER_GLOW.bronze;

  return (
    <div
      data-testid={`badge-card-${badge.slug}`}
      className={`glass-card p-4 flex flex-col items-center text-center relative animate-fade-in-up ${
        !badge.earned ? "opacity-40 grayscale" : ""
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: badge.earned ? tierGlow : undefined,
      }}
    >
      {!badge.earned && (
        <div className="absolute top-2.5 right-2.5">
          <Lock className="w-3 h-3 text-muted-foreground/60" />
        </div>
      )}
      {badge.earned && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
          style={{ backgroundColor: tierColor }}
        >
          <Zap className="w-2.5 h-2.5" />
        </div>
      )}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2.5 ${
          badge.earned ? "animate-badge-glow" : ""
        }`}
        style={{
          backgroundColor: badge.earned ? `${tierColor}15` : "hsl(var(--muted))",
          color: badge.earned ? tierColor : "hsl(var(--muted-foreground))",
          border: badge.earned ? `2px solid ${tierColor}30` : "2px solid transparent",
        }}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xs font-semibold leading-tight">{badge.name}</h3>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{badge.description}</p>
      {badge.earned && badge.earnedAt && (
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
          >
            +{badge.pointsAwarded} pts
          </span>
        </div>
      )}
      {badge.earned && badge.tier && (
        <p
          className="text-[9px] font-medium uppercase tracking-wider mt-1"
          style={{ color: tierColor }}
        >
          {badge.tier}
        </p>
      )}
    </div>
  );
}
