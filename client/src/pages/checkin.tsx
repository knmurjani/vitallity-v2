import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Zap,
  Heart,
  Brain,
  Moon,
  AlertTriangle,
  Droplets,
  UtensilsCrossed,
  Activity,
  Target,
  X,
  Plus,
  Minus,
  Search,
  ChevronDown,
} from "lucide-react";
import { FOOD_DATABASE, searchFoods, type FoodItem } from "@shared/foods";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ==================== TYPES ====================
interface CheckInData {
  id: number;
  energy: number | null;
  mood: number | null;
  stress: number | null;
  sleepQuality: number | null;
  weight: number | null;
  painLevel: number | null;
  skinRating: number | null;
  painNotes: string | null;
  helpRequest: string | null;
  exerciseTypes: string | null;
  exerciseDuration: number | null;
  traveling: boolean | null;
  plans: string | null;
  notes: string | null;
  totalCalories: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
  totalWaterMl: number | null;
  insightsJson: string | null;
}

interface FoodLogEntry {
  id: number;
  foodName: string;
  mealType: string;
  quantity: string;
  unit: string;
  source: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WaterLogEntry {
  id: number;
  label: string;
  amountMl: number;
  quantity: number;
}

interface InsightItem {
  text: string;
  color: "rose" | "gold" | "terra" | "slate" | "forest";
}

interface AiInsight {
  text: string;
  priority: "high" | "medium" | "low";
  category: string;
}

// ==================== HELPERS ====================
function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function getGreeting(name: string): { line1: string; line2: string } {
  const t = getTimeOfDay();
  switch (t) {
    case "morning":
      return { line1: `Good morning, ${name}`, line2: "Let's set you up for a good day" };
    case "afternoon":
      return { line1: `Good afternoon, ${name}`, line2: "How's the day going?" };
    case "evening":
      return { line1: `Good evening, ${name}`, line2: "Time to wind down and reflect" };
    default:
      return { line1: `Hey ${name}`, line2: "Let's wrap up the day" };
  }
}

function getInsightTitle(): string {
  return getTimeOfDay() === "morning" ? "Today's Game Plan" : "Your Insights";
}

function sliderColor(value: number): string {
  if (value <= 3) return "hsl(var(--rose))";
  if (value <= 6) return "hsl(var(--gold))";
  return "hsl(var(--primary))";
}

function insightBorderColor(color: string): string {
  switch (color) {
    case "rose": return "border-l-[hsl(var(--rose))]";
    case "gold": return "border-l-[hsl(var(--gold))]";
    case "terra": return "border-l-[hsl(var(--accent))]";
    case "slate": return "border-l-[hsl(var(--slate))]";
    case "forest": return "border-l-primary";
    default: return "border-l-primary";
  }
}

// ==================== VITALS SLIDER COMPONENT ====================
function VitalsSlider({
  label,
  icon: Icon,
  value,
  onChange,
  accentVar,
}: {
  label: string;
  icon: any;
  value: number;
  onChange: (v: number) => void;
  accentVar: string;
}) {
  return (
    <div className="mb-5" data-testid={`slider-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: `hsl(var(--${accentVar}))` }} />
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <span
          className="font-display text-2xl font-bold"
          style={{ color: sliderColor(value) }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${sliderColor(value)} ${((value - 1) / 9) * 100}%, hsl(var(--muted)) ${((value - 1) / 9) * 100}%)`,
          accentColor: sliderColor(value),
        }}
      />
    </div>
  );
}

