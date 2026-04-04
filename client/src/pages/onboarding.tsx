import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { ChipGroup, Chip } from "@/components/ui/chip";
import { RangeSlider } from "@/components/ui/range-slider";
import { searchMedications } from "@/data/medications";
import {
  ArrowLeft, ArrowRight, Loader2, X, Plus, Search,
  AlertTriangle, Info, Heart, Target, Sparkles, Check,
  Trash2, Watch, Activity,
  Clock, TrendingUp, Flame, Footprints, Moon, Dumbbell, Leaf,
  ChevronDown, ChevronUp, Pencil,
  Brain, Eye, Shield, Zap, BarChart2, RefreshCw, ChevronRight,
  User, ListChecks, Send, MessageCircle, Utensils, Sheet,
} from "lucide-react";

// ─── Why We Ask Tooltip ────────────────────────────────────
function WhyWeAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Why we ask"
        data-testid="why-we-ask"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card border border-gray-200 rounded-[12px] p-3 shadow-card text-xs text-gray-700 leading-relaxed animate-scale-in" data-testid="why-we-ask-tooltip">
            {text}
          </div>
        </>
      )}
    </span>
  );
}

// ─── Phase / Step Config ─────────────────────────────────────
const PHASES = [
  { label: "About You", steps: [1, 2] },
  { label: "Body & Movement", steps: [3, 4] },
  { label: "Food & Lifestyle", steps: [5, 6] },
  { label: "What Worked", steps: [7] },
  { label: "Goals & Plan", steps: [8, 9, 10, 11, 12, 13] },
];

const TOTAL_STEPS = 13;

function getPhaseForStep(step: number) {
  for (let i = 0; i < PHASES.length; i++) {
    if (PHASES[i].steps.includes(step)) return i;
  }
  return 0;
}

// ─── Condition → Pain mapping ────────────────────────────────
const CONDITION_PAIN_MAP: Record<string, string[]> = {
  "Fibromyalgia": ["Full Body", "Shoulders", "Back", "Hips"],
  "Arthritis": ["Knees", "Wrists", "Hips", "Fingers"],
  "Chronic Back Pain": ["Lower Back", "Upper Back"],
  "Knee Issues": ["Knees"],
  "Chronic Migraine": ["Head", "Neck"],
  "Heart Condition": ["Chest"],
  "IBS/Digestive Issues": ["Abdomen"],
  "Compressed Nerve": ["Lower Back"],
  "Sciatica": ["Lower Back", "Left Leg"],
};

// ─── Condition Suggestions ───────────────────────────────────
const CONDITION_SUGGESTIONS: Record<string, string[]> = {
  "Type 2 Diabetes": ["Hypertension", "Thyroid", "Heart Condition"],
  "Type 1 Diabetes": ["Thyroid"],
  "Hypertension": ["Heart Condition", "Type 2 Diabetes"],
  "Heart Condition": ["Hypertension", "Type 2 Diabetes"],
  "PCOD/PCOS": ["Thyroid", "Type 2 Diabetes"],
  "Thyroid": ["PCOD/PCOS"],
  "Fibromyalgia": ["Depression/Anxiety", "IBS/Digestive Issues", "Chronic Migraine"],
  "Depression/Anxiety": ["IBS/Digestive Issues", "Chronic Migraine"],
  "Chronic Back Pain": ["Sciatica"],
  "Sciatica": ["Chronic Back Pain", "Lumbar Spondylosis"],
};

// ─── Fitness Tracker Options ────────────────────────────────
const fitnessTrackerOptions = [
  { label: "Apple Watch" },
  { label: "Samsung Galaxy Watch" },
  { label: "Fitbit" },
  { label: "Garmin" },
  { label: "Oura Ring" },
  { label: "Noise/boAt Watch" },
  { label: "Mi Band / Xiaomi" },
  { label: "Whoop" },
  { label: "CGM (Continuous Glucose Monitor)" },
  { label: "None" },
];

// ─── Snacking Options ───────────────────────────────────────
const snackingOptions = [
  { label: "No snacking" },
  { label: "Light snacking (1-2 times)" },
  { label: "Frequent snacking (3+ times)" },
  { label: "Grazing throughout the day" },
];

