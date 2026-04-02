import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { RangeSlider } from "@/components/ui/range-slider";
import { useBadgeNotifications } from "@/contexts/badge-context";
import {
  ArrowLeft, Save, Loader2, ChevronLeft, ChevronRight,
  Droplets, Footprints, Dumbbell, Pill, Moon, Brain,
  Heart, Zap, AlertTriangle, Camera, X,
} from "lucide-react";

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateISO(new Date());
}

interface DailyLogData {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  fiber: number | null;
  waterMl: number | null;
  steps: number | null;
  activeMinutes: number | null;
  activityType: string;
  medication: string;
  sleepHours: number | null;
  sleepQuality: number;
  stressLevel: number;
  mood: number;
  energyLevel: number;
  painLevel: number;
  notes: string;
}

const emptyLog: DailyLogData = {
  calories: null, protein: null, carbs: null, fat: null,
  sugar: null, fiber: null, waterMl: null,
  steps: null, activeMinutes: null, activityType: "", medication: "",
  sleepHours: null, sleepQuality: 5,
  stressLevel: 5, mood: 5, energyLevel: 5, painLevel: 0,
  notes: "",
};

function cellColor(value: number | null, thresholds: { good: number; warn: number; reverse?: boolean }): string {
  if (value === null || value === undefined) return "";
  if (thresholds.reverse) {
    if (value <= thresholds.good) return "text-primary";
    if (value <= thresholds.warn) return "text-[hsl(var(--gold))]";
    return "text-[hsl(var(--rose))]";
  }
  if (value >= thresholds.good) return "text-primary";
  if (value >= thresholds.warn) return "text-[hsl(var(--gold))]";
  return "text-[hsl(var(--rose))]";
}