// ==================== STEP PROGRESS BAR ====================
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5" data-testid="step-progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i < current ? "bg-primary" : i === current ? "bg-primary/50" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ==================== MAIN CHECK-IN COMPONENT ====================
export default function CheckIn() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();

  const [phase, setPhase] = useState(0); // 0-4 for phases A-E
  const [checkIn, setCheckIn] = useState<CheckInData | null>(null);
  const [foods, setFoods] = useState<FoodLogEntry[]>([]);
  const [water, setWater] = useState<WaterLogEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Phase A state
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [weightInput, setWeightInput] = useState("");

  // Phase B state
  const [painLevel, setPainLevel] = useState(1);
  const [skinRating, setSkinRating] = useState(5);
  const [painNotes, setPainNotes] = useState("");
  const [helpRequest, setHelpRequest] = useState("");

  // Phase C state
  const [mealType, setMealType] = useState("breakfast");
  const [foodQuery, setFoodQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Phase C water state
  const [customMl, setCustomMl] = useState(250);
  const [customQty, setCustomQty] = useState(1);
  const [showCustomWater, setShowCustomWater] = useState(false);

  // Phase D state
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [exerciseDuration, setExerciseDuration] = useState(30);
  const [traveling, setTraveling] = useState(false);
  const [plans, setPlans] = useState("");
  const [notes, setNotes] = useState("");

  // Dashboard data for context
  const [dashData, setDashData] = useState<any>(null);

  // Phase E: AI insights state
  const [aiInsights, setAiInsights] = useState<AiInsight[] | null>(null);
  const [aiMotivation, setAiMotivation] = useState<string | null>(null);
  const [insightsSource, setInsightsSource] = useState<"ai" | "rules" | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Initialize check-in
  useEffect(() => {
    authFetch("POST", "/api/checkin")
      .then((r) => r.json())
      .then((d) => {
        setCheckIn(d.checkIn);
        setFoods(d.foods || []);
        setWater(d.water || []);
        // Restore state from existing check-in
        if (d.checkIn.energy) setEnergy(d.checkIn.energy);
        if (d.checkIn.mood) setMood(d.checkIn.mood);
        if (d.checkIn.stress) setStress(d.checkIn.stress);
        if (d.checkIn.sleepQuality) setSleepQuality(d.checkIn.sleepQuality);
        if (d.checkIn.weight) setWeightInput(String(d.checkIn.weight / 10));
        if (d.checkIn.painLevel) setPainLevel(d.checkIn.painLevel);
        if (d.checkIn.skinRating) setSkinRating(d.checkIn.skinRating);
        if (d.checkIn.painNotes) setPainNotes(d.checkIn.painNotes);
        if (d.checkIn.helpRequest) setHelpRequest(d.checkIn.helpRequest);
        if (d.checkIn.exerciseTypes) {
          try { setExerciseTypes(JSON.parse(d.checkIn.exerciseTypes)); } catch {}
        }
        if (d.checkIn.exerciseDuration) setExerciseDuration(d.checkIn.exerciseDuration);
        if (d.checkIn.traveling) setTraveling(true);
        if (d.checkIn.plans) setPlans(d.checkIn.plans);
        if (d.checkIn.notes) setNotes(d.checkIn.notes);
      })
      .catch(() => {});

    authFetch("GET", "/api/dashboard")
      .then((r) => r.json())
      .then(setDashData)
      .catch(() => {});
  }, [authFetch]);

  // Save current phase data on phase change
  const savePhaseData = useCallback(
    async (phaseNum: number) => {
      if (!checkIn) return;
      let body: any = {};
      if (phaseNum === 0) {
        body = {
          energy,
          mood,
          stress,
          sleepQuality,
          weight: weightInput ? Math.round(parseFloat(weightInput) * 10) : null,
        };
      } else if (phaseNum === 1) {
        body = { painLevel, skinRating, painNotes, helpRequest };
      } else if (phaseNum === 3) {
        body = {
          exerciseTypes: JSON.stringify(exerciseTypes),
          exerciseDuration: exerciseTypes.includes("Rest Day") ? 0 : exerciseDuration,
          traveling,
          plans,
          notes,
        };
      }
      try {
        await authFetch("PUT", `/api/checkin/${checkIn.id}`, body);
      } catch {}
    },
    [checkIn, energy, mood, stress, sleepQuality, weightInput, painLevel, skinRating, painNotes, helpRequest, exerciseTypes, exerciseDuration, traveling, plans, notes, authFetch]
  );

  const fetchAiInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await authFetch("POST", "/api/ai/insights");
      const data = await res.json();
      setAiInsights(data.insights || []);
      setAiMotivation(data.motivation || null);
      setInsightsSource(data.source || "ai");
    } catch {
      // API call itself failed — use client-side rule-based fallback
      setAiInsights(null);
      setInsightsSource("rules");
    } finally {
      setInsightsLoading(false);
    }
  }, [authFetch]);

  const goNext = useCallback(() => {
    savePhaseData(phase);
    const next = Math.min(phase + 1, 4);
    setPhase(next);
    // Trigger AI insights when entering Phase E
    if (next === 4) {
      fetchAiInsights();
    }
  }, [phase, savePhaseData, fetchAiInsights]);

  const goBack = useCallback(() => {
    if (phase === 0) {
      setLocation("/dashboard");
      return;
    }
    savePhaseData(phase);
    setPhase((p) => Math.max(p - 1, 0));
  }, [phase, savePhaseData, setLocation]);

  // Food search
  useEffect(() => {
    if (foodQuery.trim().length > 0) {
      const results = searchFoods(foodQuery, 8);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [foodQuery]);

  const addFood = useCallback(
    async (food: FoodItem) => {
      if (!checkIn) return;
      const qty = food.defaultQty;
      const body = {
        foodName: food.name,
        mealType,
        quantity: String(qty),
        unit: food.unit,
        source: "Homemade",
        calories: food.caloriesPer,
        protein: Math.round(food.proteinPer * 10),
        carbs: Math.round(food.carbsPer * 10),
        fat: Math.round(food.fatPer * 10),
      };
      try {
        const res = await authFetch("POST", `/api/checkin/${checkIn.id}/food`, body);
        const data = await res.json();
        setFoods((prev) => [...prev, data.food]);
        setFoodQuery("");
        setShowResults(false);
      } catch {}
    },
    [checkIn, mealType, authFetch]
  );

  const updateFoodQty = useCallback(
    async (foodLog: FoodLogEntry, delta: number) => {
      const foodItem = FOOD_DATABASE.find((f) => f.name === foodLog.foodName);
      if (!foodItem) return;
      const currentQty = parseFloat(foodLog.quantity);
      const step = foodItem.unit === "g" ? 10 : 0.5;
      const newQty = Math.max(step, currentQty + delta * step);
      const ratio = newQty / foodItem.defaultQty;
      const update = {
        quantity: String(newQty),
        calories: Math.round(foodItem.caloriesPer * ratio),
        protein: Math.round(foodItem.proteinPer * ratio * 10),
        carbs: Math.round(foodItem.carbsPer * ratio * 10),
        fat: Math.round(foodItem.fatPer * ratio * 10),
      };
      try {
        await authFetch("PUT", `/api/food/${foodLog.id}`, update);
        setFoods((prev) =>
          prev.map((f) => (f.id === foodLog.id ? { ...f, ...update } : f))
        );
      } catch {}
    },
    [authFetch]
  );

  const updateFoodSource = useCallback(
    async (foodLog: FoodLogEntry, source: string) => {
      try {
        await authFetch("PUT", `/api/food/${foodLog.id}`, { source });
        setFoods((prev) =>
          prev.map((f) => (f.id === foodLog.id ? { ...f, source } : f))
        );
      } catch {}
    },
    [authFetch]
  );

  const removeFood = useCallback(
    async (id: number) => {
      try {
        await authFetch("DELETE", `/api/food/${id}`);
        setFoods((prev) => prev.filter((f) => f.id !== id));
      } catch {}
    },
    [authFetch]
  );

  const addWater = useCallback(
    async (label: string, amountMl: number, qty: number = 1) => {
      if (!checkIn) return;
      try {
        const res = await authFetch("POST", `/api/checkin/${checkIn.id}/water`, {
          label,
          amountMl,
          quantity: qty,
        });
        const data = await res.json();
        setWater((prev) => [...prev, data.water]);
      } catch {}
    },
    [checkIn, authFetch]
  );

  const updateWaterQty = useCallback(
    async (entry: WaterLogEntry, delta: number) => {
      const newQty = Math.max(1, entry.quantity + delta);
      try {
        await authFetch("PUT", `/api/water/${entry.id}`, { quantity: newQty });
        setWater((prev) =>
          prev.map((w) => (w.id === entry.id ? { ...w, quantity: newQty } : w))
        );
      } catch {}
    },
    [authFetch]
  );

  const removeWater = useCallback(
    async (id: number) => {
      try {
        await authFetch("DELETE", `/api/water/${id}`);
        setWater((prev) => prev.filter((w) => w.id !== id));
      } catch {}
    },
    [authFetch]
  );

  // Computed totals
  const foodTotals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    for (const food of foods) {
      cal += food.calories || 0;
      p += food.protein || 0;
      c += food.carbs || 0;
      f += food.fat || 0;
    }
    return { calories: cal, protein: p / 10, carbs: c / 10, fat: f / 10 };
  }, [foods]);

  const waterTotal = useMemo(() => {
    return water.reduce((sum, w) => sum + w.amountMl * w.quantity, 0);
  }, [water]);

  // Calorie target
  const calorieTarget = useMemo(() => {
    if (!dashData?.profile) return 2000;
    const p = dashData.profile;
    const w = parseFloat(weightInput) || p.weightKg || 70;
    const h = p.heightCm || 170;
    const a = p.age || 30;
    const g = p.gender || "male";
    const al = p.activityLevel || "Moderately Active";

    let bmr = 10 * w + 6.25 * h - 5 * a + (g === "female" ? -161 : 5);
    const multipliers: Record<string, number> = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725,
      Athlete: 1.9,
    };
    const tdee = bmr * (multipliers[al] || 1.55);

    const goals = dashData.goals || [];
    const hasLoseWeight = goals.some((g: any) => g.goalType === "Lose Weight");
    const hasBuildStrength = goals.some((g: any) => g.goalType === "Build Strength");

    if (hasLoseWeight) {
      const min = g === "female" ? 1200 : 1500;
      return Math.max(min, Math.round(tdee - 500));
    }
    if (hasBuildStrength) return Math.round(tdee + 300);
    return Math.round(tdee);
  }, [dashData, weightInput]);

  // Generate insights
  const insights = useMemo((): InsightItem[] => {
    const items: InsightItem[] = [];
    const conditions = (dashData?.conditions || []).map((c: any) => c.conditionName);

    if (energy <= 3) items.push({ text: "Very low energy \u2014 prioritize rest. Consider iron-rich foods if this persists.", color: "rose" });
    if (stress >= 8) items.push({ text: "Stress is very high. Try box breathing (4-4-4-4) for 5 minutes.", color: "rose" });
    if (painLevel >= 7) items.push({ text: "Pain elevated. Skip intense exercise. Gentle stretching or warm compress.", color: "rose" });
    if (sleepQuality <= 3) items.push({ text: "Poor sleep. No caffeine after noon. Consider magnesium before bed.", color: "gold" });
    if (skinRating <= 3) items.push({ text: "Skin needs attention \u2014 increase water, add antioxidant foods.", color: "terra" });
    if (waterTotal < 1000) items.push({ text: "Water intake low. Aim for 2-3L today.", color: "slate" });
    if (traveling) items.push({ text: "Travel day \u2014 pack nuts, fruits, water bottle.", color: "slate" });
    if (conditions.includes("Type 2 Diabetes") && foodTotals.carbs > 160) items.push({ text: "Carbs high for diabetes \u2014 consider swapping rice for dal-roti.", color: "rose" });
    if (conditions.includes("Fibromyalgia") && painLevel >= 5) items.push({ text: "Fibro flare \u2014 be gentle. Rest is productive.", color: "terra" });
    if (conditions.includes("IBS") && stress >= 7) items.push({ text: "High stress + IBS \u2014 stick to simple, low-FODMAP foods.", color: "terra" });
    if (conditions.includes("Chronic Migraine") && sleepQuality <= 4) items.push({ text: "Poor sleep triggers migraines. Prioritize rest tonight.", color: "rose" });
    if (conditions.includes("Compressed Nerve") && exerciseTypes.some((e) => ["Gym (self)", "Strength (self)"].includes(e))) {
      items.push({ text: "With your nerve condition, avoid heavy lifting. Focus on core stability exercises.", color: "gold" });
    }
    if (foodTotals.protein < 30 && foods.length > 0) items.push({ text: "Protein low. Add eggs, paneer, dal, or a protein shake.", color: "slate" });
    if (items.length === 0) items.push({ text: "You're tracking well today. Keep listening to your body.", color: "forest" });

    return items;
  }, [energy, stress, painLevel, sleepQuality, skinRating, waterTotal, traveling, foodTotals, foods.length, exerciseTypes, dashData]);

  const motivationText = useMemo(() => {
    if (painLevel >= 7) return "Healing isn't linear. Rest is productive. Be kind to yourself today.";
    if (stress >= 7) return "You don't have to be perfect. You just have to show up.";
    if (energy <= 3) return "Even the smallest step forward is still progress.";
    return "Every healthy choice today is an investment in tomorrow's you.";
  }, [painLevel, stress, energy]);

  const saveCheckIn = useCallback(async () => {
    if (!checkIn) return;
    setSaving(true);
    try {
      await authFetch("POST", `/api/checkin/${checkIn.id}/complete`, {
        energy,
        mood,
        stress,
        sleepQuality,
        weight: weightInput ? Math.round(parseFloat(weightInput) * 10) : null,
        painLevel,
        skinRating,
        painNotes,
        helpRequest,
        exerciseTypes: JSON.stringify(exerciseTypes),
        exerciseDuration: exerciseTypes.includes("Rest Day") ? 0 : exerciseDuration,
        traveling,
        plans,
        notes,
        totalCalories: foodTotals.calories,
        totalProtein: Math.round(foodTotals.protein),
        totalCarbs: Math.round(foodTotals.carbs),
        totalFat: Math.round(foodTotals.fat),
        totalWaterMl: waterTotal,
        insightsJson: JSON.stringify(aiInsights || insights),
      });
      setLocation("/dashboard");
    } catch {} finally {
      setSaving(false);
    }
  }, [checkIn, energy, mood, stress, sleepQuality, weightInput, painLevel, skinRating, painNotes, helpRequest, exerciseTypes, exerciseDuration, traveling, plans, notes, foodTotals, waterTotal, insights, authFetch, setLocation]);

  const conditions = dashData?.conditions || [];
  const medications = dashData?.medications || [];
  const profileName = dashData?.profile?.name || user?.name || "";
  const greeting = getGreeting(profileName);

  const EXERCISE_OPTIONS = [
    "Walking", "Yoga", "Gym (self)", "Gym (with PT)", "Strength (self)",
    "Strength (with Trainer)", "Running", "Swimming", "Cycling", "HIIT/Crossfit",
    "Pilates", "Physiotherapy", "Stretching", "Sports/Play", "Dance", "Martial Arts", "Rest Day",
  ];

  const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"];
  const FOOD_SOURCES = ["Homemade", "Restaurant", "Packaged", "Street Food", "Canteen"];
  const WATER_PRESETS = [
    { label: "Glass (250ml)", ml: 250 },
    { label: "Glass (300ml)", ml: 300 },
    { label: "Bottle (500ml)", ml: 500 },
    { label: "Large (750ml)", ml: 750 },
    { label: "1L Bottle", ml: 1000 },
  ];

  const hasNonRestExercise = exerciseTypes.some((e) => e !== "Rest Day");

  return (
    <div className="min-h-screen bg-background" data-testid="checkin-page">
      {/* Top bar */}
      <div className="max-w-[560px] mx-auto px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="p-1" data-testid="checkin-back">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <StepProgress current={phase} total={5} />
          </div>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-5 pb-8">
        {/* ==================== PHASE A: Mood & Vitals ==================== */}
        {phase === 0 && (
          <div data-testid="phase-a">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {greeting.line1}
              </h1>
              <p className="text-text-mid text-sm mt-1">{greeting.line2}</p>
            </div>

            {/* Conditions context card */}
            {conditions.length > 0 && (
              <div className="bg-[hsl(var(--accent-faded))] rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--accent))] mb-1">
                  Active Conditions
                </p>
                <p className="text-sm text-foreground">
                  {conditions.map((c: any) => c.conditionName).join(" \u00B7 ")}
                </p>
                {medications.length > 0 && (
                  <p className="text-xs text-text-mid mt-1">
                    {medications.length} medication{medications.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Vitals card */}
            <div className="vitallity-card p-5 mb-6">
              <VitalsSlider label="Energy" icon={Zap} value={energy} onChange={setEnergy} accentVar="gold" />
              <VitalsSlider label="Mood" icon={Heart} value={mood} onChange={setMood} accentVar="primary" />
              <VitalsSlider label="Stress" icon={Brain} value={stress} onChange={setStress} accentVar="rose" />
              <VitalsSlider label="Sleep Quality" icon={Moon} value={sleepQuality} onChange={setSleepQuality} accentVar="violet" />
            </div>

            {/* Weight input */}
            <div className="vitallity-card p-5 mb-6">
              <label className="vitallity-label mb-2 block">Weight (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={dashData?.profile?.weightKg ? String(dashData.profile.weightKg) : "kg"}
                  className="vitallity-input flex-1"
                  data-testid="weight-input"
                />
                <span className="text-sm text-text-mid font-semibold">kg</span>
              </div>
            </div>

            <button onClick={goNext} className="vitallity-btn-primary w-full" data-testid="phase-a-next">
              Continue
            </button>
          </div>
        )}

        {/* ==================== PHASE B: Body Check ==================== */}
        {phase === 1 && (
          <div data-testid="phase-b">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-[hsl(var(--rose))]" />
              <h2 className="font-display text-xl font-bold text-foreground">Body Check</h2>
            </div>
            <p className="text-sm text-text-mid mb-6">Pain, skin, anything to note</p>

            <div className="vitallity-card p-5 mb-4">
              <VitalsSlider label="Pain Level" icon={AlertTriangle} value={painLevel} onChange={setPainLevel} accentVar="rose" />
              <VitalsSlider label="Skin Rating" icon={Heart} value={skinRating} onChange={setSkinRating} accentVar="accent" />

              <label className="vitallity-label mb-2 block">Pain Notes</label>
              <textarea
                value={painNotes}
                onChange={(e) => setPainNotes(e.target.value)}
                placeholder="Specific pains, migraine, cold, cough — describe what's going on..."
                className="vitallity-input w-full min-h-[80px] resize-none"
                data-testid="pain-notes"
              />
            </div>

            <div className="bg-primary/5 rounded-2xl p-5 mb-6">
              <label className="vitallity-label mb-2 block">Need help with anything today?</label>
              <textarea
                value={helpRequest}
                onChange={(e) => setHelpRequest(e.target.value)}
                placeholder="Ask anything — 'My migraine is bad, what should I eat?' or 'Suggest a gentle back workout...'"
                className="vitallity-input w-full min-h-[80px] resize-none"
                data-testid="help-request"
              />
            </div>

            <button onClick={goNext} className="vitallity-btn-primary w-full" data-testid="phase-b-next">
              Continue
            </button>
          </div>
        )}

        {/* ==================== PHASE C: Food & Water ==================== */}
        {phase === 2 && (
          <div data-testid="phase-c">
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-5 h-5 text-[hsl(var(--accent))]" />
              <h2 className="font-display text-xl font-bold text-foreground">Food & Water</h2>
            </div>
            <p className="text-sm text-text-mid mb-6">
              {getTimeOfDay() === "morning" ? "Planning meals?" : "What have you eaten?"}
            </p>

            {/* Meal type selector */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {MEAL_TYPES.map((mt) => (
                <button
                  key={mt}
                  onClick={() => setMealType(mt)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                    mealType === mt
                      ? "bg-primary text-white"
                      : "bg-muted text-text-mid"
                  }`}
                  data-testid={`meal-${mt}`}
                >
                  {mt}
                </button>
              ))}
            </div>

            {/* Food search */}
            <div className="relative mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-mid" />
                <input
                  type="text"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  onFocus={() => foodQuery.length > 0 && setShowResults(true)}
                  placeholder="Search food — egg white bhurji, dosa, biryani..."
                  className="vitallity-input w-full pl-10"
                  data-testid="food-search"
                />
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border max-h-64 overflow-y-auto">
                  {searchResults.map((food, idx) => (
                    <button
                      key={`${food.name}-${idx}`}
                      onClick={() => addFood(food)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center justify-between border-b border-border last:border-0"
                      data-testid={`food-result-${idx}`}
                    >
                      <span className="text-sm text-foreground font-medium">{food.name}</span>
                      <span className="text-xs text-text-mid">
                        {food.caloriesPer} cal/{food.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Food entries */}
            {foods.length > 0 && (
              <div className="space-y-3 mb-4">
                {foods.map((f) => (
                  <div key={f.id} className="vitallity-card p-4" data-testid={`food-entry-${f.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{f.foodName}</p>
                        <p className="text-xs text-text-mid capitalize">{f.mealType}</p>
                      </div>
                      <button onClick={() => removeFood(f.id)} className="p-1" data-testid={`remove-food-${f.id}`}>
                        <X className="w-4 h-4 text-text-mid" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateFoodQty(f, -1)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                          data-testid={`food-minus-${f.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-10 text-center">{f.quantity}</span>
                        <button
                          onClick={() => updateFoodQty(f, 1)}
                          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
                          data-testid={`food-plus-${f.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-text-mid ml-1">{f.unit}</span>
                      </div>
                      <div className="relative ml-auto">
                        <select
                          value={f.source}
                          onChange={(e) => updateFoodSource(f, e.target.value)}
                          className="text-xs bg-muted rounded-lg px-2 py-1 pr-6 appearance-none cursor-pointer text-foreground"
                          data-testid={`food-source-${f.id}`}
                        >
                          {FOOD_SOURCES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-text-mid pointer-events-none" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-mid">
                        <span className="text-[hsl(var(--slate))]">P:{(f.protein / 10).toFixed(1)}g</span>{" "}
                        <span className="text-[hsl(var(--accent))]">C:{(f.carbs / 10).toFixed(1)}g</span>{" "}
                        <span className="text-[hsl(var(--rose))]">F:{(f.fat / 10).toFixed(1)}g</span>
                      </p>
                      <p>
                        <span className="font-display text-lg font-bold text-foreground">{f.calories}</span>
                        <span className="text-xs text-text-mid ml-1">CAL</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals bar */}
            {foods.length > 0 && (
              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-mid font-semibold mb-0.5">Total</p>
                    <p className="text-xs text-text-mid">
                      P:{foodTotals.protein.toFixed(0)}g C:{foodTotals.carbs.toFixed(0)}g F:{foodTotals.fat.toFixed(0)}g
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-display text-2xl font-bold ${
                        foodTotals.calories > calorieTarget
                          ? "text-[hsl(var(--rose))]"
                          : "text-primary"
                      }`}
                    >
                      {foodTotals.calories}
                    </span>
                    <span className="text-xs text-text-mid ml-1">/ {calorieTarget} cal</span>
                  </div>
                </div>
              </div>
            )}

            {/* Water Tracker */}
            <div className="vitallity-card p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-4 h-4 text-[hsl(var(--slate))]" />
                <span className="text-sm font-semibold text-foreground">Water</span>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {WATER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addWater(preset.label, preset.ml)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/70 transition-colors flex items-center gap-1"
                    data-testid={`water-preset-${preset.ml}`}
                  >
                    <Plus className="w-3 h-3" /> {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomWater(!showCustomWater)}
                  className="px-3 py-1.5 rounded-lg bg-[hsl(var(--slate))]/10 text-xs font-medium text-[hsl(var(--slate))] hover:bg-[hsl(var(--slate))]/20 transition-colors"
                  data-testid="water-custom-toggle"
                >
                  Custom
                </button>
              </div>

              {/* Custom water entry */}
              {showCustomWater && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    value={customMl}
                    onChange={(e) => setCustomMl(parseInt(e.target.value) || 0)}
                    className="vitallity-input w-20 text-center text-sm"
                    data-testid="water-custom-ml"
                  />
                  <span className="text-xs text-text-mid">ml</span>
                  <span className="text-xs text-text-mid mx-1">x</span>
                  <input
                    type="number"
                    min={1}
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="vitallity-input w-14 text-center text-sm"
                    data-testid="water-custom-qty"
                  />
                  <button
                    onClick={() => addWater(`Custom (${customMl}ml)`, customMl, customQty)}
                    className="vitallity-btn-primary text-xs px-3 py-1.5"
                    data-testid="water-custom-add"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Water log entries */}
              {water.length > 0 && (
                <div className="space-y-2 mb-3">
                  {water.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-foreground">{w.label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateWaterQty(w, -1)}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                          data-testid={`water-minus-${w.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{w.quantity}</span>
                        <button
                          onClick={() => updateWaterQty(w, 1)}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                          data-testid={`water-plus-${w.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-text-mid w-14 text-right">
                          {w.amountMl * w.quantity}ml
                        </span>
                        <button onClick={() => removeWater(w.id)} className="p-1" data-testid={`water-remove-${w.id}`}>
                          <X className="w-3 h-3 text-text-mid" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Water total */}
              <div className="bg-[hsl(var(--slate))]/5 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs text-text-mid font-semibold">Total</span>
                <span className="font-display text-lg font-bold text-[hsl(var(--slate))]">
                  {(waterTotal / 1000).toFixed(1)}L
                </span>
              </div>
            </div>

            <button onClick={goNext} className="vitallity-btn-primary w-full" data-testid="phase-c-next">
              Continue
            </button>
          </div>
        )}

        {/* ==================== PHASE D: Activity & Plans ==================== */}
        {phase === 3 && (
          <div data-testid="phase-d">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-foreground">Activity & Plans</h2>
            </div>
            <p className="text-sm text-text-mid mb-6">Exercise, travel, and plans for the day</p>

            {/* Exercise chips */}
            <div className="vitallity-card p-5 mb-4">
              <p className="text-sm font-semibold text-foreground mb-3">Exercise</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EXERCISE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setExerciseTypes((prev) =>
                        prev.includes(opt)
                          ? prev.filter((e) => e !== opt)
                          : [...prev, opt]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      exerciseTypes.includes(opt)
                        ? "bg-primary text-white"
                        : "bg-muted text-text-mid"
                    }`}
                    data-testid={`exercise-${opt.replace(/[\s/()]/g, "-")}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Duration slider */}
              {hasNonRestExercise && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-mid">Duration</span>
                    <span className="font-display text-lg font-bold text-primary">
                      {exerciseDuration} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={exerciseDuration}
                    onChange={(e) => setExerciseDuration(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) ${((exerciseDuration - 5) / 115) * 100}%, hsl(var(--muted)) ${((exerciseDuration - 5) / 115) * 100}%)`,
                    }}
                    data-testid="exercise-duration"
                  />
                </div>
              )}
            </div>

            {/* Plans card */}
            <div className="vitallity-card p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Traveling today?</span>
                <button
                  onClick={() => setTraveling(!traveling)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    traveling ? "bg-primary justify-end" : "bg-muted justify-start"
                  }`}
                  data-testid="traveling-toggle"
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5" />
                </button>
              </div>

              <label className="vitallity-label mb-2 block">Plans</label>
              <textarea
                value={plans}
                onChange={(e) => setPlans(e.target.value)}
                placeholder="Working from home, dinner out at 8pm, need to prep..."
                className="vitallity-input w-full min-h-[70px] resize-none mb-4"
                data-testid="plans-input"
              />

              <label className="vitallity-label mb-2 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wins, struggles, observations..."
                className="vitallity-input w-full min-h-[70px] resize-none"
                data-testid="notes-input"
              />
            </div>

            <button onClick={goNext} className="vitallity-btn-primary w-full" data-testid="phase-d-next">
              Continue
            </button>
          </div>
        )}

        {/* ==================== PHASE E: Insights ==================== */}
        {phase === 4 && (
          <div data-testid="phase-e">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {getInsightTitle()}
              </h2>
            </div>
            <p className="text-sm text-text-mid mb-6">Based on today's data</p>

            {/* Loading skeleton */}
            {insightsLoading && (
              <div className="space-y-3 mb-6" data-testid="insights-loading">
                <div className="vitallity-card p-4 border-l-4 border-l-muted animate-pulse">
                  <div className="h-3 bg-muted rounded w-4/5 mb-2" />
                  <div className="h-3 bg-muted rounded w-3/5" />
                </div>
                <div className="vitallity-card p-4 border-l-4 border-l-muted animate-pulse">
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="vitallity-card p-4 border-l-4 border-l-muted animate-pulse">
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
                <p className="text-center text-sm text-text-mid animate-pulse">Analyzing your day...</p>
              </div>
            )}

            {/* AI-powered insights */}
            {!insightsLoading && aiInsights && aiInsights.length > 0 && (
              <div className="space-y-3 mb-6">
                {aiInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`vitallity-card p-4 border-l-4 ${
                      insight.priority === "high"
                        ? "border-l-[hsl(var(--rose))]"
                        : insight.priority === "medium"
                          ? "border-l-[hsl(var(--gold))]"
                          : "border-l-[hsl(var(--slate))]"
                    }`}
                    data-testid={`insight-${idx}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground flex-1">{insight.text}</p>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        insight.priority === "high"
                          ? "bg-[hsl(var(--rose))]/10 text-[hsl(var(--rose))]"
                          : insight.priority === "medium"
                            ? "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]"
                            : "bg-[hsl(var(--slate))]/10 text-[hsl(var(--slate))]"
                      }`}>
                        {insight.category}
                      </span>
                    </div>
                  </div>
                ))}
                {insightsSource === "rules" && (
                  <p className="text-xs text-text-mid text-center">Quick insights based on your data</p>
                )}
              </div>
            )}

            {/* Fallback: rule-based insights (when AI fails completely) */}
            {!insightsLoading && !aiInsights && (
              <div className="space-y-3 mb-6">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`vitallity-card p-4 border-l-4 ${insightBorderColor(insight.color)}`}
                    data-testid={`insight-${idx}`}
                  >
                    <p className="text-sm text-foreground">{insight.text}</p>
                  </div>
                ))}
                <p className="text-xs text-text-mid text-center">Quick insights based on your data</p>
              </div>
            )}

            {/* Condition-specific correlation patterns from check-in history */}
            {(() => {
              const history = dashData?.recentCheckIns || [];
              const userConditions = (dashData?.conditions || []).map((c: any) => (c.conditionName || '').toLowerCase());
              if (history.length < 3 || userConditions.length === 0) return null;

              const has = (term: string) => userConditions.some((c: string) => c.includes(term));

              function splitCompare(entries: any[], splitKey: string, threshold: number, compareKey: string, above: boolean) {
                const groupA = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (above ? c[splitKey] >= threshold : c[splitKey] < threshold));
                const groupB = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (above ? c[splitKey] < threshold : c[splitKey] >= threshold));
                if (groupA.length < 2 || groupB.length < 2) return null;
                const avgA = groupA.reduce((s: number, c: any) => s + c[compareKey], 0) / groupA.length;
                const avgB = groupB.reduce((s: number, c: any) => s + c[compareKey], 0) / groupB.length;
                const diff = Math.round(Math.abs(avgA - avgB) * 10) / 10;
                if (diff < 0.8) return null;
                return { avgA, avgB, diff };
              }

              type CondInsight = { text: string; condition: string; chartData?: any[]; metricA: string; metricB: string; colorA: string; colorB: string };
              const condInsights: CondInsight[] = [];

              // Build 7-day chart data from history
              const last7 = history.slice(0, 7).reverse();

              if (has('fibromyalgia')) {
                const r = splitCompare(history, 'sleepHours', 7, 'painLevel', false);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({
                    text: `Fibromyalgia: flare pain is ${r.diff}pts worse after under 7hrs sleep`,
                    condition: 'Fibromyalgia', metricA: 'Sleep (hrs)', metricB: 'Pain',
                    colorA: '#6366F1', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Sleep: c.sleepHours || null, Pain: c.painLevel || null }))
                  });
                }
                const w = splitCompare(history, 'waterMl', 1500, 'painLevel', false);
                if (w && w.avgA > w.avgB) {
                  condInsights.push({ text: `Fibromyalgia: pain is ${w.diff}pts higher with under 1.5L water`, condition: 'Fibromyalgia', metricA: 'Water (L)', metricB: 'Pain', colorA: '#3B82F6', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Water: c.waterMl ? Math.round(c.waterMl / 100) / 10 : null, Pain: c.painLevel || null })) });
                }
              }
              if (has('diabetes')) {
                const r = splitCompare(history, 'stressLevel', 6, 'energyLevel', true);
                if (r && r.avgA < r.avgB) {
                  condInsights.push({ text: `Diabetes: high stress correlates with ${r.diff}pts lower energy (blood sugar impact)`, condition: 'Diabetes', metricA: 'Stress', metricB: 'Energy', colorA: '#EF4444', colorB: '#F59E0B',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Stress: c.stressLevel || null, Energy: c.energyLevel || null })) });
                }
              }
              if (has('arthritis')) {
                const r = splitCompare(history, 'exerciseDuration', 15, 'painLevel', true);
                if (r && r.avgA < r.avgB) {
                  condInsights.push({ text: `Arthritis: gentle movement (15+ min) correlates with ${r.diff}pts less pain`, condition: 'Arthritis', metricA: 'Exercise (min)', metricB: 'Pain', colorA: '#2C5E3F', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Exercise: c.exerciseDuration || null, Pain: c.painLevel || null })) });
                }
              }
              if (has('hypertension') || has('high bp')) {
                const r = splitCompare(history, 'stressLevel', 7, 'sleepQuality', true);
                if (r && r.avgA < r.avgB) {
                  condInsights.push({ text: `Hypertension: high stress (7+) correlates with ${r.diff}pts worse sleep`, condition: 'Hypertension', metricA: 'Stress', metricB: 'Sleep Quality', colorA: '#EF4444', colorB: '#6366F1',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Stress: c.stressLevel || null, Sleep: c.sleepQuality || null })) });
                }
              }
              if (has('thyroid')) {
                const r = splitCompare(history, 'sleepHours', 8, 'energyLevel', true);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({ text: `Thyroid: 8+ hours sleep correlates with ${r.diff}pts more energy`, condition: 'Thyroid', metricA: 'Sleep (hrs)', metricB: 'Energy', colorA: '#6366F1', colorB: '#F59E0B',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Sleep: c.sleepHours || null, Energy: c.energyLevel || null })) });
                }
              }
              if (has('migraine')) {
                const r = splitCompare(history, 'sleepHours', 6, 'painLevel', false);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({ text: `Migraine: pain is ${r.diff}pts worse after under 6hrs sleep`, condition: 'Migraine', metricA: 'Sleep (hrs)', metricB: 'Pain', colorA: '#6366F1', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Sleep: c.sleepHours || null, Pain: c.painLevel || null })) });
                }
              }
              if (has('depression') || has('anxiety')) {
                const r = splitCompare(history, 'exerciseDuration', 20, 'mood', true);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({ text: `Mental health: 20+ min exercise correlates with ${r.diff}pts better mood`, condition: 'Mental Health', metricA: 'Exercise (min)', metricB: 'Mood', colorA: '#2C5E3F', colorB: '#F59E0B',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Exercise: c.exerciseDuration || null, Mood: c.mood || null })) });
                }
              }
              if (has('ibs') || has('digestive')) {
                const r = splitCompare(history, 'stressLevel', 6, 'painLevel', true);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({ text: `Digestive: stress above 6 correlates with ${r.diff}pts more discomfort`, condition: 'IBS', metricA: 'Stress', metricB: 'Pain', colorA: '#EF4444', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Stress: c.stressLevel || null, Pain: c.painLevel || null })) });
                }
              }
              if (has('back pain') || has('sciatica') || has('spondylosis')) {
                const r = splitCompare(history, 'stressLevel', 6, 'painLevel', true);
                if (r && r.avgA > r.avgB) {
                  condInsights.push({ text: `Back/spine: stress above 6 correlates with ${r.diff}pts more pain`, condition: 'Back Pain', metricA: 'Stress', metricB: 'Pain', colorA: '#EF4444', colorB: '#8B5CF6',
                    chartData: last7.map((c: any) => ({ d: c.date?.slice(5) || '', Stress: c.stressLevel || null, Pain: c.painLevel || null })) });
                }
              }

              if (condInsights.length === 0) return null;
              const top = condInsights.slice(0, 2);

              return (
                <div className="mb-6 space-y-3" data-testid="condition-correlations">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your condition patterns</p>
                  {top.map((ci, i) => (
                    <div key={i} className="vitallity-card border-l-4 border-l-primary/60 p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">{ci.condition}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium mb-3">{ci.text}</p>
                      {ci.chartData && ci.chartData.some((d: any) => Object.values(d).some(v => v !== null && typeof v === 'number')) && (
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={ci.chartData} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                            <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 11 }} />
                            <Line type="monotone" dataKey={ci.metricA.split(' ')[0]} stroke={ci.colorA} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            <Line type="monotone" dataKey={ci.metricB.split(' ')[0]} stroke={ci.colorB} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            <Legend iconType="circle" iconSize={5} wrapperStyle={{ fontSize: 9, paddingTop: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Motivation card */}
            <div className="bg-gradient-to-br from-[#2C5E3F] to-[#3A7A52] rounded-2xl p-6 mb-6">
              <p className="text-white font-display text-lg italic leading-relaxed">
                "{aiMotivation || motivationText}"
              </p>
            </div>

            <button
              onClick={saveCheckIn}
              disabled={saving || insightsLoading}
              className="vitallity-btn-primary w-full"
              data-testid="save-checkin"
            >
              {saving ? "Saving..." : "Save Check-in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
