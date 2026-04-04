import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
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
  Mic, MicOff, Star, Compass,
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
  "Compressed Nerve",
  // Musculoskeletal
  "Plantar Fasciitis", "Carpal Tunnel",
  // Digestive
  "Acid Reflux/GERD", "Celiac Disease", "Lactose Intolerance",
  // Hormonal
  "Perimenopause", "Menopause", "Endometriosis",
  // Mental
  "Burnout", "PTSD", "OCD",
  "None currently",
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
  "Cold/Flu", "Viral Fever", "Sprained Ankle", "Sprain", "Fracture (healing)",
  "Post-Surgery Recovery", "Food Poisoning", "Pregnancy", "Postpartum",
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
  trackingMetric?: string; // e.g. "weight_kg", "sleep_hours"
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
  gymAccess: string;
  trainerFrequency: string;
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
  pastAttemptsDidntWork: string;
  startingBarrier: string;
  barrierTimeframe: string;
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
  gymAccess: "", trainerFrequency: "",
  snackingHabit: "", dietaryPrefs: [], customDietPref: "", mealsPerDay: "", cookingStyle: "",
  eatingChallenges: [], eatingNotes: "", dietHistory: "",
  sleepHours: "", sleepQuality: "", sleepIssues: [],
  stressLevel: "", stressSources: [],
  constraintChoices: [], constraintOther: "",
  pastAttemptsWorked: "", pastAttemptsDidntWork: "", startingBarrier: "", barrierTimeframe: "",
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
  const [, navigate] = useLocation();
  // step 0 = choice screen; step 1+ = existing form flow
  const [step, setStep] = useState(0);
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
        // If user has already started the form (step > 0 in DB), skip choice screen
        if (progress.step && progress.step > 0) {
          setStep(Math.min(progress.step, TOTAL_STEPS));
        } else {
          // Show choice screen (step 0)
          setStep(0);
        }
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
            gymAccess: data.gymAccess,
            trainerFrequency: data.trainerFrequency,
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
          body = {
            pastAttemptsWorked: data.pastAttemptsWorked,
            pastAttemptsDidntWork: data.pastAttemptsDidntWork,
            startingBarrier: data.startingBarrier,
            barrierTimeframe: data.barrierTimeframe,
          };
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

  // ─── Step 0: Choice Screen ───────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5" data-testid="onboarding-choice-screen">
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40 z-20" />
        <div className="w-full max-w-[480px]">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="Vitallity">
              <rect x="2" y="2" width="28" height="28" rx="6" stroke="hsl(var(--primary))" strokeWidth="2.5" />
              <path d="M9 17L13 22L23 10" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-base font-semibold tracking-tight">Vitallity</span>
          </div>

          <h1 className="font-display text-xl font-bold tracking-tight mb-1">
            How would you like to set up your profile?
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Choose the setup experience that works best for you.
          </p>

          {/* Option 1: Guided Consultation (default) */}
          <button
            type="button"
            onClick={() => navigate("/onboarding-chat")}
            className="w-full text-left rounded-2xl border-2 border-primary bg-primary/5 p-5 mb-3 hover:bg-primary/10 transition-colors group"
            data-testid="choice-guided-consultation"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">Guided Consultation</span>
                  <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Recommended</span>
                </div>
                <p className="text-xs text-gray-600">
                  Chat with your AI coach to build your personalized plan. Takes about 5-7 minutes.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Quick Setup */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            data-testid="choice-quick-setup"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <ListChecks className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-sm block mb-1">Quick Setup</span>
                <p className="text-xs text-gray-500">
                  Fill out a structured questionnaire. Takes about 8-10 minutes.
                </p>
              </div>
            </div>
          </button>
        </div>
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

        {/* Auto-detect health suggestions */}
        {(() => {
          const ageNum = parseInt(data.age) || 0;
          const bmiVal = data.heightCm && data.weightKg ? data.weightKg / Math.pow(data.heightCm / 100, 2) : 0;
          const condNames = data.healthConditions.map(c => c.condition);
          const cards: { id: string; message: string; addLabel?: string; addCondition?: string }[] = [];

          if (data.gender === "Female" && ageNum >= 42 && ageNum < 50 && !condNames.includes("Perimenopause")) {
            cards.push({
              id: "perimenopause",
              message: "Women over 42 may experience perimenopause symptoms. Would you like to add this?",
              addLabel: "Add Perimenopause",
              addCondition: "Perimenopause",
            });
          }
          if (data.gender === "Female" && ageNum >= 50 && !condNames.includes("Menopause")) {
            cards.push({
              id: "menopause",
              message: "Women over 50 commonly experience menopause. Would you like to add this?",
              addLabel: "Add Menopause",
              addCondition: "Menopause",
            });
          }
          if (ageNum >= 40 && (condNames.includes("Hypertension") || condNames.includes("Type 2 Diabetes") || condNames.includes("Heart Condition"))) {
            cards.push({
              id: "cardiac-screening",
              message: "Consider regular cardiac screening -- your age and conditions increase cardiovascular risk.",
            });
          }
          if (bmiVal >= 35) {
            cards.push({
              id: "bmi-supervision",
              message: "Your BMI suggests you may benefit from medical supervision for weight management.",
            });
          }

          if (cards.length === 0) return null;
          return (
            <div className="space-y-3" data-testid="auto-detect-cards">
              {cards.map(card => (
                <div key={card.id} className="bg-amber-50 border border-amber-200 rounded-[14px] p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{card.message}</p>
                  </div>
                  {card.addCondition && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleConditionChange([...selectedConditionNames, card.addCondition!])}
                        className="text-xs font-semibold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-full px-3 py-1 transition-colors"
                        data-testid={`auto-add-${card.id}`}
                      >
                        {card.addLabel}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Body Diagram: line-art silhouette with radial pain spots ─
interface PainSpot { area: string; cx: number; cy: number; view: "front" | "back" | "both"; }

// Maps body area names to their (cx, cy) spot positions on the front/back view
const FRONT_SPOTS: PainSpot[] = [
  { area: "Head", cx: 130, cy: 28, view: "front" },
  { area: "Neck", cx: 130, cy: 68, view: "front" },
  { area: "Left Shoulder", cx: 156, cy: 83, view: "front" },
  { area: "Right Shoulder", cx: 104, cy: 83, view: "front" },
  { area: "Chest", cx: 130, cy: 107, view: "front" },
  { area: "Abdomen", cx: 130, cy: 145, view: "front" },
  { area: "Left Upper Arm", cx: 162, cy: 113, view: "front" },
  { area: "Right Upper Arm", cx: 98, cy: 113, view: "front" },
  { area: "Left Elbow", cx: 162, cy: 137, view: "front" },
  { area: "Right Elbow", cx: 98, cy: 137, view: "front" },
  { area: "Left Forearm", cx: 162, cy: 162, view: "front" },
  { area: "Right Forearm", cx: 98, cy: 162, view: "front" },
  { area: "Left Wrist", cx: 158, cy: 185, view: "front" },
  { area: "Right Wrist", cx: 102, cy: 185, view: "front" },
  { area: "Left Hand", cx: 158, cy: 203, view: "front" },
  { area: "Right Hand", cx: 102, cy: 203, view: "front" },
  { area: "Left Hip", cx: 145, cy: 183, view: "front" },
  { area: "Right Hip", cx: 115, cy: 183, view: "front" },
  { area: "Left Thigh", cx: 143, cy: 228, view: "front" },
  { area: "Right Thigh", cx: 117, cy: 228, view: "front" },
  { area: "Left Knee", cx: 142, cy: 268, view: "front" },
  { area: "Right Knee", cx: 118, cy: 268, view: "front" },
  { area: "Left Shin/Calf", cx: 138, cy: 308, view: "front" },
  { area: "Right Shin/Calf", cx: 122, cy: 308, view: "front" },
  { area: "Left Ankle", cx: 136, cy: 344, view: "front" },
  { area: "Right Ankle", cx: 124, cy: 344, view: "front" },
  { area: "Left Foot", cx: 138, cy: 362, view: "front" },
  { area: "Right Foot", cx: 122, cy: 362, view: "front" },
];

const BACK_SPOTS: PainSpot[] = [
  { area: "Head", cx: 130, cy: 28, view: "back" },
  { area: "Neck (rear)", cx: 130, cy: 68, view: "back" },
  { area: "Left Rear Shoulder", cx: 156, cy: 83, view: "back" },
  { area: "Right Rear Shoulder", cx: 104, cy: 83, view: "back" },
  { area: "Upper Back", cx: 130, cy: 104, view: "back" },
  { area: "Mid Back", cx: 130, cy: 130, view: "back" },
  { area: "Lower Back", cx: 130, cy: 155, view: "back" },
  { area: "Left Tricep", cx: 162, cy: 113, view: "back" },
  { area: "Right Tricep", cx: 98, cy: 113, view: "back" },
  { area: "Left Forearm", cx: 162, cy: 162, view: "back" },
  { area: "Right Forearm", cx: 98, cy: 162, view: "back" },
  { area: "Glutes", cx: 130, cy: 190, view: "back" },
  { area: "Left Hamstring", cx: 143, cy: 235, view: "back" },
  { area: "Right Hamstring", cx: 117, cy: 235, view: "back" },
  { area: "Left Knee", cx: 140, cy: 274, view: "back" },
  { area: "Right Knee", cx: 120, cy: 274, view: "back" },
  { area: "Left Calf (rear)", cx: 133, cy: 310, view: "back" },
  { area: "Right Calf (rear)", cx: 127, cy: 310, view: "back" },
  { area: "Left Foot", cx: 138, cy: 352, view: "back" },
  { area: "Right Foot", cx: 122, cy: 352, view: "back" },
];

// Compute BMI-based body silhouette variant
function getBodyVariant(gender: string, bmi: number): "male-slim" | "male-avg" | "female-slim" | "female-avg" {
  const isFemale = gender === "Female";
  const isSlim = bmi < 25;
  if (isFemale) return isSlim ? "female-slim" : "female-avg";
  return isSlim ? "male-slim" : "male-avg";
}

// Clickable hotspot size
const HIT_R = 18;

function BodySilhouetteSVG({
  view,
  variant,
  selectedAreas,
  autoSuggestedAreas,
  onToggle,
}: {
  view: "front" | "back";
  variant: "male-slim" | "male-avg" | "female-slim" | "female-avg";
  selectedAreas: string[];
  autoSuggestedAreas: string[];
  onToggle: (area: string) => void;
}) {
  const spots = view === "front" ? FRONT_SPOTS : BACK_SPOTS;

  // Body silhouette path data per variant (front / back encoded together as one viewBox 0 0 260 420)
  const outlines: Record<string, { front: string; back: string }> = {
    "male-slim": {
      front: `M130,10 C119,10 110,18 109,30 C108,42 114,52 122,56 L122,65 C118,66 116,70 116,75
              L102,72 C94,70 87,75 87,82 C87,89 94,95 102,97 L100,140 L95,145 L90,185
              L88,200 L93,215 L93,200 L96,220 L98,278 L96,345 L98,370 L102,375 L110,375 L114,345 L116,280
              L118,260 L120,202 L122,202 L124,260 L126,280 L126,345 L130,375 L134,375 L138,345 L140,280
              L142,260 L140,202 L142,202 L144,260 L146,280 L146,345 L150,375 L158,375 L162,370 L164,345
              L162,278 L164,220 L167,200 L167,215 L172,200 L170,185 L165,145 L160,140 L158,97
              C166,95 173,89 173,82 C173,75 166,70 158,72 L144,75 C144,70 142,66 138,65 L138,56
              C146,52 152,42 151,30 C150,18 141,10 130,10 Z`,
      back: `M130,10 C119,10 110,18 109,30 C108,42 114,52 122,56 L122,65 C118,66 116,70 116,75
             L102,72 C94,70 87,75 87,82 C87,89 94,95 102,97 L100,140 L95,145 L90,185
             L88,200 L93,215 L93,200 L96,220 L98,278 L96,345 L98,370 L102,375 L110,375 L114,345 L116,280
             L118,260 L120,202 L122,202 L124,260 L126,280 L126,345 L130,375 L134,375 L138,345 L140,280
             L142,260 L140,202 L142,202 L144,260 L146,280 L146,345 L150,375 L158,375 L162,370 L164,345
             L162,278 L164,220 L167,200 L167,215 L172,200 L170,185 L165,145 L160,140 L158,97
             C166,95 173,89 173,82 C173,75 166,70 158,72 L144,75 C144,70 142,66 138,65 L138,56
             C146,52 152,42 151,30 C150,18 141,10 130,10 Z`,
    },
    "male-avg": {
      front: `M130,10 C118,10 108,19 107,31 C106,43 113,53 122,57 L122,66 C117,67 114,72 114,78
              L98,74 C89,72 81,77 81,85 C81,93 89,100 98,102 L96,145 L90,152 L84,195
              L82,212 L88,228 L88,212 L92,235 L94,285 L92,348 L94,372 L100,376 L110,376 L114,348 L116,288
              L119,264 L120,204 L122,204 L125,264 L126,288 L126,348 L130,376 L134,376 L134,348 L134,288
              L135,264 L138,204 L140,204 L141,264 L144,288 L144,348 L150,376 L160,376 L166,372 L168,348
              L166,285 L168,235 L172,212 L172,228 L178,212 L176,195 L170,152 L164,145 L162,102
              C171,100 179,93 179,85 C179,77 171,72 162,74 L146,78 C146,72 143,67 138,66 L138,57
              C147,53 154,43 153,31 C152,19 142,10 130,10 Z`,
      back: `M130,10 C118,10 108,19 107,31 C106,43 113,53 122,57 L122,66 C117,67 114,72 114,78
             L98,74 C89,72 81,77 81,85 C81,93 89,100 98,102 L96,145 L90,152 L84,195
             L82,212 L88,228 L88,212 L92,235 L94,285 L92,348 L94,372 L100,376 L110,376 L114,348 L116,288
             L119,264 L120,204 L122,204 L125,264 L126,288 L126,348 L130,376 L134,376 L134,348 L134,288
             L135,264 L138,204 L140,204 L141,264 L144,288 L144,348 L150,376 L160,376 L166,372 L168,348
             L166,285 L168,235 L172,212 L172,228 L178,212 L176,195 L170,152 L164,145 L162,102
             C171,100 179,93 179,85 C179,77 171,72 162,74 L146,78 C146,72 143,67 138,66 L138,57
             C147,53 154,43 153,31 C152,19 142,10 130,10 Z`,
    },
    "female-slim": {
      front: `M130,10 C119,10 111,18 110,29 C109,40 115,50 122,54 L122,63 C119,64 117,68 117,73
              L105,70 C97,68 91,73 91,80 C91,87 97,93 105,95 L103,136 L98,143 L95,180
              C94,188 95,196 98,200 C101,205 108,210 116,215 C121,218 126,220 130,220
              C134,220 139,218 144,215 C152,210 159,205 162,200 C165,196 166,188 165,180 L162,143 L157,136
              L155,95 C163,93 169,87 169,80 C169,73 163,68 155,70 L143,73 C143,68 141,64 138,63
              L138,54 C145,50 151,40 150,29 C149,18 141,10 130,10 Z
              M116,215 L114,252 L112,278 L110,345 L113,370 L118,374 L126,374 L128,348 L130,345
              L132,348 L134,374 L142,374 L147,370 L150,345 L148,278 L146,252 L144,215`,
      back: `M130,10 C119,10 111,18 110,29 C109,40 115,50 122,54 L122,63 C119,64 117,68 117,73
             L105,70 C97,68 91,73 91,80 C91,87 97,93 105,95 L103,136 L98,143 L95,180
             C94,188 95,196 98,200 C101,205 108,210 116,215 C121,218 126,220 130,220
             C134,220 139,218 144,215 C152,210 159,205 162,200 C165,196 166,188 165,180 L162,143 L157,136
             L155,95 C163,93 169,87 169,80 C169,73 163,68 155,70 L143,73 C143,68 141,64 138,63
             L138,54 C145,50 151,40 150,29 C149,18 141,10 130,10 Z
             M116,215 L114,252 L112,278 L110,345 L113,370 L118,374 L126,374 L128,348 L130,345
             L132,348 L134,374 L142,374 L147,370 L150,345 L148,278 L146,252 L144,215`,
    },
    "female-avg": {
      front: `M130,10 C118,10 109,19 108,30 C107,42 114,52 122,56 L122,65 C118,66 115,71 115,77
              L100,73 C91,71 84,77 84,84 C84,91 91,98 100,100 L98,140 L92,148 L87,188
              C85,198 87,208 91,214 C95,220 105,228 118,234 C123,237 127,240 130,240
              C133,240 137,237 142,234 C155,228 165,220 169,214 C173,208 175,198 173,188
              L168,148 L162,140 L160,100 C169,98 176,91 176,84 C176,77 169,71 160,73
              L145,77 C145,71 142,66 138,65 L138,56 C146,52 153,42 152,30 C151,19 142,10 130,10 Z
              M118,234 L116,265 L114,290 L112,350 L115,372 L122,376 L128,376 L130,350
              L132,376 L138,376 L145,372 L148,350 L146,290 L144,265 L142,234`,
      back: `M130,10 C118,10 109,19 108,30 C107,42 114,52 122,56 L122,65 C118,66 115,71 115,77
             L100,73 C91,71 84,77 84,84 C84,91 91,98 100,100 L98,140 L92,148 L87,188
             C85,198 87,208 91,214 C95,220 105,228 118,234 C123,237 127,240 130,240
             C133,240 137,237 142,234 C155,228 165,220 169,214 C173,208 175,198 173,188
             L168,148 L162,140 L160,100 C169,98 176,91 176,84 C176,77 169,71 160,73
             L145,77 C145,71 142,66 138,65 L138,56 C146,52 153,42 152,30 C151,19 142,10 130,10 Z
             M118,234 L116,265 L114,290 L112,350 L115,372 L122,376 L128,376 L130,350
             L132,376 L138,376 L145,372 L148,350 L146,290 L144,265 L142,234`,
    },
  };

  const pathData = outlines[variant][view];

  return (
    <svg viewBox="0 0 260 400" className="w-[200px] h-[340px]" aria-label={`Human body ${view} view`}>
      <defs>
        <radialGradient id="painGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="autoGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes painPulse {
            0%, 100% { r: 10; opacity: 0.9; }
            50% { r: 14; opacity: 0.6; }
          }
          .pain-spot { animation: painPulse 1.8s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Body silhouette -- line art */}
      <path
        d={pathData}
        stroke="#1A1A1A"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Pain spots */}
      {spots.map(spot => {
        const selected = selectedAreas.includes(spot.area);
        const auto = autoSuggestedAreas.includes(spot.area);
        return (
          <g key={spot.area}>
            {/* Invisible hit target */}
            <circle
              cx={spot.cx}
              cy={spot.cy}
              r={HIT_R}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onToggle(spot.area)}
              data-testid={`spot-${spot.area.toLowerCase().replace(/[\s/()]+/g, "-")}`}
            />
            {/* Pain indicator */}
            {(selected || auto) && (
              <circle
                cx={spot.cx}
                cy={spot.cy}
                r={10}
                fill={selected ? "url(#painGradient)" : "url(#autoGradient)"}
                className={selected ? "pain-spot" : ""}
              />
            )}
          </g>
        );
      })}
    </svg>
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

  const bmi2 = useMemo(() => {
    if (!data.heightCm || !data.weightKg) return 22;
    return data.weightKg / Math.pow(data.heightCm / 100, 2);
  }, [data.heightCm, data.weightKg]);
  const bodyVariant = getBodyVariant(data.gender, bmi2);

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

      {/* Modern line-art body diagram */}
      <div className="flex justify-center mb-4" data-testid="body-diagram-container">
        <BodySilhouetteSVG
          view={bodyView}
          variant={bodyVariant}
          selectedAreas={data.painAreas}
          autoSuggestedAreas={data.autoSuggestedPain}
          onToggle={togglePain}
        />
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
          data.painAreas.includes("None")
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

        {/* Gym / Trainer Access */}
        <div data-testid="gym-access-section">
          <label className="vitallity-label">Do you currently have a gym membership or personal trainer?</label>
          <ChipGroup
            options={[
              { label: "No gym access" },
              { label: "Gym membership" },
              { label: "Personal trainer" },
              { label: "Online coach" },
            ]}
            selected={data.gymAccess ? [data.gymAccess] : []}
            onChange={vals => update("gymAccess", vals[0] || "")}
          />
        </div>

        {/* Trainer frequency (conditional) */}
        {(data.gymAccess === "Personal trainer" || data.gymAccess === "Online coach") && (
          <div data-testid="trainer-frequency-section" className="animate-fade-in-up">
            <label className="vitallity-label">How often do you work with them?</label>
            <ChipGroup
              options={[
                { label: "1x/week" },
                { label: "2-3x/week" },
                { label: "4+/week" },
              ]}
              selected={data.trainerFrequency ? [data.trainerFrequency] : []}
              onChange={vals => update("trainerFrequency", vals[0] || "")}
            />
          </div>
        )}
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

// ─── Voice Input Hook ────────────────────────────────────
function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    setError(null);
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        setError("Voice input not supported in this browser");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setError("Voice input failed. Please try again.");
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Voice input not supported in this browser");
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, error, start, stop };
}

// ─── VoiceButton: mic button with pulsing indicator ───────────
function VoiceButton({ onResult }: { onResult: (t: string) => void }) {
  const { isListening, error, start, stop } = useVoiceInput(onResult);
  const [showErr, setShowErr] = useState(false);

  const toggle = () => {
    if (isListening) { stop(); return; }
    start();
  };

  useEffect(() => {
    if (error) { setShowErr(true); const t = setTimeout(() => setShowErr(false), 3000); return () => clearTimeout(t); }
  }, [error]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
          isListening ? "bg-red-500 text-white shadow-md" : "bg-muted text-gray-600 hover:bg-muted/80"
        }`}
        title={isListening ? "Stop recording" : "Voice input"}
        data-testid="voice-btn"
      >
        {isListening ? (
          <div className="relative">
            <Mic className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-300 rounded-full animate-ping" />
          </div>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      {showErr && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-[10px] p-2 shadow-lg z-10">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Screen 7: What Worked / What Didn't ─────────────────────
function Screen7({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const isExerciser = data.exerciseComfort !== "No exercise currently";
  const hasConditions = data.healthConditions.filter(c => c.condition !== "None currently").length > 0;

  const workedChips: string[] = [
    ...(isExerciser ? ["Regular walking", "Gym routine", "Yoga practice"] : []),
    ...(hasConditions ? ["Following doctor's diet plan", "Taking medications regularly"] : []),
    "Meal planning", "Tracking calories", "Accountability partner", "Fasting", "Low carb diet",
  ];

  const appendTo = (field: keyof OnboardingData, value: string) => {
    const current = (data[field] as string) || "";
    update(field, current ? `${current}, ${value}` : value);
  };

  return (
    <div data-testid="screen-7" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold mb-1">What worked vs. what didn't</h2>
      <p className="text-gray-500 text-sm mb-8">Reflect honestly -- understanding patterns helps us plan around them</p>

      <div className="space-y-8">
        {/* Section 1: What worked */}
        <div>
          <label className="vitallity-label">What has worked for you before?</label>
          <div className="flex gap-2">
            <textarea
              value={data.pastAttemptsWorked}
              onChange={e => update("pastAttemptsWorked", e.target.value)}
              rows={4}
              placeholder="e.g., morning walks, meal prep, yoga..."
              className="vitallity-input resize-none flex-1"
              data-testid="input-what-worked"
            />
            <VoiceButton onResult={t => appendTo("pastAttemptsWorked", t)} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {workedChips.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => appendTo("pastAttemptsWorked", chip)}
                className="inline-flex items-center gap-1 bg-primary/8 text-primary rounded-full px-3 py-1 text-xs font-medium hover:bg-primary/15 transition-colors"
                data-testid={`worked-chip-${chip.toLowerCase().replace(/[\s']+/g, "-")}`}
              >
                <Plus className="w-3 h-3" />{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: What didn't work */}
        <div>
          <label className="vitallity-label">What hasn't worked or what stopped you?</label>
          <div className="flex gap-2">
            <textarea
              value={data.pastAttemptsDidntWork}
              onChange={e => update("pastAttemptsDidntWork", e.target.value)}
              rows={4}
              placeholder="e.g., time constraints, injuries, motivation..."
              className="vitallity-input resize-none flex-1"
              data-testid="input-what-didnt-work"
            />
            <VoiceButton onResult={t => appendTo("pastAttemptsDidntWork", t)} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Lost motivation", "Got injured", "Too busy", "Plateaued", "Too restrictive", "No accountability", "Stress eating", "Travel disrupted routine"].map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => appendTo("pastAttemptsDidntWork", chip)}
                className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 rounded-full px-3 py-1 text-xs font-medium hover:bg-rose-100 transition-colors"
                data-testid={`didnt-work-chip-${chip.toLowerCase().replace(/[\s']+/g, "-")}`}
              >
                <Plus className="w-3 h-3" />{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Starting barrier */}
        <div>
          <label className="vitallity-label">What stops you from starting today?</label>
          <div className="flex gap-2">
            <textarea
              value={data.startingBarrier}
              onChange={e => update("startingBarrier", e.target.value)}
              rows={3}
              placeholder="Be honest -- understanding barriers helps us plan around them"
              className="vitallity-input resize-none flex-1"
              data-testid="input-starting-barrier"
            />
            <VoiceButton onResult={t => appendTo("startingBarrier", t)} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Work schedule", "Physical pain", "Low motivation", "Don't know where to start", "Family commitments", "Financial constraints", "Mental health", "Nothing -- I'm ready"].map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => appendTo("startingBarrier", chip)}
                className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 rounded-full px-3 py-1 text-xs font-medium hover:bg-amber-100 transition-colors"
                data-testid={`barrier-chip-${chip.toLowerCase().replace(/[\s'--]+/g, "-")}`}
              >
                <Plus className="w-3 h-3" />{chip}
              </button>
            ))}
          </div>

          {/* Barrier timeframe follow-up */}
          {data.startingBarrier.length > 3 && !data.startingBarrier.toLowerCase().includes("ready") && !data.startingBarrier.toLowerCase().includes("nothing") && (
            <div className="mt-4 animate-fade-in-up" data-testid="barrier-timeframe-section">
              <label className="vitallity-label">When do you expect this barrier to ease?</label>
              <ChipGroup
                options={[
                  { label: "Within a week" },
                  { label: "1-2 weeks" },
                  { label: "1 month" },
                  { label: "Not sure" },
                  { label: "It's ongoing" },
                ]}
                selected={data.barrierTimeframe ? [data.barrierTimeframe] : []}
                onChange={vals => update("barrierTimeframe", vals[0] || "")}
              />
            </div>
          )}
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

  const sections: { key: keyof HealthSummaryData; label: string; icon: React.ReactNode; isList: boolean; borderColor: string; bgColor: string }[] = [
    { key: "observations", label: "Key Observations", icon: <Eye className="w-4 h-4" />, isList: true, borderColor: "border-l-amber-400", bgColor: "" },
    { key: "healthConsiderations", label: "Health Considerations", icon: <Shield className="w-4 h-4" />, isList: true, borderColor: "border-l-red-400", bgColor: "" },
    { key: "strengths", label: "Your Strengths", icon: <Star className="w-4 h-4" />, isList: true, borderColor: "border-l-green-400", bgColor: "" },
    { key: "focusAreas", label: "Areas for Focus", icon: <Target className="w-4 h-4" />, isList: true, borderColor: "border-l-primary", bgColor: "" },
    { key: "recommendedApproach", label: "Recommended Approach", icon: <Compass className="w-4 h-4" />, isList: false, borderColor: "border-l-blue-400", bgColor: "" },
  ];

  // BMI gauge data for profile snapshot
  const bmiVal = data.heightCm && data.weightKg ? data.weightKg / Math.pow(data.heightCm / 100, 2) : 0;
  const bmiNeedle = Math.min(Math.max((bmiVal - 15) / (45 - 15), 0), 1); // 0=left, 1=right on 15-45 range
  // SVG semicircle: 180 degrees, 100px radius centered at (110, 90)
  const needleAngle = -180 + bmiNeedle * 180; // degrees from left
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleX = 110 + 60 * Math.cos(needleRad);
  const needleY = 90 + 60 * Math.sin(needleRad);

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

  const bmiCategory8 = bmiVal < 18.5 ? "Underweight" : bmiVal < 25 ? "Normal" : bmiVal < 30 ? "Overweight" : bmiVal < 35 ? "Obese" : "Severely Obese";
  const bmiColorStyle = bmiVal < 25 ? "#16a34a" : bmiVal < 30 ? "#f59e0b" : bmiVal < 35 ? "#f97316" : "#ef4444";

  return (
    <div data-testid="screen-8-ai-summary" className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Your Health Profile</h2>
      <p className="text-gray-500 text-sm mb-6">A snapshot based on everything you've shared</p>

      {/* Enhanced Profile Snapshot card with BMI gauge */}
      <div
        className="rounded-[20px] p-5 mb-5 border border-primary/20"
        style={{ background: "linear-gradient(135deg, rgba(26,58,42,0.08) 0%, rgba(26,58,42,0.02) 100%)" }}
        data-testid="profile-snapshot-card"
      >
        <p className="text-[11px] uppercase tracking-[0.8px] text-primary font-semibold mb-3">Profile Snapshot</p>

        {bmiVal > 0 && (
          <div className="flex items-start gap-4 mb-4">
            {/* BMI Speedometer gauge */}
            <div className="shrink-0" data-testid="bmi-gauge">
              <svg viewBox="0 0 220 110" width="130" height="65" aria-label="BMI gauge">
                {/* Green zone: 15-25 (0-37deg of 180) */}
                <path d="M 20 90 A 90 90 0 0 1 110 0" fill="none" stroke="#16a34a" strokeWidth="10" />
                {/* Yellow zone: 25-30 */}
                <path d="M 110 0 A 90 90 0 0 1 164 22" fill="none" stroke="#f59e0b" strokeWidth="10" />
                {/* Orange zone: 30-35 */}
                <path d="M 164 22 A 90 90 0 0 1 195 68" fill="none" stroke="#f97316" strokeWidth="10" />
                {/* Red zone: 35-45 */}
                <path d="M 195 68 A 90 90 0 0 1 200 90" fill="none" stroke="#ef4444" strokeWidth="10" />
                {/* Needle */}
                <line
                  x1="110" y1="90"
                  x2={110 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
                  y2={90 + 70 * Math.sin((needleAngle * Math.PI) / 180)}
                  stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"
                />
                <circle cx="110" cy="90" r="5" fill="#1A1A1A" />
                {/* BMI value */}
                <text x="110" y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill={bmiColorStyle}>{bmiVal.toFixed(1)}</text>
              </svg>
              <p className="text-[10px] text-center text-gray-500 mt-0.5">{bmiCategory8}</p>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { label: "Age", value: data.age ? `${data.age} yrs` : "--" },
                { label: "Height", value: data.heightCm ? `${data.heightCm} cm` : "--" },
                { label: "Weight", value: data.weightKg ? `${data.weightKg} kg` : "--" },
                { label: "Conditions", value: `${data.healthConditions.filter(c => c.condition !== "None currently").length}` },
              ].map(stat => (
                <div key={stat.label} className="bg-white/50 rounded-[10px] p-2 text-center">
                  <div className="text-xs font-bold text-foreground">{stat.value}</div>
                  <div className="text-[10px] text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-foreground leading-relaxed">{healthSummary.profileSnapshot}</p>
      </div>

      {/* Collapsible sections with colored left borders, stagger animation */}
      <div className="space-y-2.5">
        {sections.map(({ key, label, icon, isList, borderColor }, idx) => {
          const value = healthSummary[key];
          const items = isList ? (value as string[]) : [];
          const text = !isList ? (value as string) : "";
          if ((isList && items.length === 0) || (!isList && !text)) return null;
          const isOpen = openSections[key] ?? false;

          return (
            <div
              key={key}
              className={`vitallity-card p-0 overflow-hidden border-l-4 ${borderColor}`}
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "both" }}
              data-testid={`section-${key}`}
            >
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

      {/* Clarifying Questions -- chat-bubble style */}
      {hasClarifyingQuestions && (
        <div className="mt-5" data-testid="clarifying-questions">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Clarifying Questions</p>
          <div className="space-y-4">
            {healthSummary.clarifyingQuestions.map((q, i) => (
              <div key={i} className="space-y-2">
                {/* AI question bubble */}
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-[14px] rounded-tl-sm px-4 py-2.5 text-sm text-foreground max-w-[85%]">
                    {q}
                  </div>
                </div>
                {/* User answer */}
                <div className="flex items-start gap-2 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={clarifyAnswers[i] || ""}
                    onChange={e => {
                      const next = [...clarifyAnswers];
                      next[i] = e.target.value;
                      setClarifyAnswers(next);
                    }}
                    placeholder="Your answer..."
                    className="vitallity-input flex-1 text-sm"
                    data-testid={`clarify-answer-${i}`}
                  />
                </div>
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

  // TDEE-based reality check
  const [keepTimeline, setKeepTimeline] = useState(false);
  // Reset dismiss when timeline or target changes
  useEffect(() => { setKeepTimeline(false); }, [data.weightTimeline, data.targetWeightKg]);

  const wlp = showWeightLoss && data.targetWeightKg > 0 && data.weightTimeline
    ? calculateWeightLossParams(data)
    : null;
  const showRealityCheck = !!wlp && !wlp.isRealistic && !keepTimeline;
  const requiredRatePerWeek = wlp && wlp.timelineWeeks > 0
    ? Math.round(wlp.totalKg / wlp.timelineWeeks * 100) / 100
    : 0;

  const conditionNames = data.healthConditions.map(c => c.condition);
  const hasCondition = (name: string) => conditionNames.includes(name);

  // Derive AI-suggested goals from focusAreas
  const aiSuggestedGoals = healthSummary?.focusAreas?.slice(0, 3) || [];

  // AI-driven weight loss suggestion
  const tenPctTargetKg = bmi >= 25 ? Math.round(data.weightKg * 0.9 * 10) / 10 : null;
  const kgToLose = tenPctTargetKg ? Math.round((data.weightKg - tenPctTargetKg) * 10) / 10 : 0;
  const weeksAtSafeRate = kgToLose > 0 ? Math.ceil(kgToLose / 0.625) : 0; // 0.625 kg/week midpoint
  const monthsNeeded = Math.round(weeksAtSafeRate / 4.3);

  // Per-goal AI suggestions
  const goalAISuggestions: Record<string, string> = {
    "Build Strength": "Start with 2 sessions/week, progressing to 3 by month 2",
    "Better Sleep": `Target: consistent 7+ hours within 3 weeks${data.sleepHours ? " (current: " + data.sleepHours + ")" : ""}`,
    "Reduce Stress": `Target: reduce self-rated stress from ${
      data.stressLevel === "Very High" ? "10" : data.stressLevel === "High" ? "7" : data.stressLevel === "Moderate" ? "5" : "3"
    } to ${
      data.stressLevel === "Very High" ? "7" : data.stressLevel === "High" ? "5" : data.stressLevel === "Moderate" ? "3" : "2"
    } within 4 weeks`,
    "More Energy": "Target: self-rated energy above 6/10 within 2 weeks through sleep + hydration",
    "Manage Pain": "Aim to reduce pain intensity by 2 points in 4 weeks through targeted movement",
  };

  const [showMoreGoals, setShowMoreGoals] = useState(false);
  const primaryGoals = ["Lose Weight", "Build Strength", "Better Sleep", "Reduce Stress", "More Energy", "Manage Pain"];
  const moreGoals = filteredGoals.filter(g => !primaryGoals.includes(g.label));

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

        {/* AI-driven weight loss suggestion */}
        {bmi >= 25 && tenPctTargetKg && data.goals.includes("Lose Weight") && (
          <div className="bg-primary-faded border border-primary/20 rounded-[16px] p-4" data-testid="ai-weight-suggestion">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-primary">AI Suggestion</p>
            </div>
            <p className="text-sm text-foreground mb-1">
              We suggest going from <strong>{data.weightKg}kg</strong> to <strong>{tenPctTargetKg}kg</strong> over <strong>{monthsNeeded} months</strong>
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              This represents a 10% reduction -- research shows this significantly improves diabetes markers and reduces cardiovascular risk
            </p>
            <button
              type="button"
              onClick={() => {
                update("targetWeightKg", tenPctTargetKg);
                update("weightTimeline", monthsNeeded <= 3 ? "3 months" : monthsNeeded <= 6 ? "6 months" : "1 year");
              }}
              className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1 transition-colors"
              data-testid="accept-ai-weight-suggestion"
            >
              Accept this target
            </button>
          </div>
        )}

        {/* Primary goal selection with per-goal AI rationale */}
        <div>
          <label className="vitallity-label">Select Your Goals</label>
          <div className="space-y-2">
            {filteredGoals.filter(g => primaryGoals.includes(g.label)).map(goal => {
              const isGoalSelected = data.goals.includes(goal.label);
              const suggestion = goalAISuggestions[goal.label];
              return (
                <button
                  key={goal.label}
                  type="button"
                  onClick={() => handleGoalChange(
                    isGoalSelected
                      ? data.goals.filter(g => g !== goal.label)
                      : [...data.goals, goal.label]
                  )}
                  className={`w-full text-left rounded-[14px] p-3.5 border transition-all ${
                    isGoalSelected ? "bg-primary/8 border-primary/30" : "bg-card border-gray-200 hover:border-primary/20"
                  }`}
                  data-testid={`goal-${goal.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isGoalSelected ? "border-primary bg-primary" : "border-gray-300"
                    }`}>
                      {isGoalSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{goal.label}</p>
                      <p className="text-xs text-gray-500">{goal.description}</p>
                      {isGoalSelected && suggestion && (
                        <p className="text-xs text-primary mt-1 font-medium">{suggestion}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* More goals expandable */}
          {moreGoals.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowMoreGoals(v => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                data-testid="show-more-goals"
              >
                {showMoreGoals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showMoreGoals ? "Hide" : "More goals"}
              </button>
              {showMoreGoals && (
                <div className="mt-2">
                  <ChipGroup
                    options={moreGoals}
                    selected={data.goals}
                    onChange={handleGoalChange}
                    multiple
                  />
                </div>
              )}
            </div>
          )}
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

            {showRealityCheck && wlp && (
              <div className="bg-gold-faded rounded-[14px] p-4 border border-gold/20 space-y-3" data-testid="rate-warning">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gold">
                      Losing {wlp.totalKg.toFixed(1)}kg in {data.weightTimeline} would require {requiredRatePerWeek}kg/week.
                    </p>
                    <p className="text-xs text-gold leading-relaxed">
                      The recommended safe rate for your profile is {wlp.safeKgPerWeek}kg/week ({wlp.maxDailyDeficit} kcal/day deficit from your estimated TDEE of {wlp.tdee} kcal).
                    </p>
                    <p className="text-xs text-gold leading-relaxed">
                      At a safe pace, you'd reach {data.targetWeightKg}kg in approximately {wlp.suggestedTimeline}.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => update("weightTimeline", wlp.suggestedTimeline)}
                    className="vitallity-btn-primary text-xs py-1.5 px-3"
                    data-testid="adjust-timeline-btn"
                  >
                    Adjust to {wlp.suggestedTimeline}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeepTimeline(true)}
                    className="vitallity-btn-ghost text-xs py-1.5 px-3"
                    data-testid="keep-timeline-btn"
                  >
                    Keep my timeline
                  </button>
                </div>
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

// ─── TDEE & Weight Loss Parameter Calculators ────────────────────
function calculateTDEE(weightKg: number, heightCm: number, age: number, gender: string, activityLevel: string): number {
  // Mifflin-St Jeor BMR
  const bmr = gender === 'Female'
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const mult = multipliers[activityLevel] || 1.375;
  return Math.round(bmr * mult);
}

function calculateWeightLossParams(data: OnboardingData) {
  const tdee = calculateTDEE(
    data.weightKg,
    data.heightCm || 170,
    parseInt(data.age) || 30,
    data.gender,
    'light'
  );
  const heightM = (data.heightCm || 170) / 100;
  const bmi = data.weightKg / (heightM * heightM);
  const totalKg = Math.max(0, data.weightKg - data.targetWeightKg);

  // Safe rate based on BMI
  const maxKgPerWeek = bmi > 35 ? 1.0 : bmi > 30 ? 0.85 : 0.65;
  // Each kg of fat ~7700 kcal
  const maxDailyDeficit = Math.min(Math.round(maxKgPerWeek * 7700 / 7), 750);
  const safeKgPerWeek = Math.round(maxDailyDeficit * 7 / 7700 * 100) / 100;

  const timelineWeeks =
    data.weightTimeline === '3 months' ? 12
    : data.weightTimeline === '6 months' ? 24
    : data.weightTimeline === '1 year' ? 52
    : 12;

  const realisticWeeks = safeKgPerWeek > 0 ? Math.ceil(totalKg / safeKgPerWeek) : 999;
  // 10% tolerance
  const isRealistic = totalKg === 0 || timelineWeeks >= realisticWeeks * 0.9;

  const achievableKg = Math.round(safeKgPerWeek * timelineWeeks * 10) / 10;
  const expectedEndWeight = Math.round((data.weightKg - Math.min(achievableKg, totalKg)) * 10) / 10;

  let suggestedTimeline = '';
  if (realisticWeeks <= 14) suggestedTimeline = '3 months';
  else if (realisticWeeks <= 28) suggestedTimeline = '6 months';
  else if (realisticWeeks <= 56) suggestedTimeline = '1 year';
  else suggestedTimeline = `${Math.ceil(realisticWeeks / 52)} years`;

  return {
    tdee,
    bmi,
    totalKg,
    safeKgPerWeek,
    maxDailyDeficit,
    timelineWeeks,
    realisticWeeks,
    isRealistic,
    achievableKg,
    expectedEndWeight,
    suggestedTimeline,
  };
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
    const wlp = calculateWeightLossParams(data);
    const { totalKg, timelineWeeks, safeKgPerWeek, maxDailyDeficit, tdee, isRealistic, expectedEndWeight, suggestedTimeline } = wlp;
    const targetDisplay = data.targetWeightKg > 0 ? `${data.targetWeightKg}kg` : "your target weight";
    const weeksLabel = data.weightTimeline || "12 weeks";
    // Expected weight at end of each phase
    const expAfterPhase1 = Math.round((data.weightKg - safeKgPerWeek * 2) * 10) / 10;
    const expAfterPhase2 = Math.round((data.weightKg - safeKgPerWeek * 6) * 10) / 10;
    const expAfterPhase3 = Math.round((data.weightKg - safeKgPerWeek * 10) * 10) / 10;
    const expAfterFinal = Math.round((data.weightKg - Math.min(safeKgPerWeek * timelineWeeks, totalKg)) * 10) / 10;

    // Title and target depend on whether goal is realistic
    const milestoneTitle = totalKg === 0
      ? "Healthy weight journey"
      : isRealistic
        ? `Lose ${totalKg.toFixed(1)}kg over ${weeksLabel}`
        : `Work toward ${targetDisplay}`;
    const milestoneTarget = isRealistic
      ? `Reach ${targetDisplay} at ~${safeKgPerWeek}kg/week`
      : `Safe pace: ~${safeKgPerWeek}kg/week -- Expected: ~${expectedEndWeight}kg in ${weeksLabel} (realistic in ${suggestedTimeline})`;

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
            description: `Track everything you eat (no changes yet) and drink 2.5L water daily (Expected: ~${expAfterPhase1}kg)`,
            why: "Awareness before action -- tracking alone typically reduces intake by 10-15% without any restriction",
          },
          {
            weekLabel: "Week 3-6",
            description: `Replace one meal a day with a high-protein option, add ${cardioSuggestion} 3x/week for 20 min (Expected: ~${expAfterPhase2}kg)`,
            why: `A single daily swap builds the habit loop without overwhelming you. Create a ${maxDailyDeficit} kcal daily deficit from your estimated ${tdee} kcal TDEE`,
          },
          {
            weekLabel: "Week 7-10",
            description: `Reduce refined carbs by a third, increase ${cardioSuggestion} to 4x/week, add 2 strength sessions (Expected: ~${expAfterPhase3}kg)`,
            why: "Combining cardio with strength training accelerates fat loss and preserves muscle",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: `Maintain deficit, weigh in weekly, plan for social events and travel ahead of time (Expected: ~${expAfterFinal}kg)`,
            why: "Most weight loss fails at plateau -- having a plan for life's interruptions is the difference",
          },
        ];
      } else if (highConsistency) {
        steps = [
          {
            weekLabel: "Week 1-2",
            description: `Log all meals, set a daily calorie target, start ${cardioSuggestion} 4x/week (Expected: ~${expAfterPhase1}kg)`,
            why: "Starting with structure leverages your existing discipline immediately",
          },
          {
            weekLabel: "Week 3-6",
            description: `Create a ${maxDailyDeficit} kcal daily deficit from your estimated ${tdee} kcal TDEE, 3x strength training + 3x cardio (Expected: ~${expAfterPhase2}kg)`,
            why: `A ${maxDailyDeficit} kcal deficit produces roughly ${safeKgPerWeek}kg/week loss -- proven and sustainable`,
          },
          {
            weekLabel: "Week 7-10",
            description: `Introduce progressive overload in strength sessions, track weekly body measurements (Expected: ~${expAfterPhase3}kg)`,
            why: "Measuring more than the scale shows true progress even on plateau weeks",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: `Diet break week at maintenance, then final push to ${targetDisplay} (Expected: ~${expAfterFinal}kg)`,
            why: "A planned diet break resets leptin levels and prevents metabolic adaptation",
          },
        ];
      } else {
        steps = [
          {
            weekLabel: "Week 1-2",
            description: `Track meals 5/7 days, cut sugary drinks, add a 20-min morning walk daily (Expected: ~${expAfterPhase1}kg)`,
            why: "Tracking and liquid calories are the two highest-impact low-effort changes",
          },
          {
            weekLabel: "Week 3-6",
            description: `Reduce portion size by 20%, eat protein-first at meals, ${cardioSuggestion} 3x/week (Expected: ~${expAfterPhase2}kg)`,
            why: `Create a ${maxDailyDeficit} kcal daily deficit from your estimated ${tdee} kcal TDEE. Protein keeps you full longer, reducing total intake without counting every calorie`,
          },
          {
            weekLabel: "Week 7-10",
            description: `Add 2x strength sessions per week, track weight every Wednesday morning (Expected: ~${expAfterPhase3}kg)`,
            why: "Consistent measurement day avoids misleading day-to-day fluctuations",
          },
          {
            weekLabel: `Week 11-${timelineWeeks}`,
            description: `Focus on maintenance patterns -- meal prep, social eating strategies, sleep 7+ hrs (Expected: ~${expAfterFinal}kg)`,
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
          description: `Track all meals, swap sugary drinks for water, add 15-min ${cardioSuggestion} daily (Expected: ~${expAfterPhase1}kg)`,
          why: "Quick wins in week 1-2 set the psychological tone for the rest of the journey",
        },
        {
          weekLabel: `Week 3-${timelineWeeks}`,
          description: `Create a ${maxDailyDeficit} kcal daily deficit from your estimated ${tdee} kcal TDEE, ${cardioSuggestion} 4x/week, strength 2x/week (Expected: ~${expAfterFinal}kg)`,
          why: `At ~${safeKgPerWeek}kg/week you can expect to reach approximately ${expAfterFinal}kg by your target date`,
        },
      ];
    }

    milestones.push({
      title: milestoneTitle,
      target: milestoneTarget,
      timeframe: data.weightTimeline || "3 months",
      phases,
      steps,
      trackingMetric: "weight_kg",
    });
  }

  // ── Build Strength ────────────────────────────────────────────
  if (data.goals.includes("Build Strength")) {
    // Baseline: check exercise history, conditions, activities
    const isSedentary =
      data.exerciseComfort === "No exercise currently" ||
      data.exerciseHistoryOption === "Never really exercised";
    const isCurrentlyActive =
      data.exerciseComfort === "Regular routine" ||
      data.exerciseComfort === "Very committed";
    const prefersGym = data.activities.some((e: string) =>
      e.toLowerCase().includes("gym") || e.toLowerCase().includes("weight")
    );
    const hasKnee = data.painAreas.some((p: string) =>
      p.toLowerCase().includes("knee")
    );
    const hasBack = data.painAreas.some((p: string) =>
      p.toLowerCase().includes("back")
    );
    const hasShoulder = data.painAreas.some((p: string) =>
      p.toLowerCase().includes("shoulder")
    );
    const condNamesStr = conditionNames.join(" ");
    const hasKneeCondition =
      condNamesStr.includes("knee") || condNamesStr.includes("acl");
    const hasBackCondition =
      condNamesStr.includes("back") || condNamesStr.includes("sciatica") ||
      condNamesStr.includes("spondylosis") || condNamesStr.includes("herniated");

    // Baseline descriptor
    const baselineDesc = isSedentary
      ? "Baseline: untrained -- start from zero"
      : isCurrentlyActive
      ? "Baseline: already active -- ready for structured program"
      : "Baseline: some movement history -- ready for structured loading";

    // Sessions target: research shows 24 sessions over 12 weeks is threshold for adaptation
    const targetSessions = highConsistency && isCurrentlyActive ? 36 : 24;

    // Reality check for joint issues
    const jointNote =
      hasKnee || hasKneeCondition
        ? "Avoid deep squats and heavy leg press. Focus on wall sits, straight-leg raises, and terminal knee extensions."
        : hasBack || hasBackCondition
        ? "Avoid heavy deadlifts and spinal compression. Prioritize horizontal pulling, planks, and hip-hinge with light load."
        : hasShoulder
        ? "Avoid overhead pressing until shoulder is assessed. Focus on rows, band pull-aparts, and external rotations."
        : "";

    let strengthSteps: { weekLabel: string; description: string; why: string }[];

    if (lowConsistency) {
      strengthSteps = [
        {
          weekLabel: "Week 1-2",
          description: `Observe: walk into a gym or clear space at home twice this week -- no workout required. Simply show up. (${baselineDesc})`,
          why: "This is intentionally easy -- building the habit of showing up matters more than intensity right now. Consistency cues are set before exercise cues.",
        },
        {
          weekLabel: "Week 3-6",
          description: `2x/week full-body bodyweight: 3 sets of squats, push-ups, and glute bridges. 20 min sessions.${jointNote ? " Note: " + jointNote : ""} (Target by end: all exercises with correct form)`,
          why: "Bodyweight mastery before adding load prevents injury and builds proprioception. Untrained adults gain 20-40% strength in first 8-12 weeks (Schoenfeld et al., 2017).",
        },
        {
          weekLabel: "Week 7-10",
          description: `3x/week, add ${prefersGym ? "barbell or dumbbell compound lifts (squat, row, press)" : "resistance bands or a weighted backpack"}, increase load when all reps are clean. (Expected progress: 20% load increase from Week 3 starting weight)`,
          why: "Progressive overload -- adding 2.5-5% load each week -- is the single mechanism driving strength gains.",
        },
        {
          weekLabel: "Week 11-12",
          description: `Deload week at 50% intensity, then run a benchmark test: push-ups to failure, plank hold time, or ${prefersGym ? "1RM estimate" : "max-rep band row"}. Record scores. (Goal: maintain ${targetSessions} sessions for 14+ days)`,
          why: "Deload weeks prevent overtraining and let the nervous system consolidate strength gains. Benchmarks make invisible progress visible.",
        },
      ];
    } else if (highConsistency && isCurrentlyActive) {
      strengthSteps = [
        {
          weekLabel: "Week 1-2",
          description: `Start structured program immediately: ${prefersGym ? "push-pull-legs split 3x/week, compound lifts with progressive overload log" : "full-body 3x/week with resistance bands + bodyweight, track reps and weights"}. (${baselineDesc})`,
          why: "Starting with structure leverages your existing discipline immediately. Research confirms 36 sessions over 12 weeks produce meaningful hypertrophy in trained individuals.",
        },
        {
          weekLabel: "Week 3-6",
          description: `Increase frequency to 4x/week. Add isolation work (bicep curls, lateral raises, calf raises). Increase load by 2.5kg when you complete all reps cleanly for 2 consecutive sessions.${jointNote ? " Note: " + jointNote : ""} (Target by end: 20% load increase from Week 1)`,
          why: "Frequency is the primary driver of hypertrophy in trained individuals -- more stimulus per week means more adaptation.",
        },
        {
          weekLabel: "Week 7-10",
          description: `Introduce periodization: 3 weeks of progressive load, 1 week deload. Track weekly measurements (chest, waist, arms). (Expected progress: 1-1.5kg lean mass gain -- Schoenfeld et al., 2017)`,
          why: "Periodization prevents plateaus by cycling volume and intensity, keeping adaptation stimulus high.",
        },
        {
          weekLabel: "Week 11-12",
          description: `Benchmark week: test push-ups to failure, plank hold, and ${prefersGym ? "estimated 1RM on squat and bench" : "max-rep band row and overhead press"}. Compare to Week 1. (Goal: sustain 36 sessions / 14+ consecutive days of structured training)`,
          why: "Objective benchmarks create accountability and reveal true strength gains beyond the scale.",
        },
      ];
    } else {
      strengthSteps = [
        {
          weekLabel: "Week 1-2",
          description: `2x/week full-body bodyweight: squats, push-ups, glute bridges, planks -- 20 min sessions.${jointNote ? " Note: " + jointNote : ""} (${baselineDesc})`,
          why: "Bodyweight mastery before adding load prevents injury. Untrained adults gain 20-40% strength in first 8-12 weeks of consistent training (Schoenfeld et al., 2017).",
        },
        {
          weekLabel: "Week 3-6",
          description: `3x/week, add ${prefersGym ? "barbell/dumbbell compound lifts (squat, deadlift, row, press)" : "resistance bands or weighted backpack"}, track reps in a notebook or app. (Target by end: complete all exercises with correct form; increase load by 20% from Week 1)`,
          why: "Progressive overload -- adding a little more load each session -- is the single mechanism behind strength gains.",
        },
        {
          weekLabel: "Week 7-10",
          description: hasKneeCondition || hasBackCondition
            ? "Upper-lower split: 2 upper days (rows, press, curls) + 2 lower (seated leg press at low load, hip bridges, calf raises). Avoid spinal compression and deep knee flexion. (Expected progress: 1kg lean mass gained)"
            : `${prefersGym ? "Push-pull-legs split 3x/week" : "3x/week upper-lower alternating"}, increase weight by 2.5kg when all reps are clean for 2 consecutive sessions. (Expected progress: 1-1.5kg lean mass gained)`,
          why: "Split routines allow muscles to recover fully while you train more frequently -- a proven strategy for intermediate progression.",
        },
        {
          weekLabel: "Week 11-12",
          description: `Deload week at 50% intensity, then benchmark test: push-ups to failure, plank hold time${prefersGym ? ", estimated 1RM" : ""}. Record and compare to Week 1. (Goal: complete ${targetSessions} total sessions over 12 weeks)`,
          why: "Deload prevents overtraining. Benchmarks make invisible neurological strength gains concrete and motivating.",
        },
      ];
    }

    milestones.push({
      title: "Build a sustainable strength foundation",
      target: `Complete ${targetSessions} training sessions over 12 weeks. Research shows untrained adults gain 20-40% strength in the first 8-12 weeks of consistent training (Schoenfeld et al., 2017).`,
      timeframe: "3 months",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-6", color: "accent" },
        { name: "Momentum", weeks: "Week 7-10", color: "violet" },
        { name: "Sustain", weeks: "Week 11-12", color: "primary" },
      ],
      steps: strengthSteps,
      trackingMetric: "strength_sessions",
    });
  }

  // ── Better Sleep ─────────────────────────────────────────────
  if (data.goals.includes("Better Sleep")) {
    // Baseline assessment from data
    const sleepHoursNum = (() => {
      if (data.sleepHours === "< 5 hours") return 4.5;
      if (data.sleepHours === "5-6 hours") return 5.5;
      if (data.sleepHours === "6-7 hours") return 6.5;
      if (data.sleepHours === "7-8 hours") return 7.5;
      if (data.sleepHours === "8+ hours") return 8.5;
      return 6.5;
    })();
    const sleepQualityIsPoor =
      data.sleepQuality === "Poor" || data.sleepQuality === "Fair";
    const hasTroubleAsleep = data.sleepIssues.includes("Trouble falling asleep");
    const hasNightWaking = data.sleepIssues.includes("Wake up frequently");
    const hasOverthinker = data.sleepIssues.includes("Overthinking at night");
    const hasApnea = data.sleepIssues.includes("Snoring / sleep apnea") ||
      conditionNames.some(c => c.includes("apnea"));
    const hasScreenTime = data.sleepIssues.includes("Screen time before bed");
    const hasIrregularSchedule = data.sleepIssues.includes("Irregular schedule");

    // Determine primary plan variant
    const needsDurationIncrease = sleepHoursNum < 7;
    const needsQualityImprovement = !needsDurationIncrease && sleepQualityIsPoor;

    const baselineLabel = `Baseline: ${data.sleepHours || "unknown"} sleep, quality ${data.sleepQuality || "unknown"}`;

    // Specific issue interventions
    const week1Extra = hasScreenTime
      ? "No screens (phone, TV, laptop) 45 min before bed -- use blue-light blocking glasses if unavoidable."
      : hasIrregularSchedule
      ? "Pick one consistent wake time (same on weekends) -- do not change sleep time yet, only wake time."
      : "Set one consistent wake time (same on weekends). No screens 30 min before bed.";

    const week3Extra = hasTroubleAsleep
      ? "If not asleep within 20 min, get up and do a boring activity in dim light until sleepy -- do not lie awake in bed (stimulus control therapy)."
      : hasNightWaking
      ? "Keep bedroom at 18-20 degrees C if possible. Avoid liquids 2 hours before bed to reduce waking."
      : hasOverthinker
      ? "Brain dump journal: write every unresolved thought and tomorrow's to-do list before entering the bedroom -- clear the mental RAM."
      : "Add a 10-min wind-down routine: dim lights 30 min before bed, read a physical book or do light stretching.";

    const apneaNote = hasApnea
      ? " Important: if snoring or apnea is severe, consult a doctor before relying on behavioral changes alone -- untreated apnea fragments sleep regardless of routine."
      : "";

    let sleepSteps: { weekLabel: string; description: string; why: string }[];
    let sleepTarget: string;
    let sleepTimeframe: string;

    if (needsDurationIncrease) {
      // Target: add 1-1.5 hours over 4-6 weeks
      const targetHours = Math.min(sleepHoursNum + 1.5, 8);
      sleepTarget = `Reach ${targetHours.toFixed(1)} hours/night with sleep quality rated 7+/10 for 14 consecutive days. Adults need 7-9 hours; current sleep (${data.sleepHours}) is below the clinical minimum (Walker, 2017).`;
      sleepTimeframe = "6 weeks";

      if (lowConsistency) {
        sleepSteps = [
          {
            weekLabel: "Week 1-2",
            description: `${week1Extra} Track sleep duration every morning -- note bedtime and wake time only. No other changes yet. (${baselineLabel})`,
            why: "This is intentionally easy -- tracking alone surfaces patterns (when you actually fall asleep vs. when you intend to) that inform every next step.",
          },
          {
            weekLabel: "Week 3-4",
            description: `Move bedtime 30 min earlier (keep wake time fixed). Stop caffeine by 1pm. ${week3Extra}${apneaNote} (Target by end: ${(sleepHoursNum + 0.5).toFixed(1)} hrs, quality 5+/10)`,
            why: "Anchoring wake time first stabilises the circadian clock. Then shifting bedtime earlier adds duration without disrupting the anchor. Caffeine has a 5-hour half-life -- afternoon coffee is still 50% active at 10pm.",
          },
          {
            weekLabel: "Week 5-6",
            description: `Move bedtime another 30 min earlier if Week 3-4 was successful. Cool bedroom to 18-20 degrees C. Try magnesium glycinate 200-400mg 1 hour before bed. (Target by end: ${targetHours.toFixed(1)} hrs, quality 7+/10 for 14 consecutive days)`,
            why: "Core body temperature drop triggers melatonin release -- a cool room accelerates this physiological sleep signal. Magnesium glycinate reduces sleep-onset latency in individuals with mild deficiency (Abbasi et al., 2012).",
          },
        ];
      } else {
        sleepSteps = [
          {
            weekLabel: "Week 1-2",
            description: `${week1Extra} Move bedtime 30 min earlier immediately. Track sleep duration and quality (1-10) each morning. (${baselineLabel})`,
            why: "Circadian rhythm is anchored by wake time, not sleep time. Fixing wake time while shifting bedtime earlier is the fastest route to more sleep hours.",
          },
          {
            weekLabel: "Week 3-4",
            description: `Move bedtime another 30 min earlier. Stop caffeine by 1pm. ${week3Extra}${apneaNote} (Target by end: ${(sleepHoursNum + 1).toFixed(1)} hrs, self-rated quality 6+/10)`,
            why: "Consistent 30-minute incremental shifts avoid sleep disruption while progressively extending duration. Most people see measurable improvement in 2-3 weeks (Walker, 2017).",
          },
          {
            weekLabel: "Week 5-6",
            description: `Cool bedroom to 18-20 degrees C. Add magnesium glycinate 200-400mg 1 hour before bed. Keep consistent sleep window within 30 min, 7 days/week. (Goal: ${targetHours.toFixed(1)} hrs, quality 7+/10 for 14 consecutive days)`,
            why: "Sleep efficiency (time actually asleep / time in bed) above 85% is the clinical target. Environmental optimization -- temperature, darkness -- improves efficiency without medication.",
          },
        ];
      }
    } else if (needsQualityImprovement) {
      // Already sleeping 7+ hours but quality is poor
      sleepTarget = `Improve self-rated sleep quality to 7+/10 and sleep efficiency above 85% for 14 consecutive days. You are already achieving ${data.sleepHours} -- the focus is on quality, not duration.`;
      sleepTimeframe = "6 weeks";

      sleepSteps = [
        {
          weekLabel: "Week 1-2",
          description: `${week1Extra} Rate sleep quality 1-10 every morning and note what you did the night before. Identify 1-2 patterns. (${baselineLabel})`,
          why: "Quality sleep problems require diagnosis before intervention. Tracking reveals whether the issue is sleep onset, depth, or night waking -- each has a different fix.",
        },
        {
          weekLabel: "Week 3-4",
          description: `${week3Extra} Implement stimulus control: use the bedroom only for sleep and sex -- no work, phone, or TV in bed.${apneaNote} (Target by end: quality rated 6+/10 for 7 consecutive nights)`,
          why: "Stimulus control therapy is the single most evidence-based intervention for poor sleep quality (CBT-I protocol, AASM 2021). The brain learns to associate the bed with sleepiness, not wakefulness.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Cool bedroom to 18-20 degrees C. Add magnesium glycinate 200-400mg 1 hour before bed. Try 10-min progressive muscle relaxation before sleep. (Goal: quality 7+/10 for 14 consecutive days)`,
          why: "Progressive muscle relaxation reduces physiological arousal before sleep and improves subjective sleep quality in randomised trials (Liou et al., 2020).",
        },
      ];
    } else {
      // Sleeping well -- just wants to optimize
      sleepTarget = `Maintain sleep quality 7+/10 and consistent schedule (within 15 min) for 21 consecutive days. You are already in the optimal range -- the goal is habit durability.`;
      sleepTimeframe = "6 weeks";

      sleepSteps = [
        {
          weekLabel: "Week 1-2",
          description: `Track sleep consistency: note bedtime and wake time daily. Target same window within 15 min, 7 days/week including weekends. (${baselineLabel})`,
          why: "Social jet lag -- sleeping in on weekends -- shifts the circadian clock and causes Monday fatigue even with sufficient total hours (Foster, 2020).",
        },
        {
          weekLabel: "Week 3-4",
          description: `Add a structured wind-down: dim lights 30 min before bed, cool room to 18-20 degrees C, no screens. Add 2.5L water intake during the day (not after 8pm). (Target by end: quality 7+/10 for 14 consecutive nights)`,
          why: "Environmental cues reinforce the circadian signal. Hydration prevents micro-arousals from dry mouth and muscle cramps.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Consolidate the full routine into a non-negotiable habit. If any night falls below 6/10 quality, note the cause and fix before the next night. (Goal: 7+/10 quality for 21 consecutive days)`,
          why: "Habit consolidation at Week 6 locks in the neural pathway -- consistency over this window transforms an effortful routine into automatic behaviour.",
        },
      ];
    }

    milestones.push({
      title: needsDurationIncrease
        ? `Increase sleep from ${data.sleepHours || "current"} to 7.5+ hours`
        : "Achieve restorative sleep quality",
      target: sleepTarget,
      timeframe: sleepTimeframe,
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
        { name: "Momentum", weeks: "Week 5-6", color: "violet" },
      ],
      steps: sleepSteps,
      trackingMetric: "sleep_hours",
    });
  }

  // ── Reduce Stress ────────────────────────────────────────────
  if (data.goals.includes("Reduce Stress")) {
    const stressNum = (() => {
      if (data.stressLevel === "Low") return 3;
      if (data.stressLevel === "Moderate") return 5;
      if (data.stressLevel === "High") return 7;
      if (data.stressLevel === "Very High") return 9;
      return 5;
    })();
    const isHighStress = stressNum >= 7;
    const hasWorkStress = data.stressSources.includes("Work / career");
    const hasFinancialStress = data.stressSources.includes("Financial");
    const hasRelationshipStress = data.stressSources.includes("Relationships");
    const hasHealthAnxiety = data.stressSources.includes("Health concerns");
    const hasMentalHealthCondition = conditionNames.some(c =>
      c.includes("depression") || c.includes("anxiety")
    );

    const baselineLabel = `Baseline: stress ${stressNum}/10, sources: ${data.stressSources.length > 0 ? data.stressSources.join(", ") : "not specified"}`;

    // Target: realistic 2-point reduction in 4-6 weeks (Pascoe et al., 2017)
    const targetStress = Math.max(stressNum - 2, 2);

    // Source-specific interventions
    const sourceNote = hasWorkStress
      ? "Work stress: set a hard stop time each day -- no work messages after that hour. This single boundary is the highest-impact structural change for work-related stress."
      : hasFinancialStress
      ? "Financial stress: schedule a 30-min weekly 'money review' to face numbers directly. Avoidance amplifies financial anxiety more than the actual situation."
      : hasRelationshipStress
      ? "Relationship stress: identify 1 conversation you have been avoiding and schedule it this week -- unresolved conflict is a chronic physiological stressor."
      : hasHealthAnxiety
      ? "Health anxiety: limit health-related internet searches to 10 min/day. Schedule any genuine health concern as a GP appointment rather than a search session."
      : "";

    const mentalHealthNote = hasMentalHealthCondition
      ? " Note: if you have diagnosed depression or anxiety, these practices complement but do not replace professional support -- consider maintaining or adding therapy alongside this plan."
      : "";

    let stressSteps: { weekLabel: string; description: string; why: string }[];
    let stressTarget: string;
    let stressFreq: string;

    if (isHighStress) {
      // High stress: daily practices required
      stressFreq = "daily";
      stressTarget = `Reduce self-rated stress from ${stressNum}/10 to ${targetStress}/10 over 6 weeks through daily breathwork and structured recovery. A realistic target is 2 points reduction in 4-6 weeks of consistent practice (Pascoe et al., 2017).${mentalHealthNote}`;

      if (lowConsistency) {
        stressSteps = [
          {
            weekLabel: "Week 1",
            description: `One practice only: 5 min box breathing each morning (4s inhale, 4s hold, 4s exhale, 4s hold -- 5 rounds). Do it before checking your phone. Track stress 1-10 each evening. (${baselineLabel})`,
            why: "This is intentionally easy -- one daily anchor practice is more effective than a full program you abandon in 3 days. Box breathing activates the vagus nerve and reduces cortisol within minutes (Gerritsen & Band, 2018).",
          },
          {
            weekLabel: "Week 2",
            description: `Keep morning breathing. Add a 5-min evening decompression: write 3 things that went well today. No work or news 30 min before bed.${sourceNote ? " " + sourceNote : ""} (Target by end: Week 1 stress score drops by 1 point)`,
            why: "Gratitude journaling reduces pre-sleep cortisol and cognitive arousal -- one of the most replicated findings in positive psychology research.",
          },
          {
            weekLabel: "Week 3-4",
            description: `Add a 10-min midday walk without headphones (observation walk: notice 5 things you see, 4 you hear, 3 you feel). Rate stress 1-10 at midday and evening. (Target by end: consistent sub-${targetStress + 1} stress scores for 7 days)${mentalHealthNote}`,
            why: "A nature-exposure walk reduces prefrontal rumination activity measurably in fMRI studies (Bratman et al., 2015). Tracking stress twice daily reveals which part of the day drives most of the load.",
          },
          {
            weekLabel: "Week 5-6",
            description: `Full routine: morning breathing + midday walk + evening journal. Identify the single highest-stress trigger from your tracking log and create one structural change to reduce exposure. (Goal: stress ${targetStress}/10 for 14 consecutive days)`,
            why: "Structural changes (eliminating a trigger) have 10x more impact than coping practices alone. Coping manages existing stress; structural change reduces it at the source.",
          },
        ];
      } else {
        stressSteps = [
          {
            weekLabel: "Week 1",
            description: `Daily: 5 min box breathing morning (4s in / hold / out / hold), 10-min midday walk without headphones. Track stress 1-10 at 9am, 1pm, 6pm. (${baselineLabel})`,
            why: "Three daily ratings reveal the stress arc -- most people have a specific high-point (late morning for work stress, evening for family stress) that should be targeted first. Box breathing reduces cortisol within minutes (Gerritsen & Band, 2018).",
          },
          {
            weekLabel: "Week 2",
            description: `Add evening: write 3 things that went well. Set a hard boundary for one stress source.${sourceNote ? " Specifically: " + sourceNote : ""} (Target by end: stress drops 1 point from baseline)`,
            why: "Targeted structural boundaries reduce the stress stimulus at the source. Gratitude journaling reduces pre-sleep cortisol.",
          },
          {
            weekLabel: "Week 3-4",
            description: `Full programme: morning breathing + midday walk + evening journal. If stress spikes above ${stressNum - 1} during the day, use a 2-min physiological sigh (double inhale through nose, long exhale through mouth -- 5 rounds). (Target by end: consistent sub-${targetStress + 1} for 7 days)${mentalHealthNote}`,
            why: "The physiological sigh is the fastest known reset for the autonomic nervous system -- faster than box breathing for acute stress spikes (Balban et al., 2023).",
          },
          {
            weekLabel: "Week 5-6",
            description: `Review tracking log: identify top trigger. Implement one structural change to reduce it. Maintain full routine. (Goal: stress ${targetStress}/10 for 14 consecutive days)`,
            why: "At 6 weeks, practices become automatic. Structural changes at this stage extend the gains beyond what practices alone can achieve.",
          },
        ];
      }
    } else {
      // Moderate stress: 3-4x/week preventive practices
      stressFreq = "3-4x/week";
      stressTarget = `Reduce self-rated stress from ${stressNum}/10 to ${targetStress}/10 over 4 weeks. Moderate stress responds well to 3-4x/week breathwork and recovery practices (Pascoe et al., 2017).${mentalHealthNote}`;

      stressSteps = [
        {
          weekLabel: "Week 1",
          description: `3x/week: 5 min box breathing (4s in / hold / out / hold -- 5 rounds). Track stress 1-10 each evening. Identify your 2 highest-stress days from the log. (${baselineLabel})`,
          why: "Tracking first reveals whether stress is episodic (specific days/triggers) or chronic (flat, always elevated) -- the intervention differs significantly.",
        },
        {
          weekLabel: "Week 2",
          description: `On your 2 highest-stress days: add a 10-min midday walk without headphones. Evening: write 3 things that went well. Other days: breathing practice only.${sourceNote ? " " + sourceNote : ""} (Target by end: stress drops 1 point on high-stress days)`,
          why: "Targeting the specific high-load days prevents burnout with lower overall practice time. Midday movement breaks reduce cortisol 15-20% over a workday (Heijnen et al., 2016).",
        },
        {
          weekLabel: "Week 3-4",
          description: `Increase breathing practice to 5x/week. Add one structural boundary for your primary stress source.${sourceNote ? " Specifically: " + sourceNote : ""} (Goal: stress ${targetStress}/10 for 14 consecutive days)${mentalHealthNote}`,
          why: "After 2 weeks of targeted practice, the nervous system has begun recalibrating its baseline tone. Structural changes at this stage lock in gains that practices alone cannot sustain.",
        },
      ];
    }

    milestones.push({
      title: isHighStress
        ? `Reduce high stress from ${stressNum}/10 to ${targetStress}/10`
        : `Build a consistent stress-recovery practice`,
      target: stressTarget,
      timeframe: isHighStress ? "6 weeks" : "4 weeks",
      phases: isHighStress
        ? [
            { name: "Foundation", weeks: "Week 1", color: "primary" },
            { name: "Building", weeks: "Week 2", color: "accent" },
            { name: "Momentum", weeks: "Week 3-4", color: "violet" },
            { name: "Sustain", weeks: "Week 5-6", color: "primary" },
          ]
        : [
            { name: "Foundation", weeks: "Week 1", color: "primary" },
            { name: "Building", weeks: "Week 2", color: "accent" },
            { name: "Momentum", weeks: "Week 3-4", color: "violet" },
          ],
      steps: stressSteps,
      trackingMetric: "stress_level",
    });
  }

  // ── More Energy ──────────────────────────────────────────────
  if (data.goals.includes("More Energy")) {
    // Root cause analysis: identify most likely drivers
    const sleepHoursNum = (() => {
      if (data.sleepHours === "< 5 hours") return 4.5;
      if (data.sleepHours === "5-6 hours") return 5.5;
      if (data.sleepHours === "6-7 hours") return 6.5;
      if (data.sleepHours === "7-8 hours") return 7.5;
      if (data.sleepHours === "8+ hours") return 8.5;
      return 6.5;
    })();
    const isSleepDeprived = sleepHoursNum < 7;
    const isSleepQualityPoor = data.sleepQuality === "Poor" || data.sleepQuality === "Fair";
    const isSeated = data.occupationActivity === "Desk/Office Job" || data.occupationActivity === "Work From Home";
    const isSedentaryExercise =
      data.exerciseComfort === "No exercise currently" || data.exerciseComfort === "Just starting out";
    const skipsBreakfast = data.eatingChallenges.includes("Skipping breakfast");
    const hasBloodSugarIssue =
      conditionNames.some(c => c.includes("diabetes")) ||
      data.eatingChallenges.includes("Too much sugar");
    const hasThyroid = conditionNames.some(c => c.includes("thyroid"));

    // Determine top 2-3 root causes
    const rootCauses: string[] = [];
    if (isSleepDeprived) rootCauses.push("insufficient sleep");
    if (isSleepQualityPoor && !isSleepDeprived) rootCauses.push("poor sleep quality");
    if (isSedentaryExercise && isSeated) rootCauses.push("sedentary lifestyle");
    if (skipsBreakfast || hasBloodSugarIssue) rootCauses.push("blood sugar instability");
    if (hasThyroid) rootCauses.push("thyroid condition (monitor TSH)");
    if (rootCauses.length === 0) rootCauses.push("multiple contributing factors");

    const rootCauseText = `Root cause analysis: ${rootCauses.join(", ")}`;

    const baselineLabel = `Baseline: sleep ${data.sleepHours || "unknown"}, activity ${data.exerciseComfort || "unknown"}`;

    const thyroidNote = hasThyroid
      ? " Note: thyroid conditions are a common cause of persistent fatigue -- ensure TSH is within range with your doctor before attributing low energy to lifestyle factors alone."
      : "";

    let energySteps: { weekLabel: string; description: string; why: string }[];

    if (isSleepDeprived) {
      // Primary intervention: sleep
      energySteps = [
        {
          weekLabel: "Week 1-2",
          description: `Priority 1: move bedtime 30 min earlier and fix a consistent wake time (same on weekends). Drink 2.5L water daily -- set reminders every 2 hours. (${baselineLabel}; ${rootCauseText})`,
          why: `Improving sleep by 1 hour adds approximately 20% perceived energy. Even mild dehydration (1-2%) reduces cognitive performance and perceived energy by 20-30% (Ganio et al., 2011). These two changes alone often resolve energy complaints within 2 weeks.${thyroidNote}`,
        },
        {
          weekLabel: "Week 3-4",
          description: `Add a 15-min morning walk before screens. Add protein to breakfast${skipsBreakfast ? " -- even a small option: boiled eggs, Greek yoghurt, or a handful of nuts" : " (eggs, paneer, dal, Greek yoghurt)"}. Cut refined carbs at lunch (replace white rice/bread with a smaller portion of complex carbs or vegetables). (Target by end: energy score above 5/10 for 5 consecutive days)`,
          why: "A 15-min morning walk improves afternoon energy more than caffeine and without the crash (Randolph & O'Connor, 2017). Protein at breakfast stabilises blood glucose for 4-5 hours -- preventing the mid-morning slump.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Add a 5-10 min low-intensity midday movement break${isSeated ? " -- stand up, stretch, or walk to a window every 90 min" : ""}. Reduce caffeine to before 1pm. Rate energy 1-10 at morning, midday, and evening to track patterns. (Goal: energy score above 6/10 for 14 consecutive days)`,
          why: "Stable blood sugar and regular movement breaks prevent the 3pm energy dip that most desk workers experience. Caffeine after 1pm suppresses adenosine clearance and fragments sleep, creating a next-day energy debt.",
        },
      ];
    } else if (isSedentaryExercise && isSeated) {
      // Primary driver: physical inactivity
      energySteps = [
        {
          weekLabel: "Week 1-2",
          description: `Start with a 15-min morning walk daily before screens. Drink 2.5L water (set 2-hourly reminders). Stand up every 90 min if desk-based. (${baselineLabel}; ${rootCauseText})`,
          why: `A 15-min walk improves afternoon energy more than caffeine (Randolph & O'Connor, 2017). Sedentary people who begin daily walking report 20% improvement in perceived energy within 2 weeks.${thyroidNote}`,
        },
        {
          weekLabel: "Week 3-4",
          description: `Increase to 20-30 min daily walk or ${cardioSuggestion} 3x/week. Add protein at every meal (eggs, legumes, paneer, chicken). Rate energy 1-10 each evening. (Target by end: energy score above 5/10 for 5 consecutive days)`,
          why: "Regular aerobic exercise increases mitochondrial density in muscle cells -- directly increasing the energy production capacity of every cell in the body. Results are measurable in 3-4 weeks.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Extend to 4x/week aerobic activity. Add 2 short (15 min) strength sessions. Reduce refined carbs at lunch. Cut caffeine after 1pm. (Goal: energy score above 6/10 for 14 consecutive days)`,
          why: "Combining aerobic and strength training produces greater energy improvements than either alone. Muscle mass increases the resting metabolic rate and improves insulin sensitivity -- both major energy regulators.",
        },
      ];
    } else {
      // Mixed or blood sugar focus
      energySteps = [
        {
          weekLabel: "Week 1-2",
          description: `Drink 2.5L water daily (set reminders). Add protein to every meal. ${skipsBreakfast ? "Start with a small breakfast within 1 hour of waking: boiled eggs, Greek yoghurt, or nuts." : "Avoid skipping meals."} Track energy 1-10 morning and evening. (${baselineLabel}; ${rootCauseText})`,
          why: `Dehydration reduces cognitive performance by 20-30% even at 1-2% deficit (Ganio et al., 2011). Protein at meals stabilises blood glucose and prevents the spike-crash cycle that causes afternoon fatigue.${thyroidNote}`,
        },
        {
          weekLabel: "Week 3-4",
          description: `Add a 15-min morning walk before screens. Cut refined carbs at lunch (white rice, bread, sugary snacks). Replace with vegetables, legumes, or a protein source. (Target by end: energy score above 5/10 for 5 consecutive days)`,
          why: "A 15-min morning walk sets circadian alertness for the rest of the day. Reducing refined carbs at lunch eliminates the main driver of the 3pm slump for most people.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Add ${cardioSuggestion} 3x/week for 20-30 min. Fix consistent wake time (same on weekends). Reduce caffeine to before 1pm. (Goal: energy score above 6/10 for 14 consecutive days)`,
          why: "Regular aerobic activity is the most evidence-based intervention for chronic fatigue in otherwise healthy adults -- effects appear within 3-4 weeks and compound over time.",
        },
      ];
    }

    milestones.push({
      title: "Achieve sustained daily energy above 6/10",
      target: `Self-rated energy above 6/10 for 14 consecutive days. Improving sleep by 1 hour adds ~20% perceived energy; 2.5L water daily improves cognitive alertness by 15-20% (Ganio et al., 2011); a 15-min walk improves afternoon energy more than caffeine (Randolph & O'Connor, 2017).`,
      timeframe: "6 weeks",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
        { name: "Momentum", weeks: "Week 5-6", color: "violet" },
      ],
      steps: energySteps,
      trackingMetric: "energy_level",
    });
  }

  // ── Manage Pain ──────────────────────────────────────────────
  if (data.goals.includes("Manage Pain")) {
    const painAreas = data.painAreas || [];
    const hasLowerBack = painAreas.some((p: string) =>
      p.toLowerCase().includes("lower back") || p.toLowerCase().includes("mid back")
    );
    const hasUpperBack = painAreas.some((p: string) =>
      p.toLowerCase().includes("upper back")
    );
    const hasNeck = painAreas.some((p: string) =>
      p.toLowerCase().includes("neck")
    );
    const hasKneePain = painAreas.some((p: string) =>
      p.toLowerCase().includes("knee")
    );
    const hasHipPain = painAreas.some((p: string) =>
      p.toLowerCase().includes("hip")
    );
    const hasShoulderPain = painAreas.some((p: string) =>
      p.toLowerCase().includes("shoulder")
    );
    const hasFullBody = painAreas.some((p: string) =>
      p.toLowerCase().includes("full body")
    );
    const hasFibro = conditionNames.some(c => c.includes("fibromyalgia"));
    const hasArthritis = conditionNames.some(c => c.includes("arthritis"));

    const painAreaText =
      painAreas.filter((p: string) => p !== "None").length > 0
        ? painAreas.filter((p: string) => p !== "None").join(", ")
        : "general";

    const baselineLabel = `Baseline: pain areas -- ${painAreaText}`;

    // Specific exercise prescriptions per pain location
    const week1Exercises = (() => {
      if (hasLowerBack) {
        return "McGill Big 3 daily (10 min): curl-up (3x8), side plank (3x20s each side), bird-dog (3x8 each side). Track pain score 0-10 morning and evening.";
      } else if (hasKneePain) {
        return "Daily: straight-leg raises (3x15 each leg), wall sits (3x30s), terminal knee extensions with resistance band (3x15). Avoid deep squats and stair running. Track pain score 0-10 morning and evening.";
      } else if (hasShoulderPain) {
        return "Daily: band pull-aparts (3x15), external rotations with light band or 1kg dumbbell (3x12 each side), doorway pec stretch (3x30s). Avoid overhead pressing. Track pain score 0-10 morning and evening.";
      } else if (hasNeck) {
        return "Daily: chin tucks (3x10, hold 5s), neck side stretch (3x30s each side), posture reset every hour if desk-bound (stand, roll shoulders back, chin tuck). Track pain score 0-10 morning and evening.";
      } else if (hasHipPain) {
        return "Daily: glute bridges (3x15), clamshells with band (3x15 each side), hip flexor stretch (3x45s each side). Avoid high-impact running. Track pain score 0-10 morning and evening.";
      } else if (hasUpperBack) {
        return "Daily: thoracic extension over a foam roller or rolled towel (3x60s), band rows (3x12), chest opening stretch (3x30s). Track pain score 0-10 morning and evening.";
      } else if (hasFullBody || hasFibro) {
        return "Start with 5 min gentle movement: seated cat-cow, gentle arm circles, ankle rotations. Build tolerance slowly. Log pain score 0-10 before and after movement.";
      } else {
        return "10 min gentle stretching focused on your specific pain areas. Track pain score 0-10 morning and evening and note what worsens or improves it.";
      }
    })();

    const week3Exercises = (() => {
      if (hasLowerBack) {
        return "Add: hip flexor stretch (3x45s each side), dead bug (3x8 each side). Extend McGill Big 3 to 4x/week. Heat therapy 10 min before morning session.";
      } else if (hasKneePain) {
        return "Progress to: step-ups on low step (3x10 each leg), mini-squats to 45 degrees (3x12), short-arc quads (3x15). Add ice 10 min after sessions if swelling occurs.";
      } else if (hasShoulderPain) {
        return "Progress to: face pulls with band (3x15), prone Y-T-W exercise (3x8 each position). Maintain all Week 1-2 exercises. Add heat before sessions.";
      } else if (hasNeck) {
        return "Progress to: scapular squeezes (3x15), isometric neck strengthening (3x10 each direction, 5s hold). Ergonomics review: screen at eye level, chair height adjusted.";
      } else if (hasHipPain) {
        return "Progress to: side-lying hip abduction (3x15), single-leg balance (3x30s each side). Add heat therapy 10 min before movement.";
      } else if (hasFullBody || hasFibro) {
        return "Build to 10 min movement daily: add gentle walking (5-10 min at comfortable pace). Graded exposure: increase by 1-2 min per week only if previous week felt manageable.";
      } else {
        return "Add anti-inflammatory diet adjustments: turmeric with black pepper daily, omega-3 rich foods (flaxseed, walnuts, fatty fish 2x/week), reduce refined carbs. Heat therapy 10 min before movement sessions.";
      }
    })();

    const acuteWarning =
      "Safety check: if pain worsens or becomes sharp during any exercise, stop immediately and consult a physiotherapist. This plan targets chronic pain management, not acute injury.";

    const arthritisNote = hasArthritis
      ? " Arthritis note: warm up joints with 5 min gentle movement in warm water or after a warm shower -- cold joints are more vulnerable to irritation."
      : "";

    let painSteps: { weekLabel: string; description: string; why: string }[];

    if (lowConsistency) {
      painSteps = [
        {
          weekLabel: "Week 1-2",
          description: `Track only: note pain score 0-10 at morning and evening each day. Observe 2-3 things that reliably worsen or improve your pain. No exercise programme yet. (${baselineLabel})`,
          why: "This is intentionally easy -- identifying triggers and relievers is the highest-leverage first step. The data from 2 weeks of tracking tells you more than any generic programme can.",
        },
        {
          weekLabel: "Week 3-4",
          description: `${week1Exercises}${arthritisNote} ${acuteWarning} (Target by end: completed 12/14 daily sessions; pain patterns identified)`,
          why: "Movement is the primary treatment for chronic musculoskeletal pain (NICE guidelines 2021). Expected: 2-point reduction on VAS scale in 4-6 weeks of daily movement. Starting with targeted exercises means every minute is addressing your specific pain mechanism.",
        },
        {
          weekLabel: "Week 5-6",
          description: `${week3Exercises} Add anti-inflammatory foods: turmeric with black pepper, omega-3 rich foods (flaxseed, walnuts, fatty fish 2x/week). (Target by end: pain score reduced by 1+ point from baseline)`,
          why: "Heat before movement increases tissue flexibility and reduces pain sensitivity. Anti-inflammatory dietary adjustments reduce systemic pain biomarkers measurably in 4-6 weeks.",
        },
        {
          weekLabel: "Week 7-8",
          description: `Maintain daily movement programme. Introduce 1 new strength exercise targeting the muscles supporting your pain area. Review triggers log -- eliminate or reduce 1 key trigger. (Goal: pain score reduced by 2+ points from baseline for 7 consecutive days)`,
          why: "Stronger muscles reduce mechanical load on painful joints and structures. Structural trigger elimination extends gains beyond what exercise alone can achieve.",
        },
      ];
    } else {
      painSteps = [
        {
          weekLabel: "Week 1-2",
          description: `${week1Exercises}${arthritisNote} ${acuteWarning} (${baselineLabel})`,
          why: "Targeted exercise for the specific pain area is far more effective than generic stretching. Movement is the primary treatment for chronic musculoskeletal pain (NICE guidelines 2021). Expected: 2-point reduction on VAS scale in 4-6 weeks.",
        },
        {
          weekLabel: "Week 3-4",
          description: `${week3Exercises} Add anti-inflammatory foods: turmeric with black pepper, omega-3 sources (flaxseed, walnuts, fatty fish 2x/week). Heat therapy 10 min before morning session. (Target by end: pain score reduced by 1+ point; 12/14 daily sessions completed)`,
          why: "Progressive loading of the supporting muscles reduces mechanical stress on painful structures. Dietary anti-inflammatories reduce systemic pain biomarkers (Calder, 2017). Heat increases tissue extensibility and reduces pain sensitivity before movement.",
        },
        {
          weekLabel: "Week 5-8",
          description: `Increase exercise duration to 15 min daily. Introduce 1 more targeted strength exercise for the area. Log pain triggers and remove or modify the top 1-2 triggers identified. (Goal: pain score reduced by 2+ points from baseline for 7 consecutive days)`,
          why: "At 4-6 weeks, the neuromuscular adaptations begin. Reducing triggers eliminates the recurring pain driver that exercise alone cannot address.",
        },
      ];
    }

    milestones.push({
      title: `Reduce ${painAreaText !== "general" ? painAreaText : "chronic"} pain by 2 points on a 0-10 scale`,
      target: `Self-rated pain at 2 points below baseline for 7 consecutive days. Movement is the primary treatment for chronic musculoskeletal pain (NICE guidelines 2021). Expected: 2-point VAS reduction in 4-6 weeks.`,
      timeframe: "2 months",
      phases: lowConsistency
        ? [
            { name: "Foundation", weeks: "Week 1-2", color: "primary" },
            { name: "Building", weeks: "Week 3-4", color: "accent" },
            { name: "Momentum", weeks: "Week 5-6", color: "violet" },
            { name: "Sustain", weeks: "Week 7-8", color: "primary" },
          ]
        : [
            { name: "Foundation", weeks: "Week 1-2", color: "primary" },
            { name: "Building", weeks: "Week 3-4", color: "accent" },
            { name: "Sustain", weeks: "Week 5-8", color: "primary" },
          ],
      steps: painSteps,
      trackingMetric: "active_minutes",
    });
  }

  // ── Improve Blood Markers ────────────────────────────────────
  if (data.goals.includes("Improve Blood Markers")) {
    const hasDiabetes = conditionNames.some(c =>
      c.includes("diabetes") || c.includes("type 2") || c.includes("type 1")
    );
    const hasHypertension = conditionNames.some(c =>
      c.includes("hypertension") || c.includes("high bp") || c.includes("blood pressure")
    );
    const hasThyroid = conditionNames.some(c => c.includes("thyroid"));
    const hasCholesterol = conditionNames.some(c =>
      c.includes("cholesterol") || c.includes("lipid") || c.includes("heart")
    );
    const hasPCOD = conditionNames.some(c =>
      c.includes("pcod") || c.includes("pcos")
    );

    // Build condition-specific action plan
    const conditionActions: string[] = [];
    if (hasDiabetes) conditionActions.push("HbA1c (target <6.5% or per doctor), fasting glucose, post-meal glucose");
    if (hasHypertension) conditionActions.push("systolic and diastolic BP (target <130/80 mmHg per AHA 2023)");
    if (hasThyroid) conditionActions.push("TSH, Free T3, Free T4 (retest every 6-8 weeks if on medication)");
    if (hasCholesterol) conditionActions.push("LDL, HDL, triglycerides, total cholesterol ratio");
    if (hasPCOD) conditionActions.push("testosterone, DHEA-S, LH/FSH ratio, insulin resistance markers (fasting insulin, HOMA-IR)");
    if (conditionActions.length === 0) {
      conditionActions.push("HbA1c, fasting glucose, lipids (LDL, HDL, triglycerides), thyroid (TSH), Vitamin D, CBC, CRP");
    }

    const panelText = conditionActions.join("; ");

    // Condition-specific lifestyle targets
    const week3Actions: string[] = [];
    if (hasDiabetes) {
      week3Actions.push("Reduce refined carbs: eliminate sugary drinks and white bread. Add 150 min/week moderate activity (target: HbA1c reduction of 0.5-1% in 3 months -- ADA guidelines 2024).");
    }
    if (hasHypertension) {
      week3Actions.push("Begin DASH diet principles: reduce sodium to <2300mg/day, increase potassium through leafy greens, bananas, and lentils (DASH diet reduces systolic BP by 8-14 mmHg in 2-4 weeks).");
    }
    if (hasThyroid) {
      week3Actions.push("Add selenium support: 2 Brazil nuts daily. Ensure adequate iodine (iodised salt or seafood 2x/week). Avoid raw goitrogens (raw cruciferous vegetables in excess).");
    }
    if (hasCholesterol) {
      week3Actions.push("Increase soluble fibre (oats, beans, lentils, apples). Reduce saturated fat: switch to olive oil, reduce full-fat dairy and processed meats (dietary changes can reduce LDL by 10-15% in 8-12 weeks).");
    }
    if (hasPCOD) {
      week3Actions.push("Reduce glycaemic load: avoid refined sugars, add strength training 3x/week to improve insulin sensitivity. Inositol (2g/day myo-inositol) has evidence for PCOS metabolic markers.");
    }
    if (week3Actions.length === 0) {
      week3Actions.push("Begin Mediterranean-style eating: olive oil, fish 2x/week, legumes, fruits, vegetables, whole grains. Reduce processed foods and added sugars.");
    }

    const week3Text = week3Actions.join(" ");

    const baselineLabel = `Baseline: known conditions -- ${conditionNames.length > 0 ? conditionNames.join(", ") : "none specified"}`;

    milestones.push({
      title: "Establish blood marker baseline and targeted 90-day improvement plan",
      target: `Get a comprehensive panel (${panelText}) reviewed with your doctor. Set specific target numbers. Retest at 90 days. ${hasDiabetes ? "ADA guidelines: 0.5-1% HbA1c reduction achievable in 3 months. " : ""}${hasHypertension ? "DASH diet reduces systolic BP by 8-14 mmHg in 2-4 weeks. " : ""}${hasCholesterol ? "Dietary changes reduce LDL 10-15% in 8-12 weeks. " : ""}`,
      timeframe: "3 months",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-8", color: "accent" },
        { name: "Momentum", weeks: "Week 9-12", color: "violet" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: `Book and complete a comprehensive blood panel: ${panelText}. Review results with your doctor. Write down your specific target numbers and retest date (90 days). (${baselineLabel})`,
          why: "You cannot set a target without a baseline -- this is the non-negotiable first step. A concrete number (e.g. HbA1c from 7.2 to below 6.5) transforms an abstract goal into a trackable metric.",
        },
        {
          weekLabel: "Week 3-8",
          description: `Implement condition-specific dietary changes: ${week3Text} Track adherence 5/7 days per week.`,
          why: "Dietary changes produce measurable blood marker improvements within 4-8 weeks when consistently applied. Tracking adherence (not perfection) is the predictor of success.",
        },
        {
          weekLabel: "Week 9-12",
          description: `Maintain dietary changes. Add 150 min/week moderate aerobic activity if not already doing so. Book retest at Week 12. Review delta from baseline. Adjust plan with doctor. (Goal: measurable improvement in primary target marker)`,
          why: "Exercise combined with dietary changes produces 2-3x better metabolic marker improvements than dietary changes alone. The 90-day retest closes the feedback loop and guides the next phase.",
        },
      ],
      trackingMetric: "nutrition_quality",
    });
  }

  // ── Skin Health ──────────────────────────────────────────────
  if (data.goals.includes("Skin Health")) {
    const hasDiabetes = conditionNames.some(c => c.includes("diabetes"));
    const hasThyroid = conditionNames.some(c => c.includes("thyroid"));
    const hasPCOD = conditionNames.some(c => c.includes("pcod") || c.includes("pcos"));
    const isHighStress = data.stressLevel === "High" || data.stressLevel === "Very High";
    const isSleepDeprived = data.sleepHours === "< 5 hours" || data.sleepHours === "5-6 hours";

    const hormonalNote =
      hasPCOD || hasThyroid
        ? " Note: hormonal conditions (PCOS, thyroid) are a primary driver of skin issues -- blood marker management and endocrine support are the most effective intervention, not topical products alone."
        : "";

    const diabetesNote = hasDiabetes
      ? " Note: uncontrolled blood sugar accelerates skin ageing and impairs wound healing -- glucose management is a prerequisite for skin improvement."
      : "";

    const baselineLabel = `Baseline: stress ${data.stressLevel || "unknown"}, sleep ${data.sleepHours || "unknown"}`;

    milestones.push({
      title: "Achieve clearer, healthier skin through internal and external changes",
      target: "Self-rated skin quality improvement over 8 weeks through hydration, nutrition, sleep, and stress management. Internal factors (hydration, diet, sleep, stress, hormones) drive 70-80% of skin health outcomes.",
      timeframe: "2 months",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-5", color: "accent" },
        { name: "Momentum", weeks: "Week 6-8", color: "violet" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: `Drink 2.5-3L water daily (set reminders). Add omega-3 rich foods 4x/week (walnuts, flaxseed, fatty fish). Cut refined sugar as much as possible -- sugar glycates collagen and accelerates skin ageing.${isSleepDeprived ? " Fix sleep: aim for 7+ hours -- skin repairs itself during deep sleep and collagen synthesis peaks between 11pm-4am." : ""}${hormonalNote}${diabetesNote} (${baselineLabel})`,
          why: "Hydration directly affects skin barrier function and plumpness. Omega-3 fatty acids reduce skin inflammation measurably in 12 weeks (Pilkington et al., 2011). Sugar-driven glycation is irreversible -- prevention is the most effective intervention.",
        },
        {
          weekLabel: "Week 3-5",
          description: `Add Vitamin C rich foods daily (citrus, bell peppers, amla) -- Vitamin C is essential for collagen synthesis. Add zinc-rich foods (pumpkin seeds, legumes, eggs)${isHighStress ? " -- stress depletes zinc rapidly" : ""}. Establish a simple consistent skincare routine (cleanser, moisturiser, SPF 30+ in daytime). (Target by end: consistent daily routine for 14 consecutive days)`,
          why: "Vitamin C is a cofactor for collagen hydroxylation -- without it, collagen structure is weak regardless of protein intake. SPF prevents the UV-driven photoageing that accounts for 80% of visible skin ageing.",
        },
        {
          weekLabel: "Week 6-8",
          description: `${isHighStress ? "Add a daily stress management practice (5 min breathing, 10 min walk) -- cortisol elevates sebum production and drives acne and eczema flares." : "Maintain all habits established in Weeks 1-5."} Add antioxidant-rich foods (berries, green tea, dark leafy vegetables). Review consistency log -- identify which habit had the biggest positive impact and reinforce it. (Goal: self-rated skin improvement sustained for 14+ days)`,
          why: "Antioxidants neutralise free radicals that damage skin DNA. The 8-week mark is the minimum for meaningful collagen synthesis changes -- consistency throughout is the determining factor.",
        },
      ],
      trackingMetric: "nutrition_quality",
    });
  }

  // ── Better Mobility ──────────────────────────────────────────
  if (data.goals.includes("Better Mobility")) {
    const painAreas = data.painAreas || [];
    const hasBackStiffness = painAreas.some((p: string) =>
      p.toLowerCase().includes("back")
    );
    const hasShoulderStiffness = painAreas.some((p: string) =>
      p.toLowerCase().includes("shoulder")
    );
    const hasHipStiffness = painAreas.some((p: string) =>
      p.toLowerCase().includes("hip")
    );
    const hasKneeStiffness = painAreas.some((p: string) =>
      p.toLowerCase().includes("knee")
    );
    const hasNeckStiffness = painAreas.some((p: string) =>
      p.toLowerCase().includes("neck")
    );
    const hasArthritis = conditionNames.some(c => c.includes("arthritis"));
    const isDesk = data.occupationActivity === "Desk/Office Job" || data.occupationActivity === "Work From Home";

    // Targeted mobility sequence
    const week1Mobility = (() => {
      const exercises: string[] = [];
      if (hasBackStiffness || isDesk) exercises.push("cat-cow (10 reps), child's pose (3x45s)");
      if (hasShoulderStiffness) exercises.push("arm circles (10 each direction), doorway pec stretch (3x30s)");
      if (hasHipStiffness || isDesk) exercises.push("hip flexor lunge stretch (3x45s each side), pigeon pose or figure-4 stretch (3x45s)");
      if (hasKneeStiffness) exercises.push("quad stretch standing (3x30s each side), hamstring doorway stretch (3x45s)");
      if (hasNeckStiffness) exercises.push("neck side stretch (3x30s each side), chin tucks (3x10, hold 5s)");
      if (exercises.length === 0) exercises.push("full-body mobility flow: neck circles, shoulder rolls, cat-cow, hip circles, forward fold (10 min total)");
      return exercises.join("; ");
    })();

    const arthritisNote = hasArthritis
      ? " Arthritis: always warm up in warm water or after a warm shower -- cold joints are more vulnerable to irritation. Avoid forcing range of motion past the point of discomfort."
      : "";

    const baselineLabel = `Baseline: stiffness areas -- ${painAreas.filter((p: string) => p !== "None").join(", ") || "general"}`;

    milestones.push({
      title: "Improve functional mobility and reduce stiffness",
      target: "Complete daily mobility routine for 21 consecutive days. Measurable goal: increase range of motion in primary stiff areas by self-assessment (can you touch your toes, rotate your neck fully, raise arms overhead?). Research shows consistent stretching increases range of motion measurably in 4-6 weeks (Decoster et al., 2005).",
      timeframe: "6 weeks",
      phases: [
        { name: "Foundation", weeks: "Week 1-2", color: "primary" },
        { name: "Building", weeks: "Week 3-4", color: "accent" },
        { name: "Momentum", weeks: "Week 5-6", color: "violet" },
      ],
      steps: [
        {
          weekLabel: "Week 1-2",
          description: `Daily 10-min targeted mobility routine: ${week1Mobility}.${arthritisNote}${isDesk ? " Set an hourly reminder to stand and do 2-3 of these exercises at your desk." : ""} Self-assess baseline: note which movements are restricted and by how much. (${baselineLabel})`,
          why: "Targeted stretching of specific restricted areas produces faster range-of-motion gains than generic full-body routines. Consistent daily practice is the key variable -- research shows 4-6 weeks of daily stretching produces measurable range-of-motion improvements (Decoster et al., 2005).",
        },
        {
          weekLabel: "Week 3-4",
          description: `Extend routine to 15 min. Add dynamic mobility work: leg swings (20 each direction), arm circles, thoracic rotations${isDesk ? ", and hourly desk mobility micro-breaks (2 min each)" : ""}. Begin yoga or pilates 1x/week if accessible. (Target by end: routine completed 12/14 days; 1 restricted movement noticeably improved)`,
          why: "Dynamic mobility exercises (controlled movement through range) train the nervous system to allow full range, not just stretch passive tissue. This is the mechanism for lasting mobility gains.",
        },
        {
          weekLabel: "Week 5-6",
          description: `Add loaded mobility work: goblet squat hold (3x30s), overhead reach with band (3x10), or yoga poses held at end range with breath. Re-assess baseline movements -- note changes. (Goal: 21 consecutive days of mobility routine; measurable improvement in at least 2 restricted areas)`,
          why: "Loaded mobility (controlling movement under light load at end range) is more durable than passive stretching -- it trains the body to use the new range of motion in functional movement.",
        },
      ],
      trackingMetric: "active_minutes",
    });
  }

  // ── Overall Wellness ─────────────────────────────────────────
  if (data.goals.includes("Overall Wellness")) {
    const sleepHoursNum = (() => {
      if (data.sleepHours === "< 5 hours") return 4.5;
      if (data.sleepHours === "5-6 hours") return 5.5;
      if (data.sleepHours === "6-7 hours") return 6.5;
      if (data.sleepHours === "7-8 hours") return 7.5;
      if (data.sleepHours === "8+ hours") return 8.5;
      return 6.5;
    })();
    const isSleepDeprived = sleepHoursNum < 7;
    const isHighStress = data.stressLevel === "High" || data.stressLevel === "Very High";
    const isSedentary =
      data.exerciseComfort === "No exercise currently" || data.exerciseComfort === "Just starting out";
    const eatsPoorly =
      data.cookingStyle === "Mostly eating out / ordering in" ||
      data.eatingChallenges.includes("Too much sugar") ||
      data.eatingChallenges.includes("Not enough vegetables");

    // Identify the top 2-3 wellness levers
    const levers: string[] = [];
    if (isSleepDeprived) levers.push("sleep (currently " + (data.sleepHours || "unknown") + ")");
    if (isHighStress) levers.push("stress (" + (data.stressLevel || "unknown") + ")");
    if (isSedentary) levers.push("physical activity");
    if (eatsPoorly) levers.push("diet quality");
    if (levers.length === 0) levers.push("fine-tuning all four pillars");

    const baselineLabel = `Baseline: key areas needing attention -- ${levers.join(", ")}`;

    milestones.push({
      title: "Build a sustainable four-pillar wellness foundation",
      target: `Score 7+/10 on self-rated overall wellbeing for 14 consecutive days by improving the highest-leverage areas: ${levers.join(", ")}. Wellness is a composite of sleep, movement, nutrition, and stress -- small consistent improvements in each compound rapidly.`,
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
          description: `${lowConsistency ? "Single focus only: " : ""}${isSleepDeprived ? "Fix sleep first: consistent wake time, 30 min earlier bedtime, 2.5L water daily." : isHighStress ? "Stress management first: 5 min box breathing each morning, 10-min midday walk without headphones." : isSedentary ? "Movement first: 20-min daily walk, same time each day." : "Track energy, sleep quality, and mood 1-10 each evening -- identify the weakest pillar."} (${baselineLabel})`,
          why: `${lowConsistency ? "This is intentionally easy -- one anchor habit is more effective than five habits you abandon. " : ""}Starting with the highest-leverage lever produces the fastest cross-system improvement. Sleep alone improves energy, stress resilience, appetite regulation, and cognitive performance simultaneously.`,
        },
        {
          weekLabel: "Week 3-6",
          description: `Add the second lever: ${isSleepDeprived ? isHighStress ? "stress management (5 min breathing + 10 min walk, 4x/week)" : "movement (20-30 min walk 4x/week)" : isHighStress ? isSedentary ? "daily 20-min walk + 1 strength session/week" : "add protein at every meal and reduce refined carbs" : "sleep (consistent wake time, 7+ hours target)"}. ${eatsPoorly ? "Add one home-cooked meal per week and cut sugary drinks." : "Maintain clean eating patterns."} (Target by end: 2 pillars consistently at 6+/10)`,
          why: "Compound lifestyle improvements produce synergistic effects -- better sleep improves exercise performance, which reduces stress, which improves sleep. The second pillar accelerates progress in the first.",
        },
        {
          weekLabel: "Week 7-10",
          description: `Full programme: ${isSedentary ? "30 min movement 4x/week" : "4x/week movement"}, ${isSleepDeprived ? "7+ hours sleep" : "maintain sleep"}, ${isHighStress ? "daily stress practice" : "3x/week stress practice"}, ${eatsPoorly ? "3+ home-cooked meals/week, protein at every meal" : "Mediterranean-style eating"}. Rate all four pillars daily. (Target by end: all 4 pillars at 6+/10 for 7 consecutive days)`,
          why: "Running all four systems in parallel for 4 weeks produces measurable wellbeing improvements. The brain begins to associate the new identity -- 'I am someone who sleeps well, moves daily, eats intentionally, and manages stress' -- with who you are.",
        },
        {
          weekLabel: "Week 11-12",
          description: `Maintenance and habit-locking: identify which habits survived the hardest week and which collapsed. Simplify to the most essential version of each that you can sustain indefinitely. (Goal: overall wellbeing 7+/10 for 14 consecutive days)`,
          why: "Sustainable habits are not the most intense version -- they are the minimum effective dose you will do without thinking. Locking these in at Week 12 builds the foundation for the next 12 months.",
        },
      ],
      trackingMetric: "energy_level",
    });
  }

  // ── Fallback: generic for any unmapped goal ───────────────────
  const mappedGoals = [
    "Lose Weight", "Build Strength", "Better Sleep",
    "Reduce Stress", "More Energy", "Manage Pain", "Improve Blood Markers",
    "Skin Health", "Better Mobility", "Overall Wellness",
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