export default function DailyLog() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const { processBadgeResponse } = useBadgeNotifications();

  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [data, setData] = useState<DailyLogData>({ ...emptyLog });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [mealPhotoLoading, setMealPhotoLoading] = useState(false);
  const mealPhotoRef = useRef<HTMLInputElement>(null);

  const handleMealPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMealPhotoLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxW = 800;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL("image/jpeg", 0.8);
          try {
            const res = await authFetch("POST", "/api/meal-photo/analyze", { imageData });
            const nutrition = await res.json();
            if (nutrition.calories) {
              setData(prev => ({
                ...prev,
                calories: nutrition.calories,
                protein: nutrition.protein || prev.protein,
                carbs: nutrition.carbs || prev.carbs,
                fat: nutrition.fat || prev.fat,
              }));
            }
          } catch {}
          setMealPhotoLoading(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setMealPhotoLoading(false);
    }
  };

  // Load log for selected date
  const loadLog = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await authFetch("GET", `/api/daily-log/${date}`);
      const json = await res.json();
      if (json.log) {
        const l = json.log;
        setData({
          calories: l.calories, protein: l.protein, carbs: l.carbs,
          fat: l.fat, sugar: l.sugar, fiber: l.fiber, waterMl: l.waterMl,
          steps: l.steps, activeMinutes: l.activeMinutes,
          activityType: l.activityType || "",
          medication: l.medication || "",
          sleepHours: l.sleepHours, sleepQuality: l.sleepQuality || 5,
          stressLevel: l.stressLevel || 5, mood: l.mood || 5,
          energyLevel: l.energyLevel || 5, painLevel: l.painLevel || 0,
          notes: l.notes || "",
        });
      } else {
        setData({ ...emptyLog });
      }
    } catch {
      setData({ ...emptyLog });
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // Load history (last 14 days)
  const loadHistory = useCallback(async () => {
    try {
      const end = formatDateISO(new Date());
      const start = formatDateISO(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
      const res = await authFetch("GET", `/api/daily-logs?start=${start}&end=${end}`);
      const json = await res.json();
      setHistory(json.logs || []);
    } catch {
      setHistory([]);
    }
  }, [authFetch]);

  useEffect(() => {
    loadLog(selectedDate);
  }, [selectedDate, loadLog]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const goDay = (delta: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDateISO(d));
  };

  const numInput = (field: keyof DailyLogData, val: string) => {
    const n = val === "" ? null : parseFloat(val);
    setData(prev => ({ ...prev, [field]: n }));
  };

  const addWater = (ml: number) => {
    setData(prev => ({ ...prev, waterMl: (prev.waterMl || 0) + ml }));
  };

  const saveLog = async () => {
    setSaving(true);
    try {
      const res = await authFetch("POST", "/api/daily-log", {
        date: selectedDate,
        ...data,
      });
      const result = await res.json();
      processBadgeResponse(result);
      await loadHistory();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="daily-log-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2C5E3F] to-[#3A7A52] px-5 pt-5 pb-6">
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
              aria-label="Back to dashboard"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-display text-xl font-bold text-white">Daily Log</h1>
          </div>

          {/* Date picker */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => goDay(-1)}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
              aria-label="Previous day"
              data-testid="prev-day"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <div className="text-center">
              <p className="text-white font-display font-bold text-lg" data-testid="selected-date">
                {isToday(selectedDate) ? "Today" : formatDateDisplay(selectedDate)}
              </p>
              {!isToday(selectedDate) && (
                <p className="text-white/60 text-xs">{selectedDate}</p>
              )}
            </div>
            <button
              onClick={() => goDay(1)}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
              disabled={isToday(selectedDate)}
              aria-label="Next day"
              data-testid="next-day"
            >
              <ChevronRight className={`w-4 h-4 ${isToday(selectedDate) ? "text-white/30" : "text-white"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[560px] mx-auto px-5 py-6 space-y-5 pb-28">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Nutrition Section */}
            <div className="glass-card p-5" data-testid="section-nutrition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-display font-bold text-foreground">Nutrition</h2>
                </div>
                {/* Meal Photo Button */}
                <div>
                  <input ref={mealPhotoRef} type="file" accept="image/*" capture="environment" onChange={handleMealPhoto} className="hidden" />
                  <button
                    type="button"
                    onClick={() => mealPhotoRef.current?.click()}
                    disabled={mealPhotoLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1.5 hover:bg-primary/15 transition-colors active:scale-[0.97] disabled:opacity-50"
                    data-testid="meal-photo-btn"
                  >
                    {mealPhotoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {mealPhotoLoading ? "Analyzing..." : "Snap Meal"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="vitallity-label">Calories</label>
                  <input
                    type="number"
                    value={data.calories ?? ""}
                    onChange={e => numInput("calories", e.target.value)}
                    placeholder="Total calories"
                    className="vitallity-input"
                    data-testid="input-calories"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="vitallity-label">Protein (g)</label>
                    <input
                      type="number"
                      value={data.protein ?? ""}
                      onChange={e => numInput("protein", e.target.value)}
                      placeholder="g"
                      className="vitallity-input"
                      data-testid="input-protein"
                    />
                  </div>
                  <div>
                    <label className="vitallity-label">Carbs (g)</label>
                    <input
                      type="number"
                      value={data.carbs ?? ""}
                      onChange={e => numInput("carbs", e.target.value)}
                      placeholder="g"
                      className="vitallity-input"
                      data-testid="input-carbs"
                    />
                  </div>
                  <div>
                    <label className="vitallity-label">Fat (g)</label>
                    <input
                      type="number"
                      value={data.fat ?? ""}
                      onChange={e => numInput("fat", e.target.value)}
                      placeholder="g"
                      className="vitallity-input"
                      data-testid="input-fat"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="vitallity-label">Sugar (g)</label>
                    <input
                      type="number"
                      value={data.sugar ?? ""}
                      onChange={e => numInput("sugar", e.target.value)}
                      placeholder="g"
                      className="vitallity-input"
                      data-testid="input-sugar"
                    />
                  </div>
                  <div>
                    <label className="vitallity-label">Fiber (g)</label>
                    <input
                      type="number"
                      value={data.fiber ?? ""}
                      onChange={e => numInput("fiber", e.target.value)}
                      placeholder="g"
                      className="vitallity-input"
                      data-testid="input-fiber"
                    />
                  </div>
                </div>

                {/* Water */}
                <div>
                  <label className="vitallity-label">Water (ml)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={data.waterMl ?? ""}
                      onChange={e => numInput("waterMl", e.target.value)}
                      placeholder="ml"
                      className="vitallity-input flex-1"
                      data-testid="input-water"
                    />
                    <button
                      type="button"
                      onClick={() => addWater(250)}
                      className="vitallity-btn-ghost text-xs px-3 py-2 flex items-center gap-1"
                      data-testid="water-add-250"
                    >
                      <Droplets className="w-3 h-3" /> +250
                    </button>
                    <button
                      type="button"
                      onClick={() => addWater(500)}
                      className="vitallity-btn-ghost text-xs px-3 py-2 flex items-center gap-1"
                      data-testid="water-add-500"
                    >
                      <Droplets className="w-3 h-3" /> +500
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Section */}
            <div className="glass-card p-5" data-testid="section-activity">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-[hsl(var(--accent))]" />
                </div>
                <h2 className="font-display font-bold text-foreground">Activity</h2>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="vitallity-label">Steps</label>
                    <input
                      type="number"
                      value={data.steps ?? ""}
                      onChange={e => numInput("steps", e.target.value)}
                      placeholder="Steps"
                      className="vitallity-input"
                      data-testid="input-steps"
                    />
                  </div>
                  <div>
                    <label className="vitallity-label">Active Min</label>
                    <input
                      type="number"
                      value={data.activeMinutes ?? ""}
                      onChange={e => numInput("activeMinutes", e.target.value)}
                      placeholder="Minutes"
                      className="vitallity-input"
                      data-testid="input-active-minutes"
                    />
                  </div>
                </div>
                <div>
                  <label className="vitallity-label">Activity Type</label>
                  <input
                    type="text"
                    value={data.activityType}
                    onChange={e => setData(prev => ({ ...prev, activityType: e.target.value }))}
                    placeholder="What exercise / activity?"
                    className="vitallity-input"
                    data-testid="input-activity-type"
                  />
                </div>
              </div>
            </div>

            {/* Medication Section */}
            <div className="glass-card p-5" data-testid="section-medication">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--violet))]/10 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-[hsl(var(--violet))]" />
                </div>
                <h2 className="font-display font-bold text-foreground">Medication</h2>
              </div>
              <input
                type="text"
                value={data.medication}
                onChange={e => setData(prev => ({ ...prev, medication: e.target.value }))}
                placeholder="Medications taken today"
                className="vitallity-input"
                data-testid="input-medication"
              />
            </div>

            {/* Sleep Section */}
            <div className="glass-card p-5" data-testid="section-sleep">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--slate))]/10 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-[hsl(var(--slate))]" />
                </div>
                <h2 className="font-display font-bold text-foreground">Sleep</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="vitallity-label">Hours Slept</label>
                  <input
                    type="number"
                    step="0.5"
                    value={data.sleepHours ?? ""}
                    onChange={e => numInput("sleepHours", e.target.value)}
                    placeholder="Hours"
                    className="vitallity-input w-32"
                    data-testid="input-sleep-hours"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Sleep Quality</p>
                  <RangeSlider
                    value={data.sleepQuality}
                    onChange={v => setData(prev => ({ ...prev, sleepQuality: v }))}
                    leftLabel="Poor"
                    rightLabel="Excellent"
                    testId="slider-sleep-quality"
                  />
                </div>
              </div>
            </div>

            {/* Wellness Section */}
            <div className="glass-card p-5" data-testid="section-wellness">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--rose))]/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[hsl(var(--rose))]" />
                </div>
                <h2 className="font-display font-bold text-foreground">Wellness</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Stress</p>
                  <RangeSlider
                    value={data.stressLevel}
                    onChange={v => setData(prev => ({ ...prev, stressLevel: v }))}
                    leftLabel="Calm"
                    rightLabel="Very stressed"
                    testId="slider-stress"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Mood</p>
                  <RangeSlider
                    value={data.mood}
                    onChange={v => setData(prev => ({ ...prev, mood: v }))}
                    leftLabel="Low"
                    rightLabel="Great"
                    testId="slider-mood"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Energy</p>
                  <RangeSlider
                    value={data.energyLevel}
                    onChange={v => setData(prev => ({ ...prev, energyLevel: v }))}
                    leftLabel="Exhausted"
                    rightLabel="Energized"
                    testId="slider-energy"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Pain</p>
                  <RangeSlider
                    value={data.painLevel}
                    onChange={v => setData(prev => ({ ...prev, painLevel: v }))}
                    min={0}
                    leftLabel="None"
                    rightLabel="Severe"
                    testId="slider-pain"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="glass-card p-5" data-testid="section-notes">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-display font-bold text-foreground">Notes</h2>
              </div>
              <textarea
                value={data.notes}
                onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Anything to note about today..."
                className="vitallity-input resize-none"
                data-testid="input-notes"
              />
            </div>

            {/* History Table */}
            {history.length > 0 && (
              <div data-testid="history-section">
                <h2 className="font-display font-bold text-foreground mb-3">Recent History</h2>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-text-light font-medium">Date</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Cal</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Prot</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Steps</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Sleep</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Stress</th>
                        <th className="text-right py-2 px-2 text-text-light font-medium">Mood</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row: any) => (
                        <tr
                          key={row.date}
                          className={`border-b border-border/50 cursor-pointer hover:bg-primary/5 transition-colors ${
                            row.date === selectedDate ? "bg-primary/8" : ""
                          }`}
                          onClick={() => setSelectedDate(row.date)}
                          data-testid={`history-row-${row.date}`}
                        >
                          <td className="py-2 px-2 font-medium">{formatDateDisplay(row.date)}</td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.calories, { good: 1500, warn: 1000 })}`}>
                            {row.calories ?? "-"}
                          </td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.protein, { good: 50, warn: 30 })}`}>
                            {row.protein ?? "-"}
                          </td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.steps, { good: 8000, warn: 4000 })}`}>
                            {row.steps ?? "-"}
                          </td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.sleepHours, { good: 7, warn: 5 })}`}>
                            {row.sleepHours ?? "-"}
                          </td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.stressLevel, { good: 3, warn: 6, reverse: true })}`}>
                            {row.stressLevel ?? "-"}
                          </td>
                          <td className={`py-2 px-2 text-right ${cellColor(row.mood, { good: 7, warn: 4 })}`}>
                            {row.mood ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save button fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-5 py-4">
        <div className="max-w-[560px] mx-auto">
          <button
            type="button"
            onClick={saveLog}
            disabled={saving || loading}
            className="vitallity-btn-primary w-full flex items-center justify-center gap-2"
            data-testid="save-log"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Log
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
