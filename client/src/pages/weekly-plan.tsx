import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthFetch } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Dumbbell,
  Utensils,
  Brain,
  Activity,
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  Pill,
  HeartPulse,
  Moon,
  Footprints,
  Droplets,
} from "lucide-react";

// ==================== TYPES ====================

interface Exercise {
  key: string;
  name: string;
  subtitle: string;
  sets: number;
  reps: string; // e.g. "12" or "30s"
}

interface Meal {
  key: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
}

interface NutritionDay {
  meals: { breakfast: Meal; lunch: Meal; dinner: Meal; snacks: Meal };
  totals: { calories: number; protein: number; carbs: number; fat: number };
}

interface StressActivity {
  key: string;
  timing: string;
  activity: string;
  duration: string;
}

interface PainExercise {
  key: string;
  name: string;
  prescription: string;
  note: string;
}

interface MedicationItem {
  key: string;
  name: string;
  dosage: string;
  timing: "Morning" | "Afternoon" | "Evening";
}

interface HealthCheck {
  key: string;
  name: string;
  timing: string;
}

interface SleepItem {
  key: string;
  text: string;
}

interface StepTarget {
  target: number; // steps
  dayType: "rest" | "exercise" | "cardio";
}

interface HydrationTarget {
  totalMl: number; // total daily target in ml
}

interface DayPlan {
  label: string; // "Push Day — Chest, Shoulders, Triceps"
  duration: string; // "50-60 min"
  activityType: "exercise" | "recovery" | "rest" | "nutrition";
  stepTarget: StepTarget;
  exercises: Exercise[];
  nutrition: NutritionDay;
  hydration: HydrationTarget;
  medications: MedicationItem[];
  healthChecks: HealthCheck[];
  stress: StressActivity[];
  pain: PainExercise[];
  sleep: SleepItem[];
}

type WeeklyPlan = DayPlan[];

interface LogEntry {
  dayIndex: number;
  sectionKey: string;
  itemKey: string;
}

// ==================== PLAN GENERATION ====================

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  return monday.toISOString().split("T")[0];
}

