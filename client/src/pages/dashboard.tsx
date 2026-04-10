import { useEffect, useState } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Settings,
  ClipboardList,
  Flag,
  Zap,
  Check,
  AlertTriangle,
  MoveRight,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Pause,
  CheckCircle,
  BarChart3,
  Flame,
  Trophy,
  Star,
  Heart,
  Target,
  Crown,
  Shield,
  Award,
  Droplets,
  Smile,
  Footprints,
  PenLine,
  Sun,
  Moon,
  CloudSun,
  FileText,
  Scale,
  Sparkles,
  Send,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import ChatSheet from "@/components/chat-sheet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Legend,
} from "recharts";

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

interface DashboardData {
  profile: any;
  goals: any[];
  milestones: any[];
  recentCheckIns: any[];
  conditions: any[];
  medications: any[];
  stats: { checkInCount: number; activeMilestones: number };
}

interface WeeklyReviewData {
  summary?: string;
  wins?: string[];
  improvements?: string[];
  nextWeekFocus?: string;
}

interface CalibrationData {
  snapshot: any;
  gaps: { type: string; message: string; statedScore: number; actualMetric: number }[];
}

interface BriefingData {
  greeting: string;
  insights: string[];
  focus: string;
}

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const n = name || "";
  if (hour < 12) return `Good morning, ${n}`;
  if (hour < 17) return `Good afternoon, ${n}`;
  if (hour < 21) return `Good evening, ${n}`;
  return `Hey ${n}`;
}

function getTimeIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return Sun;
  if (hour < 17) return CloudSun;
  return Moon;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getMoodIndicator(mood: number | null) {
  if (!mood) return null;
  if (mood >= 7) return { icon: Check, color: "text-primary bg-primary/10" };
  if (mood >= 4) return { icon: Zap, color: "text-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" };
  return { icon: AlertTriangle, color: "text-[hsl(var(--rose))] bg-[hsl(var(--rose))]/10" };
}

