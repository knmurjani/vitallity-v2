import { useEffect, useState, useCallback } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  Flag,
  Heart,
  Activity,
  Brain,
  Trash2,
  Pill,
  Target,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  X,
  Bell,
  Download,
  Check,
  BarChart3,
  Send,
  MessageSquare,
  Sheet,
  BookOpen,
  ExternalLink,
  LinkIcon,
  Unlink,
  Loader2,
  Award,
  Watch,
  Utensils,
  Plug,
  Sun,
  Moon,
} from "lucide-react";
import AppTour from "@/components/app-tour";

interface SettingsData {
  user: { id: number; email: string };
  profile: any;
  goals: any[];
  conditions: any[];
  painAreas: any[];
  medications: any[];
  dietaryPrefs: any[];
  activities: any[];
  milestones: any[];
}

interface NotifPrefs {
  morningReminder: boolean;
  morningTime: string;
  lunchReminder: boolean;
  lunchTime: string;
  waterReminder: boolean;
  waterTime: string;
  eveningReminder: boolean;
  eveningTime: string;
  medicationReminder: boolean;
  medicationTime: string;
  maxPerDay: number;
}

interface NotifConfig {
  reminderHour: number;  // 1-12
  reminderAmPm: "AM" | "PM";
  reminderMethod: "telegram" | "email" | "none";
  reminderFrequency: "daily" | "weekdays" | "custom";
  customDays: number[]; // 0=Sun, 1=Mon ... 6=Sat
}

interface CalibrationAdjustment {
  disciplineGap: number;
  consistencyGap: number;
  sleepGap: number;
  tone: "encouraging" | "calibrating" | "celebrating";
  message: string;
  claimedDiscipline: number | null;
  actualLogFrequency: number;
  claimedConsistency: number | null;
  actualStreak: number;
  claimedSleepHours: number | null;
  actualAvgSleep: number | null;
}

interface CalibrationData {
  snapshot: any;
  gaps: { type: string; message: string; statedScore: number; actualMetric: number }[];
  calibrationAdjustment: CalibrationAdjustment | null;
}

const DEFAULT_NOTIF: NotifPrefs = {
  morningReminder: true, morningTime: "08:00",
  lunchReminder: true, lunchTime: "12:30",
  waterReminder: true, waterTime: "15:00",
  eveningReminder: true, eveningTime: "18:00",
  medicationReminder: false, medicationTime: "",
  maxPerDay: 3,
};

const GOAL_TYPES = ["Lose Weight", "Build Muscle", "Improve Fitness", "Better Sleep", "Reduce Stress", "Manage Condition", "Custom"];