function generateWeeklyPlan(profile: any, goals: any[], conditions: any[], painAreas: any[], activities: any[], dietaryPrefs: any[], medications: any[]): WeeklyPlan {
  const hasGym = activities.some((a: any) =>
    ["Gym", "Weight Training", "Gym membership", "Personal trainer"].some(g =>
      (a.activityName || a).toLowerCase().includes(g.toLowerCase())
    )
  ) || (profile?.exerciseComfort || "").toLowerCase().includes("gym");

  const goalTypes = goals.map((g: any) => (g.goalType || "").toLowerCase());
  const isWeightLoss = goalTypes.some(g => g.includes("weight") || g.includes("lose"));
  const isMuscleGain = goalTypes.some(g => g.includes("strength") || g.includes("muscle") || g.includes("build"));
  const painAreaNames = painAreas.map((p: any) => (p.areaName || "").toLowerCase());
  const hasBackPain = painAreaNames.some(p => p.includes("back") || p.includes("lumbar"));
  const hasKneePain = painAreaNames.some(p => p.includes("knee") || p.includes("knees"));
  const isVegetarian = dietaryPrefs.some((d: any) => (d.preferenceName || "").toLowerCase().includes("vegetarian"));

  const targetCalories = isWeightLoss ? 1700 : isMuscleGain ? 2400 : 2000;
  const targetProtein = isMuscleGain ? 160 : 120;

  // Conditions
  const conditionNames = conditions.map((c: any) => (c.conditionName || "").toLowerCase());
  const hasDiabetes = conditionNames.some(c => c.includes("diabetes") || c.includes("diabetic"));
  const hasHypertension = conditionNames.some(c => c.includes("hypertension") || c.includes("blood pressure") || c.includes("hypert"));

  // Hydration target: weight * 33ml, min 2500ml, capped at 4000ml
  const weightKg = profile?.weightKg || 0;
  const hydrationMl = weightKg > 0
    ? Math.min(4000, Math.max(2500, Math.round(weightKg * 33)))
    : 2500;

  // ==================== MEDICATIONS ====================
  const buildMedications = (): MedicationItem[] => {
    const items: MedicationItem[] = [];

    // Real user medications
    if (medications && medications.length > 0) {
      const timings: Array<"Morning" | "Afternoon" | "Evening"> = ["Morning", "Afternoon", "Evening"];
      medications.forEach((med: any, idx: number) => {
        items.push({
          key: `med-${idx}`,
          name: med.medicationName || med.name || "Medication",
          dosage: med.dosage || "As prescribed",
          timing: timings[idx % timings.length],
        });
      });
    }

    // Condition-based supplement suggestions
    if (hasDiabetes) {
      items.push({ key: "supp-vitd", name: "Vitamin D", dosage: "1000 IU", timing: "Morning" });
      items.push({ key: "supp-omega3", name: "Omega-3", dosage: "1000 mg", timing: "Evening" });
    }
    if (!hasDiabetes && items.length === 0) {
      items.push({ key: "supp-multi", name: "Multivitamin", dosage: "1 tablet", timing: "Morning" });
    }

    return items;
  };

  const medicationItems = buildMedications();

  // ==================== HEALTH CHECKS ====================
  const buildHealthChecks = (dayIndex: number): HealthCheck[] => {
    const checks: HealthCheck[] = [];
    const isMonday = dayIndex === 0;

    if (hasDiabetes) {
      checks.push({ key: "hc-fbs", name: "Check fasting blood sugar", timing: "Morning" });
      checks.push({ key: "hc-pms", name: "Check post-meal blood sugar", timing: "2 hrs after lunch" });
    }
    if (hasHypertension) {
      checks.push({ key: "hc-bpm", name: "Measure blood pressure", timing: "Morning" });
      checks.push({ key: "hc-bpe", name: "Measure blood pressure", timing: "Evening" });
    }
    // General checks
    if (isMonday) {
      checks.push({ key: "hc-weigh", name: "Weigh yourself", timing: "Morning (before eating)" });
    }
    checks.push({ key: "hc-rhr", name: "Check resting heart rate", timing: "Morning (before getting up)" });

    return checks;
  };

  // ==================== SLEEP HYGIENE ====================
  const buildSleep = (goals: any[], prof: any): SleepItem[] => {
    const sleepGoal = goals.find((g: any) =>
      (g.goalType || "").toLowerCase().includes("sleep")
    );
    const targetHours = sleepGoal ? 8 : 7;
    const wakeTime = "6:30 AM";
    // Calculate bedtime: if target 7hrs and wake 6:30 AM, bed at 11:30 PM
    const wakeHour = 6.5;
    const bedHour = (wakeHour - targetHours + 24) % 24;
    const bedH = Math.floor(bedHour);
    const bedM = (bedHour - bedH) * 60;
    const bedAmPm = bedH >= 12 ? "PM" : "AM";
    const bedH12 = bedH > 12 ? bedH - 12 : bedH === 0 ? 12 : bedH;
    const bedtime = `${bedH12}:${bedM === 0 ? "00" : "30"} ${bedAmPm}`;

    return [
      { key: "sl-target", text: `Sleep target: ${targetHours} hours (${bedtime} -- ${wakeTime})` },
      { key: "sl-caffeine", text: "No caffeine after 2 PM" },
      { key: "sl-lights", text: "Dim lights 1 hour before bed" },
      { key: "sl-screens", text: "No screens 30 minutes before bed" },
      { key: "sl-bedtime", text: `In bed by ${bedtime}` },
      { key: "sl-wake", text: `Wake up at ${wakeTime} (same time every day)` },
    ];
  };

  const sleepItems = buildSleep(goals, profile);

  // Nutrition templates
  const vegBreakfasts: Meal[] = [
    { key: "b1", name: "Oats with banana and almond butter", description: "Rolled oats, 1 banana, 1 tbsp almond butter, honey", calories: 380, protein: 12 },
    { key: "b2", name: "Greek yogurt parfait", description: "Full-fat Greek yogurt, granola, mixed berries", calories: 340, protein: 18 },
    { key: "b3", name: "Whole wheat toast with avocado and eggs", description: "2 slices toast, 1/2 avocado, 2 poached eggs", calories: 420, protein: 20 },
    { key: "b4", name: "Smoothie bowl", description: "Spinach, protein powder, frozen berries, chia seeds, almond milk", calories: 320, protein: 22 },
    { key: "b5", name: "Poha with vegetables", description: "Flattened rice with peas, carrots, turmeric, lime", calories: 300, protein: 9 },
    { key: "b6", name: "Moong dal chilla", description: "Protein-rich lentil pancakes with mint chutney", calories: 280, protein: 16 },
    { key: "b7", name: "Upma with nuts", description: "Semolina upma with cashews, mustard, curry leaves", calories: 310, protein: 10 },
  ];
  const nonVegBreakfasts: Meal[] = [
    { key: "b1", name: "Eggs and oats", description: "3 scrambled eggs, rolled oats with milk, fruit", calories: 420, protein: 28 },
    { key: "b2", name: "Greek yogurt with boiled eggs", description: "Full-fat yogurt, 2 hard-boiled eggs, berries", calories: 370, protein: 30 },
    { key: "b3", name: "Chicken omelette wrap", description: "2-egg omelette, grilled chicken strips, whole wheat wrap", calories: 460, protein: 38 },
    { key: "b4", name: "Protein smoothie", description: "Whey protein, banana, milk, peanut butter, oats", calories: 400, protein: 35 },
    { key: "b5", name: "Egg bhurji with toast", description: "Spiced scrambled eggs with onion, tomato, 2 toast slices", calories: 380, protein: 26 },
    { key: "b6", name: "Tuna on whole wheat toast", description: "Canned tuna, avocado, 2 toast slices, lemon", calories: 350, protein: 32 },
    { key: "b7", name: "Oats with eggs", description: "Rolled oats, 2 poached eggs, spinach, hot sauce", calories: 360, protein: 28 },
  ];

  const vegLunches: Meal[] = [
    { key: "l1", name: "Dal and brown rice", description: "Masoor dal, brown rice, cucumber raita, salad", calories: 480, protein: 18 },
    { key: "l2", name: "Paneer wrap", description: "Grilled paneer, roasted peppers, hummus, whole wheat wrap", calories: 460, protein: 22 },
    { key: "l3", name: "Quinoa vegetable bowl", description: "Quinoa, roasted vegetables, chickpeas, tahini dressing", calories: 440, protein: 20 },
    { key: "l4", name: "Rajma chawal", description: "Red kidney beans, brown rice, yogurt, salad", calories: 500, protein: 20 },
    { key: "l5", name: "Tofu stir-fry with noodles", description: "Firm tofu, mixed vegetables, soy sauce, noodles", calories: 450, protein: 24 },
    { key: "l6", name: "Chole with roti", description: "Spiced chickpeas, 2 whole wheat rotis, salad", calories: 490, protein: 18 },
    { key: "l7", name: "Mixed vegetable khichdi", description: "Lentil rice with vegetables, ghee, papad", calories: 420, protein: 16 },
  ];
  const nonVegLunches: Meal[] = [
    { key: "l1", name: "Grilled chicken with brown rice", description: "180g chicken breast, 1 cup brown rice, salad, curd", calories: 550, protein: 48 },
    { key: "l2", name: "Egg fried rice", description: "Brown rice, 3 eggs, mixed vegetables, soy sauce", calories: 500, protein: 28 },
    { key: "l3", name: "Fish curry with rice", description: "Grilled fish, coconut curry, 1 cup rice, salad", calories: 520, protein: 42 },
    { key: "l4", name: "Chicken wrap", description: "Grilled chicken strips, lettuce, hummus, whole wheat wrap", calories: 480, protein: 40 },
    { key: "l5", name: "Chicken dal", description: "Chicken pieces, lentils, 2 rotis, cucumber salad", calories: 560, protein: 46 },
    { key: "l6", name: "Prawn stir-fry", description: "Prawns, mixed vegetables, brown rice, oyster sauce", calories: 490, protein: 38 },
    { key: "l7", name: "Tuna quinoa bowl", description: "Canned tuna, quinoa, avocado, cherry tomatoes, olive oil", calories: 480, protein: 42 },
  ];

  const vegDinners: Meal[] = [
    { key: "d1", name: "Vegetable soup with bread", description: "Minestrone soup, 1 slice whole grain bread, side salad", calories: 320, protein: 14 },
    { key: "d2", name: "Palak paneer with roti", description: "Spinach paneer curry, 2 whole wheat rotis", calories: 420, protein: 22 },
    { key: "d3", name: "Lentil soup", description: "Red lentil soup with cumin, 1 pita bread, yogurt", calories: 360, protein: 18 },
    { key: "d4", name: "Stuffed capsicum", description: "Bell peppers with quinoa, black beans, cheese filling", calories: 380, protein: 20 },
    { key: "d5", name: "Mushroom stir-fry with roti", description: "Mushrooms, peas, capsicum, 2 rotis", calories: 340, protein: 14 },
    { key: "d6", name: "Matar paneer", description: "Paneer and peas curry, 1 cup rice", calories: 430, protein: 22 },
    { key: "d7", name: "Moong dal soup", description: "Yellow lentil soup, bread, salad", calories: 300, protein: 16 },
  ];
  const nonVegDinners: Meal[] = [
    { key: "d1", name: "Grilled fish with vegetables", description: "Salmon fillet, steamed broccoli, cauliflower, olive oil", calories: 420, protein: 42 },
    { key: "d2", name: "Chicken soup", description: "Chicken broth, vegetables, noodles, herbs", calories: 340, protein: 32 },
    { key: "d3", name: "Egg curry with roti", description: "Boiled egg curry, 2 whole wheat rotis", calories: 400, protein: 26 },
    { key: "d4", name: "Baked chicken breast", description: "Herb-baked chicken, roasted vegetables, brown rice", calories: 460, protein: 44 },
    { key: "d5", name: "Prawn salad", description: "Grilled prawns, mixed greens, avocado, lemon dressing", calories: 320, protein: 30 },
    { key: "d6", name: "Chicken tikka with salad", description: "Grilled chicken tikka, cucumber tomato salad, mint chutney", calories: 380, protein: 40 },
    { key: "d7", name: "Fish tacos", description: "Grilled fish, corn tortillas, cabbage slaw, salsa", calories: 400, protein: 36 },
  ];

  const vegSnacks: Meal[] = [
    { key: "s1", name: "Fruit and nuts", description: "Apple, 20g almonds, 10g walnuts", calories: 200, protein: 5 },
    { key: "s2", name: "Hummus and veggies", description: "3 tbsp hummus, carrot and cucumber sticks", calories: 160, protein: 6 },
    { key: "s3", name: "Roasted chana", description: "50g roasted chickpeas, lemon, spices", calories: 180, protein: 10 },
    { key: "s4", name: "Protein shake", description: "Plant protein powder, almond milk, banana", calories: 200, protein: 20 },
    { key: "s5", name: "Mixed nuts", description: "Almonds, cashews, walnuts — 30g", calories: 180, protein: 5 },
    { key: "s6", name: "Sprouts chaat", description: "Mixed sprouts, tomato, onion, lime, chaat masala", calories: 150, protein: 9 },
    { key: "s7", name: "Banana with peanut butter", description: "1 medium banana, 1 tbsp natural peanut butter", calories: 190, protein: 5 },
  ];
  const nonVegSnacks: Meal[] = [
    { key: "s1", name: "Boiled eggs and nuts", description: "2 hard-boiled eggs, 15g almonds", calories: 200, protein: 18 },
    { key: "s2", name: "Whey protein shake", description: "Whey protein, milk, banana", calories: 220, protein: 25 },
    { key: "s3", name: "Chicken jerky", description: "Homemade or store-bought chicken jerky, 40g", calories: 150, protein: 22 },
    { key: "s4", name: "Greek yogurt and nuts", description: "150g Greek yogurt, 15g walnuts", calories: 210, protein: 16 },
    { key: "s5", name: "Tuna and crackers", description: "Tuna in water, whole grain crackers", calories: 180, protein: 20 },
    { key: "s6", name: "Egg white omelette", description: "3 egg whites, spinach, chili flakes", calories: 120, protein: 18 },
    { key: "s7", name: "Cottage cheese", description: "150g low-fat cottage cheese, black pepper, fruit", calories: 160, protein: 20 },
  ];

  const breakfasts = isVegetarian ? vegBreakfasts : nonVegBreakfasts;
  const lunches = isVegetarian ? vegLunches : nonVegLunches;
  const dinners = isVegetarian ? vegDinners : nonVegDinners;
  const snacks = isVegetarian ? vegSnacks : nonVegSnacks;

  const makeNutrition = (i: number): NutritionDay => {
    const b = breakfasts[i % breakfasts.length];
    const l = lunches[i % lunches.length];
    const d = dinners[i % dinners.length];
    const s = snacks[i % snacks.length];
    const scale = targetCalories / 2000;
    return {
      meals: {
        breakfast: { ...b, calories: Math.round(b.calories * scale), protein: Math.round(b.protein * scale) },
        lunch: { ...l, calories: Math.round(l.calories * scale), protein: Math.round(l.protein * scale) },
        dinner: { ...d, calories: Math.round(d.calories * scale), protein: Math.round(d.protein * scale) },
        snacks: { ...s, calories: Math.round(s.calories * scale), protein: Math.round(s.protein * scale) },
      },
      totals: {
        calories: targetCalories,
        protein: targetProtein,
        carbs: isWeightLoss ? 180 : 280,
        fat: isWeightLoss ? 55 : 75,
      },
    };
  };

  // Stress activities — varied across 7 days
  const stressActivities: StressActivity[][] = [
    // Day 0: Monday
    [
      { key: "s1", timing: "Morning", activity: "5-min box breathing", duration: "5 min" },
      { key: "s2", timing: "Midday", activity: "Desk stretch break", duration: "5 min" },
      { key: "s3", timing: "Evening", activity: "10-min body scan meditation", duration: "10 min" },
    ],
    // Day 1: Tuesday
    [
      { key: "s4", timing: "Morning", activity: "Gratitude journaling — 3 things", duration: "5 min" },
      { key: "s5", timing: "Midday", activity: "5-min mindful walk outside", duration: "5 min" },
      { key: "s6", timing: "Evening", activity: "Progressive muscle relaxation", duration: "8 min" },
    ],
    // Day 2: Wednesday
    [
      { key: "s7", timing: "Morning", activity: "10-min sunlight walk", duration: "10 min" },
      { key: "s8", timing: "Midday", activity: "Desk stretch break", duration: "5 min" },
      { key: "s9", timing: "Evening", activity: "4-7-8 breathing before sleep", duration: "5 min" },
    ],
    // Day 3: Thursday
    [
      { key: "s10", timing: "Morning", activity: "Deep diaphragmatic breathing", duration: "5 min" },
      { key: "s11", timing: "Midday", activity: "5-min mindful walk outside", duration: "5 min" },
      { key: "s12", timing: "Evening", activity: "Guided body scan meditation", duration: "12 min" },
    ],
    // Day 4: Friday
    [
      { key: "s13", timing: "Morning", activity: "5-min box breathing", duration: "5 min" },
      { key: "s14", timing: "Morning", activity: "10-min sunlight walk", duration: "10 min" },
      { key: "s15", timing: "Evening", activity: "Progressive muscle relaxation", duration: "8 min" },
    ],
    // Day 5: Saturday
    [
      { key: "s16", timing: "Morning", activity: "10-min yoga nidra", duration: "10 min" },
      { key: "s17", timing: "Midday", activity: "5-min mindful walk outside", duration: "5 min" },
    ],
    // Day 6: Sunday
    [
      { key: "s18", timing: "Morning", activity: "Gratitude journaling — reflect on the week", duration: "10 min" },
      { key: "s19", timing: "Evening", activity: "4-7-8 breathing before sleep", duration: "5 min" },
    ],
  ];

  // Pain management
  const backPainExercises: PainExercise[] = [
    { key: "p1", name: "McGill curl-up", prescription: "3 x 10 reps", note: "Keep lower back flat, only raise head and shoulders" },
    { key: "p2", name: "Side plank", prescription: "3 x 20 seconds each side", note: "Maintain straight body alignment" },
    { key: "p3", name: "Bird-dog", prescription: "3 x 10 reps each side", note: "Extend opposite arm and leg slowly" },
    { key: "p4", name: "Cat-cow stretch", prescription: "2 x 10 reps", note: "Add if pain is below 4/10" },
    { key: "p5", name: "Glute bridge", prescription: "3 x 15 reps", note: "Press heels into floor, squeeze glutes at top" },
  ];
  const kneePainExercises: PainExercise[] = [
    { key: "p6", name: "Straight-leg raise", prescription: "3 x 15 reps each side", note: "Keep quad engaged throughout" },
    { key: "p7", name: "Clamshells", prescription: "3 x 20 reps each side", note: "Keep hips stacked, use resistance band if comfortable" },
    { key: "p8", name: "Terminal knee extension", prescription: "3 x 15 reps", note: "Loop band behind knee, press knee straight" },
    { key: "p9", name: "Step-up (low box)", prescription: "3 x 12 reps each leg", note: "Use a 15 cm step, avoid pain range" },
    { key: "p10", name: "Seated leg press (shallow)", prescription: "3 x 12 reps", note: "0-60 degrees only, no deep knee flexion" },
  ];

  const activePain = [
    ...(hasBackPain ? backPainExercises : []),
    ...(hasKneePain ? kneePainExercises : []),
  ];

  // Exercise templates
  const gymPlan: Array<{ label: string; duration: string; activityType: DayPlan["activityType"]; exercises: Exercise[] }> = [
    {
      label: "Push Day — Chest, Shoulders, Triceps",
      duration: "50-60 min",
      activityType: "exercise",
      exercises: [
        { key: "e1", name: "Barbell Bench Press", subtitle: "Go heavier than last week", sets: 4, reps: "8" },
        { key: "e2", name: "Incline Dumbbell Press", subtitle: "Control the descent — 3s down", sets: 3, reps: "10" },
        { key: "e3", name: "Overhead Press (Dumbbell)", subtitle: "Keep core tight, don't arch lower back", sets: 3, reps: "10" },
        { key: "e4", name: "Cable Lateral Raise", subtitle: "Full range, no swinging", sets: 3, reps: "15" },
        { key: "e5", name: "Tricep Rope Pushdown", subtitle: "Squeeze at bottom", sets: 3, reps: "12" },
        { key: "e6", name: "Overhead Tricep Extension", subtitle: "Keep elbows close to head", sets: 3, reps: "12" },
      ],
    },
    {
      label: "Pull Day — Back, Biceps",
      duration: "50-60 min",
      activityType: "exercise",
      exercises: [
        { key: "e7", name: hasBackPain ? "Cable Row (seated)" : "Barbell Deadlift", subtitle: hasBackPain ? "Neutral spine, pull elbows back" : "Hinge at hips, brace core", sets: 4, reps: hasBackPain ? "12" : "5" },
        { key: "e8", name: "Lat Pulldown", subtitle: "Lead with elbows, not hands", sets: 4, reps: "10" },
        { key: "e9", name: "Seated Cable Row", subtitle: "Full retraction, hold 1s at end", sets: 3, reps: "12" },
        { key: "e10", name: "Face Pull", subtitle: "Flare elbows high, external rotation", sets: 3, reps: "15" },
        { key: "e11", name: "Barbell Bicep Curl", subtitle: "Full ROM, no momentum", sets: 3, reps: "12" },
        { key: "e12", name: "Hammer Curl", subtitle: "Neutral grip, controlled", sets: 3, reps: "10" },
      ],
    },
    {
      label: "Rest / Light Cardio",
      duration: "20-30 min optional",
      activityType: "recovery",
      exercises: [
        { key: "e13", name: "Brisk Walk", subtitle: "Easy pace — recovery only", sets: 1, reps: "20 min" },
        { key: "e14", name: "Foam Rolling", subtitle: "Major muscle groups", sets: 1, reps: "10 min" },
        { key: "e15", name: "Light Stretching", subtitle: "Hold each stretch 30s", sets: 1, reps: "10 min" },
      ],
    },
    {
      label: hasKneePain ? "Legs Day — Modified (Knee Safe)" : "Legs Day — Quads, Hamstrings, Glutes, Calves",
      duration: "55-65 min",
      activityType: "exercise",
      exercises: hasKneePain
        ? [
            { key: "e16", name: "Leg Press (shallow range)", subtitle: "0-60 degree range, no pain", sets: 4, reps: "12" },
            { key: "e17", name: "Romanian Deadlift", subtitle: "Hip hinge, feel hamstring stretch", sets: 3, reps: "10" },
            { key: "e18", name: "Leg Extension (light)", subtitle: "Pain-free range only", sets: 3, reps: "15" },
            { key: "e19", name: "Standing Calf Raise", subtitle: "Full range, pause at top", sets: 4, reps: "20" },
            { key: "e20", name: "Glute Bridge", subtitle: "Squeeze glutes hard at top", sets: 3, reps: "15" },
          ]
        : [
            { key: "e16", name: "Back Squat", subtitle: hasBackPain ? "Goblet squat instead — safer for spine" : "Brace core, drive knees out", sets: 4, reps: "8" },
            { key: "e17", name: "Romanian Deadlift", subtitle: "Hip hinge, feel hamstring stretch", sets: 3, reps: "10" },
            { key: "e18", name: "Leg Press", subtitle: "Feet shoulder-width, full range", sets: 3, reps: "12" },
            { key: "e19", name: "Leg Curl (seated)", subtitle: "Slow eccentric — 3s down", sets: 3, reps: "12" },
            { key: "e20", name: "Standing Calf Raise", subtitle: "Full range, pause at top", sets: 4, reps: "20" },
          ],
    },
    {
      label: "Cardio + Core",
      duration: "40-50 min",
      activityType: "exercise",
      exercises: [
        { key: "e21", name: "Treadmill / Elliptical", subtitle: "Moderate intensity, 130-150 bpm", sets: 1, reps: "20 min" },
        { key: "e22", name: hasBackPain ? "Dead Bug" : "Plank", subtitle: hasBackPain ? "Opposite arm-leg extension, slow" : "Neutral spine, breathe normally", sets: 3, reps: hasBackPain ? "8 each side" : "45s" },
        { key: "e23", name: hasBackPain ? "Pallof Press" : "Hanging Knee Raise", subtitle: hasBackPain ? "Anti-rotation, resist twisting" : "Controlled, no swinging", sets: 3, reps: "12" },
        { key: "e24", name: "Ab Wheel Rollout", subtitle: "Only go as far as you can control", sets: 3, reps: "10" },
        { key: "e25", name: "Russian Twist", subtitle: "Control the rotation", sets: 3, reps: "16" },
      ],
    },
    {
      label: "Rest / Active Recovery",
      duration: "Optional light activity",
      activityType: "rest",
      exercises: [
        { key: "e26", name: "Light walk or swim", subtitle: "Low intensity only", sets: 1, reps: "30 min" },
        { key: "e27", name: "Mobility work", subtitle: "Hip flexors, shoulders, thoracic spine", sets: 1, reps: "15 min" },
      ],
    },
    {
      label: "Cardio / Flexibility",
      duration: "30-45 min",
      activityType: "exercise",
      exercises: [
        { key: "e28", name: "Cycling or brisk walk", subtitle: "Steady state, conversational pace", sets: 1, reps: "25 min" },
        { key: "e29", name: "Full body stretch routine", subtitle: "Hold each position 30-45 seconds", sets: 1, reps: "15 min" },
        { key: "e30", name: "Hip flexor stretch", subtitle: "Kneeling lunge position", sets: 2, reps: "45s each" },
      ],
    },
  ];

  const noGymPlan: Array<{ label: string; duration: string; activityType: DayPlan["activityType"]; exercises: Exercise[] }> = [
    {
      label: "Upper Body — Bodyweight",
      duration: "40-50 min",
      activityType: "exercise",
      exercises: [
        { key: "e1", name: "Push-up", subtitle: "Go slow on the way down — 3s", sets: 4, reps: "12" },
        { key: "e2", name: "Pike Push-up", subtitle: "Shoulders over wrists, elbows flared", sets: 3, reps: "10" },
        { key: "e3", name: "Diamond Push-up", subtitle: "Hands forming diamond, tricep focus", sets: 3, reps: "10" },
        { key: "e4", name: "Inverted Row (table or bar)", subtitle: "Keep body straight, pull chest to bar", sets: 4, reps: "12" },
        { key: "e5", name: "Dip (chair)", subtitle: "Lower until elbows at 90 degrees", sets: 3, reps: "12" },
        { key: "e6", name: "Superman hold", subtitle: "Squeeze glutes and back, hold 2s", sets: 3, reps: "12" },
      ],
    },
    {
      label: "Lower Body — Bodyweight",
      duration: "40-50 min",
      activityType: "exercise",
      exercises: hasKneePain
        ? [
            { key: "e7", name: "Glute bridge", subtitle: "Squeeze at top, hold 2s", sets: 4, reps: "20" },
            { key: "e8", name: "Single-leg deadlift", subtitle: "Hinge at hip, feel hamstring", sets: 3, reps: "10 each" },
            { key: "e9", name: "Standing calf raise", subtitle: "Slow and controlled", sets: 4, reps: "25" },
            { key: "e10", name: "Donkey kick", subtitle: "Full hip extension, squeeze glute", sets: 3, reps: "15 each" },
            { key: "e11", name: "Side-lying leg raise", subtitle: "Keep hips stacked", sets: 3, reps: "20 each" },
          ]
        : [
            { key: "e7", name: "Bodyweight squat", subtitle: "Chest tall, drive knees out", sets: 4, reps: "20" },
            { key: "e8", name: "Reverse lunge", subtitle: "Back knee hovers off floor", sets: 3, reps: "12 each" },
            { key: "e9", name: "Glute bridge", subtitle: "Squeeze at top, hold 2s", sets: 4, reps: "20" },
            { key: "e10", name: "Wall sit", subtitle: "90 degree angle, breathe steadily", sets: 3, reps: "45s" },
            { key: "e11", name: "Standing calf raise", subtitle: "Slow and controlled", sets: 4, reps: "25" },
          ],
    },
    {
      label: "Rest Day",
      duration: "Optional walk",
      activityType: "rest",
      exercises: [
        { key: "e12", name: "Rest", subtitle: "Allow your body to recover", sets: 0, reps: "—" },
        { key: "e13", name: "Light walk (optional)", subtitle: "20-30 min easy pace", sets: 1, reps: "20-30 min" },
      ],
    },
    {
      label: "Full Body Circuit",
      duration: "45-55 min",
      activityType: "exercise",
      exercises: [
        { key: "e14", name: "Jumping jacks", subtitle: "Warm up for 3 minutes", sets: 1, reps: "3 min" },
        { key: "e15", name: "Push-up", subtitle: "Control, don't rush", sets: 3, reps: "12" },
        { key: "e16", name: hasKneePain ? "Glute bridge" : "Squat", subtitle: hasKneePain ? "Squeeze hard at top" : "Full depth, controlled", sets: 3, reps: "15" },
        { key: "e17", name: "Mountain climber", subtitle: "Core tight, alternate legs fast", sets: 3, reps: "30s" },
        { key: "e18", name: hasBackPain ? "Bird-dog" : "Burpee", subtitle: hasBackPain ? "Slow and controlled" : "Explosive jump at top", sets: 3, reps: hasBackPain ? "10 each" : "10" },
        { key: "e19", name: "Plank", subtitle: "Maintain neutral spine", sets: 3, reps: "40s" },
      ],
    },
    {
      label: "Cardio — Walk / Run",
      duration: "30-40 min",
      activityType: "exercise",
      exercises: [
        { key: "e20", name: "Brisk walk or light jog", subtitle: "Aim for 130-140 bpm", sets: 1, reps: "30-40 min" },
        { key: "e21", name: "Interval walk", subtitle: "2 min fast, 1 min slow — repeat 8x", sets: 8, reps: "3 min" },
      ],
    },
    {
      label: "Yoga / Flexibility",
      duration: "30-40 min",
      activityType: "recovery",
      exercises: [
        { key: "e22", name: "Sun salutation (Surya Namaskar)", subtitle: "12 rounds, steady breath", sets: 3, reps: "4 rounds" },
        { key: "e23", name: "Seated forward fold", subtitle: "Hold 45s, relax into stretch", sets: 2, reps: "45s" },
        { key: "e24", name: "Pigeon pose", subtitle: "Hold each side", sets: 2, reps: "45s each" },
        { key: "e25", name: "Child's pose", subtitle: "Breath into lower back", sets: 1, reps: "90s" },
        { key: "e26", name: "Legs up the wall", subtitle: "Relaxing inversion, deep breath", sets: 1, reps: "3 min" },
      ],
    },
    {
      label: "Rest Day",
      duration: "Full rest",
      activityType: "rest",
      exercises: [
        { key: "e27", name: "Full rest", subtitle: "Recovery is part of the program", sets: 0, reps: "—" },
      ],
    },
  ];

  const exercisePlan = hasGym ? gymPlan : noGymPlan;

  // Step targets based on day type
  const getStepTarget = (activityType: DayPlan["activityType"], label: string): StepTarget => {
    const isCardioDay = label.toLowerCase().includes("cardio") || label.toLowerCase().includes("walk") || label.toLowerCase().includes("run");
    if (activityType === "rest") return { target: 5000, dayType: "rest" };
    if (isCardioDay) return { target: 10000, dayType: "cardio" };
    return { target: 8000, dayType: "exercise" };
  };

  return exercisePlan.map((ep, i) => ({
    ...ep,
    stepTarget: getStepTarget(ep.activityType, ep.label),
    nutrition: makeNutrition(i),
    hydration: { totalMl: hydrationMl },
    medications: medicationItems,
    healthChecks: buildHealthChecks(i),
    stress: stressActivities[i % stressActivities.length],
    pain: activePain.length > 0 ? activePain : [],
    sleep: sleepItems,
  }));
}