// ─── Milestone Suggestions ───────────────────────────────────
const MILESTONE_SUGGESTIONS: Record<string, { title: string; target: string; timeframe: string; steps: { weekLabel: string; description: string; why: string }[]; phases?: { name: string; weeks: string; color: string }[] }> = {
  "Lose Weight": {
    title: "Lose first 2-3kg",
    target: "Reduce 2.5kg from current weight",
    timeframe: "1 month",
    phases: [
      { name: "Foundation", weeks: "Week 1-2", color: "primary" },
      { name: "Building", weeks: "Week 3-4", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1-2", description: "Track food intake 5/7 days and add a 20-min morning walk", why: "Awareness is the first lever -- you can't change what you don't measure" },
      { weekLabel: "Week 3-4", description: "Cut sugary drinks, reduce rice/bread by 25%, and walk daily", why: "Simple swaps create a calorie deficit without feeling deprived" },
    ],
  },
  "Manage Pain": {
    title: "Reduce pain by 2 points",
    target: "Pain level 4 or below",
    timeframe: "1 month",
    phases: [
      { name: "Foundation", weeks: "Week 1-2", color: "primary" },
      { name: "Building", weeks: "Week 3-4", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1-2", description: "10 min gentle stretching daily + track pain triggers in a journal", why: "Identifying triggers is the fastest path to relief" },
      { weekLabel: "Week 3-4", description: "Heat/cold therapy routine + anti-inflammatory diet adjustments", why: "Physical and dietary interventions compound for faster pain reduction" },
    ],
  },
  "Build Strength": {
    title: "Establish a 3x/week routine",
    target: "12 sessions in 4 weeks",
    timeframe: "1 month",
    phases: [
      { name: "Foundation", weeks: "Week 1-2", color: "primary" },
      { name: "Building", weeks: "Week 3-4", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1-2", description: "2x/week bodyweight: squats, push-ups, planks (20 min each)", why: "Starting below capacity builds the habit without burning out" },
      { weekLabel: "Week 3-4", description: "3x/week, add resistance bands or light weights, track reps", why: "Progressive overload signals your body to grow stronger" },
    ],
  },
  "Better Sleep": {
    title: "Fix sleep schedule",
    target: "Same sleep time within 30 min for 14 days",
    timeframe: "2 weeks",
    phases: [
      { name: "Foundation", weeks: "Week 1", color: "primary" },
      { name: "Building", weeks: "Week 2", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1", description: "Set a consistent wake alarm, no screens 30 min before bed", why: "Circadian rhythm is anchored by wake time, not sleep time" },
      { weekLabel: "Week 2", description: "Add a 10-min wind-down routine: dim lights, reading, light stretching", why: "Rituals signal the brain that sleep is coming" },
    ],
  },
  "More Energy": {
    title: "Sustained energy above 6/10",
    target: "7-day average self-rated energy at 6 or above",
    timeframe: "2 weeks",
    phases: [
      { name: "Foundation", weeks: "Week 1", color: "primary" },
      { name: "Building", weeks: "Week 2", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1", description: "Aim for 7+ hrs sleep, drink 2.5L water daily, 15-min morning walk", why: "Sleep and hydration are the two most underrated energy levers" },
      { weekLabel: "Week 2", description: "Eat protein at each meal, reduce refined carbs, keep sleep routine", why: "Stable blood sugar prevents the afternoon energy crash" },
    ],
  },
  "Reduce Stress": {
    title: "Daily breathing and wind-down practice",
    target: "14 consecutive days of stress practice",
    timeframe: "2 weeks",
    phases: [
      { name: "Foundation", weeks: "Week 1", color: "primary" },
      { name: "Building", weeks: "Week 2", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1", description: "5 min box breathing daily (4s in, 4s hold, 4s out, 4s hold)", why: "Box breathing activates the parasympathetic nervous system within minutes" },
      { weekLabel: "Week 2", description: "Add an evening wind-down routine: journal 3 things that went well", why: "Gratitude journaling rewires stress pathways over time" },
    ],
  },
  "Improve Blood Markers": {
    title: "Baseline blood test and action plan",
    target: "Complete blood panel and review with doctor",
    timeframe: "2 weeks",
    phases: [
      { name: "Foundation", weeks: "Week 1", color: "primary" },
      { name: "Building", weeks: "Week 2", color: "accent" },
    ],
    steps: [
      { weekLabel: "Week 1", description: "Book and complete a comprehensive blood test (HbA1c, lipids, thyroid)", why: "You cannot improve what you haven't measured" },
      { weekLabel: "Week 2", description: "Review results with your doctor and note target numbers", why: "Knowing your specific numbers creates a concrete goal to track" },
    ],
  },
};

// ─── Option Arrays ───────────────────────────────────────────

const healthConditionOptions = [
  "Asthma", "Type 2 Diabetes", "Type 1 Diabetes", "Hypertension",
  "Heart Condition", "Thyroid", "PCOD/PCOS", "Fibromyalgia",
  "Arthritis", "Chronic Back Pain", "Knee Issues", "ACL Surgery",
  "Knee Replacement", "IBS/Digestive Issues", "Chronic Migraine",
  "Depression/Anxiety", "Sleep Apnea", "Sciatica",
  "Cervical Spondylosis", "Lumbar Spondylosis",
  "Compressed Nerve", "None currently",
];

const durationOptions = [
  { label: "< 1 year" }, { label: "1-3 years" },
  { label: "3-5 years" }, { label: "5-10 years" },
  { label: "10+ years" }, { label: "Since childhood" },
];

const acuteOptions = [
  "Lumbar Spondylosis", "Cervical Spondylosis", "Sciatica", "Herniated Disc",
  "Plantar Fasciitis", "Frozen Shoulder", "Carpal Tunnel", "Tennis Elbow",
  "Rotator Cuff Injury", "Shin Splints", "ACL/MCL Injury", "Active Migraine",
  "Cold/Flu", "Viral Fever", "Sprained Ankle", "Fracture (healing)",
  "Post-Surgery Recovery", "Pregnancy", "Postpartum",
];

const familyHistoryOptions = [
  "Diabetes", "Heart Disease", "Hypertension/High BP",
  "Cancer", "Thyroid", "Obesity", "Stroke",
  "Kidney Disease", "Mental Health Conditions",
  "Autoimmune Disorders", "None known",
];

const painOptions = [
  "Head", "Neck", "Left Shoulder", "Right Shoulder", "Chest",
  "Left Upper Arm", "Right Upper Arm", "Left Elbow", "Right Elbow",
  "Left Forearm", "Right Forearm", "Left Wrist", "Right Wrist",
  "Left Hand", "Right Hand", "Abdomen",
  "Left Hip", "Right Hip", "Left Thigh", "Right Thigh",
  "Left Knee", "Right Knee", "Left Shin/Calf", "Right Shin/Calf",
  "Left Ankle", "Right Ankle", "Left Foot", "Right Foot",
  "Upper Back", "Mid Back", "Lower Back", "Glutes",
  "Left Rear Shoulder", "Right Rear Shoulder",
  "Left Tricep", "Right Tricep",
  "Left Hamstring", "Right Hamstring",
  "Left Calf (rear)", "Right Calf (rear)",
  "Neck (rear)", "Full Body", "None",
];

const occupationActivityOptions = [
  { label: "Desk/Office Job", description: "Mostly sitting -- computer, meetings, desk work" },
  { label: "Light On-Feet", description: "Some walking -- teaching, retail, light supervising" },
  { label: "Moderately Physical", description: "Regular movement -- nursing, warehouse, service industry" },
  { label: "Heavy Physical", description: "Intense labor -- construction, farming, manual work" },
  { label: "Work From Home", description: "Remote work -- variable movement depending on setup" },
  { label: "Student", description: "Mix of sitting in class and moving around campus" },
  { label: "Retired/Not Working", description: "Daily routine varies, not occupation-bound" },
];

const exerciseHistoryOptions = [
  { label: "Never really exercised", description: "No significant exercise habit in the past" },
  { label: "Used to be active", description: "Had phases of regular exercise but fell off" },
  { label: "On-and-off gym goer", description: "Joined gyms multiple times, inconsistent attendance" },
  { label: "Sports background", description: "Played sports in school/college, less active now" },
  { label: "Yoga / walking regular", description: "Consistent with lighter activities" },
  { label: "Currently active", description: "Exercise regularly now, looking to optimize" },
];

const exerciseComforts = [
  { label: "No exercise currently", description: "Haven't exercised in months or longer" },
  { label: "Just starting out", description: "Trying to build a habit, occasional walks" },
  { label: "Light & occasional", description: "Walk/yoga 1-2x/week, 15-20 min sessions" },
  { label: "Regular routine", description: "Exercise 3-4x/week, 30-45 min each" },
  { label: "Very committed", description: "5-6x/week, mix of cardio & strength, 45-60 min" },
];

const activityOptions = [
  "Walking", "Yoga", "Gym / Weight Training", "Running", "Swimming", "Cycling",
  "Dance", "Cricket", "Badminton", "Football", "Tennis", "Table Tennis",
  "Stretching", "Martial Arts", "Pilates", "Hiking / Trekking",
  "Home Workouts", "Zumba", "CrossFit", "None yet",
];

const dietaryOptions = [
  "Vegetarian", "Vegan", "Eggetarian", "Non-Vegetarian", "Flexitarian",
  "Jain", "No Onion/Garlic", "Sattvic", "Gluten Free", "Lactose Free",
  "Low FODMAP", "Keto / Low Carb", "Halal", "Observes Fasting Days", "Nut Allergy",
];

const mealsPerDayOptions = [
  { label: "1 meal" }, { label: "2 meals" },
  { label: "3 meals" }, { label: "More than 3 meals" },
];

const cookingOptions = [
  { label: "Mostly home-cooked" }, { label: "Mix of home & outside" },
  { label: "Mostly eating out / ordering in" }, { label: "Depends on the day" },
];

const eatingChallengeOptions = [
  "Late night eating", "Skipping breakfast", "Emotional eating",
  "Too much sugar", "Too much fried food", "Large portions",
  "Not enough vegetables", "Not enough protein", "Irregular timings",
  "Too much caffeine", "Frequent snacking", "Weekend binge eating",
];

const sleepHoursOptions = [
  { label: "< 5 hours" }, { label: "5-6 hours" },
  { label: "6-7 hours" }, { label: "7-8 hours" },
  { label: "8+ hours" },
];

const sleepQualityOptions = [
  { label: "Poor", description: "Wake up tired, restless nights" },
  { label: "Fair", description: "Inconsistent, some good nights" },
  { label: "Good", description: "Usually sleep well" },
  { label: "Excellent", description: "Deep, restorative sleep" },
];

const sleepIssueOptions = [
  "Trouble falling asleep", "Wake up frequently", "Wake up too early",
  "Snoring / sleep apnea", "Screen time before bed", "Irregular schedule",
  "Overthinking at night", "None",
];

const stressLevelOptions = [
  { label: "Low", description: "Generally calm, manageable stress" },
  { label: "Moderate", description: "Regular stress but coping okay" },
  { label: "High", description: "Frequent stress affecting daily life" },
  { label: "Very High", description: "Constant overwhelm, burnout territory" },
];

const stressSourceOptions = [
  "Work / career", "Financial", "Relationships", "Health concerns",
  "Family responsibilities", "Social pressure", "Loneliness / isolation",
  "Academic", "None significant",
];

const constraintOptions = [
  "Long work hours (10+/day)", "Frequent travel",
  "Night shift / irregular hours", "Limited kitchen access",
  "Budget constraints", "Family meal planning (cook for others)",
  "Physical injury limiting movement", "Caregiving responsibilities",
  "No gym access", "Weather / outdoor limitations",
  "Social events / dining out frequently", "Upcoming surgery or medical procedure",
];

// ─── Types ───────────────────────────────────────────────────
interface HealthConditionEntry {
  condition: string;
  duration: string;
  notes: string;
}

interface HealthSummaryData {
  profileSnapshot: string;
  observations: string[];
  healthConsiderations: string[];
  strengths: string[];
  focusAreas: string[];
  recommendedApproach: string;
  clarifyingQuestions: string[];
}

interface MilestoneData {
  title: string;
  target: string;
  timeframe: string;
  steps: { weekLabel: string; description: string; why: string }[];
  phases?: { name: string; weeks: string; color: string }[];
}

interface OnboardingData {
  // Screen 1: Basics
  name: string;
  age: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  heightUnit: "cm" | "ftin";
  weightUnit: "kg" | "lbs";
  heightFt: number;
  heightIn: number;
  // Screen 2: Health History (structured)
  healthConditions: HealthConditionEntry[];
  acuteConditions: string[];
  customAcute: string;
  medications: string[];
  medSearch: string;
  customMed: string;
  familyConditions: string[];
  familyHistoryOther: string;
  // Screen 3: Pain Areas
  painAreas: string[];
  autoSuggestedPain: string[];
  customPainArea: string;
  // Screen 4: Exercise & Activity
  occupationActivity: string;
  exerciseHistoryOption: string;
  exerciseComfort: string;
  activities: string[];
  fitnessTrackers: string[];
  // Screen 5: Diet & Eating
  snackingHabit: string;
  dietaryPrefs: string[];
  customDietPref: string;
  mealsPerDay: string;
  cookingStyle: string;
  eatingChallenges: string[];
  eatingNotes: string;
  dietHistory: string;
  // Screen 6: Sleep, Stress & Constraints
  sleepHours: string;
  sleepQuality: string;
  sleepIssues: string[];
  stressLevel: string;
  stressSources: string[];
  constraintChoices: string[];
  constraintOther: string;
  // Screen 7: What Worked
  pastAttemptsWorked: string;
  // Screen 8: Goals
  goals: string[];
  customGoal: string;
  targetWeightKg: number;
  targetWeightUnit: "kg" | "lbs";
  weightTimeline: string;
  bmiUnderstand: boolean;
  // Screen 9: Self-Assessment
  nutritionKnowledge: number;
  exerciseKnowledge: number;
  selfDiscipline: number;
  consistencyHistory: number;
  whyNow: string;
  // Screen 10: Milestones
  milestones: MilestoneData[];
  // Legacy fields (for backward compat with old saved progress)
  healthHistory?: string;
  familyHistory?: string;
  chronicConditions?: string[];
  activityLevel?: string;
  exerciseHistory?: string;
  currentEating?: string;
  sleepStress?: string;
  constraints?: string;
}

const defaultData: OnboardingData = {
  name: "", age: "", gender: "", heightCm: 170, weightKg: 70,
  heightUnit: "cm", weightUnit: "kg", heightFt: 5, heightIn: 7,
  healthConditions: [], acuteConditions: [], customAcute: "",
  medications: [], medSearch: "", customMed: "",
  familyConditions: [], familyHistoryOther: "",
  painAreas: [], autoSuggestedPain: [], customPainArea: "",
  occupationActivity: "", exerciseHistoryOption: "", exerciseComfort: "", activities: [], fitnessTrackers: [],
  snackingHabit: "", dietaryPrefs: [], customDietPref: "", mealsPerDay: "", cookingStyle: "",
  eatingChallenges: [], eatingNotes: "", dietHistory: "",
  sleepHours: "", sleepQuality: "", sleepIssues: [],
  stressLevel: "", stressSources: [],
  constraintChoices: [], constraintOther: "",
  pastAttemptsWorked: "",
  goals: [], customGoal: "", targetWeightKg: 65, targetWeightUnit: "kg", weightTimeline: "", bmiUnderstand: false,
  nutritionKnowledge: 5, exerciseKnowledge: 5, selfDiscipline: 5, consistencyHistory: 5, whyNow: "",
  milestones: [],
};

// ─── Main Component ──────────────────────────────────────────
const ENCOURAGING_SUBTITLES: Record<number, string> = {
  2: "Almost done with the health basics -- you're doing great",
  4: "Halfway there! Your exercise profile helps us plan smarter",
  7: "Nearly there -- your AI health summary is next",
  8: "We're analyzing everything you've shared",
  12: "Almost there -- connect your tools for a seamless experience",
  13: "You did it! Your personalized journey starts now",
};

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const authFetch = useAuthFetch();
  const [step, setStep] = useState(user?.onboardingStep || 1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [phaseCelebration, setPhaseCelebration] = useState<string | null>(null);
  const [prevPhase, setPrevPhase] = useState<number>(0);
  const [healthSummary, setHealthSummary] = useState<HealthSummaryData | null>(null);

  // Load existing progress
  useEffect(() => {
    if (initialLoaded) return;
    authFetch("GET", "/api/onboarding/progress")
      .then(res => res.json())
      .then(progress => {
        if (progress.step) setStep(Math.min(progress.step, TOTAL_STEPS));
        const d = progress.data;
        if (d?.profile) {
          const p = d.profile;
          setData(prev => ({
            ...prev,
            name: p.name || "",
            age: p.age?.toString() || "",
            gender: p.gender || "",
            heightCm: p.heightCm || 170,
            weightKg: p.weightKg || 70,
            dietHistory: p.dietHistory || "",
            pastAttemptsWorked: p.pastAttemptsWorked || "",
            occupationActivity: p.activityLevel || p.occupationActivity || "",
            exerciseComfort: p.exerciseComfort || "",
            customGoal: p.customGoal || "",
            targetWeightKg: p.targetWeightKg || 65,
            weightTimeline: p.weightTimeline || "",
            nutritionKnowledge: p.nutritionKnowledge || 5,
            exerciseKnowledge: p.exerciseKnowledge || 5,
            selfDiscipline: p.selfDiscipline || 5,
            consistencyHistory: p.consistencyHistory || 5,
            whyNow: p.whyNow || "",
          }));
        }
        if (d?.conditions) {
          // Convert old format to new healthConditions
          const chronic = d.conditions.filter((c: any) => c.isChronic);
          const acute = d.conditions.filter((c: any) => !c.isChronic);
          setData(prev => ({
            ...prev,
            healthConditions: chronic.map((c: any) => ({
              condition: c.conditionName,
              duration: c.duration || "",
              notes: c.notes || "",
            })),
            acuteConditions: acute.map((c: any) => c.conditionName),
          }));
        }
        if (d?.painAreas) {
          setData(prev => ({
            ...prev,
            painAreas: d.painAreas.map((p: any) => p.areaName),
            autoSuggestedPain: d.painAreas.filter((p: any) => p.autoSuggested).map((p: any) => p.areaName),
          }));
        }
        if (d?.medications) {
          setData(prev => ({ ...prev, medications: d.medications.map((m: any) => m.medicationName) }));
        }
        if (d?.activities) {
          setData(prev => ({ ...prev, activities: d.activities.map((a: any) => a.activityName) }));
        }
        if (d?.dietaryPrefs) {
          setData(prev => ({ ...prev, dietaryPrefs: d.dietaryPrefs.map((p: any) => p.preferenceName) }));
        }
        if (d?.goals) {
          setData(prev => ({ ...prev, goals: d.goals.map((g: any) => g.goalType) }));
        }
        if (d?.milestones) {
          setData(prev => ({
            ...prev,
            milestones: d.milestones.map((m: any) => ({
              title: m.title, target: m.target || "", timeframe: m.timeframe || "",
              steps: m.steps?.map((s: any) => ({
                weekLabel: s.weekLabel || `Week ${s.weekNumber || 1}`,
                description: s.description || "",
                why: s.why || "",
              })) || [],
              phases: m.phases || undefined,
            })),
          }));
        }
        setInitialLoaded(true);
      })
      .catch(() => setInitialLoaded(true));
  }, [authFetch, initialLoaded]);

  const update = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const bmi = useMemo(() => {
    if (!data.heightCm || !data.weightKg) return 0;
    return data.weightKg / Math.pow(data.heightCm / 100, 2);
  }, [data.heightCm, data.weightKg]);

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obese";
    return "Severely Obese";
  }, [bmi]);

  const bmiColor = useMemo(() => {
    if (bmi < 18.5) return "text-slate";
    if (bmi < 25) return "text-primary";
    if (bmi < 30) return "text-accent";
    return "text-rose";
  }, [bmi]);

  const saveStep = async () => {
    setSaving(true);
    try {
      let body: any = {};
      switch (step) {
        case 1:
          body = { name: data.name, age: parseInt(data.age), gender: data.gender, heightCm: data.heightCm, weightKg: data.weightKg };
          break;
        case 2:
          body = {
            healthConditions: data.healthConditions,
            conditions: [
              ...data.healthConditions.map(c => ({ conditionName: c.condition, isChronic: true })),
              ...data.acuteConditions.map(c => ({ conditionName: c, isChronic: false })),
            ],
            medications: data.medications,
            familyConditions: data.familyConditions,
            familyHistoryOther: data.familyHistoryOther,
          };
          break;
        case 3:
          body = {
            painAreas: data.painAreas.map(a => ({ areaName: a, autoSuggested: data.autoSuggestedPain.includes(a) })),
            customPainArea: data.customPainArea,
          };
          break;
        case 4:
          body = {
            occupationActivity: data.occupationActivity,
            exerciseHistoryOption: data.exerciseHistoryOption,
            exerciseComfort: data.exerciseComfort,
            activities: data.activities,
          };
          break;
        case 5:
          body = {
            dietaryPrefs: data.dietaryPrefs,
            mealsPerDay: data.mealsPerDay,
            cookingStyle: data.cookingStyle,
            eatingChallenges: data.eatingChallenges,
            eatingNotes: data.eatingNotes,
            dietHistory: data.dietHistory,
          };
          break;
        case 6:
          body = {
            sleepHours: data.sleepHours,
            sleepQuality: data.sleepQuality,
            sleepIssues: data.sleepIssues,
            stressLevel: data.stressLevel,
            stressSources: data.stressSources,
            constraintChoices: data.constraintChoices,
            constraintOther: data.constraintOther,
          };
          break;
        case 7:
          body = { pastAttemptsWorked: data.pastAttemptsWorked };
          break;
        case 8:
          // AI Health Summary screen - no save needed, just advance
          body = null;
          break;
        case 12:
          // Integrations screen - no save needed, just advance
          body = null;
          break;
        case 9:
          body = {
            goals: data.goals.map(g => ({ goalType: g })),
            customGoal: data.customGoal,
            targetWeightKg: data.goals.includes("Lose Weight") ? data.targetWeightKg : null,
            weightTimeline: data.goals.includes("Lose Weight") ? data.weightTimeline : null,
          };
          break;
        case 10:
          body = {
            nutritionKnowledge: data.nutritionKnowledge, exerciseKnowledge: data.exerciseKnowledge,
            selfDiscipline: data.selfDiscipline, consistencyHistory: data.consistencyHistory, whyNow: data.whyNow,
          };
          break;
        case 11:
          body = { milestones: data.milestones };
          break;
        case 13: {
          const completeRes = await authFetch("POST", "/api/onboarding/complete");
          const completeData = await completeRes.json();
          if (completeData.newBadges?.length > 0) {
            const badge = completeData.newBadges[0];
            setPhaseCelebration(`${badge.name} -- +${badge.pointsAwarded} pts`);
            await new Promise(r => setTimeout(r, 2000));
            setPhaseCelebration(null);
          }
          await refreshUser();
          return;
        }
      }

      if (body !== null) {
        await authFetch("POST", `/api/onboarding/step/${step}`, body);
      }

      if (step < TOTAL_STEPS) {
        const nextStep = step + 1;
        const currentPhaseIdx = getPhaseForStep(step);
        const nextPhaseIdx = getPhaseForStep(nextStep);
        if (nextPhaseIdx > currentPhaseIdx) {
          setPhaseCelebration(PHASES[currentPhaseIdx].label);
          setTimeout(() => setPhaseCelebration(null), 1500);
        }
        setStep(nextStep);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Quick Start: skip goals/milestones and complete onboarding immediately
  const quickStartOnboarding = async () => {
    setSaving(true);
    try {
      const completeRes = await authFetch("POST", "/api/onboarding/complete");
      const completeData = await completeRes.json();
      if (completeData.newBadges?.length > 0) {
        const badge = completeData.newBadges[0];
        setPhaseCelebration(`${badge.name} -- +${badge.pointsAwarded} pts`);
        await new Promise(r => setTimeout(r, 1500));
        setPhaseCelebration(null);
      }
      await refreshUser();
    } catch (err) {
      console.error("Quick start error:", err);
    } finally {
      setSaving(false);
    }
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return data.name.trim() && data.age && parseInt(data.age) >= 13 && data.gender;
      case 9:
        if (bmi >= 35 && !data.bmiUnderstand) return false;
        return data.goals.length > 0;
      default:
        return true;
    }
  }, [step, data, bmi]);

  const currentPhase = getPhaseForStep(step);

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean top accent line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40 z-20" />
      <div className="max-w-[560px] mx-auto px-5 pt-8 pb-32 relative z-10">
        {/* Phase indicator */}
        <div className="flex gap-2 mb-4" data-testid="phase-indicator">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex-1">
              <div
                className={`h-[2px] rounded-full transition-all duration-500 ${
                  i < currentPhase ? "bg-primary" : i === currentPhase ? "bg-primary" : "bg-gray-200"
                }`}
              />
              <span className={`text-[9px] uppercase tracking-[0.8px] mt-1.5 block truncate ${
                i === currentPhase ? "text-primary font-semibold" : "text-gray-400"
              }`}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step progress */}
        <div className="h-[2px] bg-gray-100 rounded-full mb-2" data-testid="step-progress">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step counter with time estimate */}
        <p className="text-[11px] text-gray-400 mb-1" data-testid="step-counter">
          Step {step} of {TOTAL_STEPS} {step < TOTAL_STEPS ? `· about ${Math.max(1, Math.ceil((TOTAL_STEPS - step) * 0.75))} min left` : "· almost done!"}
        </p>

        {/* Encouraging subtitle */}
        {ENCOURAGING_SUBTITLES[step] && (
          <p className="text-xs text-primary font-medium mb-4" data-testid="encouraging-subtitle">
            {ENCOURAGING_SUBTITLES[step]}
          </p>
        )}
        {!ENCOURAGING_SUBTITLES[step] && <div className="mb-4" />}

        {/* Phase celebration overlay */}
        {phaseCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" data-testid="phase-celebration">
            <div className="glass-card p-8 text-center animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold">
                {phaseCelebration} complete!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Great progress, keep going</p>
            </div>
          </div>
        )}

        {/* Screen content */}
        {step === 1 && <Screen1 data={data} update={update} bmi={bmi} bmiCategory={bmiCategory} bmiColor={bmiColor} />}
        {step === 2 && <Screen3 data={data} update={update} />}
        {step === 3 && <Screen2 data={data} update={update} />}
        {step === 4 && <Screen4 data={data} update={update} />}
        {step === 5 && <Screen5 data={data} update={update} />}
        {step === 6 && <Screen6 data={data} update={update} />}
        {step === 7 && <Screen7 data={data} update={update} />}
        {step === 8 && <Screen8AISummary data={data} healthSummary={healthSummary} setHealthSummary={setHealthSummary} authFetch={authFetch} />}
        {step === 9 && <Screen9Goals data={data} update={update} bmi={bmi} healthSummary={healthSummary} />}
        {step === 10 && <Screen10 data={data} update={update} />}
        {step === 11 && <Screen11Milestones data={data} update={update} />}
        {step === 12 && <Screen12Integrations authFetch={authFetch} />}
        {step === 13 && <Screen13Review data={data} bmi={bmi} bmiCategory={bmiCategory} />}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-5 py-4 z-30">
        <div className="max-w-[560px] mx-auto">
          {/* Step 8: two choices */}
          {step === 8 ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={saveStep}
                disabled={saving}
                className="vitallity-btn-primary flex items-center justify-center gap-2"
                data-testid="onboarding-continue-setup"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Continue Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={quickStartOnboarding}
                disabled={saving}
                className="vitallity-btn-ghost text-sm flex items-center justify-center gap-2"
                data-testid="onboarding-quick-start"
              >
                Quick Start -- I'll set goals later
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="vitallity-btn-ghost flex items-center gap-2"
                  data-testid="onboarding-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={saveStep}
                disabled={saving || !canContinue}
                className="vitallity-btn-primary flex-1 flex items-center justify-center gap-2"
                data-testid="onboarding-continue"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === TOTAL_STEPS ? (
                  <>
                    Begin My Journey
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 1: Basic Profile ─────────────────────────────────
function Screen1({ data, update, bmi, bmiCategory, bmiColor }: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  bmi: number; bmiCategory: string; bmiColor: string;
}) {
  const setHeightUnit = (unit: "cm" | "ftin") => {
    if (unit === data.heightUnit) return;
    if (unit === "ftin") {
      const totalInches = data.heightCm / 2.54;
      update("heightFt", Math.floor(totalInches / 12));
      update("heightIn", Math.round(totalInches % 12));
      update("heightUnit", "ftin");
    } else {
      const cm = Math.round((data.heightFt * 12 + data.heightIn) * 2.54);
      update("heightCm", cm);
      update("heightUnit", "cm");
    }
  };

  const setWeightUnit = (unit: "kg" | "lbs") => {
    if (unit === data.weightUnit) return;
    update("weightUnit", unit);
  };

  // Weight uses a local string state so decimals and backspace work naturally
  const toDisplayWeight = (kg: number) => {
    if (kg === 0) return '';
    const val = data.weightUnit === 'lbs' ? kg * 2.20462 : kg;
    const s = val.toFixed(1);
    return s.endsWith('.0') ? s.slice(0, -2) : s;
  };
  const [weightStr, setWeightStr] = useState(toDisplayWeight(data.weightKg));
  useEffect(() => { setWeightStr(toDisplayWeight(data.weightKg)); }, [data.weightUnit]);
  const commitWeight = () => {
    const cleaned = weightStr.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    const val = parseFloat(cleaned);
    if (!cleaned || isNaN(val)) { update('weightKg', 0); return; }
    update('weightKg', data.weightUnit === 'lbs' ? Math.round((val / 2.20462) * 10) / 10 : Math.round(val * 10) / 10);
  };
  const handleWeightChange = (raw: string) => {
    // Only allow digits and one decimal point
    const filtered = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setWeightStr(filtered);
    // Also update live for BMI preview
    const val = parseFloat(filtered);
    if (!isNaN(val) && val > 0) {
      update('weightKg', data.weightUnit === 'lbs' ? Math.round((val / 2.20462) * 10) / 10 : Math.round(val * 10) / 10);
    }
  };

  const updateHeightFromFtIn = (ft: number, inches: number) => {
    update("heightFt", ft);
    update("heightIn", inches);
    update("heightCm", Math.round((ft * 12 + inches) * 2.54));
  };

  return (
    <div data-testid="screen-1" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Let's get to know you</h2>
      <p className="text-gray-500 text-sm mb-8">Basic information to personalize your journey</p>

      <div className="space-y-6">
        <div>
          <label className="vitallity-label">Name</label>
          <input
            type="text"
            value={data.name}
            onChange={e => update("name", e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className="vitallity-input"
            data-testid="input-name"
          />
        </div>

        <div>
          <label className="vitallity-label">Age</label>
          <input
            type="number"
            value={data.age}
            onChange={e => update("age", e.target.value)}
            placeholder="Age"
            min={13} max={120}
            className="vitallity-input w-32"
            data-testid="input-age"
          />
        </div>

        <div>
          <label className="vitallity-label">Gender</label>
          <ChipGroup
            options={[{ label: "Male" }, { label: "Female" }, { label: "Other" }]}
            selected={data.gender ? [data.gender] : []}
            onChange={vals => update("gender", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Height</label>
          <div className="flex bg-card rounded-[10px] border border-gray-200 p-0.5 w-fit mb-3">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.heightUnit === "cm" ? "bg-primary text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setHeightUnit("cm")}
              data-testid="toggle-height-cm"
            >cm</button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.heightUnit === "ftin" ? "bg-primary text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setHeightUnit("ftin")}
              data-testid="toggle-height-ftin"
            >ft / in</button>
          </div>
          {data.heightUnit === "cm" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.heightCm}
                onChange={e => update("heightCm", parseInt(e.target.value) || 0)}
                min={100} max={250}
                className="vitallity-input w-28"
                data-testid="input-height-cm"
              />
              <span className="text-sm text-gray-500">cm</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={data.heightFt}
                onChange={e => updateHeightFromFtIn(parseInt(e.target.value) || 0, data.heightIn)}
                min={3} max={8}
                className="vitallity-input w-20"
                data-testid="input-height-ft"
              />
              <span className="text-sm text-gray-500">ft</span>
              <input
                type="number"
                value={data.heightIn}
                onChange={e => updateHeightFromFtIn(data.heightFt, parseInt(e.target.value) || 0)}
                min={0} max={11}
                className="vitallity-input w-20"
                data-testid="input-height-in"
              />
              <span className="text-sm text-gray-500">in</span>
            </div>
          )}
        </div>

        <div>
          <label className="vitallity-label">Current Weight</label>
          <div className="flex bg-card rounded-[10px] border border-gray-200 p-0.5 w-fit mb-3">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.weightUnit === "kg" ? "bg-primary text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setWeightUnit("kg")}
              data-testid="toggle-weight-kg"
            >kg</button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.weightUnit === "lbs" ? "bg-primary text-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setWeightUnit("lbs")}
              data-testid="toggle-weight-lbs"
            >lbs</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={weightStr}
              onChange={e => handleWeightChange(e.target.value)}
              onBlur={commitWeight}
              placeholder="0"
              className="vitallity-input w-28"
              data-testid="input-weight"
            />
            <span className="text-sm text-gray-500">{data.weightUnit}</span>
          </div>
        </div>

        {bmi > 0 && data.heightCm > 0 && data.weightKg > 0 && (
          <div className="bg-card rounded-[14px] border border-gray-200 p-4 flex items-center gap-3" data-testid="bmi-display">
            <div className={`text-2xl font-display font-bold ${bmiColor}`}>
              {bmi.toFixed(1)}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">BMI</div>
              <div className={`text-sm font-medium ${bmiColor}`}>{bmiCategory}</div>
            </div>
          </div>
        )}
        {/* Spacer so BMI card doesn't overlap the Continue button */}
        <div className="h-20" />
      </div>
    </div>
  );
}

// ─── Screen 2: Health History (MERGED) ───────────────────────
function Screen2({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const [medResults, setMedResults] = useState<ReturnType<typeof searchMedications>>([]);

  const selectedConditionNames = data.healthConditions.map(c => c.condition);

  const handleConditionChange = (selected: string[]) => {
    // "None currently" logic
    if (selected.includes("None currently") && !selectedConditionNames.includes("None currently")) {
      update("healthConditions", [{ condition: "None currently", duration: "", notes: "" }]);
      // Clear auto-suggested pain
      update("painAreas", data.painAreas.filter(p => !data.autoSuggestedPain.includes(p)));
      update("autoSuggestedPain", []);
      return;
    }
    const filtered = selected.filter(s => s !== "None currently");

    // Build new healthConditions, preserving existing entries
    const newConditions: HealthConditionEntry[] = filtered.map(name => {
      const existing = data.healthConditions.find(c => c.condition === name);
      return existing || { condition: name, duration: "", notes: "" };
    });
    update("healthConditions", newConditions);

    // Auto-suggest pain areas
    const suggested = new Set<string>();
    for (const name of filtered) {
      const areas = CONDITION_PAIN_MAP[name];
      if (areas) areas.forEach(a => suggested.add(a));
    }
    const suggestedArr = Array.from(suggested);
    update("autoSuggestedPain", suggestedArr);

    const currentManual = data.painAreas.filter(p => !data.autoSuggestedPain.includes(p));
    const newPainAreas = Array.from(new Set([...currentManual, ...suggestedArr]));
    update("painAreas", newPainAreas);
  };

  const updateConditionField = (condition: string, field: "duration" | "notes", value: string) => {
    update("healthConditions", data.healthConditions.map(c =>
      c.condition === condition ? { ...c, [field]: value } : c
    ));
  };

  const removeCondition = (condition: string) => {
    handleConditionChange(selectedConditionNames.filter(c => c !== condition));
  };

  const handleMedSearch = (q: string) => {
    update("medSearch", q);
    setMedResults(searchMedications(q));
  };

  const addMed = (name: string) => {
    if (!data.medications.includes(name)) {
      update("medications", [...data.medications, name]);
    }
    update("medSearch", "");
    setMedResults([]);
  };

  const removeMed = (name: string) => {
    update("medications", data.medications.filter(m => m !== name));
  };

  const addCustomAcute = () => {
    if (data.customAcute.trim() && !data.acuteConditions.includes(data.customAcute.trim())) {
      update("acuteConditions", [...data.acuteConditions, data.customAcute.trim()]);
      update("customAcute", "");
    }
  };

  const addCustomMed = () => {
    if (data.customMed.trim()) {
      addMed(data.customMed.trim());
      update("customMed", "");
    }
  };

  const handleFamilyChange = (selected: string[]) => {
    if (selected.includes("None known") && !data.familyConditions.includes("None known")) {
      update("familyConditions", ["None known"]);
      return;
    }
    update("familyConditions", selected.filter(s => s !== "None known"));
  };

  return (
    <div data-testid="screen-2" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">
        Health history
        <WhyWeAsk text="Your health conditions help us avoid harmful exercise recommendations and tailor nutrition advice to your specific needs." />
      </h2>
      <p className="text-gray-500 text-sm mb-8">Understanding your background helps us plan better</p>

      <div className="space-y-8">
        {/* Section A: Health Conditions */}
        <div>
          <label className="vitallity-label">Health Conditions</label>
          <ChipGroup
            options={healthConditionOptions.map(c => ({ label: c }))}
            selected={selectedConditionNames}
            onChange={handleConditionChange}
            multiple
          />

          {/* Sub-cards for selected conditions */}
          {data.healthConditions.filter(c => c.condition !== "None currently").map(entry => (
            <div key={entry.condition} className="glass-card mt-3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{entry.condition}</span>
                <button type="button" onClick={() => removeCondition(entry.condition)} aria-label={`Remove ${entry.condition}`}>
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <label className="vitallity-label">How long ago?</label>
              <ChipGroup
                options={durationOptions}
                selected={entry.duration ? [entry.duration] : []}
                onChange={vals => updateConditionField(entry.condition, "duration", vals[0] || "")}
              />
              <label className="vitallity-label mt-3">Notes (optional)</label>
              <input
                type="text"
                value={entry.notes}
                onChange={e => updateConditionField(entry.condition, "notes", e.target.value)}
                placeholder="Any details..."
                className="vitallity-input"
                data-testid={`condition-notes-${entry.condition.toLowerCase().replace(/\s+/g, "-")}`}
              />
            </div>
          ))}

          {/* Condition suggestions based on selected conditions */}
          {(() => {
            const selected = selectedConditionNames.filter(c => c !== "None currently");
            const suggestions = new Set<string>();
            for (const cond of selected) {
              const related = CONDITION_SUGGESTIONS[cond];
              if (related) related.forEach(r => { if (!selected.includes(r)) suggestions.add(r); });
            }
            const sugList = Array.from(suggestions);
            if (sugList.length === 0) return null;
            return (
              <div className="bg-primary-faded rounded-[14px] p-3 mt-3 animate-fade-in-up" data-testid="condition-suggestions">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-primary">People with your conditions often also have these. Want to add?</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sugList.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleConditionChange([...selectedConditionNames, s])}
                      className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium hover:bg-primary/20 transition-colors"
                      data-testid={`suggest-${s.toLowerCase().replace(/[\s/]+/g, "-")}`}
                    >
                      <Plus className="w-3 h-3" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Section C: Medications */}
        <div>
          <label className="vitallity-label">Current Medications</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={data.medSearch}
              onChange={e => handleMedSearch(e.target.value)}
              placeholder="Search medications (generic or brand name)..."
              className="vitallity-input pl-11"
              data-testid="input-med-search"
            />
            {medResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-card border border-gray-200 rounded-[14px] shadow-card overflow-hidden" data-testid="med-search-results">
                {medResults.map(m => (
                  <button
                    key={m.genericName}
                    type="button"
                    onClick={() => addMed(m.genericName + (m.brandNames.length ? ` (${m.brandNames[0]})` : ""))}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors border-b border-gray-200 last:border-0"
                  >
                    <span className="font-medium">{m.genericName}</span>
                    {m.brandNames.length > 0 && (
                      <span className="text-gray-500"> ({m.brandNames.join(", ")})</span>
                    )}
                    <span className="text-[10px] text-gray-400 uppercase ml-2">{m.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {data.medications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" data-testid="selected-medications">
              {data.medications.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 bg-primary/8 text-primary rounded-full px-3 py-1.5 text-sm">
                  {m}
                  <button type="button" onClick={() => removeMed(m)} aria-label={`Remove ${m}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={data.customMed}
              onChange={e => update("customMed", e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomMed()}
              placeholder="Add unlisted medication..."
              className="vitallity-input flex-1"
              data-testid="input-custom-med"
            />
            <button type="button" onClick={addCustomMed} className="vitallity-btn-ghost px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section D: Family Health History */}
        <div>
          <label className="vitallity-label">Family Health History <span className="normal-case text-gray-400">(optional)</span></label>
          <ChipGroup
            options={familyHistoryOptions.map(c => ({ label: c }))}
            selected={data.familyConditions}
            onChange={handleFamilyChange}
            multiple
          />
          <div className="mt-3">
            <input
              type="text"
              value={data.familyHistoryOther}
              onChange={e => update("familyHistoryOther", e.target.value)}
              placeholder="Other family conditions..."
              className="vitallity-input"
              data-testid="input-family-other"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3: Pain Areas (with SVG torso) ───────────────────
function Screen3({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const [bodyView, setBodyView] = useState<"front" | "back">("front");

  const togglePain = (area: string) => {
    if (area === "None") {
      update("painAreas", data.painAreas.includes("None") ? [] : ["None"]);
      return;
    }
    const without = data.painAreas.filter(p => p !== "None");
    if (without.includes(area)) {
      update("painAreas", without.filter(p => p !== area));
    } else {
      update("painAreas", [...without, area]);
    }
  };

  const isSelected = (area: string) => data.painAreas.includes(area);
  const isAutoSuggested = (area: string) => data.autoSuggestedPain.includes(area);

  const regionFill = (area: string) => {
    if (isSelected(area)) return "fill-primary/20 stroke-primary";
    if (isAutoSuggested(area)) return "fill-primary/10 stroke-primary/50";
    return "fill-transparent stroke-text-light/30";
  };

  const addCustomPain = () => {
    if (data.customPainArea.trim() && !data.painAreas.includes(data.customPainArea.trim())) {
      update("painAreas", [...data.painAreas.filter(p => p !== "None"), data.customPainArea.trim()]);
      update("customPainArea", "");
    }
  };

  const selectedAreas = data.painAreas.filter(p => p !== "None");

  return (
    <div data-testid="screen-3" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">
        Pain areas
        <WhyWeAsk text="Knowing your pain points helps us recommend safe exercises and suggest stretches or therapies specific to your problem areas." />
      </h2>
      <p className="text-gray-500 text-sm mb-4">Tap areas where you experience pain or discomfort</p>

      {data.autoSuggestedPain.length > 0 && (
        <div className="bg-primary-faded rounded-[14px] p-3 mb-4 flex items-start gap-2" data-testid="pain-auto-suggest-note">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-xs text-primary">Auto-suggested based on your conditions</span>
        </div>
      )}

      {/* Front / Back toggle */}
      <div className="flex bg-muted/50 rounded-[100px] p-1 mb-4 max-w-[200px] mx-auto" data-testid="body-view-toggle">
        <button
          type="button"
          onClick={() => setBodyView("front")}
          className={`flex-1 py-2 text-xs font-semibold rounded-[100px] transition-all ${
            bodyView === "front" ? "bg-primary text-white shadow-sm" : "text-gray-700"
          }`}
          data-testid="body-view-front"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setBodyView("back")}
          className={`flex-1 py-2 text-xs font-semibold rounded-[100px] transition-all ${
            bodyView === "back" ? "bg-primary text-white shadow-sm" : "text-gray-700"
          }`}
          data-testid="body-view-back"
        >
          Back
        </button>
      </div>

      {/* SVG Body Diagrams */}
      <div className="flex justify-center mb-4">
        {bodyView === "front" ? (
          <svg viewBox="0 0 260 420" className="w-[220px] h-[370px]" aria-label="Human body front view pain map">
            {/* ── FRONT VIEW ── */}

            {/* Head */}
            <path d="M130,12 C118,12 108,20 107,31 C106,42 112,52 120,55 C124,57 126,60 126,64 L134,64 C134,60 136,57 140,55 C148,52 154,42 153,31 C152,20 142,12 130,12 Z"
              className={`${regionFill("Head")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Head")} data-testid="svg-head"
            />
            {isSelected("Head") && <text x="145" y="22" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">Head</text>}

            {/* Neck */}
            <path d="M122,64 L122,78 C122,81 125,83 130,83 C135,83 138,81 138,78 L138,64 Z"
              className={`${regionFill("Neck")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Neck")} data-testid="svg-neck"
            />
            {isSelected("Neck") && <text x="142" y="74" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">Neck</text>}

            {/* Left Shoulder (body-left = screen-right of center) */}
            <path d="M138,78 C138,78 148,76 156,72 C162,69 167,73 167,79 C167,85 162,90 155,92 C148,94 140,92 138,90 Z"
              className={`${regionFill("Left Shoulder")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Shoulder")} data-testid="svg-left-shoulder"
            />
            {isSelected("Left Shoulder") && <text x="158" y="70" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Shoulder</text>}

            {/* Right Shoulder */}
            <path d="M122,78 C122,78 112,76 104,72 C98,69 93,73 93,79 C93,85 98,90 105,92 C112,94 120,92 122,90 Z"
              className={`${regionFill("Right Shoulder")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Shoulder")} data-testid="svg-right-shoulder"
            />
            {isSelected("Right Shoulder") && <text x="64" y="70" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">R Shoulder</text>}

            {/* Chest */}
            <path d="M122,84 C120,84 105,88 103,96 C101,104 102,114 104,120 C106,126 110,128 122,128 L138,128 C150,128 154,126 156,120 C158,114 159,104 157,96 C155,88 140,84 138,84 Z"
              className={`${regionFill("Chest")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Chest")} data-testid="svg-chest"
            />
            {isSelected("Chest") && <text x="121" y="110" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Chest</text>}

            {/* Abdomen */}
            <path d="M104,120 C103,126 102,136 103,146 C104,156 106,162 110,165 C114,168 120,170 130,170 C140,170 146,168 150,165 C154,162 156,156 157,146 C158,136 157,126 156,120 C150,123 140,125 130,125 C120,125 110,123 104,120 Z"
              className={`${regionFill("Abdomen")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Abdomen")} data-testid="svg-abdomen"
            />
            {isSelected("Abdomen") && <text x="130" y="148" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Abdomen</text>}

            {/* Left Upper Arm */}
            <path d="M155,92 C157,95 162,100 166,108 C169,115 169,124 167,130 C165,134 162,136 160,136 C157,136 154,134 153,130 C151,124 150,115 150,108 C149,100 150,93 155,92 Z"
              className={`${regionFill("Left Upper Arm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Upper Arm")} data-testid="svg-left-upper-arm"
            />
            {isSelected("Left Upper Arm") && <text x="172" y="112" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Arm</text>}

            {/* Right Upper Arm */}
            <path d="M105,92 C103,95 98,100 94,108 C91,115 91,124 93,130 C95,134 98,136 100,136 C103,136 106,134 107,130 C109,124 110,115 110,108 C111,100 110,93 105,92 Z"
              className={`${regionFill("Right Upper Arm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Upper Arm")} data-testid="svg-right-upper-arm"
            />
            {isSelected("Right Upper Arm") && <text x="72" y="112" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">R Arm</text>}

            {/* Left Elbow */}
            <ellipse cx="162" cy="137" rx="8" ry="7"
              className={`${regionFill("Left Elbow")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Elbow")} data-testid="svg-left-elbow"
            />
            {isSelected("Left Elbow") && <text x="172" y="140" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Elbow</text>}

            {/* Right Elbow */}
            <ellipse cx="98" cy="137" rx="8" ry="7"
              className={`${regionFill("Right Elbow")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Elbow")} data-testid="svg-right-elbow"
            />
            {isSelected("Right Elbow") && <text x="62" y="140" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">R Elbow</text>}

            {/* Left Forearm */}
            <path d="M154,144 C152,150 151,158 151,166 C151,173 153,178 157,180 C161,182 165,180 167,176 C169,172 169,164 168,156 C167,148 164,143 162,143 C160,143 156,143 154,144 Z"
              className={`${regionFill("Left Forearm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Forearm")} data-testid="svg-left-forearm"
            />
            {isSelected("Left Forearm") && <text x="172" y="162" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Forearm</text>}

            {/* Right Forearm */}
            <path d="M106,144 C108,150 109,158 109,166 C109,173 107,178 103,180 C99,182 95,180 93,176 C91,172 91,164 92,156 C93,148 96,143 98,143 C100,143 104,143 106,144 Z"
              className={`${regionFill("Right Forearm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Forearm")} data-testid="svg-right-forearm"
            />
            {isSelected("Right Forearm") && <text x="60" y="162" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Forearm</text>}

            {/* Left Wrist */}
            <path d="M151,180 C150,183 150,187 151,190 C152,193 155,195 158,195 C161,195 164,193 165,190 C166,187 166,183 165,180 C163,182 160,183 157,183 C154,183 152,182 151,180 Z"
              className={`${regionFill("Left Wrist")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Wrist")} data-testid="svg-left-wrist"
            />
            {isSelected("Left Wrist") && <text x="170" y="188" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Wrist</text>}

            {/* Right Wrist */}
            <path d="M109,180 C110,183 110,187 109,190 C108,193 105,195 102,195 C99,195 96,193 95,190 C94,187 94,183 95,180 C97,182 100,183 103,183 C106,183 108,182 109,180 Z"
              className={`${regionFill("Right Wrist")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Wrist")} data-testid="svg-right-wrist"
            />
            {isSelected("Right Wrist") && <text x="60" y="188" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Wrist</text>}

            {/* Left Hand */}
            <path d="M151,190 C149,194 148,200 149,206 C150,211 153,215 158,215 C163,215 166,211 167,206 C168,200 167,194 165,190 C163,193 160,195 157,195 C154,195 152,193 151,190 Z"
              className={`${regionFill("Left Hand")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Hand")} data-testid="svg-left-hand"
            />
            {isSelected("Left Hand") && <text x="170" y="206" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Hand</text>}

            {/* Right Hand */}
            <path d="M109,190 C111,194 112,200 111,206 C110,211 107,215 102,215 C97,215 94,211 93,206 C92,200 93,194 95,190 C97,193 100,195 103,195 C106,195 108,193 109,190 Z"
              className={`${regionFill("Right Hand")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Hand")} data-testid="svg-right-hand"
            />
            {isSelected("Right Hand") && <text x="60" y="206" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Hand</text>}

            {/* Left Hip */}
            <path d="M130,170 C137,170 144,171 148,174 C152,177 154,182 154,188 C154,194 151,198 146,200 C141,202 136,202 131,202 L130,202 L130,170 Z"
              className={`${regionFill("Left Hip")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Hip")} data-testid="svg-left-hip"
            />
            {isSelected("Left Hip") && <text x="156" y="186" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Hip</text>}

            {/* Right Hip */}
            <path d="M130,170 C123,170 116,171 112,174 C108,177 106,182 106,188 C106,194 109,198 114,200 C119,202 124,202 129,202 L130,202 L130,170 Z"
              className={`${regionFill("Right Hip")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Hip")} data-testid="svg-right-hip"
            />
            {isSelected("Right Hip") && <text x="74" y="186" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Hip</text>}

            {/* Left Thigh */}
            <path d="M131,202 C136,202 141,202 146,200 C148,199 150,197 150,202 C152,212 154,228 153,242 C152,252 148,258 143,260 C138,262 133,261 131,260 L131,202 Z"
              className={`${regionFill("Left Thigh")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Thigh")} data-testid="svg-left-thigh"
            />
            {isSelected("Left Thigh") && <text x="158" y="232" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Thigh</text>}

            {/* Right Thigh */}
            <path d="M129,202 C124,202 119,202 114,200 C112,199 110,197 110,202 C108,212 106,228 107,242 C108,252 112,258 117,260 C122,262 127,261 129,260 L129,202 Z"
              className={`${regionFill("Right Thigh")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Thigh")} data-testid="svg-right-thigh"
            />
            {isSelected("Right Thigh") && <text x="72" y="232" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Thigh</text>}

            {/* Left Knee */}
            <ellipse cx="142" cy="268" rx="12" ry="11"
              className={`${regionFill("Left Knee")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Knee")} data-testid="svg-left-knee"
            />
            {isSelected("Left Knee") && <text x="157" y="271" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Knee</text>}

            {/* Right Knee */}
            <ellipse cx="118" cy="268" rx="12" ry="11"
              className={`${regionFill("Right Knee")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Knee")} data-testid="svg-right-knee"
            />
            {isSelected("Right Knee") && <text x="73" y="271" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Knee</text>}

            {/* Left Shin/Calf */}
            <path d="M134,279 C136,285 140,295 141,308 C142,320 140,330 137,336 C135,340 132,342 130,342 L131,279 C132,279 133,279 134,279 Z"
              className={`${regionFill("Left Shin/Calf")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Shin/Calf")} data-testid="svg-left-shin"
            />
            {isSelected("Left Shin/Calf") && <text x="146" y="308" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Shin</text>}

            {/* Right Shin/Calf */}
            <path d="M126,279 C124,285 120,295 119,308 C118,320 120,330 123,336 C125,340 128,342 130,342 L129,279 C128,279 127,279 126,279 Z"
              className={`${regionFill("Right Shin/Calf")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Shin/Calf")} data-testid="svg-right-shin"
            />
            {isSelected("Right Shin/Calf") && <text x="74" y="308" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Shin</text>}

            {/* Left Ankle */}
            <ellipse cx="136" cy="344" rx="9" ry="7"
              className={`${regionFill("Left Ankle")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Ankle")} data-testid="svg-left-ankle"
            />
            {isSelected("Left Ankle") && <text x="148" y="347" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Ankle</text>}

            {/* Right Ankle */}
            <ellipse cx="124" cy="344" rx="9" ry="7"
              className={`${regionFill("Right Ankle")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Ankle")} data-testid="svg-right-ankle"
            />
            {isSelected("Right Ankle") && <text x="72" y="347" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Ankle</text>}

            {/* Left Foot */}
            <path d="M128,351 C131,351 136,352 140,354 C144,356 146,360 145,364 C144,368 140,370 136,370 C132,370 128,368 126,364 C124,360 124,355 126,352 C127,351 127,351 128,351 Z"
              className={`${regionFill("Left Foot")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Foot")} data-testid="svg-left-foot"
            />
            {isSelected("Left Foot") && <text x="148" y="364" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Foot</text>}

            {/* Right Foot */}
            <path d="M132,351 C129,351 124,352 120,354 C116,356 114,360 115,364 C116,368 120,370 124,370 C128,370 132,368 134,364 C136,360 136,355 134,352 C133,351 133,351 132,351 Z"
              className={`${regionFill("Right Foot")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Foot")} data-testid="svg-right-foot"
            />
            {isSelected("Right Foot") && <text x="72" y="364" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Foot</text>}
          </svg>
        ) : (
          <svg viewBox="0 0 260 420" className="w-[220px] h-[370px]" aria-label="Human body back view pain map">
            {/* ── BACK VIEW ── */}

            {/* Head (rear) */}
            <path d="M130,12 C118,12 108,20 107,31 C106,42 112,52 120,55 C124,57 126,60 126,64 L134,64 C134,60 136,57 140,55 C148,52 154,42 153,31 C152,20 142,12 130,12 Z"
              className={`${regionFill("Head")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Head")} data-testid="svg-head-back"
            />
            {isSelected("Head") && <text x="145" y="22" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">Head</text>}

            {/* Neck (rear) */}
            <path d="M122,64 L122,78 C122,81 125,83 130,83 C135,83 138,81 138,78 L138,64 Z"
              className={`${regionFill("Neck (rear)")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Neck (rear)")} data-testid="svg-neck-rear"
            />
            {isSelected("Neck (rear)") && <text x="142" y="74" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">Neck</text>}

            {/* Left Rear Shoulder */}
            <path d="M138,78 C138,78 148,76 156,72 C162,69 167,73 167,79 C167,85 162,90 155,92 C148,94 140,92 138,90 Z"
              className={`${regionFill("Left Rear Shoulder")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Rear Shoulder")} data-testid="svg-left-rear-shoulder"
            />
            {isSelected("Left Rear Shoulder") && <text x="158" y="70" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Shoulder</text>}

            {/* Right Rear Shoulder */}
            <path d="M122,78 C122,78 112,76 104,72 C98,69 93,73 93,79 C93,85 98,90 105,92 C112,94 120,92 122,90 Z"
              className={`${regionFill("Right Rear Shoulder")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Rear Shoulder")} data-testid="svg-right-rear-shoulder"
            />
            {isSelected("Right Rear Shoulder") && <text x="64" y="70" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Shoulder</text>}

            {/* Upper Back */}
            <path d="M122,84 C120,84 106,87 103,94 C101,100 102,110 103,118 L157,118 C158,110 159,100 157,94 C154,87 140,84 138,84 Z"
              className={`${regionFill("Upper Back")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Upper Back")} data-testid="svg-upper-back"
            />
            {isSelected("Upper Back") && <text x="130" y="104" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Upper Back</text>}

            {/* Mid Back */}
            <path d="M103,118 L157,118 L158,138 C158,140 155,142 152,143 C148,144 140,145 130,145 C120,145 112,144 108,143 C105,142 102,140 102,138 Z"
              className={`${regionFill("Mid Back")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Mid Back")} data-testid="svg-mid-back"
            />
            {isSelected("Mid Back") && <text x="130" y="133" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Mid Back</text>}

            {/* Lower Back */}
            <path d="M102,138 C102,140 102,148 103,158 C104,164 107,168 112,170 L148,170 C153,168 156,164 157,158 C158,148 158,140 158,138 L102,138 Z"
              className={`${regionFill("Lower Back")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Lower Back")} data-testid="svg-lower-back"
            />
            {isSelected("Lower Back") && <text x="130" y="157" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Lower Back</text>}

            {/* Left Tricep (back of upper arm) */}
            <path d="M155,92 C157,95 162,100 166,108 C169,115 169,124 167,130 C165,134 162,136 160,136 C157,136 154,134 153,130 C151,124 150,115 150,108 C149,100 150,93 155,92 Z"
              className={`${regionFill("Left Tricep")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Tricep")} data-testid="svg-left-tricep"
            />
            {isSelected("Left Tricep") && <text x="172" y="112" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Tricep</text>}

            {/* Right Tricep */}
            <path d="M105,92 C103,95 98,100 94,108 C91,115 91,124 93,130 C95,134 98,136 100,136 C103,136 106,134 107,130 C109,124 110,115 110,108 C111,100 110,93 105,92 Z"
              className={`${regionFill("Right Tricep")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Tricep")} data-testid="svg-right-tricep"
            />
            {isSelected("Right Tricep") && <text x="60" y="112" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Tricep</text>}

            {/* Left Forearm (back view) */}
            <path d="M154,144 C152,150 151,158 151,166 C151,173 153,178 157,180 C161,182 165,180 167,176 C169,172 169,164 168,156 C167,148 164,143 162,143 C160,143 156,143 154,144 Z"
              className={`${regionFill("Left Forearm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Forearm")} data-testid="svg-left-forearm-back"
            />
            {isSelected("Left Forearm") && <text x="172" y="162" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Forearm</text>}

            {/* Right Forearm (back view) */}
            <path d="M106,144 C108,150 109,158 109,166 C109,173 107,178 103,180 C99,182 95,180 93,176 C91,172 91,164 92,156 C93,148 96,143 98,143 C100,143 104,143 106,144 Z"
              className={`${regionFill("Right Forearm")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Forearm")} data-testid="svg-right-forearm-back"
            />
            {isSelected("Right Forearm") && <text x="60" y="162" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Forearm</text>}

            {/* Glutes */}
            <path d="M112,170 C108,172 104,176 103,184 C102,192 104,200 108,204 C112,208 118,210 124,210 C127,210 129,210 130,210 C131,210 133,210 136,210 C142,210 148,208 152,204 C156,200 158,192 157,184 C156,176 152,172 148,170 Z"
              className={`${regionFill("Glutes")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Glutes")} data-testid="svg-glutes"
            />
            {isSelected("Glutes") && <text x="130" y="192" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="middle">Glutes</text>}

            {/* Left Hamstring */}
            <path d="M131,210 C136,210 141,210 146,208 C148,207 150,205 150,210 C152,220 153,236 151,250 C149,260 145,266 140,267 C136,268 132,267 131,265 L131,210 Z"
              className={`${regionFill("Left Hamstring")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Hamstring")} data-testid="svg-left-hamstring"
            />
            {isSelected("Left Hamstring") && <text x="158" y="238" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Hamstring</text>}

            {/* Right Hamstring */}
            <path d="M129,210 C124,210 119,210 114,208 C112,207 110,205 110,210 C108,220 107,236 109,250 C111,260 115,266 120,267 C124,268 128,267 129,265 L129,210 Z"
              className={`${regionFill("Right Hamstring")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Hamstring")} data-testid="svg-right-hamstring"
            />
            {isSelected("Right Hamstring") && <text x="72" y="238" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Hamstring</text>}

            {/* Left Knee (back view) */}
            <ellipse cx="140" cy="274" rx="12" ry="10"
              className={`${regionFill("Left Knee")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Knee")} data-testid="svg-left-knee-back"
            />
            {isSelected("Left Knee") && <text x="156" y="277" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Knee</text>}

            {/* Right Knee (back view) */}
            <ellipse cx="120" cy="274" rx="12" ry="10"
              className={`${regionFill("Right Knee")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Knee")} data-testid="svg-right-knee-back"
            />
            {isSelected("Right Knee") && <text x="74" y="277" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Knee</text>}

            {/* Left Calf (rear) */}
            <path d="M132,284 C134,290 138,302 138,314 C138,325 136,333 133,337 C131,340 130,341 130,341 L131,284 C131,284 132,284 132,284 Z"
              className={`${regionFill("Left Calf (rear)")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Calf (rear)")} data-testid="svg-left-calf-rear"
            />
            {isSelected("Left Calf (rear)") && <text x="144" y="312" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Calf</text>}

            {/* Right Calf (rear) */}
            <path d="M128,284 C126,290 122,302 122,314 C122,325 124,333 127,337 C129,340 130,341 130,341 L129,284 C129,284 128,284 128,284 Z"
              className={`${regionFill("Right Calf (rear)")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Calf (rear)")} data-testid="svg-right-calf-rear"
            />
            {isSelected("Right Calf (rear)") && <text x="76" y="312" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Calf</text>}

            {/* Left Foot (back view) */}
            <path d="M130,341 C133,341 138,342 142,344 C146,346 148,350 147,354 C146,358 142,360 138,360 C134,360 130,358 128,354 C126,350 126,344 128,342 Z"
              className={`${regionFill("Left Foot")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Left Foot")} data-testid="svg-left-foot-back"
            />
            {isSelected("Left Foot") && <text x="150" y="352" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80">L Foot</text>}

            {/* Right Foot (back view) */}
            <path d="M130,341 C127,341 122,342 118,344 C114,346 112,350 113,354 C114,358 118,360 122,360 C126,360 130,358 132,354 C134,350 134,344 132,342 Z"
              className={`${regionFill("Right Foot")} stroke-[1.5] cursor-pointer transition-colors`}
              onClick={() => togglePain("Right Foot")} data-testid="svg-right-foot-back"
            />
            {isSelected("Right Foot") && <text x="72" y="352" fontSize="9" fill="currentColor" className="pointer-events-none font-medium opacity-80" textAnchor="end">R Foot</text>}
          </svg>
        )}
      </div>

      {/* Selected areas chips */}
      {selectedAreas.length > 0 && (
        <div className="mb-4" data-testid="selected-pain-areas">
          <label className="vitallity-label">Selected areas</label>
          <div className="flex flex-wrap gap-1.5">
            {selectedAreas.map(area => (
              <span key={area} className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                {area}
                <button type="button" onClick={() => togglePain(area)} aria-label={`Remove ${area}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* None option */}
      <button
        type="button"
        onClick={() => togglePain("None")}
        className={`w-full py-3 px-4 rounded-2xl border text-sm font-medium transition-all mb-4 ${
          isSelected("None")
            ? "bg-primary/10 border-primary text-primary"
            : "border-gray-200 text-gray-700 hover:bg-muted/50"
        }`}
        data-testid="pain-none"
      >
        No pain or discomfort
      </button>

      {/* Custom pain area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={data.customPainArea}
          onChange={e => update("customPainArea", e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustomPain()}
          placeholder="Other area..."
          className="vitallity-input flex-1"
          data-testid="input-custom-pain"
        />
        <button type="button" onClick={addCustomPain} className="vitallity-btn-ghost px-4">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Screen 4: Exercise & Activity (MERGED) ──────────────────
function Screen4({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  return (
    <div data-testid="screen-4" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">
        Exercise & activity
        <WhyWeAsk text="Your exercise background helps us set realistic starting points and suggest activities you're likely to enjoy and stick with." />
      </h2>
      <p className="text-gray-500 text-sm mb-8">Understanding your movement patterns</p>

      <div className="space-y-8">
        <div>
          <label className="vitallity-label">Activity Level by Occupation</label>
          <ChipGroup
            options={occupationActivityOptions}
            selected={data.occupationActivity ? [data.occupationActivity] : []}
            onChange={vals => update("occupationActivity", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Exercise History</label>
          <ChipGroup
            options={exerciseHistoryOptions}
            selected={data.exerciseHistoryOption ? [data.exerciseHistoryOption] : []}
            onChange={vals => update("exerciseHistoryOption", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Exercise Comfort</label>
          <ChipGroup
            options={exerciseComforts}
            selected={data.exerciseComfort ? [data.exerciseComfort] : []}
            onChange={vals => update("exerciseComfort", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Activities You Enjoy</label>
          <ChipGroup
            options={activityOptions.map(a => ({ label: a }))}
            selected={data.activities}
            onChange={vals => update("activities", vals)}
            multiple
          />
        </div>

        {/* Fitness Tracker */}
        <div>
          <label className="vitallity-label flex items-center">
            <Watch className="w-3.5 h-3.5 mr-1.5" />
            Fitness Tracker / Wearable
          </label>
          <ChipGroup
            options={fitnessTrackerOptions}
            selected={data.fitnessTrackers}
            onChange={vals => {
              if (vals.includes("None") && !data.fitnessTrackers.includes("None")) {
                update("fitnessTrackers", ["None"]);
              } else {
                update("fitnessTrackers", vals.filter(v => v !== "None"));
              }
            }}
            multiple
          />
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Diet & Eating ─────────────────────────────────
function Screen5({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const addCustomDietPref = () => {
    if (data.customDietPref.trim() && !data.dietaryPrefs.includes(data.customDietPref.trim())) {
      update("dietaryPrefs", [...data.dietaryPrefs, data.customDietPref.trim()]);
      update("customDietPref", "");
    }
  };

  return (
    <div data-testid="screen-5" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">
        Diet & eating
        <WhyWeAsk text="Understanding your dietary preferences and patterns lets us suggest realistic, culturally appropriate meal plans instead of generic advice." />
      </h2>
      <p className="text-gray-500 text-sm mb-8">Your food preferences and patterns</p>

      <div className="space-y-8">
        {/* Dietary Preferences */}
        <div>
          <label className="vitallity-label">Dietary Preferences</label>
          <ChipGroup
            options={dietaryOptions.map(d => ({ label: d }))}
            selected={data.dietaryPrefs}
            onChange={vals => update("dietaryPrefs", vals)}
            multiple
          />
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={data.customDietPref}
              onChange={e => update("customDietPref", e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomDietPref()}
              placeholder="Add custom preference..."
              className="vitallity-input flex-1"
              data-testid="input-custom-diet-pref"
            />
            <button type="button" onClick={addCustomDietPref} className="vitallity-btn-ghost px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Explanation cards */}
          {data.dietaryPrefs.includes("Flexitarian") && (
            <div className="bg-card rounded-[14px] border border-gray-200 p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Flexitarian</p>
                  <p className="text-xs text-gray-500 mt-1">Primarily plant-based but occasionally includes meat, fish, or dairy. Focuses on whole foods, vegetables, and plant proteins while allowing flexibility for social situations or personal preference.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Low FODMAP") && (
            <div className="bg-card rounded-[14px] border border-gray-200 p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Low FODMAP</p>
                  <p className="text-xs text-gray-500 mt-1">A diet that limits fermentable carbohydrates that can trigger IBS symptoms. Common high-FODMAP foods to avoid: wheat, onions, garlic, beans, certain fruits. Usually done in phases with a dietitian.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Sattvic") && (
            <div className="bg-card rounded-[14px] border border-gray-200 p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sattvic</p>
                  <p className="text-xs text-gray-500 mt-1">A yogic diet emphasizing fresh, seasonal, and minimally processed vegetarian foods. Avoids onion, garlic, caffeine, and alcohol. Focuses on grains, fruits, vegetables, nuts, and dairy for physical and mental clarity.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Jain") && (
            <div className="bg-card rounded-[14px] border border-gray-200 p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Jain</p>
                  <p className="text-xs text-gray-500 mt-1">Strictly vegetarian, avoids root vegetables (potatoes, onions, garlic, carrots), mushrooms, and foods that may involve harming organisms. Eating before sunset is common practice.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Eating Patterns */}
        <div>
          <label className="vitallity-label">Meals Per Day</label>
          <ChipGroup
            options={mealsPerDayOptions}
            selected={data.mealsPerDay ? [data.mealsPerDay] : []}
            onChange={vals => update("mealsPerDay", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Snacking Habit</label>
          <ChipGroup
            options={snackingOptions}
            selected={data.snackingHabit ? [data.snackingHabit] : []}
            onChange={vals => update("snackingHabit", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Cooking Style</label>
          <ChipGroup
            options={cookingOptions}
            selected={data.cookingStyle ? [data.cookingStyle] : []}
            onChange={vals => update("cookingStyle", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Eating Challenges</label>
          <ChipGroup
            options={eatingChallengeOptions.map(c => ({ label: c }))}
            selected={data.eatingChallenges}
            onChange={vals => update("eatingChallenges", vals)}
            multiple
          />
        </div>

        <div>
          <label className="vitallity-label">Additional Notes <span className="normal-case text-gray-400">(optional)</span></label>
          <textarea
            value={data.eatingNotes}
            onChange={e => update("eatingNotes", e.target.value)}
            rows={3}
            placeholder="Anything else about your eating patterns..."
            className="vitallity-input resize-none"
            data-testid="input-eating-notes"
          />
        </div>

        {/* Diet History */}
        <div>
          <label className="vitallity-label">Diet History</label>
          <textarea
            value={data.dietHistory}
            onChange={e => update("dietHistory", e.target.value)}
            rows={4}
            placeholder="Any diets you've tried? Keto, intermittent fasting, calorie counting, Ayurvedic? What was your experience?"
            className="vitallity-input resize-none"
            data-testid="input-diet-history"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Screen 6: Sleep, Stress & Constraints ───────────────────
function Screen6({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const handleSleepIssues = (vals: string[]) => {
    if (vals.includes("None") && !data.sleepIssues.includes("None")) {
      update("sleepIssues", ["None"]);
    } else {
      update("sleepIssues", vals.filter(v => v !== "None"));
    }
  };

  const handleStressSources = (vals: string[]) => {
    if (vals.includes("None significant") && !data.stressSources.includes("None significant")) {
      update("stressSources", ["None significant"]);
    } else {
      update("stressSources", vals.filter(v => v !== "None significant"));
    }
  };

  return (
    <div data-testid="screen-6" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Sleep, stress & constraints</h2>
      <p className="text-gray-500 text-sm mb-8">Factors that shape your capacity for change</p>

      <div className="space-y-8">
        {/* Sleep */}
        <div>
          <label className="vitallity-label">Hours of Sleep</label>
          <ChipGroup
            options={sleepHoursOptions}
            selected={data.sleepHours ? [data.sleepHours] : []}
            onChange={vals => update("sleepHours", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Sleep Quality</label>
          <ChipGroup
            options={sleepQualityOptions}
            selected={data.sleepQuality ? [data.sleepQuality] : []}
            onChange={vals => update("sleepQuality", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Sleep Issues</label>
          <ChipGroup
            options={sleepIssueOptions.map(s => ({ label: s }))}
            selected={data.sleepIssues}
            onChange={handleSleepIssues}
            multiple
          />
        </div>

        {/* Stress */}
        <div>
          <label className="vitallity-label">Stress Level</label>
          <ChipGroup
            options={stressLevelOptions}
            selected={data.stressLevel ? [data.stressLevel] : []}
            onChange={vals => update("stressLevel", vals[0] || "")}
          />
        </div>

        <div>
          <label className="vitallity-label">Stress Sources</label>
          <ChipGroup
            options={stressSourceOptions.map(s => ({ label: s }))}
            selected={data.stressSources}
            onChange={handleStressSources}
            multiple
          />
        </div>

        {/* Constraints */}
        <div>
          <label className="vitallity-label">Constraints & Realities</label>
          <ChipGroup
            options={constraintOptions.map(c => ({ label: c }))}
            selected={data.constraintChoices}
            onChange={vals => update("constraintChoices", vals)}
            multiple
          />
          <div className="mt-3">
            <input
              type="text"
              value={data.constraintOther}
              onChange={e => update("constraintOther", e.target.value)}
              placeholder="Other constraints..."
              className="vitallity-input"
              data-testid="input-constraint-other"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 7: What Worked / What Didn't ─────────────────────
function Screen7({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  return (
    <div data-testid="screen-7" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">What worked vs. what didn't</h2>
      <p className="text-gray-500 text-sm mb-8">Now that we know your history, reflect on past attempts</p>

      <div className="space-y-6">
        <div>
          <label className="vitallity-label">Past Attempts</label>
          <textarea
            value={data.pastAttemptsWorked}
            onChange={e => update("pastAttemptsWorked", e.target.value)}
            rows={8}
            placeholder="Be honest -- it's genuinely helpful. 'Keto worked for 2 months but unsustainable. Walking was great until monsoons. I'm good with discipline for 3 weeks then fall off...'"
            className="vitallity-input resize-none"
            data-testid="input-past-attempts"
          />
        </div>
      </div>
    </div>
  );
}


// ─── Screen 8: AI Health Summary (NEW) ─────────────────────────────────────
function Screen8AISummary({
  data, healthSummary, setHealthSummary, authFetch,
}: {
  data: OnboardingData;
  healthSummary: HealthSummaryData | null;
  setHealthSummary: (s: HealthSummaryData) => void;
  authFetch: (method: string, path: string, body?: any) => Promise<Response>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);
  const hasFetched = useRef(false);

  const fetchSummary = async (extra?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        profile: { name: data.name, age: data.age, gender: data.gender, heightCm: data.heightCm, weightKg: data.weightKg },
        conditions: data.healthConditions,
        acuteConditions: data.acuteConditions,
        medications: data.medications,
        painAreas: data.painAreas,
        exercise: { occupationActivity: data.occupationActivity, exerciseComfort: data.exerciseComfort, exerciseHistory: data.exerciseHistoryOption, activities: data.activities },
        eating: { mealsPerDay: data.mealsPerDay, snackingHabit: data.snackingHabit, cookingStyle: data.cookingStyle, dietaryPrefs: data.dietaryPrefs, eatingChallenges: data.eatingChallenges, dietHistory: data.dietHistory },
        sleep: { sleepHours: data.sleepHours, sleepQuality: data.sleepQuality, sleepIssues: data.sleepIssues },
        stress: { stressLevel: data.stressLevel, stressSources: data.stressSources },
        constraints: data.constraintChoices,
        pastAttemptsWorked: data.pastAttemptsWorked,
        ...(extra && extra.length > 0 ? { clarifyingAnswers: extra } : {}),
      };
      const res = await authFetch("POST", "/api/ai/health-summary", payload);
      const json = await res.json();
      setHealthSummary(json);
      setOpenSections({ observations: true });
    } catch (e: any) {
      setError("We couldn't generate your summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current && !healthSummary) {
      hasFetched.current = true;
      fetchSummary();
    }
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: { key: keyof HealthSummaryData; label: string; icon: React.ReactNode; isList: boolean }[] = [
    { key: "observations", label: "Key Observations", icon: <Eye className="w-4 h-4" />, isList: true },
    { key: "healthConsiderations", label: "Health Considerations", icon: <Shield className="w-4 h-4" />, isList: true },
    { key: "strengths", label: "Your Strengths", icon: <Zap className="w-4 h-4" />, isList: true },
    { key: "focusAreas", label: "Areas for Focus", icon: <Target className="w-4 h-4" />, isList: true },
    { key: "recommendedApproach", label: "Recommended Approach", icon: <BarChart2 className="w-4 h-4" />, isList: false },
  ];

  if (loading) {
    return (
      <div data-testid="screen-8-ai-summary" className="animate-fade-in-up">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your Health Profile</h2>
        <p className="text-gray-500 text-sm mb-2">Analyzing everything you've shared with us...</p>
        <p className="text-gray-400 text-xs mb-6">This takes about 20-30 seconds</p>
        <div className="space-y-4">
          <div className="vitallity-card flex items-center gap-4 p-6">
            <div className="w-10 h-10 rounded-full animate-shimmer shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded-full animate-shimmer w-3/4" />
              <div className="h-3 rounded-full animate-shimmer w-1/2" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="vitallity-card p-5 space-y-3">
              <div className="h-3 rounded-full animate-shimmer w-2/5" />
              <div className="h-3 rounded-full animate-shimmer w-full" />
              <div className="h-3 rounded-full animate-shimmer w-4/5" />
            </div>
          ))}
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Brain className="w-4 h-4 text-primary animate-pulse" />
              Analyzing your health profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="screen-8-ai-summary" className="animate-fade-in-up">
        <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your Health Profile</h2>
        <div className="vitallity-card p-6 mt-8 text-center">
          <AlertTriangle className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-3">We couldn't generate your AI summary right now.</p>
          <p className="text-xs text-gray-400 mb-5">You can try again or continue -- this won't affect your experience.</p>
          <button
            type="button"
            onClick={() => fetchSummary()}
            className="vitallity-btn-secondary text-sm px-5 py-2.5"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!healthSummary) return null;

  const hasClarifyingQuestions = healthSummary.clarifyingQuestions && healthSummary.clarifyingQuestions.length > 0;

  return (
    <div data-testid="screen-8-ai-summary" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your Health Profile</h2>
      <p className="text-gray-500 text-sm mb-6">A snapshot based on everything you've shared</p>

      {/* Profile Snapshot - gradient card */}
      <div
        className="rounded-[20px] p-5 mb-5 border border-primary/20"
        style={{ background: "linear-gradient(135deg, rgba(26,58,42,0.08) 0%, rgba(26,58,42,0.02) 100%)" }}
        data-testid="profile-snapshot-card"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.8px] text-primary font-semibold mb-1.5">Profile Snapshot</p>
            <p className="text-sm text-foreground leading-relaxed">{healthSummary.profileSnapshot}</p>
          </div>
        </div>
      </div>

      {/* Collapsible sections */}
      <div className="space-y-2.5">
        {sections.map(({ key, label, icon, isList }) => {
          const value = healthSummary[key];
          const items = isList ? (value as string[]) : [];
          const text = !isList ? (value as string) : "";
          if ((isList && items.length === 0) || (!isList && !text)) return null;
          const isOpen = openSections[key] ?? false;

          return (
            <div key={key} className="vitallity-card p-0 overflow-hidden" data-testid={`section-${key}`}>
              <button
                type="button"
                onClick={() => toggleSection(key)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-primary">{icon}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-200/50">
                  {isList ? (
                    <ul className="space-y-2 mt-3">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed mt-3">{text}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clarifying Questions */}
      {hasClarifyingQuestions && (
        <div className="mt-5 vitallity-card" data-testid="clarifying-questions">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">A couple of clarifying questions</p>
          </div>
          <div className="space-y-4">
            {healthSummary.clarifyingQuestions.map((q, i) => (
              <div key={i}>
                <label className="vitallity-label">{q}</label>
                <input
                  type="text"
                  value={clarifyAnswers[i] || ""}
                  onChange={e => {
                    const next = [...clarifyAnswers];
                    next[i] = e.target.value;
                    setClarifyAnswers(next);
                  }}
                  placeholder="Your answer..."
                  className="vitallity-input"
                  data-testid={`clarify-answer-${i}`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fetchSummary(clarifyAnswers)}
            className="mt-4 flex items-center gap-2 text-sm text-primary font-semibold hover:opacity-80 transition-opacity"
            data-testid="update-summary-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Update Summary
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Screen 9: Goals (redesigned with AI suggestions) ──────────────────────
function Screen9Goals({ data, update, bmi, healthSummary }: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  bmi: number;
  healthSummary: HealthSummaryData | null;
}) {
  const goalOptions = [
    { label: "Lose Weight", description: "Reduce body fat sustainably" },
    { label: "Manage Pain", description: "Reduce chronic pain levels" },
    { label: "Build Strength", description: "Get stronger, more capable" },
    { label: "Better Sleep", description: "Improve sleep quality & duration" },
    { label: "Reduce Stress", description: "Lower anxiety, more calm" },
    { label: "More Energy", description: "Stop feeling fatigued" },
    { label: "Skin Health", description: "Clearer, healthier skin" },
    { label: "Improve Blood Markers", description: "HbA1c, lipids, thyroid levels" },
    { label: "Better Mobility", description: "Move without stiffness/pain" },
    { label: "Overall Wellness", description: "Just feel better in general" },
  ];

  useEffect(() => {
    if (data.goals.length > 0) return;
    const preselected: string[] = [];
    if (bmi < 18.5) {
      preselected.push("Overall Wellness", "Build Strength");
    } else if (bmi >= 25 && bmi < 30) {
      preselected.push("Lose Weight");
    } else if (bmi >= 30 && bmi < 35) {
      preselected.push("Lose Weight", "Improve Blood Markers");
    } else if (bmi >= 35) {
      preselected.push("Lose Weight");
    }
    if (preselected.length > 0) update("goals", preselected);
  }, [bmi]);

  const filteredGoals = bmi < 18.5
    ? goalOptions.filter(g => g.label !== "Lose Weight")
    : goalOptions;

  const handleGoalChange = (selected: string[]) => {
    if (bmi >= 35 && !selected.includes("Lose Weight")) {
      selected = [...selected, "Lose Weight"];
    }
    update("goals", selected);
  };

  const showWeightLoss = data.goals.includes("Lose Weight");
  const [targetWeightStr, setTargetWeightStr] = useState<string>(
    data.targetWeightUnit === "lbs"
      ? String(Math.round(data.targetWeightKg * 2.20462))
      : String(data.targetWeightKg)
  );

  // Keep string in sync when unit toggles
  useEffect(() => {
    setTargetWeightStr(
      data.targetWeightUnit === "lbs"
        ? String(Math.round(data.targetWeightKg * 2.20462))
        : String(data.targetWeightKg)
    );
  }, [data.targetWeightUnit]);

  const handleTargetWeightChange = (raw: string) => {
    // Allow digits and a single decimal point
    if (/^\d*\.?\d*$/.test(raw)) {
      setTargetWeightStr(raw);
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        update("targetWeightKg", data.targetWeightUnit === "lbs" ? num / 2.20462 : num);
      }
    }
  };

  const weeksForTimeline = data.weightTimeline === "3 months" ? 12 : data.weightTimeline === "6 months" ? 24 : data.weightTimeline === "1 year" ? 52 : 0;
  const kgToLose = data.weightKg - data.targetWeightKg;
  const ratePerWeek = weeksForTimeline > 0 ? kgToLose / weeksForTimeline : 0;
  const showRateWarning = ratePerWeek > 1 && weeksForTimeline > 0;

  const conditionNames = data.healthConditions.map(c => c.condition);
  const hasCondition = (name: string) => conditionNames.includes(name);

  // Derive AI-suggested goals from focusAreas
  const aiSuggestedGoals = healthSummary?.focusAreas?.slice(0, 3) || [];

  return (
    <div data-testid="screen-9-goals" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your health goals</h2>
      {healthSummary ? (
        <p className="text-gray-500 text-sm mb-6">Based on your profile, here's what we'd recommend focusing on</p>
      ) : (
        <p className="text-gray-500 text-sm mb-6">What matters most to you right now?</p>
      )}

      <div className="space-y-6">
        {/* BMI cards */}
        {bmi < 18.5 && (
          <div className="bg-slate-faded rounded-[14px] p-4 border border-slate/20" data-testid="bmi-card-underweight">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate">Your BMI suggests you're underweight</p>
                <p className="text-xs text-gray-700 mt-1">Focus on nourishment and strength building.</p>
              </div>
            </div>
          </div>
        )}
        {bmi >= 25 && bmi < 30 && (
          <div className="bg-accent-faded rounded-[14px] p-4 border border-accent/20" data-testid="bmi-card-overweight">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent">BMI {bmi.toFixed(1)} - Weight management could help</p>
                <p className="text-xs text-gray-700 mt-1">Based on your BMI, weight management could improve your overall health.</p>
              </div>
            </div>
          </div>
        )}
        {bmi >= 30 && bmi < 35 && (
          <div className="bg-rose-faded rounded-[14px] p-4 border border-rose/20" data-testid="bmi-card-obese">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose">BMI {bmi.toFixed(1)} - Obesity range</p>
                <p className="text-xs text-gray-700 mt-1">Weight loss should be a priority for your health. We recommend discussing with your doctor.</p>
              </div>
            </div>
          </div>
        )}
        {bmi >= 35 && (
          <div className="bg-rose-faded rounded-[14px] p-4 border border-rose/20" data-testid="bmi-card-severe">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose">BMI {bmi.toFixed(1)} - Medical advisory</p>
                <p className="text-xs text-gray-700 mt-1">Your BMI requires medical attention. We strongly recommend consulting your doctor before starting any program.</p>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.bmiUnderstand}
                    onChange={e => update("bmiUnderstand", e.target.checked)}
                    className="rounded border-gray-200"
                    data-testid="bmi-understand-checkbox"
                  />
                  <span className="text-xs font-medium text-gray-700">I understand and want to proceed</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Compound cards */}
        {bmi > 25 && (hasCondition("Type 2 Diabetes") || hasCondition("Type 1 Diabetes")) && (
          <div className="bg-accent-faded rounded-[14px] p-4 border border-accent/20">
            <p className="text-sm text-accent">Weight loss is one of the most effective interventions for Type 2 diabetes. Even 5-7% body weight loss can significantly improve blood sugar control.</p>
          </div>
        )}
        {bmi > 25 && (hasCondition("Chronic Back Pain") || hasCondition("Knee Issues")) && (
          <div className="bg-accent-faded rounded-[14px] p-4 border border-accent/20">
            <p className="text-sm text-accent">Excess weight adds stress to your joints. Weight loss will directly help reduce your pain.</p>
          </div>
        )}
        {bmi > 30 && hasCondition("Heart Condition") && (
          <div className="bg-rose-faded rounded-[14px] p-4 border border-rose/20">
            <p className="text-sm text-rose">Please get exercise clearance from your cardiologist before starting.</p>
          </div>
        )}

        {/* AI-suggested goals */}
        {aiSuggestedGoals.length > 0 && (
          <div className="space-y-2.5" data-testid="ai-suggested-goals">
            <p className="text-[11px] uppercase tracking-[0.8px] text-primary font-semibold">AI Recommendations</p>
            {aiSuggestedGoals.map((suggestion, i) => {
              // Map focus area text to a known goal
              const matchedGoal = filteredGoals.find(g =>
                suggestion.toLowerCase().includes(g.label.toLowerCase().split(' ')[0])
              )?.label || null;
              const isSelected = matchedGoal ? data.goals.includes(matchedGoal) : false;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (matchedGoal) {
                      handleGoalChange(
                        isSelected
                          ? data.goals.filter(g => g !== matchedGoal)
                          : [...data.goals, matchedGoal]
                      );
                    }
                  }}
                  className={`w-full text-left rounded-[16px] p-4 border transition-all active:scale-[0.97] ${
                    isSelected
                      ? 'bg-primary/8 border-primary/30'
                      : 'bg-card border-gray-200 hover:border-primary/30'
                  }`}
                  data-testid={`ai-goal-${i}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      {matchedGoal && <p className="text-sm font-semibold text-foreground mb-0.5">{matchedGoal}</p>}
                      <p className="text-xs text-gray-500 leading-relaxed">{suggestion}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Goal selection */}
        <div>
          <label className="vitallity-label">{aiSuggestedGoals.length > 0 ? 'All Goals' : 'Select Your Goals'}</label>
          <ChipGroup
            options={filteredGoals}
            selected={data.goals}
            onChange={handleGoalChange}
            multiple
          />
        </div>

        {/* Reality check based on consistency history */}
        {data.consistencyHistory > 0 && data.consistencyHistory <= 4 && (
          <div className="bg-accent-faded rounded-[16px] p-4 border border-accent/20" data-testid="reality-check">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-accent leading-relaxed">
                Based on your consistency history, we'd suggest starting with a 1-month milestone rather than jumping to 6 months. Small wins compound.
              </p>
            </div>
          </div>
        )}

        {/* Custom goal */}
        <div>
          <label className="vitallity-label">Custom Goal <span className="normal-case text-gray-400">(optional)</span></label>
          <textarea
            value={data.customGoal}
            onChange={e => update("customGoal", e.target.value)}
            rows={3}
            placeholder="Or describe in your own words -- 'I want to play with my kids without getting winded', 'Get my HbA1c below 6.5'"
            className="vitallity-input resize-none"
            data-testid="input-custom-goal"
          />
        </div>

        {/* Weight target (conditional) */}
        {showWeightLoss && (
          <div className="vitallity-card space-y-4" data-testid="weight-target-section">
            <label className="vitallity-label">Weight Target</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={targetWeightStr}
                onChange={e => handleTargetWeightChange(e.target.value)}
                className="vitallity-input w-28"
                placeholder="e.g. 72.5"
                data-testid="input-target-weight"
              />
              <button
                type="button"
                onClick={() => update("targetWeightUnit", data.targetWeightUnit === "kg" ? "lbs" : "kg")}
                className="text-xs font-semibold text-primary bg-primary/8 rounded-full px-3 py-1"
              >
                {data.targetWeightUnit}
              </button>
            </div>

            <div>
              <label className="vitallity-label">Timeline</label>
              <select
                value={data.weightTimeline}
                onChange={e => update("weightTimeline", e.target.value)}
                className="vitallity-input"
                data-testid="select-weight-timeline"
              >
                <option value="">Select timeline</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
                <option value="Flexible">Flexible (sustainable pace)</option>
              </select>
            </div>

            {showRateWarning && (
              <div className="bg-gold-faded rounded-[14px] p-3 flex items-start gap-2" data-testid="rate-warning">
                <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span className="text-xs text-gold">That pace ({ratePerWeek.toFixed(1)}kg/week) may not be sustainable. We recommend 0.5-1kg per week for lasting results.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen 10: Self-Assessment ─────────────────────────────────
function Screen10({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const pastText = (data.pastAttemptsWorked || "").toLowerCase();
  const showCrossValidation = data.selfDiscipline >= 8 &&
    (pastText.includes("fall off") || pastText.includes("couldn't maintain") || pastText.includes("stopped after") || pastText.includes("inconsist"));

  return (
    <div data-testid="screen-10" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Self-assessment</h2>
      <p className="text-gray-500 text-sm mb-6">Honest answers lead to realistic, lasting plans</p>

      <div className="bg-violet-faded rounded-[14px] p-5 mb-8 border border-violet/15" data-testid="calibration-explainer">
        <p className="text-sm text-violet leading-relaxed">
          Research shows people tend to overestimate their knowledge and underestimate the difficulty of change. By being honest here, we can give you realistic plans that actually stick -- rather than ambitious plans that fail in week 2.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium text-foreground mb-4">
            How well do you understand nutrition -- calories, macros, what to eat for your goals?
          </p>
          <RangeSlider
            value={data.nutritionKnowledge}
            onChange={v => update("nutritionKnowledge", v)}
            leftLabel="Very little"
            rightLabel="Expert"
            testId="slider-nutrition"
          />
          {data.nutritionKnowledge >= 8 && (
            <div className="bg-gold-faded rounded-[14px] p-3 mt-3 flex items-start gap-2" data-testid="warning-nutrition">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-gold">Most people overestimate here initially. That's completely normal -- we'll calibrate together over time.</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-4">
            How well do you understand exercise -- form, programming, what's right for your body?
          </p>
          <RangeSlider
            value={data.exerciseKnowledge}
            onChange={v => update("exerciseKnowledge", v)}
            leftLabel="Very little"
            rightLabel="Expert"
            testId="slider-exercise"
          />
          {data.exerciseKnowledge >= 8 && (
            <div className="bg-gold-faded rounded-[14px] p-3 mt-3 flex items-start gap-2" data-testid="warning-exercise">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-gold">Most people overestimate here initially. That's completely normal -- we'll calibrate together over time.</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-4">
            Historically, how disciplined have you been about health routines?
          </p>
          <RangeSlider
            value={data.selfDiscipline}
            onChange={v => update("selfDiscipline", v)}
            leftLabel="Struggle a lot"
            rightLabel="Very consistent"
            testId="slider-discipline"
          />
          {data.selfDiscipline >= 8 && (
            <div className="bg-gold-faded rounded-[14px] p-3 mt-3 flex items-start gap-2" data-testid="warning-discipline">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-gold">Most people overestimate here initially. That's completely normal -- we'll calibrate together over time.</span>
            </div>
          )}
          {showCrossValidation && (
            <div className="bg-accent-faded rounded-[14px] p-3 mt-2 flex items-start gap-2" data-testid="cross-validation">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-xs text-accent">Your past attempts suggest building gradually might work better than an ambitious start. We'll factor that in.</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-4">
            How long do your health efforts typically last before you fall off?
          </p>
          <ChipGroup
            options={[
              { label: "1-2 days" },
              { label: "5-6 days" },
              { label: "1 week" },
              { label: "2 weeks" },
              { label: "1 month" },
              { label: "2-3 months" },
              { label: "6+ months" },
            ]}
            selected={(() => {
              const v = data.consistencyHistory;
              if (v <= 1) return ["1-2 days"];
              if (v <= 3) return ["5-6 days"];
              if (v <= 4) return ["1 week"];
              if (v <= 5) return ["2 weeks"];
              if (v <= 6) return ["1 month"];
              if (v <= 8) return ["2-3 months"];
              if (v <= 10) return ["6+ months"];
              return [];
            })()}
            onChange={vals => {
              const map: Record<string, number> = { "1-2 days": 1, "5-6 days": 2, "1 week": 4, "2 weeks": 5, "1 month": 6, "2-3 months": 7, "6+ months": 9 };
              update("consistencyHistory", map[vals[0]] || 5);
            }}
          />
          {data.consistencyHistory >= 8 && (
            <div className="bg-gold-faded rounded-[14px] p-3 mt-3 flex items-start gap-2" data-testid="warning-consistency">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-xs text-gold">Most people overestimate here initially. That's completely normal -- we'll calibrate together over time.</span>
            </div>
          )}
        </div>

        <div>
          <label className="vitallity-label">Why Now?</label>
          <textarea
            value={data.whyNow}
            onChange={e => update("whyNow", e.target.value)}
            rows={4}
            placeholder="What's motivating this attempt? A health scare, a life event, just tired of feeling this way? Understanding your 'why' helps us keep you on track."
            className="vitallity-input resize-none"
            data-testid="input-why-now"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Glide Path Generator ─────────────────────────────────────────
function generateGlidePath(data: OnboardingData): MilestoneData[] {
  const conditionNames = data.healthConditions.map(c => c.condition.toLowerCase());
  const hasKneeOrBack = conditionNames.some(c =>
    c.includes("knee") || c.includes("back") || c.includes("sciatica") || c.includes("spondylosis")
  );
  const hasHeart = conditionNames.some(c => c.includes("heart"));
  const hasAsthma = conditionNames.some(c => c.includes("asthma"));
  const lowConsistency = data.consistencyHistory <= 3;
  const highConsistency = data.consistencyHistory >= 7;
  const lowDiscipline = data.selfDiscipline <= 3;

  // Safe cardio suggestion based on health conditions
  const cardioSuggestion = hasKneeOrBack
    ? "swimming or cycling"
    : hasAsthma || hasHeart
    ? "brisk walking"
    : "brisk walking or light jogging";

  const milestones: MilestoneData[] = [];

  // ── Lose Weight ──────────────────────────────────────────────
  if (data.goals.includes("Lose Weight")) {
    const totalKg = Math.max(0, data.weightKg - data.targetWeightKg);
    const timelineWeeks =
      data.weightTimeline === "3 months" ? 12
      : data.weightTimeline === "6 months" ? 24
      : data.weightTimeline === "1 year" ? 52
      : 12;
    const safeRate = Math.min(totalKg / Math.max(timelineWeeks, 1), 1);
    const firstPhaseKg = +(safeRate * 2).toFixed(1);
    const targetDisplay = data.targetWeightKg > 0 ? `${data.targetWeightKg}kg` : "your target weight";
    const weeksLabel = data.weightTimeline || "12 weeks";

    let phases: { name: string; weeks: string; color: string }[];
    let steps: { weekLabel: string; description: string; why: string }[];

    if (timelineWeeks >= 12) {
      phases = [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-6", color: "accent" },
        { name: "Momentum", weeks: "Week 7-10", color: "violet" },
        { name: "Sustain", weeks: `Week 11-${timelineWeeks}`, color: "primary" },
      ];
      if (lowConsistency || lowDiscipline) {
        steps = [
          {
            weekLabel: "Week 1-2",
            description: "Track everything you eat (no changes yet) and drink 2.5L water daily",
            why: "Awareness before action -- tracking alone typically reduces intake by 10-15% without any restriction",
          },
          {
            weekLabel: "Week 3-6",
            description: `Replace one meal a day with a high-protein option, add ${cardioSuggestion} 3x/week for 20 min`,
            why: "A single daily swap builds the habit loop without overwhelming you",
          },
          {
            weekLabel: "Week 7-10",
            description: `Reduce refined carbs by a third, increase ${cardioSuggestion} to 4x/week, add 2 strength sessions`,
            why: "Combining cardio with strength training accelerates fat loss and preserves muscle",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: "Maintain deficit, weigh in weekly, plan for social events and travel ahead of time",
            why: "Most weight loss fails at plateau -- having a plan for life's interruptions is the difference",
          },
        ];
      } else if (highConsistency) {
        steps = [
          {
            weekLabel: "Week 1-2",
            description: `Log all meals, set a daily calorie target, start ${cardioSuggestion} 4x/week`,
            why: "Starting with structure leverages your existing discipline immediately",
          },
          {
            weekLabel: "Week 3-6",
            description: "Structured deficit (500 kcal/day below TDEE), 3x strength training + 3x cardio",
            why: "A 500 kcal deficit produces roughly 0.5kg/week loss -- proven and sustainable",
          },
          {
            weekLabel: "Week 7-10",
            description: "Introduce progressive overload in strength sessions, track weekly body measurements",
            why: "Measuring more than the scale shows true progress even on plateau weeks",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: `Diet break week at maintenance, then final push to ${targetDisplay}`,
            why: "A planned diet break resets leptin levels and prevents metabolic adaptation",
          },
        ];
      } else {
        steps = [
          {
            weekLabel: "Week 1-2",
            description: "Track meals 5/7 days, cut sugary drinks, add a 20-min morning walk daily",
            why: "Tracking and liquid calories are the two highest-impact low-effort changes",
          },
          {
            weekLabel: "Week 3-6",
            description: `Reduce portion size by 20%, eat protein-first at meals, ${cardioSuggestion} 3x/week`,
            why: "Protein keeps you full longer, reducing total intake without counting every calorie",
          },
          {
            weekLabel: "Week 7-10",
            description: "Add 2x strength sessions per week, track weight every Wednesday morning",
            why: "Consistent measurement day avoids misleading day-to-day fluctuations",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: "Focus on maintenance patterns -- meal prep, social eating strategies, sleep 7+ hrs",
            why: "Habits that survive weekends and social events are the ones that last",
          },
        ];
      }
    } else {
      phases = [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: `Week 3-${timelineWeeks}`, color: "accent" },
      ];
      steps = [
        {
          weekLabel: "Week 1-2",
          description: `Track all meals, swap sugary drinks for water, add 15-min ${cardioSuggestion} daily`,
          why: "Quick wins in week 1-2 set the psychological tone for the rest of the journey",
        },
        {
          weekLabel: `Week 3-${timelineWeeks}`,
          description: `Maintain 400-500 kcal daily deficit, ${cardioSuggestion} 4x/week, strength 2x/week`,
          why: `At this pace you can expect to lose ${firstPhaseKg}kg by your target date`,
        },
      ];
    }

    milestones.push({
      title: totalKg > 0
        ? `Lose ${totalKg.toFixed(1)}kg in ${weeksLabel}`
        : "Healthy weight journey",
      target: `Reach ${targetDisplay} by maintaining a progressive deficit`,
      timeframe: data.weightTimeline || "3 months",
      phases,
      steps,
    });
  }

  // ── Build Strength ────────────────────────────────────────────
  if (data.goals.includes("Build Strength")) {
    const exerciseTypes = (data as any).exerciseTypes || data.activities || [];
    const prefersGym = exerciseTypes.some((e: string) =>
      e.toLowerCase().includes("gym") || e.toLowerCase().includes("weight")
    );
    const startSessions = lowConsistency ? "2" : "2";

    milestones.push({
      title: "Build a sustainable strength foundation",
      target: `Complete ${highConsistency ? 36 : 24} training sessions over 12 weeks`,
      timeframe: "3 months",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-6", color: "accent" },
        { name: "Momentum", weeks: "Week 7-10", color: "violet" },
        { name: "Sustain", weeks: "Week 11-12", color: "primary" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: `${startSessions}x/week full-body bodyweight: squats, push-ups, glute bridges, planks (20 min)`,
          why: "Bodyweight mastery before adding load prevents injury and builds proprioception",
        },
        {
          weekLabel: "Week 3-6",
          description: `3x/week, add ${prefersGym ? "barbell/dumbbell compound lifts" : "resistance bands or weighted backpack"}, track reps and note progress`,
          why: "Progressive overload -- consistently adding a little more -- is the single mechanism behind strength gains",
        },
        {
          weekLabel: "Week 7-10",
          description: hasKneeOrBack
            ? "Upper-lower split: 2 upper days + 2 lower (seated/lying exercises), avoid spinal loading"
            : "Push-pull-legs split 3x/week, increase weight by 2.5kg when you can complete all reps cleanly",
          why: "Split routines allow muscles to recover fully while you train more frequently",
        },
        {
          weekLabel: "Week 11-12",
          description: "Deload week at 50% intensity, then test 1-rep max or max-rep benchmarks",
          why: "Deload weeks prevent overtraining and let your nervous system consolidate strength gains",
        },
      ],
    });
  }

  // ── Better Sleep ─────────────────────────────────────────────
  if (data.goals.includes("Better Sleep")) {
    milestones.push({
      title: "Build a consistent sleep rhythm",
      target: "Same sleep window within 30 min for 21 consecutive days",
      timeframe: "6 weeks",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
        { name: "Momentum", weeks: "Week 5-6", color: "violet" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: "Set one consistent wake time (same on weekends), no screens 30 min before bed",
          why: "Circadian rhythm is anchored by wake time -- not sleep time. Fixing wake time first is faster",
        },
        {
          weekLabel: "Week 3-4",
          description: "Stop caffeine by 2pm, add a 10-min wind-down routine (dim lights, journaling or reading)",
          why: "Caffeine has a 5-hour half-life -- afternoon coffee is still half-active at 10pm",
        },
        {
          weekLabel: "Week 5-6",
          description: "Cool bedroom to 18-20C if possible, try magnesium glycinate 400mg before bed",
          why: "Core body temperature drop triggers melatonin release -- a cool room accelerates this",
        },
      ],
    });
  }

  // ── Reduce Stress ────────────────────────────────────────────
  if (data.goals.includes("Reduce Stress")) {
    milestones.push({
      title: "Build a daily stress-recovery practice",
      target: "30 consecutive days with at least one stress practice completed",
      timeframe: "1 month",
      phases: [
        { name: "Foundation", weeks: "Week 1", color: "primary" },
        { name: "Building", weeks: "Week 2", color: "accent" },
        { name: "Momentum", weeks: "Week 3-4", color: "violet" },
      ],
      steps: [
        {
          weekLabel: "Week 1",
          description: "5 min box breathing daily: 4s inhale, 4s hold, 4s exhale, 4s hold -- repeat 5 rounds",
          why: "Box breathing activates the vagus nerve and lowers cortisol within minutes of practice",
        },
        {
          weekLabel: "Week 2",
          description: "Add a 10-min evening wind-down: write 3 things that went well today before bed",
          why: "Gratitude journaling reduces pre-sleep rumination -- one of the biggest sleep and stress disruptors",
        },
        {
          weekLabel: "Week 3-4",
          description: "15-min midday walk without headphones, plus breathing practice. Track stress level 1-10 daily",
          why: "Tracking stress reveals patterns (time of day, triggers) so you can intervene before it peaks",
        },
      ],
    });
  }

  // ── More Energy ──────────────────────────────────────────────
  if (data.goals.includes("More Energy")) {
    milestones.push({
      title: "Achieve sustained energy above 6/10",
      target: "Self-rated daily energy at 6+ for 14 consecutive days",
      timeframe: "1 month",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: "Target 7.5 hrs sleep, drink 2.5L water daily, 15-min morning walk before screens",
          why: "Even mild dehydration (1-2%) reduces cognitive performance and perceived energy by 20-30%",
        },
        {
          weekLabel: "Week 3-4",
          description: "Add protein to every meal (eggs, dal, paneer, chicken), cut refined carbs at lunch",
          why: "Stable blood sugar is the most direct lever for sustained afternoon energy -- protein blunts the spike and crash",
        },
      ],
    });
  }

  // ── Manage Pain ──────────────────────────────────────────────
  if (data.goals.includes("Manage Pain")) {
    const painAreas = data.painAreas || [];
    const hasSpinalPain = painAreas.some((p: string) =>
      p.toLowerCase().includes("back") || p.toLowerCase().includes("neck")
    );
    milestones.push({
      title: "Reduce pain level by 2 points",
      target: "Self-rated pain at 4 or below for 7 consecutive days",
      timeframe: "1 month",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: hasSpinalPain
            ? "Cat-cow, child's pose, and knee-to-chest stretches for 10 min daily. Track pain score morning and evening"
            : "10 min gentle stretching daily focused on your specific pain areas. Log triggers and patterns",
          why: "Tracking pain triggers is consistently the fastest path to identifying what to avoid -- and what helps",
        },
        {
          weekLabel: "Week 3-4",
          description: "Add anti-inflammatory foods (turmeric milk, omega-3 rich fish or flaxseed, berries). Heat therapy 10 min before stretching",
          why: "Heat before movement increases tissue flexibility; dietary anti-inflammatories reduce systemic pain over weeks",
        },
      ],
    });
  }

  // ── Improve Blood Markers ────────────────────────────────────
  if (data.goals.includes("Improve Blood Markers")) {
    milestones.push({
      title: "Establish blood marker baseline and 90-day targets",
      target: "Complete blood panel reviewed with doctor, action plan in place",
      timeframe: "2 weeks",
      phases: [
        { name: "Foundation", weeks: "Week 1", color: "primary" },
        { name: "Building", weeks: "Week 2", color: "accent" },
      ],
      steps: [
        {
          weekLabel: "Week 1",
          description: "Book and complete a comprehensive panel: HbA1c, fasting glucose, lipids, thyroid (TSH), Vitamin D, CBC",
          why: "You cannot set a target without a baseline -- this is the non-negotiable first step",
        },
        {
          weekLabel: "Week 2",
          description: "Review results with your doctor. Write down your specific targets and retest date (90 days)",
          why: "A concrete number (e.g. HbA1c from 7.2 to below 6.5) transforms an abstract goal into a trackable metric",
        },
      ],
    });
  }

  // ── Fallback: generic for any unmapped goal ───────────────────
  const mappedGoals = [
    "Lose Weight", "Build Strength", "Better Sleep",
    "Reduce Stress", "More Energy", "Manage Pain", "Improve Blood Markers",
  ];
  for (const goal of data.goals) {
    if (!mappedGoals.includes(goal) && MILESTONE_SUGGESTIONS[goal]) {
      const s = MILESTONE_SUGGESTIONS[goal];
      milestones.push({ ...s, steps: s.steps.map(st => ({ ...st })) });
    }
  }

  return milestones;
}

// ── Phase color helpers ──────────────────────────────────────
const PHASE_STYLES: Record<string, {
  bg: string; border: string; dot: string; label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  primary: { bg: "bg-primary/8",  border: "border-primary/20", dot: "bg-primary", label: "text-primary", icon: Leaf },
  accent:  { bg: "bg-accent/8",   border: "border-accent/20",  dot: "bg-accent",  label: "text-accent",  icon: TrendingUp },
  violet:  { bg: "bg-violet/8",   border: "border-violet/20",  dot: "bg-violet",  label: "text-violet",  icon: Flame },
  gold:    { bg: "bg-gold-faded", border: "border-gold/20",    dot: "bg-gold",    label: "text-gold",    icon: Sparkles },
};

const GOAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Lose Weight":           Footprints,
  "Build Strength":        Dumbbell,
  "Better Sleep":          Moon,
  "Reduce Stress":         Leaf,
  "More Energy":           Flame,
  "Manage Pain":           Heart,
  "Improve Blood Markers": TrendingUp,
};

// ── Editable Step Card ────────────────────────────────────────
function StepCard({
  step, stepIdx, mIdx, phaseColor,
  onEditDesc, onEditWhy,
}: {
  step: { weekLabel: string; description: string; why: string };
  stepIdx: number;
  mIdx: number;
  phaseColor: string;
  onEditDesc: (val: string) => void;
  onEditWhy: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const style = PHASE_STYLES[phaseColor] || PHASE_STYLES.primary;

  return (
    <div className="relative pl-6 pb-5 last:pb-0" data-testid={`milestone-${mIdx}-step-${stepIdx}`}>
      {/* vertical connector line */}
      <span className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200 last:hidden" aria-hidden />
      {/* dot */}
      <span className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full ${style.dot} flex items-center justify-center`}>
        <Check className="w-2.5 h-2.5 text-white" />
      </span>

      <div className="mb-1 flex items-center gap-2">
        <span className={`text-xs font-semibold ${style.label}`}>{step.weekLabel}</span>
        <button
          type="button"
          onClick={() => setEditing(e => !e)}
          className="ml-auto text-gray-400 hover:text-primary transition-colors"
          aria-label={editing ? "Save step" : "Edit step"}
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={step.description}
            onChange={e => onEditDesc(e.target.value)}
            rows={2}
            className="vitallity-input resize-none text-sm w-full"
            placeholder="What to do"
            data-testid={`milestone-${mIdx}-step-${stepIdx}-desc`}
          />
          <textarea
            value={step.why}
            onChange={e => onEditWhy(e.target.value)}
            rows={2}
            className="vitallity-input resize-none text-xs w-full"
            placeholder="Why this matters"
            data-testid={`milestone-${mIdx}-step-${stepIdx}-why`}
          />
        </div>
      ) : (
        <div>
          <p className="text-sm text-foreground leading-snug">{step.description}</p>
          <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">{step.why}</p>
        </div>
      )}
    </div>
  );
}

// ─── Screen 11: Smart Glide Path (Milestones) ─────────────────────
function Screen11Milestones({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  // Auto-generate glide path on first load
  useEffect(() => {
    if (data.milestones.length === 0 && data.goals.length > 0) {
      update("milestones", generateGlidePath(data));
    }
  }, []);

  // Regenerate when goals change (e.g. user went back and changed goals)
  const [prevGoals, setPrevGoals] = useState<string[]>(data.goals);
  useEffect(() => {
    if (JSON.stringify(prevGoals) !== JSON.stringify(data.goals)) {
      setPrevGoals(data.goals);
      update("milestones", generateGlidePath(data));
    }
  }, [data.goals]);

  const updateStepField = (
    mIdx: number,
    sIdx: number,
    field: "description" | "why",
    val: string
  ) => {
    const updated = [...data.milestones];
    const steps = [...updated[mIdx].steps];
    steps[sIdx] = { ...steps[sIdx], [field]: val };
    updated[mIdx] = { ...updated[mIdx], steps };
    update("milestones", updated);
  };

  const removeMilestone = (idx: number) => {
    update("milestones", data.milestones.filter((_, i) => i !== idx));
  };

  const addCustomMilestone = () => {
    update("milestones", [...data.milestones, {
      title: "Custom milestone",
      target: "",
      timeframe: "1 month",
      phases: [{ name: "Foundation", weeks: "Week 1-2", color: "primary" }],
      steps: [{ weekLabel: "Week 1-2", description: "", why: "" }],
    }]);
  };

  const regenerate = () => {
    update("milestones", generateGlidePath(data));
  };

  const showCalibrationWarning = data.selfDiscipline >= 8 && data.consistencyHistory < 5;

  // End-goal summary line for weight loss
  const endGoalLine = (() => {
    if (data.goals.includes("Lose Weight") && data.targetWeightKg > 0) {
      const month = data.weightTimeline === "3 months" ? 3
        : data.weightTimeline === "6 months" ? 6
        : data.weightTimeline === "1 year" ? 12 : 3;
      const now = new Date();
      now.setMonth(now.getMonth() + month);
      const label = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
      return `Target: ${data.targetWeightKg}kg by ${label}`;
    }
    return null;
  })();

  return (
    <div data-testid="screen-11-milestones" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Your glide path</h2>
      <p className="text-gray-500 text-sm mb-6">A step-by-step runway to your goals, built around your reality</p>

      {showCalibrationWarning && (
        <div className="bg-gold-faded rounded-[14px] p-4 mb-5 flex items-start gap-2" data-testid="calibration-milestone-warning">
          <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <span className="text-xs text-gold">Your plans have tended to start strong but fade. We've built this path to start easy -- resist the urge to skip ahead.</span>
        </div>
      )}

      {data.milestones.length === 0 && data.goals.length === 0 && (
        <div className="bg-primary/8 rounded-[14px] p-6 text-center border border-primary/15" data-testid="no-goals-prompt">
          <Target className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-primary">No goals selected yet</p>
          <p className="text-xs text-gray-500 mt-1">Go back to Step 8 and select your goals to generate your glide path</p>
        </div>
      )}

      <div className="space-y-7">
        {data.milestones.map((m, mIdx) => {
          const GoalIcon = GOAL_ICONS[data.goals[mIdx]] || Target;
          const phases = m.phases || [{ name: "Foundation", weeks: "All weeks", color: "primary" }];

          // Group steps by matching phase.weeks label
          const phaseSteps: { phase: typeof phases[0]; steps: typeof m.steps; startSIdx: number }[] = [];
          let sIdx = 0;
          for (const phase of phases) {
            const matchingSteps = m.steps.filter(s => s.weekLabel === phase.weeks);
            if (matchingSteps.length > 0) {
              phaseSteps.push({ phase, steps: matchingSteps, startSIdx: sIdx });
              sIdx += matchingSteps.length;
            } else {
              const fallbackSteps = m.steps.slice(sIdx, sIdx + 1);
              if (fallbackSteps.length > 0) {
                phaseSteps.push({ phase, steps: fallbackSteps, startSIdx: sIdx });
                sIdx += fallbackSteps.length;
              }
            }
          }
          // Remaining steps not assigned to any phase
          if (sIdx < m.steps.length) {
            phaseSteps.push({
              phase: { name: "Additional", weeks: "", color: "primary" },
              steps: m.steps.slice(sIdx),
              startSIdx: sIdx,
            });
          }

          return (
            <div key={mIdx} className="vitallity-card" data-testid={`milestone-${mIdx}`}>
              {/* Milestone header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
                    <GoalIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{m.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{m.target}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(mIdx)}
                  className="text-gray-400 hover:text-rose transition-colors shrink-0 mt-0.5"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Timeframe badge */}
              <div className="flex items-center gap-1.5 mb-5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">{m.timeframe}</span>
              </div>

              {/* Phase cards with vertical timeline */}
              <div className="space-y-4">
                {phaseSteps.map(({ phase, steps: pSteps, startSIdx }, pIdx) => {
                  const style = PHASE_STYLES[phase.color] || PHASE_STYLES.primary;
                  const PhaseIcon = style.icon;
                  return (
                    <div
                      key={pIdx}
                      className={`rounded-[12px] border ${style.bg} ${style.border} p-4`}
                      data-testid={`milestone-${mIdx}-phase-${pIdx}`}
                    >
                      {/* Phase header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-6 h-6 rounded-full ${style.dot} flex items-center justify-center shrink-0`}>
                          <PhaseIcon className="w-3 h-3 text-white" />
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wide ${style.label}`}>
                          Phase {pIdx + 1}: {phase.name}
                        </span>
                        {phase.weeks && (
                          <span className="text-xs text-gray-400 ml-auto">{phase.weeks}</span>
                        )}
                      </div>

                      {/* Steps within phase */}
                      <div className="mt-2">
                        {pSteps.map((step, relIdx) => {
                          const absoluteSIdx = startSIdx + relIdx;
                          return (
                            <StepCard
                              key={absoluteSIdx}
                              step={step}
                              stepIdx={absoluteSIdx}
                              mIdx={mIdx}
                              phaseColor={phase.color}
                              onEditDesc={val => updateStepField(mIdx, absoluteSIdx, "description", val)}
                              onEditWhy={val => updateStepField(mIdx, absoluteSIdx, "why", val)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* End goal summary */}
      {endGoalLine && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{endGoalLine}</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={regenerate}
          className="flex-1 border border-gray-200 rounded-[12px] p-3 flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-card transition-colors"
          data-testid="regenerate-glide-path"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          Regenerate
        </button>
        <button
          type="button"
          onClick={addCustomMilestone}
          className="flex-1 border border-dashed border-primary/30 rounded-[12px] p-3 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-colors"
          data-testid="add-custom-milestone"
        >
          <Plus className="w-4 h-4" />
          Add milestone
        </button>
      </div>

      {/* How Points Work */}
      <div className="vitallity-card mt-6" data-testid="points-explainer">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[hsl(var(--gold))]" />
          <p className="text-sm font-semibold text-foreground">How Points Work</p>
        </div>
        <div className="space-y-2">
          {[
            { label: "Complete profile", pts: "+100 pts" },
            { label: "Daily check-in", pts: "+10 pts" },
            { label: "7-day streak", pts: "+50 pts" },
            { label: "Upload health report", pts: "+25 pts" },
            { label: "Hit a milestone", pts: "+75 pts" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-xs text-gray-700">{item.label}</p>
              <span className="text-xs font-semibold text-[hsl(var(--gold))]">{item.pts}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">Rewards Store coming soon -- redeem points for premium features and wellness products</p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 12: Integrations ────────────────────────────────────────────────
function Screen12Integrations({ authFetch }: { authFetch: (method: string, url: string, body?: any) => Promise<Response> }) {
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [sheetsLoading, setSheetsLoading] = useState(false);

  const connectTelegram = async () => {
    setTelegramLoading(true);
    try {
      const res = await authFetch("POST", "/api/telegram/generate-link");
      const d = await res.json();
      if (d.deepLink) window.open(d.deepLink, "_blank");
    } catch {} finally {
      setTelegramLoading(false);
    }
  };

  const connectSheets = async () => {
    setSheetsLoading(true);
    try {
      const res = await authFetch("GET", "/api/google-sheets/auth-url");
      const d = await res.json();
      if (d.url) window.open(d.url, "_blank");
    } catch {} finally {
      setSheetsLoading(false);
    }
  };

  return (
    <div data-testid="screen-12-integrations" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Power Up Your Journey</h2>
      <p className="text-gray-500 text-sm mb-6">Connect your tools for a seamless experience</p>

      <div className="space-y-3">
        {/* Telegram */}
        <div className="vitallity-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Telegram</p>
              <p className="text-xs text-gray-700 mt-0.5">Daily reminders and check-ins without opening the app</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 flex-wrap">
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">1</span>
            <span>Tap Connect</span>
            <span className="text-border mx-1">-</span>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">2</span>
            <span>Open in Telegram</span>
            <span className="text-border mx-1">-</span>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">3</span>
            <span>Press Start</span>
          </div>
          <button
            onClick={connectTelegram}
            disabled={telegramLoading}
            className="vitallity-btn-primary text-sm flex items-center gap-2"
            data-testid="connect-telegram-btn"
          >
            {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Connect Telegram
          </button>
        </div>

        {/* Google Sheets */}
        <div className="vitallity-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
              <Sheet className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Google Sheets</p>
              <p className="text-xs text-gray-700 mt-0.5">Auto-export your logs to a spreadsheet</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 flex-wrap">
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">1</span>
            <span>Tap Connect</span>
            <span className="text-border mx-1">-</span>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">2</span>
            <span>Sign in with Google</span>
            <span className="text-border mx-1">-</span>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">3</span>
            <span>Allow access</span>
          </div>
          <button
            onClick={connectSheets}
            disabled={sheetsLoading}
            className="vitallity-btn-primary text-sm flex items-center gap-2"
            data-testid="connect-sheets-btn"
          >
            {sheetsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sheet className="w-4 h-4" />}
            Connect Sheets
          </button>
        </div>

        {/* Coming Soon divider */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Coming Soon</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Coming Soon items */}
        <div className="space-y-2 opacity-60">
          <div className="vitallity-card p-4 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <p className="text-xs text-gray-700">Message-based check-ins</p>
            </div>
            <span className="text-[10px] font-semibold bg-muted text-gray-500 rounded-full px-2 py-0.5">Soon</span>
          </div>
          <div className="vitallity-card p-4 flex items-center gap-3">
            <Utensils className="w-5 h-5 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">MyFitnessPal</p>
              <p className="text-xs text-gray-700">Sync nutrition data</p>
            </div>
            <span className="text-[10px] font-semibold bg-muted text-gray-500 rounded-full px-2 py-0.5">Soon</span>
          </div>
          <div className="vitallity-card p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Health Trackers</p>
              <p className="text-xs text-gray-700">Apple Health, Fitbit, Garmin</p>
            </div>
            <span className="text-[10px] font-semibond bg-muted text-gray-500 rounded-full px-2 py-0.5">Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 13: Journey Review ───────────────────────────────
function Screen13Review({ data, bmi, bmiCategory }: { data: OnboardingData; bmi: number; bmiCategory: string }) {
  const scoreColor = (val: number) => {
    if (val <= 4) return "text-rose";
    if (val <= 7) return "text-gold";
    return "text-primary";
  };

  const scoreLabel = (val: number) => {
    if (val <= 4) return "Low";
    if (val <= 7) return "Moderate";
    return "High";
  };

  const showCalibrationWarning = data.selfDiscipline >= 8 || data.consistencyHistory >= 8;
  const conditionNames = data.healthConditions.filter(c => c.condition !== "None currently").map(c => c.condition);

  return (
    <div data-testid="screen-12-review" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">Your journey map</h2>
      <p className="text-gray-500 text-sm mb-8">Review your information before we begin</p>

      <div className="space-y-5">
        {/* Profile card */}
        <div className="vitallity-card" data-testid="review-profile">
          <h3 className="vitallity-label">Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Age</span>
              <span className="font-medium">{data.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Height</span>
              <span className="font-medium">{data.heightCm} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Weight</span>
              <span className="font-medium">{data.weightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">BMI</span>
              <span className="font-medium">
                {bmi.toFixed(1)} <span className="text-gray-500">({bmiCategory})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Health Conditions card */}
        {(conditionNames.length > 0 || data.medications.length > 0) && (
          <div className="vitallity-card" data-testid="review-conditions">
            <h3 className="vitallity-label">Health Conditions</h3>
            {conditionNames.length > 0 && (
              <div className="mb-3">
                <div className="space-y-1.5">
                  {data.healthConditions.filter(c => c.condition !== "None currently").map(c => (
                    <div key={c.condition} className="flex items-center gap-2">
                      <span className="bg-primary/8 text-primary text-xs rounded-full px-2.5 py-1">{c.condition}</span>
                      {c.duration && <span className="text-[10px] text-gray-500">{c.duration}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.familyConditions.length > 0 && !data.familyConditions.includes("None known") && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Family History</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.familyConditions.map(c => (
                    <span key={c} className="bg-accent/8 text-accent text-xs rounded-full px-2.5 py-1">{c}</span>
                  ))}
                  {data.familyHistoryOther && (
                    <span className="bg-accent/8 text-accent text-xs rounded-full px-2.5 py-1">{data.familyHistoryOther}</span>
                  )}
                </div>
              </div>
            )}
            {data.painAreas.length > 0 && !data.painAreas.includes("None") && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Pain Areas</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.painAreas.map(p => (
                    <span key={p} className="bg-rose/8 text-rose text-xs rounded-full px-2.5 py-1">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {data.medications.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Medications</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.medications.map(m => (
                    <span key={m} className="bg-slate/8 text-slate text-xs rounded-full px-2.5 py-1">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lifestyle card */}
        <div className="vitallity-card" data-testid="review-lifestyle">
          <h3 className="vitallity-label">Lifestyle</h3>
          <div className="space-y-2 text-sm">
            {data.occupationActivity && (
              <div className="flex justify-between">
                <span className="text-gray-500">Occupation</span>
                <span className="font-medium">{data.occupationActivity}</span>
              </div>
            )}
            {data.exerciseHistoryOption && (
              <div className="flex justify-between">
                <span className="text-gray-500">Exercise History</span>
                <span className="font-medium text-right max-w-[200px]">{data.exerciseHistoryOption}</span>
              </div>
            )}
            {data.exerciseComfort && (
              <div className="flex justify-between">
                <span className="text-gray-500">Exercise Comfort</span>
                <span className="font-medium text-right max-w-[200px]">{data.exerciseComfort}</span>
              </div>
            )}
            {data.sleepHours && (
              <div className="flex justify-between">
                <span className="text-gray-500">Sleep</span>
                <span className="font-medium">{data.sleepHours} ({data.sleepQuality || "N/A"})</span>
              </div>
            )}
            {data.stressLevel && (
              <div className="flex justify-between">
                <span className="text-gray-500">Stress</span>
                <span className="font-medium">{data.stressLevel}</span>
              </div>
            )}
          </div>
          {data.constraintChoices.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Constraints</div>
              <div className="flex flex-wrap gap-1.5">
                {data.constraintChoices.map(c => (
                  <span key={c} className="bg-slate/8 text-slate text-xs rounded-full px-2.5 py-1">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals card */}
        <div className="vitallity-card" data-testid="review-goals">
          <h3 className="vitallity-label">Goals</h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.goals.map(g => (
              <span key={g} className="bg-primary/8 text-primary text-xs rounded-full px-2.5 py-1 font-medium">{g}</span>
            ))}
          </div>
          {data.customGoal && (
            <p className="text-sm text-gray-700 italic">"{data.customGoal}"</p>
          )}
          {data.goals.includes("Lose Weight") && data.targetWeightKg && (
            <div className="text-sm text-gray-700 mt-2">
              Target: {data.targetWeightKg}kg
              {data.weightTimeline && ` in ${data.weightTimeline}`}
            </div>
          )}
        </div>

        {/* Self-Assessment card */}
        <div className="vitallity-card" data-testid="review-assessment">
          <h3 className="vitallity-label">Self-Assessment</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Nutrition", value: data.nutritionKnowledge },
              { label: "Exercise", value: data.exerciseKnowledge },
              { label: "Discipline", value: data.selfDiscipline },
              { label: "Consistency", value: data.consistencyHistory },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`text-2xl font-display font-bold ${scoreColor(item.value)}`}>
                  {item.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                <div className={`text-[10px] font-medium ${scoreColor(item.value)}`}>{scoreLabel(item.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones card */}
        {data.milestones.length > 0 && (
          <div className="vitallity-card" data-testid="review-milestones">
            <h3 className="vitallity-label">Milestones ({data.milestones.length})</h3>
            <div className="space-y-2">
              {data.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <span className="font-medium">{m.title}</span>
                    {m.timeframe && <span className="text-gray-500 ml-2">({m.timeframe})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calibration warning */}
        {showCalibrationWarning && (
          <div className="bg-gold-faded rounded-[14px] p-4 border border-gold/15" data-testid="review-calibration-warning">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <p className="text-xs text-gold leading-relaxed">
                You rated discipline/consistency quite high. We'll start with an appropriately ambitious plan -- but if things slip in weeks 2-3, that's completely normal and we'll recalibrate without judgment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