export default function Settings() {
  const { user, logout } = useAuth();
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<SettingsData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Expandable section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Editing states
  const [editBasic, setEditBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({ name: "", age: "", heightCm: "", weightKg: "" });
  const [savingBasic, setSavingBasic] = useState(false);

  // Add condition
  const [newCondition, setNewCondition] = useState("");
  const [addingCondition, setAddingCondition] = useState(false);

  // Add medication
  const [newMedication, setNewMedication] = useState("");
  const [addingMedication, setAddingMedication] = useState(false);

  // Add goal
  const [newGoalType, setNewGoalType] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifConfig, setNotifConfig] = useState<NotifConfig>({
    reminderHour: 8,
    reminderAmPm: "AM",
    reminderMethod: "email",
    reminderFrequency: "daily",
    customDays: [1, 2, 3, 4, 5],
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Calibration
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);

  // Exporting
  const [exporting, setExporting] = useState(false);

  // Telegram
  const [telegramStatus, setTelegramStatus] = useState<{ configured: boolean; linked: boolean } | null>(null);
  const [telegramLink, setTelegramLink] = useState<{ token: string; deepLink: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Google Sheets
  const [sheetsStatus, setSheetsStatus] = useState<{ configured: boolean; connected: boolean; spreadsheetUrl: string | null } | null>(null);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // App Tour replay
  const [showTour, setShowTour] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/settings");
      const d = await res.json();
      setData(d);
    } catch {}
  }, [authFetch]);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/notifications/prefs");
      const d = await res.json();
      if (d.prefs) setNotifPrefs(d.prefs);
    } catch {}
  }, [authFetch]);

  const fetchCalibration = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/calibration");
      const d = await res.json();
      setCalibration(d);
    } catch {}
  }, [authFetch]);

  const fetchTelegramStatus = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/telegram/status");
      const d = await res.json();
      setTelegramStatus(d);
    } catch {}
  }, [authFetch]);

  const fetchSheetsStatus = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/google-sheets/status");
      const d = await res.json();
      setSheetsStatus(d);
    } catch {}
  }, [authFetch]);

  useEffect(() => {
    fetchData();
    fetchNotifs();
    fetchCalibration();
    fetchTelegramStatus();
    fetchSheetsStatus();
  }, [fetchData, fetchNotifs, fetchCalibration, fetchTelegramStatus, fetchSheetsStatus]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const profile = data?.profile;
  const goals = data?.goals || [];
  const conditions = data?.conditions || [];
  const medications = data?.medications || [];
  const milestones = data?.milestones || [];

  // Basic info edit handlers
  const startEditBasic = () => {
    setBasicForm({
      name: profile?.name || "",
      age: profile?.age?.toString() || "",
      heightCm: profile?.heightCm?.toString() || "",
      weightKg: profile?.weightKg?.toString() || "",
    });
    setEditBasic(true);
  };

  const saveBasic = async () => {
    setSavingBasic(true);
    try {
      const updates: any = {};
      if (basicForm.name) updates.name = basicForm.name;
      if (basicForm.age) updates.age = parseInt(basicForm.age);
      if (basicForm.heightCm) updates.heightCm = parseInt(basicForm.heightCm);
      if (basicForm.weightKg) updates.weightKg = parseInt(basicForm.weightKg);
      await authFetch("PUT", "/api/profile", updates);
      await fetchData();
      setEditBasic(false);
    } catch {} finally {
      setSavingBasic(false);
    }
  };

  const computedBmi = () => {
    const h = parseInt(basicForm.heightCm);
    const w = parseInt(basicForm.weightKg);
    if (h > 0 && w > 0) {
      return (w / ((h / 100) ** 2)).toFixed(1);
    }
    return null;
  };

  // Condition handlers
  const addCondition = async () => {
    if (!newCondition.trim()) return;
    setAddingCondition(true);
    try {
      await authFetch("POST", "/api/profile/conditions", { name: newCondition.trim(), isChronic: true });
      setNewCondition("");
      await fetchData();
    } catch {} finally {
      setAddingCondition(false);
    }
  };

  const removeCondition = async (id: number) => {
    try {
      await authFetch("DELETE", `/api/profile/conditions/${id}`);
      await fetchData();
    } catch {}
  };

  // Medication handlers
  const addMedication = async () => {
    if (!newMedication.trim()) return;
    setAddingMedication(true);
    try {
      await authFetch("POST", "/api/profile/medications", { name: newMedication.trim() });
      setNewMedication("");
      await fetchData();
    } catch {} finally {
      setAddingMedication(false);
    }
  };

  const removeMedication = async (id: number) => {
    try {
      await authFetch("DELETE", `/api/profile/medications/${id}`);
      await fetchData();
    } catch {}
  };

  // Goal handlers
  const addGoal = async () => {
    if (!newGoalType) return;
    setAddingGoal(true);
    try {
      await authFetch("POST", "/api/profile/goals", {
        goalType: newGoalType,
        customDescription: newGoalDesc || undefined,
      });
      setNewGoalType("");
      setNewGoalDesc("");
      await fetchData();
    } catch {} finally {
      setAddingGoal(false);
    }
  };

  const removeGoal = async (id: number) => {
    try {
      await authFetch("DELETE", `/api/profile/goals/${id}`);
      await fetchData();
    } catch {}
  };

  // Notification handlers
  const saveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      await authFetch("PUT", "/api/notifications/prefs", notifPrefs);
      await fetchNotifs();
    } catch {} finally {
      setSavingNotif(false);
    }
  };

  const saveNotifConfig = async () => {
    setSavingConfig(true);
    try {
      await authFetch("POST", "/api/settings/notifications", notifConfig);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch {} finally {
      setSavingConfig(false);
    }
  };

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await authFetch("GET", "/api/export/json");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vitallity-data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {} finally {
      setExporting(false);
    }
  };

  // Reset
  const handleReset = async () => {
    setResetting(true);
    try {
      await authFetch("POST", "/api/settings/reset");
      logout();
      setLocation("/");
    } catch {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-6"
        style={{
          background: "linear-gradient(to bottom, hsl(152 37% 16%), hsl(152 32% 24%), hsl(var(--background)))",
          borderRadius: "0 0 28px 28px",
        }}
      >
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
              aria-label="Back to dashboard"
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-display text-xl font-bold text-white">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-5 py-6 space-y-3">

        {/* Dark Mode Toggle */}
        <div className="glass-card p-4 flex items-center justify-between" data-testid="dark-mode-toggle-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {isDark ? <Moon className="w-4.5 h-4.5 text-primary" /> : <Sun className="w-4.5 h-4.5 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{isDark ? "Dark Mode" : "Light Mode"}</p>
              <p className="text-xs text-text-mid">Switch appearance</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              isDark ? "bg-primary" : "bg-border"
            }`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="dark-mode-toggle"
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                isDark ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* 1. Basic Info Section */}
        <div className="glass-card overflow-hidden" data-testid="basic-info-section">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Basic Info"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Basic Info</p>
              <p className="text-xs text-text-mid truncate">{profile?.name || "User"} {profile?.age ? `· ${profile.age}y` : ""} {profile?.weightKg ? `· ${profile.weightKg}kg` : ""}</p>
            </div>
            {expandedSection === "basic" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "basic" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {!editBasic ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-mid text-xs">Name</p>
                      <p className="font-semibold text-foreground">{profile?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-text-mid text-xs">Age</p>
                      <p className="font-semibold text-foreground">{profile?.age || "-"}</p>
                    </div>
                    <div>
                      <p className="text-text-mid text-xs">Height</p>
                      <p className="font-semibold text-foreground">{profile?.heightCm ? `${profile.heightCm} cm` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-text-mid text-xs">Weight</p>
                      <p className="font-semibold text-foreground">{profile?.weightKg ? `${profile.weightKg} kg` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-text-mid text-xs">BMI</p>
                      <p className="font-semibold text-foreground">{profile?.bmi || "-"}</p>
                    </div>
                    <div>
                      <p className="text-text-mid text-xs">Gender</p>
                      <p className="font-semibold text-foreground capitalize">{profile?.gender || "-"}</p>
                    </div>
                  </div>
                  <button onClick={startEditBasic} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary" aria-label="Edit basic info">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="vitallity-label">Name</label>
                    <input type="text" value={basicForm.name} onChange={e => setBasicForm(p => ({ ...p, name: e.target.value }))} className="vitallity-input w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="vitallity-label">Age</label>
                      <input type="number" value={basicForm.age} onChange={e => setBasicForm(p => ({ ...p, age: e.target.value }))} className="vitallity-input w-full" />
                    </div>
                    <div>
                      <label className="vitallity-label">Height (cm)</label>
                      <input type="number" value={basicForm.heightCm} onChange={e => setBasicForm(p => ({ ...p, heightCm: e.target.value }))} className="vitallity-input w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="vitallity-label">Weight (kg)</label>
                    <input type="number" value={basicForm.weightKg} onChange={e => setBasicForm(p => ({ ...p, weightKg: e.target.value }))} className="vitallity-input w-full" />
                    {computedBmi() && (
                      <p className="text-xs text-text-mid mt-1">Estimated BMI: <span className="font-semibold text-foreground">{computedBmi()}</span></p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveBasic} disabled={savingBasic} className="vitallity-btn-primary flex-1 text-sm py-2 disabled:opacity-50" aria-label="Save basic info">
                      {savingBasic ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditBasic(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-semibold text-foreground" aria-label="Cancel editing">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Conditions Section */}
        <div className="glass-card overflow-hidden" data-testid="conditions-section">
          <button
            onClick={() => toggleSection("conditions")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Conditions"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--rose))]/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4.5 h-4.5 text-[hsl(var(--rose))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Conditions</p>
              <p className="text-xs text-text-mid">{conditions.length} condition{conditions.length !== 1 ? "s" : ""}</p>
            </div>
            {expandedSection === "conditions" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "conditions" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {conditions.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {conditions.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-foreground">{c.conditionName} {c.isChronic && <span className="text-xs text-text-mid">(chronic)</span>}</span>
                      <button onClick={() => removeCondition(c.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[hsl(var(--rose))]/10" aria-label={`Remove ${c.conditionName}`}>
                        <X className="w-3.5 h-3.5 text-[hsl(var(--rose))]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-mid mb-3">No conditions added</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add condition..."
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCondition()}
                  className="vitallity-input flex-1 text-sm"
                />
                <button onClick={addCondition} disabled={addingCondition || !newCondition.trim()} className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-50" aria-label="Add condition">
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Medications Section */}
        <div className="glass-card overflow-hidden" data-testid="medications-section">
          <button
            onClick={() => toggleSection("medications")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Medications"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--violet))]/10 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4.5 h-4.5 text-[hsl(var(--violet))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Medications</p>
              <p className="text-xs text-text-mid">{medications.length} medication{medications.length !== 1 ? "s" : ""}</p>
            </div>
            {expandedSection === "medications" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "medications" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {medications.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {medications.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-foreground">{m.medicationName}</span>
                      <button onClick={() => removeMedication(m.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[hsl(var(--rose))]/10" aria-label={`Remove ${m.medicationName}`}>
                        <X className="w-3.5 h-3.5 text-[hsl(var(--rose))]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-mid mb-3">No medications added</p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add medication..."
                  value={newMedication}
                  onChange={e => setNewMedication(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addMedication()}
                  className="vitallity-input flex-1 text-sm"
                />
                <button onClick={addMedication} disabled={addingMedication || !newMedication.trim()} className="w-9 h-9 rounded-xl bg-[hsl(var(--violet))]/10 flex items-center justify-center disabled:opacity-50" aria-label="Add medication">
                  <Plus className="w-4 h-4 text-[hsl(var(--violet))]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Goals Section */}
        <div className="glass-card overflow-hidden" data-testid="goals-section">
          <button
            onClick={() => toggleSection("goals")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Goals"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4.5 h-4.5 text-[hsl(var(--accent))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Goals</p>
              <p className="text-xs text-text-mid">{goals.length} goal{goals.length !== 1 ? "s" : ""}</p>
            </div>
            {expandedSection === "goals" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "goals" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {goals.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {goals.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-medium">{g.goalType}</span>
                        {g.customDescription && <p className="text-xs text-text-mid truncate">{g.customDescription}</p>}
                        {g.targetValue && <p className="text-xs text-text-mid">{g.targetValue}</p>}
                      </div>
                      <button onClick={() => removeGoal(g.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[hsl(var(--rose))]/10 flex-shrink-0" aria-label={`Remove ${g.goalType}`}>
                        <X className="w-3.5 h-3.5 text-[hsl(var(--rose))]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-mid mb-3">No goals added</p>
              )}
              <div className="space-y-2">
                <select
                  value={newGoalType}
                  onChange={e => setNewGoalType(e.target.value)}
                  className="vitallity-input w-full text-sm"
                >
                  <option value="">Select goal type...</option>
                  {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {newGoalType === "Custom" && (
                  <input
                    type="text"
                    placeholder="Describe your goal..."
                    value={newGoalDesc}
                    onChange={e => setNewGoalDesc(e.target.value)}
                    className="vitallity-input w-full text-sm"
                  />
                )}
                {newGoalType && (
                  <button onClick={addGoal} disabled={addingGoal} className="vitallity-btn-primary w-full text-sm py-2 disabled:opacity-50" aria-label="Add goal">
                    {addingGoal ? "Adding..." : "Add Goal"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. Milestones Section */}
        {milestones.length > 0 && (
          <div className="glass-card overflow-hidden" data-testid="milestones-section">
            <button
              onClick={() => toggleSection("milestones")}
              className="w-full flex items-center gap-3 p-4 text-left"
              aria-label="Milestones"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Milestones</p>
                <p className="text-xs text-text-mid">{milestones.length} milestone{milestones.length !== 1 ? "s" : ""}</p>
              </div>
              {expandedSection === "milestones" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
            </button>
            {expandedSection === "milestones" && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                {milestones.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setLocation(`/milestone/${m.id}`)}
                    className="w-full flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5 text-left"
                    aria-label={`View milestone: ${m.title}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.status === "completed" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    }`}>
                      {m.status === "completed" ? <Check className="w-3.5 h-3.5" /> : <Flag className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      <p className="text-xs text-text-mid truncate">{m.target} {m.timeframe && `· ${m.timeframe}`}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      m.status === "completed" ? "bg-primary/10 text-primary" :
                      m.status === "paused" ? "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" :
                      m.status === "active" ? "bg-primary/10 text-primary" :
                      "bg-muted text-text-mid"
                    }`}>{m.status || "planned"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Calibration Section */}
        <div className="glass-card overflow-hidden" data-testid="calibration-section">
          <button
            onClick={() => toggleSection("calibration")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Calibration"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--slate))]/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4.5 h-4.5 text-[hsl(var(--slate))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Calibration</p>
              <p className="text-xs text-text-mid">Self-assessment vs actual</p>
            </div>
            {expandedSection === "calibration" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "calibration" && (
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">

              {/* Self-assessment vs reality comparison bars */}
              {calibration?.calibrationAdjustment && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-3">Your self-assessment vs reality</p>
                  <div className="space-y-3">

                    {/* Discipline bar */}
                    {calibration.calibrationAdjustment.claimedDiscipline !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-text-mid">Discipline</span>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-text-mid">Claimed <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.claimedDiscipline}/10</span></span>
                            <span className="text-text-mid">Actual <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.actualLogFrequency}%</span> logged</span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--accent))]/40"
                            style={{ width: `${(calibration.calibrationAdjustment.claimedDiscipline / 10) * 100}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--accent))]"
                            style={{ width: `${Math.min(100, calibration.calibrationAdjustment.actualLogFrequency)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Consistency bar */}
                    {calibration.calibrationAdjustment.claimedConsistency !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-text-mid">Consistency</span>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-text-mid">Claimed <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.claimedConsistency}/10</span></span>
                            <span className="text-text-mid">Actual <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.actualStreak} day streak</span></span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-primary/40"
                            style={{ width: `${(calibration.calibrationAdjustment.claimedConsistency / 10) * 100}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, (calibration.calibrationAdjustment.actualStreak / 14) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Sleep bar */}
                    {calibration.calibrationAdjustment.claimedSleepHours !== null && calibration.calibrationAdjustment.actualAvgSleep !== null && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-text-mid">Sleep</span>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-text-mid">Claimed <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.claimedSleepHours} hrs</span></span>
                            <span className="text-text-mid">Actual <span className="font-semibold text-foreground">{calibration.calibrationAdjustment.actualAvgSleep} hrs</span></span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--slate))]/40"
                            style={{ width: `${Math.min(100, (calibration.calibrationAdjustment.claimedSleepHours / 10) * 100)}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--slate))]"
                            style={{ width: `${Math.min(100, (calibration.calibrationAdjustment.actualAvgSleep / 10) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Calibration tone message */}
                  <div className={`mt-3 rounded-lg px-3 py-2.5 text-xs ${
                    calibration.calibrationAdjustment.tone === "celebrating"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : calibration.calibrationAdjustment.tone === "encouraging"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-[hsl(var(--slate))]/10 text-foreground"
                  }`}>
                    <p className="font-semibold mb-0.5">
                      {calibration.calibrationAdjustment.tone === "celebrating"
                        ? "You are doing better than you expected"
                        : calibration.calibrationAdjustment.tone === "encouraging"
                        ? "Let's recalibrate"
                        : "Your estimates were close to reality"}
                    </p>
                    <p className="leading-relaxed">{calibration.calibrationAdjustment.message}</p>
                  </div>
                </div>
              )}

              {/* Existing knowledge self-assessment bars */}
              <div className="grid grid-cols-2 gap-3">
                {profile?.nutritionKnowledge != null && (
                  <div>
                    <p className="text-text-mid text-xs">Nutrition Knowledge</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(profile.nutritionKnowledge / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{profile.nutritionKnowledge}/10</span>
                    </div>
                  </div>
                )}
                {profile?.exerciseKnowledge != null && (
                  <div>
                    <p className="text-text-mid text-xs">Exercise Knowledge</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(profile.exerciseKnowledge / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{profile.exerciseKnowledge}/10</span>
                    </div>
                  </div>
                )}
                {profile?.selfDiscipline != null && (
                  <div>
                    <p className="text-text-mid text-xs">Self Discipline</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[hsl(var(--accent))] rounded-full" style={{ width: `${(profile.selfDiscipline / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{profile.selfDiscipline}/10</span>
                    </div>
                  </div>
                )}
                {profile?.consistencyHistory != null && (
                  <div>
                    <p className="text-text-mid text-xs">Consistency</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[hsl(var(--accent))] rounded-full" style={{ width: `${(profile.consistencyHistory / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{profile.consistencyHistory}/10</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected behavioral gaps */}
              {calibration?.gaps && calibration.gaps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Detected Gaps</p>
                  {calibration.gaps.map((gap, i) => (
                    <div key={i} className="bg-[hsl(var(--violet))]/5 rounded-lg px-3 py-2">
                      <p className="text-xs text-foreground">{gap.message}</p>
                      <p className="text-[10px] text-text-mid mt-0.5">Stated: {gap.statedScore}/10 · Actual: {gap.actualMetric}%</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 14-day metrics summary */}
              {calibration?.snapshot && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">14-Day Metrics</p>
                  <div className="grid grid-cols-2 gap-2">
                    {calibration.snapshot.foodLoggingPct != null && (
                      <div className="text-xs">
                        <span className="text-text-mid">Food Logging:</span> <span className="font-semibold text-foreground">{calibration.snapshot.foodLoggingPct}%</span>
                      </div>
                    )}
                    {calibration.snapshot.exerciseAdherencePct != null && (
                      <div className="text-xs">
                        <span className="text-text-mid">Exercise:</span> <span className="font-semibold text-foreground">{calibration.snapshot.exerciseAdherencePct}%</span>
                      </div>
                    )}
                    {calibration.snapshot.checkinConsistencyPct != null && (
                      <div className="text-xs">
                        <span className="text-text-mid">Consistency:</span> <span className="font-semibold text-foreground">{calibration.snapshot.checkinConsistencyPct}%</span>
                      </div>
                    )}
                    {calibration.snapshot.calorieAccuracyPct != null && (
                      <div className="text-xs">
                        <span className="text-text-mid">Calorie Accuracy:</span> <span className="font-semibold text-foreground">{calibration.snapshot.calorieAccuracyPct}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* 7. Notifications Section */}
        <div className="glass-card overflow-hidden" data-testid="notifications-section">
          <button
            onClick={() => toggleSection("notifications")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Notifications"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4.5 h-4.5 text-[hsl(var(--gold))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-text-mid">Reminder preferences</p>
            </div>
            {expandedSection === "notifications" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "notifications" && (
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <NotifToggle
                label="Morning Reminder"
                enabled={notifPrefs.morningReminder}
                time={notifPrefs.morningTime}
                onToggle={() => setNotifPrefs(p => ({ ...p, morningReminder: !p.morningReminder }))}
                onTimeChange={t => setNotifPrefs(p => ({ ...p, morningTime: t }))}
              />
              <NotifToggle
                label="Lunch Reminder"
                enabled={notifPrefs.lunchReminder}
                time={notifPrefs.lunchTime}
                onToggle={() => setNotifPrefs(p => ({ ...p, lunchReminder: !p.lunchReminder }))}
                onTimeChange={t => setNotifPrefs(p => ({ ...p, lunchTime: t }))}
              />
              <NotifToggle
                label="Water Reminder"
                enabled={notifPrefs.waterReminder}
                time={notifPrefs.waterTime}
                onToggle={() => setNotifPrefs(p => ({ ...p, waterReminder: !p.waterReminder }))}
                onTimeChange={t => setNotifPrefs(p => ({ ...p, waterTime: t }))}
              />
              <NotifToggle
                label="Evening Reminder"
                enabled={notifPrefs.eveningReminder}
                time={notifPrefs.eveningTime}
                onToggle={() => setNotifPrefs(p => ({ ...p, eveningReminder: !p.eveningReminder }))}
                onTimeChange={t => setNotifPrefs(p => ({ ...p, eveningTime: t }))}
              />
              <NotifToggle
                label="Medication Reminder"
                enabled={notifPrefs.medicationReminder}
                time={notifPrefs.medicationTime}
                onToggle={() => setNotifPrefs(p => ({ ...p, medicationReminder: !p.medicationReminder }))}
                onTimeChange={t => setNotifPrefs(p => ({ ...p, medicationTime: t }))}
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-foreground">Max reminders per day</span>
                <select
                  value={notifPrefs.maxPerDay}
                  onChange={e => setNotifPrefs(p => ({ ...p, maxPerDay: parseInt(e.target.value) }))}
                  className="vitallity-input text-xs w-16 text-center"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button onClick={saveNotifPrefs} disabled={savingNotif} className="vitallity-btn-primary w-full text-sm py-2 disabled:opacity-50" aria-label="Save notification preferences">
                {savingNotif ? "Saving..." : "Save Preferences"}
              </button>

              {/* Daily Reminder Config */}
              <div className="border-t border-border/50 pt-3 mt-1 space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Daily Check-in Reminder</p>

                {/* Time picker */}
                <div>
                  <p className="vitallity-label mb-1.5">Reminder Time</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={notifConfig.reminderHour}
                      onChange={e => setNotifConfig(p => ({ ...p, reminderHour: parseInt(e.target.value) }))}
                      className="vitallity-input w-20 text-center"
                      aria-label="Reminder hour"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <div className="flex rounded-xl overflow-hidden border border-border">
                      {(["AM", "PM"] as const).map(period => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setNotifConfig(p => ({ ...p, reminderAmPm: period }))}
                          className={`px-3 py-2 text-xs font-semibold transition-colors ${
                            notifConfig.reminderAmPm === period
                              ? "bg-primary text-white"
                              : "text-text-mid hover:bg-muted"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reminder method */}
                <div>
                  <p className="vitallity-label mb-1.5">Reminder Method</p>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { value: "telegram", label: "Telegram", available: telegramStatus?.linked },
                      { value: "email", label: "Email", available: true },
                      { value: "none", label: "None", available: true },
                    ] as const).map(opt => (
                      opt.available !== false && (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNotifConfig(p => ({ ...p, reminderMethod: opt.value }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            notifConfig.reminderMethod === opt.value
                              ? "bg-primary text-white border-primary"
                              : "border-border text-text-mid hover:border-primary/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <p className="vitallity-label mb-1.5">Frequency</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["daily", "weekdays", "custom"] as const).map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setNotifConfig(p => ({ ...p, reminderFrequency: freq }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                          notifConfig.reminderFrequency === freq
                            ? "bg-primary text-white border-primary"
                            : "border-border text-text-mid hover:border-primary/40"
                        }`}
                      >
                        {freq === "weekdays" ? "Weekdays only" : freq === "custom" ? "Custom days" : freq}
                      </button>
                    ))}
                  </div>

                  {/* Custom day selector */}
                  {notifConfig.reminderFrequency === "custom" && (
                    <div className="flex gap-1.5 mt-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNotifConfig(p => ({
                            ...p,
                            customDays: p.customDays.includes(idx)
                              ? p.customDays.filter(d => d !== idx)
                              : [...p.customDays, idx].sort(),
                          }))}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                            notifConfig.customDays.includes(idx)
                              ? "bg-primary text-white"
                              : "bg-muted text-text-mid"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={saveNotifConfig}
                  disabled={savingConfig}
                  className="vitallity-btn-primary w-full text-sm py-2 disabled:opacity-50"
                  aria-label="Save reminder configuration"
                >
                  {savingConfig ? "Saving..." : configSaved ? "Saved" : "Save Reminder Config"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 8. Data Section */}
        <div className="glass-card overflow-hidden" data-testid="data-section">
          <button
            onClick={() => toggleSection("data")}
            className="w-full flex items-center gap-3 p-4 text-left"
            aria-label="Data"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--slate))]/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-4.5 h-4.5 text-[hsl(var(--slate))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Data</p>
              <p className="text-xs text-text-mid">Export or delete your data</p>
            </div>
            {expandedSection === "data" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "data" && (
            <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-foreground disabled:opacity-50"
                aria-label="Export all data as JSON"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export All Data (JSON)"}
              </button>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[hsl(var(--rose))]/30 text-[hsl(var(--rose))] font-semibold text-sm"
                  data-testid="reset-btn"
                  aria-label="Delete account"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              ) : (
                <div className="p-4 rounded-xl border-2 border-[hsl(var(--rose))]/30">
                  <p className="text-sm font-semibold text-foreground mb-1">Are you sure?</p>
                  <p className="text-xs text-text-mid mb-4">
                    This will permanently delete all your data including check-ins, goals, milestones, and profile information. You will need to complete onboarding again.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground"
                      data-testid="reset-cancel"
                      aria-label="Cancel deletion"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="flex-1 py-2.5 rounded-xl bg-[hsl(var(--rose))] text-white text-sm font-semibold disabled:opacity-50"
                      data-testid="reset-confirm"
                      aria-label="Confirm deletion"
                    >
                      {resetting ? "Deleting..." : "Yes, Delete Everything"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Integrations Section */}
        <div className="mt-2 mb-1">
          <div className="flex items-center gap-2 px-1">
            <Plug className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Integrations</h2>
          </div>
        </div>

        {/* Connected Services */}

        {/* Google Sheets */}
        <div className="glass-card overflow-hidden" data-testid="sheets-section">
          <button
            className="w-full flex items-center gap-3 p-4"
            onClick={() => toggleSection("sheets")}
          >
            <div className="w-9 h-9 rounded-full bg-[#0F9D58]/10 flex items-center justify-center flex-shrink-0">
              <Sheet className="w-4.5 h-4.5 text-[#0F9D58]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Google Sheets</p>
              <p className="text-xs text-text-mid">Auto-sync daily log data</p>
            </div>
            {sheetsStatus?.connected ? (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Connected</span>
            ) : (
              expandedSection === "sheets" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />
            )}
          </button>
          {expandedSection === "sheets" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {sheetsStatus?.configured ? (
                sheetsStatus.connected ? (
                  <div className="space-y-3">
                    {sheetsStatus.spreadsheetUrl && (
                      <a
                        href={sheetsStatus.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary font-medium flex items-center gap-1"
                        data-testid="sheets-link"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Spreadsheet
                      </a>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setSyncingSheets(true);
                          try {
                            await authFetch("POST", "/api/google-sheets/sync");
                          } catch {} finally {
                            setSyncingSheets(false);
                          }
                        }}
                        className="vitallity-btn-ghost text-xs py-2 px-3 flex items-center gap-1"
                        disabled={syncingSheets}
                        data-testid="sheets-sync"
                      >
                        {syncingSheets ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sheet className="w-3 h-3" />}
                        Sync Now
                      </button>
                      <button
                        onClick={async () => {
                          await authFetch("POST", "/api/google-sheets/disconnect");
                          fetchSheetsStatus();
                        }}
                        className="text-xs text-[hsl(var(--rose))] font-medium flex items-center gap-1"
                        data-testid="sheets-disconnect"
                      >
                        <Unlink className="w-3 h-3" /> Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const res = await authFetch("GET", "/api/google-sheets/auth-url");
                        const d = await res.json();
                        window.open(d.url, "_blank", "width=500,height=600");
                      } catch {}
                    }}
                    className="vitallity-btn-primary text-xs py-2 px-4 flex items-center gap-1"
                    data-testid="sheets-connect"
                  >
                    <LinkIcon className="w-3 h-3" /> Connect Google Sheets
                  </button>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Google Sheets sync requires server configuration</p>
              )}
            </div>
          )}
        </div>

        {/* Telegram */}
        <div className="glass-card overflow-hidden" data-testid="telegram-section">
          <button
            className="w-full flex items-center gap-3 p-4"
            onClick={() => toggleSection("telegram")}
          >
            <div className="w-9 h-9 rounded-full bg-[#0088cc]/10 flex items-center justify-center flex-shrink-0">
              <Send className="w-4.5 h-4.5 text-[#0088cc]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Telegram</p>
              <p className="text-xs text-text-mid">Check-ins & reminders</p>
            </div>
            {telegramStatus?.linked ? (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Connected</span>
            ) : (
              expandedSection === "telegram" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />
            )}
          </button>
          {expandedSection === "telegram" && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {telegramStatus?.configured ? (
                telegramStatus.linked ? (
                  <div>
                    <button
                      onClick={async () => {
                        await authFetch("POST", "/api/telegram/unlink");
                        fetchTelegramStatus();
                      }}
                      className="text-xs text-[hsl(var(--rose))] font-medium flex items-center gap-1"
                      data-testid="telegram-unlink"
                    >
                      <Unlink className="w-3 h-3" /> Disconnect
                    </button>
                  </div>
                ) : telegramLink ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Open Telegram and message the bot with this code:
                    </p>
                    <p className="text-sm font-mono font-bold text-foreground mb-2">{telegramLink.token}</p>
                    <a
                      href={telegramLink.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vitallity-btn-primary text-xs py-2 px-4 inline-flex items-center gap-1"
                      data-testid="telegram-deep-link"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Telegram
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setGeneratingLink(true);
                      try {
                        const res = await authFetch("POST", "/api/telegram/generate-link");
                        const d = await res.json();
                        if (d.deepLink) {
                          setTelegramLink(d);
                        } else {
                          alert(d.message || "Telegram is not configured on the server. Add TELEGRAM_BOT_TOKEN in Railway env vars.");
                        }
                      } catch (e: any) {
                        alert("Could not connect Telegram. Check that TELEGRAM_BOT_TOKEN is set in Railway environment variables.");
                      } finally {
                        setGeneratingLink(false);
                      }
                    }}
                    className="vitallity-btn-primary text-xs py-2 px-4 flex items-center gap-1"
                    disabled={generatingLink}
                    data-testid="telegram-connect"
                  >
                    {generatingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                    Connect Telegram
                  </button>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Telegram integration not configured</p>
              )}
            </div>
          )}
        </div>

        {/* Coming Soon Integrations */}
        <div className="glass-card p-4 space-y-3" data-testid="coming-soon-integrations">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Coming Soon</p>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <p className="text-xs text-gray-500">Messaging & reminders</p>
            </div>
            <span className="text-[10px] font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">Coming Soon</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0070F3]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0070F3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/><path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h6v2H7z" fill="white"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">MyFitnessPal</p>
              <p className="text-xs text-gray-500">Nutrition sync</p>
            </div>
            <span className="text-[10px] font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">Coming Soon</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4A90D9]/10 flex items-center justify-center flex-shrink-0">
              <Watch className="w-4.5 h-4.5 text-[#4A90D9]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Health Trackers</p>
              <p className="text-xs text-gray-500">Apple Health, Samsung, Fitbit, Garmin</p>
            </div>
            <span className="text-[10px] font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">Coming Soon</span>
          </div>
        </div>

        {/* App Guide Section */}
        <div className="glass-card overflow-hidden" data-testid="app-guide-section">
          <button
            className="w-full flex items-center gap-3 p-4"
            onClick={() => toggleSection("guide")}
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="flex-1 text-left text-sm font-semibold">App Guide</span>
            {expandedSection === "guide" ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
          </button>
          {expandedSection === "guide" && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowTour(true)}
                className="vitallity-btn-ghost text-xs py-2 px-4 flex items-center gap-1"
                data-testid="replay-tour"
              >
                <BookOpen className="w-3 h-3" /> Replay App Tour
              </button>
            </div>
          )}
        </div>

        {/* Rewards / Badges */}
        <button
          onClick={() => setLocation("/badges")}
          className="glass-card w-full p-4 flex items-center gap-3"
          data-testid="badges-link"
        >
          <Award className="w-4 h-4 text-primary" />
          <span className="flex-1 text-left text-sm font-semibold">Rewards & Badges</span>
          <ChevronDown className="w-4 h-4 text-text-mid -rotate-90" />
        </button>

        {/* Logout */}
        <button
          onClick={() => { logout(); setLocation("/"); }}
          className="w-full py-3 text-sm font-semibold text-text-mid mt-4"
          data-testid="logout-btn"
          aria-label="Log out"
        >
          Log Out
        </button>

        {/* Tour overlay */}
        {showTour && <AppTour onComplete={() => setShowTour(false)} />}
      </div>
    </div>
  );
}

function NotifToggle({ label, enabled, time, onToggle, onTimeChange }: {
  label: string;
  enabled: boolean;
  time: string;
  onToggle: () => void;
  onTimeChange: (t: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
        aria-label={`Toggle ${label}`}
      >
        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-[3px] transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
      </button>
      <span className="text-sm text-foreground flex-1">{label}</span>
      {enabled && (
        <input
          type="time"
          value={time}
          onChange={e => onTimeChange(e.target.value)}
          className="vitallity-input text-xs w-24 text-center"
          aria-label={`${label} time`}
        />
      )}
    </div>
  );
}