// ==================== COMPONENT HELPERS ====================

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ACTIVITY_COLORS: Record<DayPlan["activityType"], { pill: string; dot: string; label: string }> = {
  exercise: { pill: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500", label: "Exercise" },
  nutrition: { pill: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", label: "Nutrition" },
  recovery: { pill: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", label: "Recovery" },
  rest: { pill: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", label: "Rest" },
};

function CheckItem({
  itemKey,
  checked,
  onToggle,
  children,
}: {
  itemKey: string;
  checked: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`flex items-start gap-3 w-full text-left py-2.5 px-0 transition-opacity ${checked ? "opacity-60" : ""}`}
      onClick={() => onToggle(itemKey)}
      data-testid={`check-item-${itemKey}`}
    >
      <span className="mt-0.5 flex-shrink-0">
        {checked ? (
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </span>
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </span>
      <span className={`flex-1 min-w-0 ${checked ? "line-through text-muted-foreground" : ""}`}>
        {children}
      </span>
    </button>
  );
}

function CollapsibleSection({
  title,
  icon,
  iconColor,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="vitallity-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
        data-testid={`section-toggle-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Hydration widget — 8 buttons each ~300ml, tap to fill blue
function HydrationWidget({
  totalMl,
  filledCount,
  onToggle,
}: {
  totalMl: number;
  filledCount: number;
  onToggle: (index: number) => void;
}) {
  const cups = 8;
  const mlPerCup = Math.round(totalMl / cups);
  const consumedMl = filledCount * mlPerCup;
  const consumedL = (consumedMl / 1000).toFixed(1);
  const targetL = (totalMl / 1000).toFixed(1);

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Hydration</p>
        <span className="text-xs font-semibold text-blue-600">{consumedL}L / {targetL}L</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">Each glass is approx. {mlPerCup} ml. Tap to mark as consumed.</p>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: cups }).map((_, idx) => {
          const filled = idx < filledCount;
          return (
            <button
              key={idx}
              onClick={() => onToggle(idx)}
              data-testid={`hydration-cup-${idx}`}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                filled
                  ? "bg-blue-500 border-blue-500"
                  : "bg-background border-border/60 hover:border-blue-300"
              }`}
              aria-label={`Glass ${idx + 1} ${filled ? "consumed" : "not consumed"}`}
            >
              <Droplets className={`w-4 h-4 ${filled ? "text-white" : "text-muted-foreground/50"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function WeeklyPlanPage() {
  const [, setLocation] = useLocation();
  const authFetch = useAuthFetch();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [weekStartDate, setWeekStartDate] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);

  // Hydration state: dayIndex -> number of cups filled
  const [hydrationCups, setHydrationCups] = useState<Record<number, number>>({});

  // Load plan on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch user profile + weekly plan in parallel
        const [profileRes, planRes] = await Promise.all([
          authFetch("GET", "/api/settings"),
          authFetch("GET", "/api/weekly-plan"),
        ]);
        const profileData = await profileRes.json();
        const planData = await planRes.json();

        setWeekStartDate(planData.weekStartDate);

        // Convert logs to internal format
        const incomingLogs: LogEntry[] = (planData.logs || []).map((l: any) => ({
          dayIndex: l.dayIndex,
          sectionKey: l.sectionKey,
          itemKey: l.itemKey,
        }));
        setLogs(incomingLogs);

        // Set current day (Mon=0 ... Sun=6)
        const today = new Date().getDay(); // 0=Sun
        const todayIndex = today === 0 ? 6 : today - 1;
        setSelectedDay(todayIndex);

        if (planData.plan) {
          setPlan(planData.plan);
        } else {
          // Generate plan from profile
          const generated = generateWeeklyPlan(
            profileData.profile || {},
            profileData.goals || [],
            profileData.conditions || [],
            profileData.painAreas || [],
            profileData.activities || [],
            profileData.dietaryPrefs || [],
            profileData.medications || [],
          );
          setPlan(generated);

          // Save generated plan
          setSavingPlan(true);
          try {
            await authFetch("POST", "/api/weekly-plan", {
              weekStartDate: getWeekStartDate(),
              plan: generated,
            });
          } finally {
            setSavingPlan(false);
          }
        }
      } catch (err) {
        console.error("Failed to load weekly plan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [authFetch]);

  const isChecked = useCallback(
    (dayIndex: number, sectionKey: string, itemKey: string) =>
      logs.some(
        l => l.dayIndex === dayIndex && l.sectionKey === sectionKey && l.itemKey === itemKey
      ),
    [logs]
  );

  const toggleItem = useCallback(
    async (dayIndex: number, sectionKey: string, itemKey: string) => {
      const newChecked = !isChecked(dayIndex, sectionKey, itemKey);
      if (newChecked) {
        setLogs(prev => [...prev, { dayIndex, sectionKey, itemKey }]);
      } else {
        setLogs(prev => prev.filter(l => !(l.dayIndex === dayIndex && l.sectionKey === sectionKey && l.itemKey === itemKey)));
      }
      try {
        await authFetch("POST", "/api/weekly-plan/log", {
          weekStartDate,
          dayIndex,
          sectionKey,
          itemKey,
          completed: newChecked,
        });
      } catch {
        // Revert
        if (newChecked) {
          setLogs(prev => prev.filter(l => !(l.dayIndex === dayIndex && l.sectionKey === sectionKey && l.itemKey === itemKey)));
        } else {
          setLogs(prev => [...prev, { dayIndex, sectionKey, itemKey }]);
        }
      }
    },
    [isChecked, weekStartDate, authFetch]
  );

  // Toggle a hydration cup for a given day
  const toggleHydrationCup = useCallback((dayIndex: number, cupIndex: number) => {
    setHydrationCups(prev => {
      const current = prev[dayIndex] ?? 0;
      // If clicking the current last filled cup, unfill it; otherwise fill up to cupIndex+1
      const newCount = cupIndex < current ? cupIndex : cupIndex + 1;
      return { ...prev, [dayIndex]: newCount };
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Building your weekly plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Could not load plan. Please try again.</p>
      </div>
    );
  }

  const dayPlan = plan[selectedDay];
  const hasPain = dayPlan.pain.length > 0;
  const hasMedications = dayPlan.medications.length > 0;

  // Step target label helpers
  const stepTargetLabel = dayPlan.stepTarget.target.toLocaleString();

  // Calculate today's completion
  const todayItems = [
    { sectionKey: "steps", itemKey: "step-target" },
    ...dayPlan.exercises.map(e => ({ sectionKey: "exercise", itemKey: e.key })),
    ...Object.values(dayPlan.nutrition.meals).map(m => ({ sectionKey: "nutrition", itemKey: m.key })),
    ...dayPlan.medications.map(m => ({ sectionKey: "medication", itemKey: m.key })),
    ...dayPlan.healthChecks.map(h => ({ sectionKey: "healthcheck", itemKey: h.key })),
    ...dayPlan.stress.map(s => ({ sectionKey: "stress", itemKey: s.key })),
    ...(hasPain ? dayPlan.pain.map(p => ({ sectionKey: "pain", itemKey: p.key })) : []),
    ...dayPlan.sleep.map(s => ({ sectionKey: "sleep", itemKey: s.key })),
  ];
  const completedToday = todayItems.filter(item =>
    isChecked(selectedDay, item.sectionKey, item.itemKey)
  ).length;
  const totalToday = todayItems.length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const cupsFilledToday = hydrationCups[selectedDay] ?? 0;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="weekly-plan-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            data-testid="back-button"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground leading-tight">My Weekly Plan</h1>
            <p className="text-[11px] text-muted-foreground">
              {savingPlan ? "Saving plan..." : "Personalized for your goals"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Day selector pills */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DAY_LABELS.map((day, i) => {
              const dp = plan[i];
              const colors = ACTIVITY_COLORS[dp.activityType];
              const isSelected = selectedDay === i;
              const today = new Date().getDay();
              const todayIndex = today === 0 ? 6 : today - 1;
              const isToday = i === todayIndex;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i)}
                  data-testid={`day-pill-${day.toLowerCase()}`}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all min-w-[52px]
                    ${isSelected
                      ? `${colors.pill} border-current shadow-sm`
                      : isToday
                        ? "bg-background border-primary/40 text-foreground"
                        : "bg-muted/40 border-transparent text-muted-foreground"
                    }`}
                >
                  <span className="text-[11px] font-semibold">{day}</span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? colors.dot : isToday ? "bg-primary" : "bg-muted-foreground/30"}`} />
                </button>
              );
            })}
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(ACTIVITY_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                <span className="text-[11px] text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day title + progress */}
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">{dayPlan.label}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{dayPlan.duration}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${ACTIVITY_COLORS[dayPlan.activityType].pill}`}>
              {ACTIVITY_COLORS[dayPlan.activityType].label}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">{completedToday} of {totalToday} activities completed today</span>
              <span className="text-[11px] font-semibold text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>
        </div>

        {/* A. Exercise Plan */}
        <CollapsibleSection
          title="Exercise Plan"
          icon={<Dumbbell className="w-4 h-4" />}
          iconColor="bg-green-100 text-green-700"
          defaultOpen={true}
        >
          <div className="divide-y divide-border/40">
            {/* Step Target row */}
            <CheckItem
              itemKey="step-target"
              checked={isChecked(selectedDay, "steps", "step-target")}
              onToggle={() => toggleItem(selectedDay, "steps", "step-target")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Daily Step Goal</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{dayPlan.stepTarget.dayType} day target</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground flex-shrink-0">{stepTargetLabel}</span>
              </div>
            </CheckItem>

            {dayPlan.exercises.map((ex) => {
              const checked = isChecked(selectedDay, "exercise", ex.key);
              return (
                <CheckItem
                  key={ex.key}
                  itemKey={ex.key}
                  checked={checked}
                  onToggle={() => toggleItem(selectedDay, "exercise", ex.key)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{ex.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{ex.subtitle}</p>
                    </div>
                    {ex.sets > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-foreground">{ex.sets} x {ex.reps}</p>
                        <p className="text-[10px] text-muted-foreground">sets x reps</p>
                      </div>
                    )}
                  </div>
                </CheckItem>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* B. Nutrition Plan */}
        <CollapsibleSection
          title="Nutrition Plan"
          icon={<Utensils className="w-4 h-4" />}
          iconColor="bg-amber-100 text-amber-700"
          defaultOpen={false}
        >
          <div className="space-y-3">
            {/* Meal rows */}
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((mealType) => {
              const meal = dayPlan.nutrition.meals[mealType];
              const checked = isChecked(selectedDay, "nutrition", meal.key);
              const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
              return (
                <div key={mealType} className="border border-border/40 rounded-lg overflow-hidden">
                  <CheckItem
                    itemKey={meal.key}
                    checked={checked}
                    onToggle={() => toggleItem(selectedDay, "nutrition", meal.key)}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{mealLabel}</span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{meal.calories} cal</span>
                          <span>{meal.protein}g protein</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{meal.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{meal.description}</p>
                    </div>
                  </CheckItem>
                </div>
              );
            })}

            {/* Daily totals */}
            <div className="bg-muted/40 rounded-lg p-3 mt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Daily Target</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: `${dayPlan.nutrition.totals.calories}` },
                  { label: "Protein", value: `${dayPlan.nutrition.totals.protein}g` },
                  { label: "Carbs", value: `${dayPlan.nutrition.totals.carbs}g` },
                  { label: "Fat", value: `${dayPlan.nutrition.totals.fat}g` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-sm font-bold text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hydration subsection */}
            <HydrationWidget
              totalMl={dayPlan.hydration.totalMl}
              filledCount={cupsFilledToday}
              onToggle={(cupIndex) => toggleHydrationCup(selectedDay, cupIndex)}
            />
          </div>
        </CollapsibleSection>

        {/* C. Medication & Supplements */}
        <CollapsibleSection
          title="Medication & Supplements"
          icon={<Pill className="w-4 h-4" />}
          iconColor="bg-violet-100 text-violet-700"
          defaultOpen={false}
        >
          {hasMedications ? (
            <div className="divide-y divide-border/40">
              {dayPlan.medications.map((med) => {
                const checked = isChecked(selectedDay, "medication", med.key);
                return (
                  <CheckItem
                    key={med.key}
                    itemKey={med.key}
                    checked={checked}
                    onToggle={() => toggleItem(selectedDay, "medication", med.key)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{med.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{med.dosage}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        med.timing === "Morning"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : med.timing === "Afternoon"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}>
                        {med.timing}
                      </span>
                    </div>
                  </CheckItem>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No medications configured.</p>
          )}
        </CollapsibleSection>

        {/* D. Health Checks */}
        <CollapsibleSection
          title="Health Checks"
          icon={<HeartPulse className="w-4 h-4" />}
          iconColor="bg-rose-100 text-rose-700"
          defaultOpen={false}
        >
          <div className="divide-y divide-border/40">
            {dayPlan.healthChecks.map((hc) => {
              const checked = isChecked(selectedDay, "healthcheck", hc.key);
              return (
                <CheckItem
                  key={hc.key}
                  itemKey={hc.key}
                  checked={checked}
                  onToggle={() => toggleItem(selectedDay, "healthcheck", hc.key)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">{hc.name}</p>
                    <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0 text-right">{hc.timing}</span>
                  </div>
                </CheckItem>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* E. Stress Management */}
        <CollapsibleSection
          title="Stress Management"
          icon={<Brain className="w-4 h-4" />}
          iconColor="bg-purple-100 text-purple-700"
          defaultOpen={false}
        >
          <div className="divide-y divide-border/40">
            {dayPlan.stress.map((s) => {
              const checked = isChecked(selectedDay, "stress", s.key);
              return (
                <CheckItem
                  key={s.key}
                  itemKey={s.key}
                  checked={checked}
                  onToggle={() => toggleItem(selectedDay, "stress", s.key)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.timing}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{s.activity}</p>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">{s.duration}</span>
                  </div>
                </CheckItem>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* F. Pain Management (only if user has pain areas) */}
        {hasPain && (
          <CollapsibleSection
            title="Pain Management"
            icon={<Activity className="w-4 h-4" />}
            iconColor="bg-red-100 text-red-700"
            defaultOpen={false}
          >
            <div className="divide-y divide-border/40">
              {dayPlan.pain.map((p) => {
                const checked = isChecked(selectedDay, "pain", p.key);
                return (
                  <CheckItem
                    key={p.key}
                    itemKey={p.key}
                    checked={checked}
                    onToggle={() => toggleItem(selectedDay, "pain", p.key)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs font-medium text-primary mt-0.5">{p.prescription}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.note}</p>
                    </div>
                  </CheckItem>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* G. Sleep Hygiene */}
        <CollapsibleSection
          title="Sleep Hygiene"
          icon={<Moon className="w-4 h-4" />}
          iconColor="bg-indigo-100 text-indigo-700"
          defaultOpen={false}
        >
          <div className="divide-y divide-border/40">
            {dayPlan.sleep.map((item) => {
              const checked = isChecked(selectedDay, "sleep", item.key);
              return (
                <CheckItem
                  key={item.key}
                  itemKey={item.key}
                  checked={checked}
                  onToggle={() => toggleItem(selectedDay, "sleep", item.key)}
                >
                  <p className="text-sm font-semibold text-foreground">{item.text}</p>
                </CheckItem>
              );
            })}
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}