export default function Dashboard() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReviewData | null>(null);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [waterToday, setWaterToday] = useState(0);
  const [quickMood, setQuickMood] = useState(0);
  const [stepsInput, setStepsInput] = useState(false);
  const [stepsValue, setStepsValue] = useState("");
  const [checkInHistory, setCheckInHistory] = useState<any[]>([]);

  useEffect(() => {
    authFetch("GET", "/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {});

    authFetch("GET", "/api/ai/weekly-review/latest")
      .then((res) => res.json())
      .then((d) => {
        if (d.review?.data) setWeeklyReview(d.review.data);
      })
      .catch(() => {});

    authFetch("GET", "/api/calibration")
      .then((res) => res.json())
      .then((d) => {
        if (d.gaps && d.gaps.length > 0) setCalibration(d);
      })
      .catch(() => {});

    authFetch("GET", "/api/badges/my")
      .then((res) => res.json())
      .then((d) => {
        setTotalPoints(d.totalPoints || 0);
        setStreak(d.streak || 0);
        setRecentBadges((d.badges || []).slice(0, 5));
      })
      .catch(() => {});

    authFetch("GET", "/api/morning-briefing")
      .then((res) => res.json())
      .then((d) => {
        if (d.briefing) setBriefing(d.briefing);
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));

    // Fetch 30 days of check-in history for visualizations
    authFetch("GET", "/api/checkins?limit=30")
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d.checkIns)) setCheckInHistory(d.checkIns);
      })
      .catch(() => {});
  }, [authFetch]);

  const profile = data?.profile;
  const goals = data?.goals || [];
  const conditions = (data?.conditions || []).map((c: any) => (c.conditionName || c.condition_name || '').toLowerCase());
  const dashMilestones = data?.milestones || [];
  const recentCheckIns = data?.recentCheckIns || [];
  const stats = data?.stats || { checkInCount: 0, activeMilestones: 0 };

  const activeMilestones = dashMilestones.filter(
    (m: any) => m.status === "planned" || m.status === "active" || m.status === "paused"
  );
  const completedMilestones = dashMilestones.filter((m: any) => m.status === "completed");

  const hasLoseWeightGoal = goals.some((g) => g.goalType === "Lose Weight");
  const currentWeight = profile?.weightKg;
  const targetWeight = profile?.targetWeightKg;
  const startWeight = currentWeight;
  const latestWeightCheckIn = recentCheckIns.find((c) => c.weight);
  const displayWeight = latestWeightCheckIn
    ? latestWeightCheckIn.weight / 10
    : currentWeight;

  const weightProgress =
    hasLoseWeightGoal && startWeight && targetWeight && displayWeight
      ? Math.min(100, Math.max(0, ((startWeight - displayWeight) / (startWeight - targetWeight)) * 100))
      : 0;

  const level = getLevel(totalPoints);
  const TimeIcon = getTimeIcon();

  // --- Visualization data ---
  // Weight trend: from check-in history with weight
  const weightTrendData = checkInHistory
    .filter((c: any) => c.weight)
    .map((c: any) => ({
      date: c.date ? c.date.slice(5) : "", // MM-DD
      weight: c.weight / 10,
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));

  // Also include recent check-ins from dashboard data
  const recentWithWeight = recentCheckIns
    .filter((c: any) => c.weight)
    .map((c: any) => ({
      date: c.date ? c.date.slice(5) : "",
      weight: c.weight / 10,
    }));

  const allWeightData = [...weightTrendData];
  recentWithWeight.forEach((r) => {
    if (!allWeightData.find((w) => w.date === r.date)) allWeightData.push(r);
  });
  allWeightData.sort((a, b) => a.date.localeCompare(b.date));

  // Mood sparkline: last 7 days from check-in history
  const last7Days = checkInHistory
    .filter((c: any) => c.mood)
    .slice(-7)
    .map((c: any) => ({
      date: c.date ? c.date.slice(5) : "",
      mood: c.mood,
    }));

  // Also merge recent check-ins for mood
  const recentWithMood = recentCheckIns
    .filter((c: any) => c.mood)
    .slice(0, 7)
    .map((c: any) => ({ date: c.date ? c.date.slice(5) : "", mood: c.mood }));

  const moodData = last7Days.length > 0 ? last7Days : recentWithMood;

  // Weekly macros: average protein/carbs/fat from check-ins with nutrition data
  const logsWithNutrition = checkInHistory.filter(
    (c: any) => (c.totalProtein || 0) + (c.totalCarbs || 0) + (c.totalFat || 0) > 0
  );
  let macroSummary: { protein: number; carbs: number; fat: number } | null = null;
  if (logsWithNutrition.length > 0) {
    const avgProtein = logsWithNutrition.reduce((s: number, c: any) => s + (c.totalProtein || 0), 0) / logsWithNutrition.length;
    const avgCarbs = logsWithNutrition.reduce((s: number, c: any) => s + (c.totalCarbs || 0), 0) / logsWithNutrition.length;
    const avgFat = logsWithNutrition.reduce((s: number, c: any) => s + (c.totalFat || 0), 0) / logsWithNutrition.length;
    const total = avgProtein + avgCarbs + avgFat;
    if (total > 0) {
      macroSummary = {
        protein: Math.round((avgProtein / total) * 100),
        carbs: Math.round((avgCarbs / total) * 100),
        fat: Math.round((avgFat / total) * 100),
      };
    }
  }

  // Is new user? (0 check-ins)
  const isNewUser = stats.checkInCount === 0;

  // Has the user logged today? Check if today's date appears in recentCheckIns
  const todayStr = new Date().toISOString().split("T")[0];
  const hasLoggedToday = recentCheckIns.some((c: any) => c.date === todayStr);

  // Quick start: user has 0 goals set (may have used quick start)
  const needsGoals = goals.length === 0 && !isNewUser;

  const addWater = () => {
    setWaterToday(w => w + 250);
  };

  const cycleMood = () => {
    setQuickMood(m => (m % 5) + 1);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      {/* Premium gradient hero */}
      <div className="bg-gradient-to-b from-[#1A3A2A] via-[#2C5E3F] to-[#3A7A52] px-5 pt-6 pb-8" style={{ borderRadius: "0 0 28px 28px" }}>
        <div className="max-w-[560px] mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-white/60 text-sm">{formatDate(new Date())}</p>
            <div className="flex items-center gap-2">
              {/* Level pill */}
              <button
                onClick={() => setLocation("/badges")}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 border border-white/15"
                style={{ backgroundColor: `${level.color}20` }}
                data-testid="level-pill"
              >
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: level.color }} />
                <span className="text-[10px] font-semibold text-white">{level.name}</span>
              </button>
              {/* Points pill */}
              <button
                onClick={() => setLocation("/badges")}
                className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1.5"
                data-testid="points-pill"
              >
                <Zap className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
                <span className="text-xs font-semibold text-white">{totalPoints.toLocaleString()}</span>
              </button>
              <button
                onClick={() => setLocation("/settings")}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                data-testid="settings-btn"
                aria-label="Settings"
              >
                <Settings className="w-4.5 h-4.5 text-white" />
              </button>
            </div>
          </div>

          {/* Greeting */}
          <h1
            className="font-display text-2xl font-bold text-white mb-1 animate-fade-in-up"
            data-testid="dashboard-greeting"
          >
            {getGreeting(profile?.name || user?.name)}
          </h1>

          {/* Level progress bar */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${level.progress}%`, backgroundColor: level.color }}
              />
            </div>
            {level.next && (
              <span className="text-[10px] text-white/40">{level.next.name}</span>
            )}
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center" data-testid="weight-stat">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Weight</p>
              {displayWeight ? (
                <p className="text-white font-display text-base font-bold">
                  {displayWeight}
                  <span className="text-white/50 text-[10px] font-body"> kg</span>
                </p>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Scale className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/50 text-[9px] leading-tight">Log weigh-in</p>
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center" data-testid="checkins-stat">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Check-ins</p>
              {stats.checkInCount > 0 ? (
                <p className="text-white font-display text-base font-bold">{stats.checkInCount}</p>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/50 text-[9px] leading-tight">First unlocks</p>
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Milestones</p>
              <p className="text-white font-display text-base font-bold">{stats.activeMilestones}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center" data-testid="streak-stat">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Streak</p>
              <p className="text-white font-display text-base font-bold">
                {streak}
                <span className="text-white/50 text-[10px] font-body"> d</span>
              </p>
            </div>
          </div>

          {/* Recent badges */}
          {recentBadges.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setLocation("/badges")}
                className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                data-testid="recent-badges"
              >
                {recentBadges.map((b: any) => {
                  const badgeIconMap: Record<string, React.ElementType> = {
                    trophy: Trophy, flame: Flame, star: Star, heart: Heart,
                    target: Target, zap: Zap, crown: Crown, shield: Shield,
                  };
                  const BadgeIcon = badgeIconMap[b.iconType] || Award;
                  return (
                    <div key={b.id} className="flex items-center gap-1.5 bg-white/8 rounded-full px-2.5 py-1 shrink-0">
                      <BadgeIcon className="w-3 h-3 text-[hsl(var(--gold))]" />
                      <span className="text-[10px] font-medium text-white whitespace-nowrap">{b.name}</span>
                    </div>
                  );
                })}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body content */}
      <div className="max-w-[560px] mx-auto px-5 py-6 space-y-5 pb-24">

        {/* Getting Started card (new users only) */}
        {isNewUser && (
          <div
            className="vitallity-card border-l-4"
            style={{ borderLeftColor: "#C4815C" }}
            data-testid="getting-started-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#C4815C]" />
              <p className="font-display text-sm font-bold text-foreground">Getting Started</p>
            </div>
            <p className="text-xs text-text-mid mb-4">Complete these three steps to unlock your personalized journey</p>
            <div className="space-y-2">
              <button
                onClick={() => setLocation("/daily-log")}
                className="w-full flex items-center gap-3 p-3 rounded-[14px] bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                data-testid="gs-checkin"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Log your first check-in</p>
                <MoveRight className="w-4 h-4 text-text-light ml-auto" />
              </button>
              <button
                onClick={() => setLocation("/health-records")}
                className="w-full flex items-center gap-3 p-3 rounded-[14px] bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                data-testid="gs-health-records"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Upload a health report</p>
                <MoveRight className="w-4 h-4 text-text-light ml-auto" />
              </button>
              <button
                onClick={() => setLocation("/settings")}
                className="w-full flex items-center gap-3 p-3 rounded-[14px] bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                data-testid="gs-telegram"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Send className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Connect Telegram for reminders</p>
                <MoveRight className="w-4 h-4 text-text-light ml-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Complete wellness plan (quick start users) */}
        {needsGoals && (
          <div
            className="vitallity-card border-l-4"
            style={{ borderLeftColor: "#C4815C" }}
            data-testid="complete-wellness-plan-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#C4815C]" />
              <p className="font-display text-sm font-bold text-foreground">Complete Your Wellness Plan</p>
            </div>
            <p className="text-xs text-text-mid mb-3">Set goals and milestones to get personalized guidance from your AI coach</p>
            <button
              onClick={() => setLocation("/settings")}
              className="vitallity-btn-primary text-sm flex items-center gap-2"
              data-testid="complete-plan-btn"
            >
              Set Goals Now
              <MoveRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Morning Briefing */}
        {briefingLoading ? (
          <div className="glass-card p-5" data-testid="briefing-loading">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TimeIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : briefing ? (
          <div className="glass-card p-5 animate-fade-in-up" data-testid="morning-briefing">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TimeIcon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-display text-sm font-bold text-foreground">{briefing.greeting}</p>
            </div>
            <div className="space-y-2 mb-3">
              {briefing.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-xs text-text-mid">{insight}</p>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-primary">{briefing.focus}</p>
            </div>
          </div>
        ) : null}

        {/* Proactive Check-in Card */}
        {!hasLoggedToday && !isNewUser && data && (
          <button
            onClick={() => {
              setChatInitialMessage("I'd like to do a quick wellness check-in for today. Please ask me about my mood, energy levels, sleep last night, and any concerns I might have.");
              setChatOpen(true);
            }}
            className="w-full glass-card p-4 text-left flex items-center gap-4 active:scale-[0.99] transition-transform border border-primary/20"
            data-testid="proactive-checkin-card"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold text-foreground">How are you feeling today?</p>
              <p className="text-text-light text-[11px] mt-0.5">Quick wellness check-in with your AI coach</p>
            </div>
            <MoveRight className="w-4 h-4 text-text-light shrink-0" />
          </button>
        )}

        {/* Quick-Log Widgets */}
        <div className="grid grid-cols-4 gap-2" data-testid="quick-log-widgets">
          <button
            onClick={addWater}
            className="glass-card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
            data-testid="quick-water"
          >
            <Droplets className="w-5 h-5 text-[#60A5FA]" />
            <span className="text-[10px] font-semibold text-text-mid">+Water</span>
            {waterToday > 0 && (
              <span className="text-[10px] font-mono font-bold text-[#60A5FA]">{waterToday}ml</span>
            )}
          </button>
          <button
            onClick={cycleMood}
            className="glass-card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
            data-testid="quick-mood"
          >
            <Smile className="w-5 h-5 text-[hsl(var(--gold))]" />
            <span className="text-[10px] font-semibold text-text-mid">Mood</span>
            {quickMood > 0 && (
              <span className="text-[10px] font-mono font-bold text-[hsl(var(--gold))]">{quickMood}/5</span>
            )}
          </button>
          <button
            onClick={() => setStepsInput(true)}
            className="glass-card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
            data-testid="quick-steps"
          >
            <Footprints className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-semibold text-text-mid">Steps</span>
          </button>
          <button
            onClick={() => setLocation("/daily-log")}
            className="glass-card p-3 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-transform"
            data-testid="quick-full-log"
          >
            <PenLine className="w-5 h-5 text-[hsl(var(--terracotta))]" />
            <span className="text-[10px] font-semibold text-text-mid">Full Log</span>
          </button>
        </div>

        {/* Steps modal */}
        {stepsInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setStepsInput(false)}>
            <div className="glass-card p-6 w-[280px]" onClick={e => e.stopPropagation()} data-testid="steps-modal">
              <p className="font-display text-lg font-bold mb-3">Log Steps</p>
              <input
                type="number"
                value={stepsValue}
                onChange={e => setStepsValue(e.target.value)}
                placeholder="e.g. 5000"
                className="vitallity-input text-center text-lg font-mono mb-3"
                autoFocus
                data-testid="steps-input"
              />
              <button
                onClick={() => { setStepsInput(false); setStepsValue(""); }}
                className="vitallity-btn-primary w-full text-sm"
                data-testid="steps-save"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Data Visualizations */}
        {/* A. Weight Trend Line */}
        {hasLoseWeightGoal && (
          <div className="vitallity-card" data-testid="weight-trend-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Weight Trend</p>
            </div>
            {allWeightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={allWeightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--text-light))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-light))" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                    formatter={(val: number) => [`${val} kg`, "Weight"]}
                  />
                  {targetWeight && (
                    <ReferenceLine y={targetWeight} stroke="#C4815C" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `Target: ${targetWeight}kg`, fill: "#C4815C", fontSize: 10, position: "right" }} />
                  )}
                  <Line type="monotone" dataKey="weight" stroke="#2C5E3F" strokeWidth={2} dot={{ r: 3, fill: "#2C5E3F", stroke: "#2C5E3F" }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[80px] text-center">
                <Scale className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-xs text-text-light">Log your weight to see trends</p>
              </div>
            )}
          </div>
        )}

        {/* B. Mood Sparkline */}
        <div className="vitallity-card" data-testid="mood-sparkline-card">
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-4 h-4 text-[hsl(var(--gold))]" />
            <p className="text-sm font-semibold text-foreground">Mood (Last 7 Days)</p>
          </div>
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={moodData} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C5E3F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2C5E3F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                  formatter={(val: number) => [`${val}/10`, "Mood"]}
                />
                <Area type="monotone" dataKey="mood" stroke="#2C5E3F" strokeWidth={2} fill="url(#moodGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60px] text-center">
              <p className="text-xs text-text-light">Track your mood to see patterns</p>
            </div>
          )}
        </div>

        {/* C. 14-Day Wellness Trends */}
        {(() => {
          const trendData = recentCheckIns
            .filter((c: any) => c.date && (c.mood || c.energyLevel || c.sleepQuality || c.stressLevel || c.painLevel))
            .reverse()
            .map((c: any) => ({
              date: c.date ? c.date.slice(5) : "",
              Mood: c.mood || null,
              Energy: c.energyLevel || null,
              Sleep: c.sleepQuality || null,
              Stress: c.stressLevel || null,
              Pain: c.painLevel || null,
            }));
          const hasData = trendData.length >= 2;
          return (
            <div className="vitallity-card" data-testid="wellness-trends-card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Wellness Trends (14 Days)</p>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">Sleep, mood, energy, stress, and pain scores over time</p>
              {hasData ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      ticks={[0, 5, 10]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 12,
                        fontSize: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                      formatter={(val: number, name: string) => [val ? `${val}/10` : "--", name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                    />
                    <Line type="monotone" dataKey="Sleep" stroke="#6366F1" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Mood" stroke="#2C5E3F" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Energy" stroke="#F59E0B" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Stress" stroke="#EF4444" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Pain" stroke="#8B5CF6" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[100px] text-center">
                  <TrendingUp className="w-6 h-6 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Log 2+ check-ins to see your wellness trends</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* C2. Correlation Insights */}
        {(() => {
          // Build correlation insights from 14-day check-in data
          const raw = recentCheckIns.filter((c: any) => c.date);
          if (raw.length < 3) return null;

          type Insight = { text: string; type: "positive" | "negative" | "neutral"; chartData?: any[]; lineA?: string; lineB?: string; colorA?: string; colorB?: string };
          const insights: Insight[] = [];

          // Helper: split check-ins by a threshold and compare averages of another metric
          function compareByThreshold(
            entries: any[],
            splitKey: string,
            splitThreshold: number,
            compareKey: string,
            splitLabel: string,
            compareLabel: string,
            below: boolean, // true = "under threshold", false = "over threshold"
            minDiff: number = 1.0
          ) {
            const low = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (below ? c[splitKey] < splitThreshold : c[splitKey] >= splitThreshold));
            const high = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (below ? c[splitKey] >= splitThreshold : c[splitKey] < splitThreshold));
            if (low.length < 2 || high.length < 2) return null;
            const avgLow = low.reduce((s: number, c: any) => s + c[compareKey], 0) / low.length;
            const avgHigh = high.reduce((s: number, c: any) => s + c[compareKey], 0) / high.length;
            const diff = Math.round(Math.abs(avgLow - avgHigh) * 10) / 10;
            if (diff < minDiff) return null;
            return { avgLow, avgHigh, diff, lowCount: low.length, highCount: high.length };
          }

          // Build 7-day chart data for visual insights
          const last7raw = raw.slice(0, 7).reverse().map((c: any) => ({ d: c.date?.slice(5) || '', ...c }));

          // 1. Sleep hours vs Pain
          const sleepPain = compareByThreshold(raw, 'sleepHours', 6, 'painLevel', 'sleep', 'pain', true, 1.0);
          if (sleepPain && sleepPain.avgLow > sleepPain.avgHigh) {
            insights.push({ text: `Your pain scores are ${sleepPain.diff}pts higher on days you sleep under 6hrs`, type: 'negative',
              chartData: last7raw.map(c => ({ d: c.d, Sleep: c.sleepHours || null, Pain: c.painLevel || null })),
              lineA: 'Sleep', lineB: 'Pain', colorA: '#6366F1', colorB: '#8B5CF6' });
          }

          // 2. Sleep hours vs Mood
          const sleepMood = compareByThreshold(raw, 'sleepHours', 7, 'mood', 'sleep', 'mood', false, 1.0);
          if (sleepMood && sleepMood.avgLow > sleepMood.avgHigh) {
            insights.push({ text: `Your mood is ${sleepMood.diff}pts higher on days you sleep 7+ hours`, type: 'positive',
              chartData: last7raw.map(c => ({ d: c.d, Sleep: c.sleepHours || null, Mood: c.mood || null })),
              lineA: 'Sleep', lineB: 'Mood', colorA: '#6366F1', colorB: '#2C5E3F' });
          }

          // 3. Sleep hours vs Energy
          const sleepEnergy = compareByThreshold(raw, 'sleepHours', 7, 'energyLevel', 'sleep', 'energy', false, 1.0);
          if (sleepEnergy && sleepEnergy.avgLow > sleepEnergy.avgHigh) {
            insights.push({ text: `Your energy is ${sleepEnergy.diff}pts higher when you get 7+ hours of sleep`, type: 'positive',
              chartData: last7raw.map(c => ({ d: c.d, Sleep: c.sleepHours || null, Energy: c.energyLevel || null })),
              lineA: 'Sleep', lineB: 'Energy', colorA: '#6366F1', colorB: '#F59E0B' });
          }

          // 4. Stress vs Sleep quality
          const stressSleep = compareByThreshold(raw, 'stressLevel', 7, 'sleepQuality', 'stress', 'sleep quality', true, 1.0);
          if (stressSleep && stressSleep.avgLow < stressSleep.avgHigh) {
            insights.push({ text: `Your sleep quality drops ${stressSleep.diff}pts on high-stress days (7+)`, type: 'negative' });
          }

          // 5. Stress vs Mood
          const stressMood = compareByThreshold(raw, 'stressLevel', 6, 'mood', 'stress', 'mood', true, 1.0);
          if (stressMood && stressMood.avgLow < stressMood.avgHigh) {
            insights.push({ text: `Your mood is ${stressMood.diff}pts lower on days with stress above 6`, type: 'negative' });
          }

          // 6. Exercise vs Mood
          const exerciseMood = compareByThreshold(raw, 'exerciseDuration', 20, 'mood', 'exercise', 'mood', false, 0.8);
          if (exerciseMood && exerciseMood.avgLow > exerciseMood.avgHigh) {
            insights.push({ text: `Your mood is ${exerciseMood.diff}pts higher on days you exercise 20+ minutes`, type: 'positive' });
          }

          // 7. Exercise vs Energy
          const exerciseEnergy = compareByThreshold(raw, 'exerciseDuration', 20, 'energyLevel', 'exercise', 'energy', false, 0.8);
          if (exerciseEnergy && exerciseEnergy.avgLow > exerciseEnergy.avgHigh) {
            insights.push({ text: `Your energy is ${exerciseEnergy.diff}pts higher on active days (20+ min exercise)`, type: 'positive' });
          }

          // 8. Steps vs Energy
          const stepEnergy = compareByThreshold(raw, 'steps', 5000, 'energyLevel', 'steps', 'energy', false, 0.8);
          if (stepEnergy && stepEnergy.avgLow > stepEnergy.avgHigh) {
            insights.push({ text: `Your energy is ${stepEnergy.diff}pts higher on days with 5000+ steps`, type: 'positive' });
          }

          // 9. Pain vs Mood
          const painMood = compareByThreshold(raw, 'painLevel', 5, 'mood', 'pain', 'mood', true, 1.0);
          if (painMood && painMood.avgLow < painMood.avgHigh) {
            insights.push({ text: `Your mood drops ${painMood.diff}pts on high-pain days (5+)`, type: 'negative' });
          }

          // 10. Water vs Energy
          const waterEnergy = compareByThreshold(raw, 'waterMl', 1500, 'energyLevel', 'water', 'energy', false, 0.8);
          if (waterEnergy && waterEnergy.avgLow > waterEnergy.avgHigh) {
            insights.push({ text: `Your energy is ${waterEnergy.diff}pts higher when you drink 1.5L+ water`, type: 'positive' });
          }

          // ── Condition-specific correlations ──
          const has = (term: string) => conditions.some((c: string) => c.includes(term));

          // Fibromyalgia: flare days (pain 6+) vs prior night sleep and hydration
          if (has('fibromyalgia')) {
            const sleepFibro = compareByThreshold(raw, 'sleepHours', 7, 'painLevel', 'sleep', 'pain', true, 0.8);
            if (sleepFibro && sleepFibro.avgLow > sleepFibro.avgHigh) {
              insights.push({ text: `Fibromyalgia: your flare-ups average ${sleepFibro.diff}pts worse after sleeping under 7hrs`, type: 'negative' });
            }
            const waterFibro = compareByThreshold(raw, 'waterMl', 1500, 'painLevel', 'water', 'pain', true, 0.8);
            if (waterFibro && waterFibro.avgLow > waterFibro.avgHigh) {
              insights.push({ text: `Fibromyalgia: pain is ${waterFibro.diff}pts higher on days with under 1.5L water`, type: 'negative' });
            }
            const stressFibro = compareByThreshold(raw, 'stressLevel', 6, 'painLevel', 'stress', 'pain', false, 0.8);
            if (stressFibro && stressFibro.avgLow > stressFibro.avgHigh) {
              insights.push({ text: `Fibromyalgia: stress above 6 correlates with ${stressFibro.diff}pts more pain`, type: 'negative' });
            }
          }

          // Arthritis: pain vs exercise and temperature (we use sleep quality as proxy for rest)
          if (has('arthritis')) {
            const exerciseArth = compareByThreshold(raw, 'exerciseDuration', 15, 'painLevel', 'exercise', 'pain', false, 0.8);
            if (exerciseArth && exerciseArth.avgLow < exerciseArth.avgHigh) {
              insights.push({ text: `Arthritis: gentle movement (15+ min) correlates with ${exerciseArth.diff}pts less joint pain`, type: 'positive' });
            }
            const restArth = compareByThreshold(raw, 'sleepQuality', 6, 'painLevel', 'sleep quality', 'pain', false, 0.8);
            if (restArth && restArth.avgLow < restArth.avgHigh) {
              insights.push({ text: `Arthritis: good sleep quality (6+) correlates with ${restArth.diff}pts less pain next day`, type: 'positive' });
            }
          }

          // Diabetes (Type 1 or 2): stress and sleep vs energy (blood sugar proxy)
          if (has('diabetes')) {
            const stressDiab = compareByThreshold(raw, 'stressLevel', 6, 'energyLevel', 'stress', 'energy', true, 0.8);
            if (stressDiab && stressDiab.avgLow < stressDiab.avgHigh) {
              insights.push({ text: `Diabetes: high stress days (6+) correlate with ${stressDiab.diff}pts lower energy -- stress spikes blood sugar`, type: 'negative' });
            }
            const sleepDiab = compareByThreshold(raw, 'sleepHours', 7, 'energyLevel', 'sleep', 'energy', false, 0.8);
            if (sleepDiab && sleepDiab.avgLow > sleepDiab.avgHigh) {
              insights.push({ text: `Diabetes: 7+ hours sleep correlates with ${sleepDiab.diff}pts better energy -- sleep helps insulin sensitivity`, type: 'positive' });
            }
          }

          // Hypertension: stress and exercise vs overall wellness
          if (has('hypertension') || has('high bp')) {
            const stressBP = compareByThreshold(raw, 'stressLevel', 7, 'sleepQuality', 'stress', 'sleep', true, 0.8);
            if (stressBP && stressBP.avgLow < stressBP.avgHigh) {
              insights.push({ text: `Hypertension: high stress (7+) correlates with ${stressBP.diff}pts worse sleep -- both raise blood pressure`, type: 'negative' });
            }
            const exerciseBP = compareByThreshold(raw, 'steps', 4000, 'mood', 'steps', 'mood', false, 0.8);
            if (exerciseBP && exerciseBP.avgLow > exerciseBP.avgHigh) {
              insights.push({ text: `Hypertension: 4000+ steps days correlate with ${exerciseBP.diff}pts better mood -- movement helps regulate BP`, type: 'positive' });
            }
          }

          // Thyroid: sleep and energy patterns
          if (has('thyroid')) {
            const sleepThyroid = compareByThreshold(raw, 'sleepHours', 8, 'energyLevel', 'sleep', 'energy', false, 0.8);
            if (sleepThyroid && sleepThyroid.avgLow > sleepThyroid.avgHigh) {
              insights.push({ text: `Thyroid: 8+ hours sleep correlates with ${sleepThyroid.diff}pts more energy -- thyroid conditions need extra rest`, type: 'positive' });
            }
          }

          // Depression/Anxiety: exercise and sleep as mood regulators
          if (has('depression') || has('anxiety')) {
            const exerciseMH = compareByThreshold(raw, 'exerciseDuration', 20, 'mood', 'exercise', 'mood', false, 0.8);
            if (exerciseMH && exerciseMH.avgLow > exerciseMH.avgHigh) {
              insights.push({ text: `Mental health: 20+ min exercise correlates with ${exerciseMH.diff}pts better mood -- consistent with clinical evidence`, type: 'positive' });
            }
            const sleepMH = compareByThreshold(raw, 'sleepQuality', 6, 'mood', 'sleep', 'mood', false, 0.8);
            if (sleepMH && sleepMH.avgLow > sleepMH.avgHigh) {
              insights.push({ text: `Mental health: good sleep (quality 6+) correlates with ${sleepMH.diff}pts higher mood`, type: 'positive' });
            }
          }

          // Chronic back pain / sciatica / spondylosis
          if (has('back pain') || has('sciatica') || has('spondylosis')) {
            const exerciseBack = compareByThreshold(raw, 'exerciseDuration', 15, 'painLevel', 'exercise', 'pain', false, 0.8);
            if (exerciseBack && exerciseBack.avgLow < exerciseBack.avgHigh) {
              insights.push({ text: `Back/spine: gentle daily movement (15+ min) correlates with ${exerciseBack.diff}pts less pain`, type: 'positive' });
            }
            const stressBack = compareByThreshold(raw, 'stressLevel', 6, 'painLevel', 'stress', 'pain', false, 0.8);
            if (stressBack && stressBack.avgLow > stressBack.avgHigh) {
              insights.push({ text: `Back/spine: stress above 6 correlates with ${stressBack.diff}pts more pain -- tension aggravates spinal issues`, type: 'negative' });
            }
          }

          // Knee issues / ACL
          if (has('knee') || has('acl')) {
            const stepsKnee = compareByThreshold(raw, 'steps', 8000, 'painLevel', 'steps', 'pain', false, 0.8);
            if (stepsKnee && stepsKnee.avgLow > stepsKnee.avgHigh) {
              insights.push({ text: `Knee: pain is ${stepsKnee.diff}pts higher on days exceeding 8000 steps -- consider lower-impact activity`, type: 'negative' });
            }
          }

          // PCOD/PCOS: stress and sleep affect hormones
          if (has('pcod') || has('pcos')) {
            const stressPCOS = compareByThreshold(raw, 'stressLevel', 6, 'sleepQuality', 'stress', 'sleep', true, 0.8);
            if (stressPCOS && stressPCOS.avgLow < stressPCOS.avgHigh) {
              insights.push({ text: `PCOS: high stress (6+) correlates with ${stressPCOS.diff}pts worse sleep -- stress disrupts hormonal balance`, type: 'negative' });
            }
          }

          // Migraine: sleep and stress triggers
          if (has('migraine')) {
            const sleepMigraine = compareByThreshold(raw, 'sleepHours', 6, 'painLevel', 'sleep', 'pain', true, 0.8);
            if (sleepMigraine && sleepMigraine.avgLow > sleepMigraine.avgHigh) {
              insights.push({ text: `Migraine: pain is ${sleepMigraine.diff}pts worse after under 6hrs sleep -- sleep disruption is a top trigger`, type: 'negative' });
            }
            const stressMigraine = compareByThreshold(raw, 'stressLevel', 7, 'painLevel', 'stress', 'pain', false, 0.8);
            if (stressMigraine && stressMigraine.avgLow > stressMigraine.avgHigh) {
              insights.push({ text: `Migraine: stress 7+ days correlate with ${stressMigraine.diff}pts higher pain scores`, type: 'negative' });
            }
          }

          // IBS / Digestive
          if (has('ibs') || has('digestive')) {
            const stressIBS = compareByThreshold(raw, 'stressLevel', 6, 'painLevel', 'stress', 'pain', false, 0.8);
            if (stressIBS && stressIBS.avgLow > stressIBS.avgHigh) {
              insights.push({ text: `Digestive: stress above 6 correlates with ${stressIBS.diff}pts more discomfort -- gut-brain axis at work`, type: 'negative' });
            }
            const sleepIBS = compareByThreshold(raw, 'sleepQuality', 6, 'painLevel', 'sleep', 'pain', false, 0.8);
            if (sleepIBS && sleepIBS.avgLow < sleepIBS.avgHigh) {
              insights.push({ text: `Digestive: good sleep (6+) correlates with ${sleepIBS.diff}pts less gut discomfort`, type: 'positive' });
            }
          }

          // Sleep Apnea
          if (has('sleep apnea') || has('apnea')) {
            const apneaEnergy = compareByThreshold(raw, 'sleepHours', 8, 'energyLevel', 'sleep', 'energy', false, 0.8);
            if (apneaEnergy && apneaEnergy.avgLow > apneaEnergy.avgHigh) {
              insights.push({ text: `Sleep apnea: 8+ hours correlates with ${apneaEnergy.diff}pts more energy -- you may need extra time to compensate for disrupted sleep`, type: 'positive' });
            }
          }

          if (insights.length === 0) return null;

          // Show top 3 most impactful insights (highest diff)
          const top = insights.slice(0, 3);

          return (
            <div className="vitallity-card" data-testid="correlation-insights-card">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Your Patterns</p>
              </div>
              <div className="space-y-2.5">
                {top.map((insight, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs leading-relaxed ${
                      insight.type === 'positive'
                        ? 'bg-primary/6 text-primary border border-primary/10'
                        : insight.type === 'negative'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}
                    data-testid={`insight-${i}`}
                  >
                    <span className="shrink-0 mt-0.5">
                      {insight.type === 'positive' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : insight.type === 'negative' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="font-medium">{insight.text}</span>
                  </div>
                ))}
              </div>
              {/* Mini trend chart for the top insight with chart data */}
              {(() => {
                const chartInsight = top.find(i => i.chartData && i.lineA && i.lineB);
                if (!chartInsight || !chartInsight.chartData) return null;
                const hasValues = chartInsight.chartData.some((d: any) => {
                  const vals = Object.values(d).filter(v => typeof v === 'number');
                  return vals.length >= 2;
                });
                if (!hasValues) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1.5">7-day trend: {chartInsight.lineA} vs {chartInsight.lineB}</p>
                    <ResponsiveContainer width="100%" height={90}>
                      <LineChart data={chartInsight.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                        <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                        <Line type="monotone" dataKey={chartInsight.lineA} stroke={chartInsight.colorA} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                        <Line type="monotone" dataKey={chartInsight.lineB} stroke={chartInsight.colorB} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                        <Legend iconType="circle" iconSize={5} wrapperStyle={{ fontSize: 9, paddingTop: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
              {insights.length > 3 && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">+ {insights.length - 3} more patterns detected</p>
              )}
            </div>
          );
        })()}

        {/* D. Weekly Macro Summary */}
        <div className="vitallity-card" data-testid="macro-summary-card">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[hsl(var(--accent))]" />
            <p className="text-sm font-semibold text-foreground">Weekly Macros (Avg)</p>
          </div>
          {macroSummary ? (
            <div className="space-y-2">
              <div className="w-full h-6 flex rounded-full overflow-hidden">
                <div className="h-full bg-primary flex items-center justify-center transition-all" style={{ width: `${macroSummary.protein}%` }}>
                  {macroSummary.protein >= 15 && <span className="text-[9px] font-bold text-white">{macroSummary.protein}%</span>}
                </div>
                <div className="h-full bg-[hsl(var(--accent))] flex items-center justify-center transition-all" style={{ width: `${macroSummary.carbs}%` }}>
                  {macroSummary.carbs >= 15 && <span className="text-[9px] font-bold text-white">{macroSummary.carbs}%</span>}
                </div>
                <div className="h-full bg-[hsl(var(--gold))] flex items-center justify-center transition-all" style={{ width: `${macroSummary.fat}%` }}>
                  {macroSummary.fat >= 15 && <span className="text-[9px] font-bold text-white">{macroSummary.fat}%</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[11px] text-text-mid">Protein {macroSummary.protein}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]" />
                  <span className="text-[11px] text-text-mid">Carbs {macroSummary.carbs}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--gold))]" />
                  <span className="text-[11px] text-text-mid">Fat {macroSummary.fat}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60px] text-center">
              <p className="text-xs text-text-light">Log meals to see your nutrition breakdown</p>
            </div>
          )}
        </div>

        {/* Action CTA Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocation("/checkin")}
            className="glass-card p-4 text-left active:scale-[0.98] transition-transform"
            data-testid="checkin-cta"
          >
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <p className="font-display text-sm font-bold text-foreground">Check-in</p>
            <p className="text-text-light text-[11px] mt-0.5">Mood, food & activity</p>
          </button>

          <button
            onClick={() => setLocation("/daily-log")}
            className="glass-card p-4 text-left active:scale-[0.98] transition-transform"
            data-testid="daily-log-cta"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <p className="font-display text-sm font-bold text-foreground">Daily Log</p>
            <p className="text-text-light text-[11px] mt-0.5">Nutrition & wellness</p>
          </button>
        </div>

        {/* My Plan CTA */}
        <button
          onClick={() => setLocation("/weekly-plan")}
          className="w-full glass-card p-4 text-left flex items-center gap-4 active:scale-[0.99] transition-transform border border-primary/20"
          data-testid="my-plan-cta"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-foreground">My Plan</p>
            <p className="text-text-light text-[11px] mt-0.5">Exercise, nutrition & recovery</p>
          </div>
          <MoveRight className="w-4 h-4 text-text-light shrink-0" />
        </button>

        {/* Goal Tracking CTA */}
        <button
          onClick={() => setLocation("/goals")}
          className="w-full glass-card p-4 text-left flex items-center gap-4 active:scale-[0.99] transition-transform border border-primary/20"
          data-testid="goal-tracking-cta"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-foreground">Goal Tracking</p>
            <p className="text-text-light text-[11px] mt-0.5">Glidepath, milestones & coaching</p>
          </div>
          <MoveRight className="w-4 h-4 text-text-light shrink-0" />
        </button>

        {/* Health Records CTA */}
        <button
          onClick={() => setLocation("/health-records")}
          className="w-full glass-card p-4 text-left flex items-center gap-4 active:scale-[0.99] transition-transform"
          data-testid="health-records-cta"
        >
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--rose))]/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[hsl(var(--rose))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-foreground">Health Records</p>
            <p className="text-text-light text-[11px] mt-0.5">Blood reports, prescriptions & more</p>
          </div>
          <MoveRight className="w-4 h-4 text-text-light shrink-0" />
        </button>

        {/* Calibration */}
        {calibration && calibration.gaps.length > 0 && (
          <div className="glass-card p-4" data-testid="calibration-card">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[hsl(var(--violet))]" />
              <p className="text-xs font-semibold text-[hsl(var(--violet))] uppercase tracking-wider">Journey Calibration</p>
            </div>
            <p className="text-sm text-foreground mb-3">{calibration.gaps[0].message}</p>
            <button
              onClick={() => setChatOpen(true)}
              className="text-xs font-semibold text-[hsl(var(--violet))] flex items-center gap-1"
              aria-label="Adjust my plan"
            >
              Adjust my plan <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Weekly Review */}
        {weeklyReview && weeklyReview.summary && (
          <div className="glass-card overflow-hidden" data-testid="weekly-review-card">
            <button
              onClick={() => setReviewExpanded(!reviewExpanded)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Weekly Review</p>
                <p className="text-sm text-foreground mt-0.5 line-clamp-1">{weeklyReview.summary}</p>
              </div>
              {reviewExpanded ? <ChevronUp className="w-4 h-4 text-text-mid shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-mid shrink-0" />}
            </button>
            {reviewExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {weeklyReview.wins && weeklyReview.wins.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Wins</p>
                    {weeklyReview.wins.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">{w}</p>
                      </div>
                    ))}
                  </div>
                )}
                {weeklyReview.improvements && weeklyReview.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Areas to Improve</p>
                    {weeklyReview.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <ArrowUp className="w-3.5 h-3.5 text-[hsl(var(--accent))] mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">{imp}</p>
                      </div>
                    ))}
                  </div>
                )}
                {weeklyReview.nextWeekFocus && (
                  <div className="bg-primary/5 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-primary">Next Week's Focus</p>
                    <p className="text-xs text-foreground mt-0.5">{weeklyReview.nextWeekFocus}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Weight Progress */}
        {hasLoseWeightGoal && startWeight && targetWeight && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Weight Progress</p>
              <p className="text-sm text-primary font-semibold">{Math.round(weightProgress)}%</p>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${weightProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-text-mid">
              <span>{startWeight}kg</span>
              <span className="font-semibold text-foreground">{displayWeight || startWeight}kg</span>
              <span>{targetWeight}kg</span>
            </div>
          </div>
        )}

        {/* Active Milestones */}
        {activeMilestones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Milestones</h2>
            </div>
            <div className="space-y-3">
              {activeMilestones.map((m: any, i: number) => (
                <button
                  key={m.id}
                  onClick={() => setLocation(`/milestone/${m.id}`)}
                  className="w-full glass-card p-4 text-left animate-fade-in-up active:scale-[0.99] transition-transform"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  data-testid={`milestone-card-${m.id}`}
                  aria-label={`View milestone: ${m.title}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm flex-1">{m.title}</p>
                    {m.status === "paused" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" data-testid="paused-badge">
                        <Pause className="w-3 h-3" /> Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-mid mb-2">Target: {m.target} &middot; {m.timeframe}</p>
                  {m.steps && m.steps.length > 0 && (
                    <div className="flex gap-1">
                      {m.steps.map((s: any) => (
                        <div key={s.id} className={`h-1.5 flex-1 rounded-full ${s.status === "done" ? "bg-primary" : s.status === "skipped" ? "bg-[hsl(var(--gold))]/40" : "bg-muted"}`} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed Milestones */}
        {completedMilestones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Completed ({completedMilestones.length})</h2>
            </div>
            <div className="space-y-2">
              {completedMilestones.map((m: any) => (
                <button key={m.id} onClick={() => setLocation(`/milestone/${m.id}`)} className="w-full glass-card p-3 text-left opacity-70" data-testid={`completed-milestone-${m.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-text-mid truncate">{m.target}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent Check-ins</h2>
            <div className="space-y-2">
              {recentCheckIns.map((c: any) => {
                const mood = getMoodIndicator(c.mood);
                const MoodIcon = mood?.icon;
                return (
                  <div key={c.id} className="glass-card p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {c.date}
                        {c.timeOfDay && <span className="text-text-mid font-normal ml-2 capitalize">{c.timeOfDay}</span>}
                      </p>
                      <p className="text-xs text-text-mid mt-0.5">
                        E:{c.energy || "-"} M:{c.mood || "-"} S:{c.stress || "-"}
                        {c.weight ? ` \u00B7 ${(c.weight / 10).toFixed(1)}kg` : ""}
                      </p>
                    </div>
                    {MoodIcon && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mood.color}`}>
                        <MoodIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A3A2A] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#153020] transition-colors z-40"
        data-testid="chat-fab"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <ChatSheet
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatInitialMessage(undefined); }}
        initialMessage={chatInitialMessage}
      />
    </div>
  );
}
