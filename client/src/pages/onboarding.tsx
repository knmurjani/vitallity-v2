import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";

// ─── Why We Ask Tooltip ────────────────────────────────────
function WhyWeAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-text-light hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Why we ask"
        data-testid="why-we-ask"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card border border-border rounded-[12px] p-3 shadow-card text-xs text-text-mid leading-relaxed animate-scale-in" data-testid="why-we-ask-tooltip">
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
  { label: "Goals & Plan", steps: [8, 9, 10, 11] },
];

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
  7: "You're in the home stretch -- just goals and milestones left",
  11: "You did it! Your personalized journey starts now",
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

  // Load existing progress
  useEffect(() => {
    if (initialLoaded) return;
    authFetch("GET", "/api/onboarding/progress")
      .then(res => res.json())
      .then(progress => {
        if (progress.step) setStep(Math.min(progress.step, 11));
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
          body = {
            goals: data.goals.map(g => ({ goalType: g })),
            customGoal: data.customGoal,
            targetWeightKg: data.goals.includes("Lose Weight") ? data.targetWeightKg : null,
            weightTimeline: data.goals.includes("Lose Weight") ? data.weightTimeline : null,
          };
          break;
        case 9:
          body = {
            nutritionKnowledge: data.nutritionKnowledge, exerciseKnowledge: data.exerciseKnowledge,
            selfDiscipline: data.selfDiscipline, consistencyHistory: data.consistencyHistory, whyNow: data.whyNow,
          };
          break;
        case 10:
          body = { milestones: data.milestones };
          break;
        case 11: {
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

      await authFetch("POST", `/api/onboarding/step/${step}`, body);

      if (step < 11) {
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

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return data.name.trim() && data.age && parseInt(data.age) >= 13 && data.gender;
      case 8:
        if (bmi >= 35 && !data.bmiUnderstand) return false;
        return data.goals.length > 0;
      default:
        return true;
    }
  }, [step, data, bmi]);

  const currentPhase = getPhaseForStep(step);

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[560px] mx-auto px-5 py-6 pb-32">
        {/* Phase indicator */}
        <div className="flex gap-2 mb-3" data-testid="phase-indicator">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= currentPhase ? "bg-primary" : "bg-border"
                }`}
              />
              <span className={`text-[10px] uppercase tracking-wider mt-1 block ${
                i === currentPhase ? "text-primary font-semibold" : "text-text-light"
              }`}>
                {phase.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step progress */}
        <div className="h-[3px] bg-border rounded-full mb-2" data-testid="step-progress">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / 11) * 100}%` }}
          />
        </div>

        {/* Step counter with time estimate */}
        <p className="text-xs text-muted-foreground mb-1" data-testid="step-counter">
          Step {step} of 11 {step < 11 ? `-- about ${Math.max(1, Math.ceil((11 - step) * 0.75))} min left` : "-- almost done!"}
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
        {step === 2 && <Screen2 data={data} update={update} />}
        {step === 3 && <Screen3 data={data} update={update} />}
        {step === 4 && <Screen4 data={data} update={update} />}
        {step === 5 && <Screen5 data={data} update={update} />}
        {step === 6 && <Screen6 data={data} update={update} />}
        {step === 7 && <Screen7 data={data} update={update} />}
        {step === 8 && <Screen8 data={data} update={update} bmi={bmi} />}
        {step === 9 && <Screen9 data={data} update={update} />}
        {step === 10 && <Screen10 data={data} update={update} />}
        {step === 11 && <Screen11 data={data} bmi={bmi} bmiCategory={bmiCategory} />}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-5 py-4">
        <div className="max-w-[560px] mx-auto flex gap-3">
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
            ) : step === 11 ? (
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

  const displayWeight = data.weightUnit === "lbs" ? (data.weightKg * 2.20462).toFixed(1).replace(/\.0$/, '') : String(data.weightKg).replace(/\.0$/, '');
  const setWeight = (raw: string) => {
    // Allow empty, digits, and one decimal point
    if (raw === '' || raw === '.') { update("weightKg", 0); return; }
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    const val = parseFloat(cleaned);
    if (isNaN(val)) return;
    update("weightKg", data.weightUnit === "lbs" ? Math.round((val / 2.20462) * 10) / 10 : Math.round(val * 10) / 10);
  };

  const updateHeightFromFtIn = (ft: number, inches: number) => {
    update("heightFt", ft);
    update("heightIn", inches);
    update("heightCm", Math.round((ft * 12 + inches) * 2.54));
  };

  return (
    <div data-testid="screen-1">
      <h2 className="font-display text-2xl font-bold mb-1">Let's get to know you</h2>
      <p className="text-text-light text-sm mb-8">Basic information to personalize your journey</p>

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
          <div className="flex bg-card rounded-[10px] border border-border p-0.5 w-fit mb-3">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.heightUnit === "cm" ? "bg-primary text-white shadow-sm" : "text-text-light"
              }`}
              onClick={() => setHeightUnit("cm")}
              data-testid="toggle-height-cm"
            >cm</button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.heightUnit === "ftin" ? "bg-primary text-white shadow-sm" : "text-text-light"
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
              <span className="text-sm text-text-light">cm</span>
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
              <span className="text-sm text-text-light">ft</span>
              <input
                type="number"
                value={data.heightIn}
                onChange={e => updateHeightFromFtIn(data.heightFt, parseInt(e.target.value) || 0)}
                min={0} max={11}
                className="vitallity-input w-20"
                data-testid="input-height-in"
              />
              <span className="text-sm text-text-light">in</span>
            </div>
          )}
        </div>

        <div>
          <label className="vitallity-label">Current Weight</label>
          <div className="flex bg-card rounded-[10px] border border-border p-0.5 w-fit mb-3">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.weightUnit === "kg" ? "bg-primary text-white shadow-sm" : "text-text-light"
              }`}
              onClick={() => setWeightUnit("kg")}
              data-testid="toggle-weight-kg"
            >kg</button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                data.weightUnit === "lbs" ? "bg-primary text-white shadow-sm" : "text-text-light"
              }`}
              onClick={() => setWeightUnit("lbs")}
              data-testid="toggle-weight-lbs"
            >lbs</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={displayWeight}
              onChange={e => setWeight(e.target.value)}
              className="vitallity-input w-28"
              data-testid="input-weight"
            />
            <span className="text-sm text-text-light">{data.weightUnit}</span>
          </div>
        </div>

        {bmi > 0 && data.heightCm > 0 && data.weightKg > 0 && (
          <div className="bg-card rounded-[14px] border border-border p-4 flex items-center gap-3" data-testid="bmi-display">
            <div className={`text-2xl font-display font-bold ${bmiColor}`}>
              {bmi.toFixed(1)}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-light">BMI</div>
              <div className={`text-sm font-medium ${bmiColor}`}>{bmiCategory}</div>
            </div>
          </div>
        )}
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
    <div data-testid="screen-2">
      <h2 className="font-display text-2xl font-bold mb-1">
        Health history
        <WhyWeAsk text="Your health conditions help us avoid harmful exercise recommendations and tailor nutrition advice to your specific needs." />
      </h2>
      <p className="text-text-light text-sm mb-8">Understanding your background helps us plan better</p>

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
                  <X className="w-4 h-4 text-text-light" />
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

        {/* Section B: Acute Issues */}
        <div>
          <label className="vitallity-label">Current / Acute Issues</label>
          <ChipGroup
            options={acuteOptions.map(c => ({ label: c }))}
            selected={data.acuteConditions}
            onChange={vals => update("acuteConditions", vals)}
            multiple
          />
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={data.customAcute}
              onChange={e => update("customAcute", e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomAcute()}
              placeholder="Type custom condition..."
              className="vitallity-input flex-1"
              data-testid="input-custom-acute"
            />
            <button type="button" onClick={addCustomAcute} className="vitallity-btn-ghost px-4">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section C: Medications */}
        <div>
          <label className="vitallity-label">Current Medications</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              value={data.medSearch}
              onChange={e => handleMedSearch(e.target.value)}
              placeholder="Search medications (generic or brand name)..."
              className="vitallity-input pl-11"
              data-testid="input-med-search"
            />
            {medResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-card border border-border rounded-[14px] shadow-card overflow-hidden" data-testid="med-search-results">
                {medResults.map(m => (
                  <button
                    key={m.genericName}
                    type="button"
                    onClick={() => addMed(m.genericName + (m.brandNames.length ? ` (${m.brandNames[0]})` : ""))}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors border-b border-border last:border-0"
                  >
                    <span className="font-medium">{m.genericName}</span>
                    {m.brandNames.length > 0 && (
                      <span className="text-text-light"> ({m.brandNames.join(", ")})</span>
                    )}
                    <span className="text-[10px] text-text-faint uppercase ml-2">{m.category}</span>
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
          <label className="vitallity-label">Family Health History <span className="normal-case text-text-faint">(optional)</span></label>
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
    <div data-testid="screen-3">
      <h2 className="font-display text-2xl font-bold mb-1">
        Pain areas
        <WhyWeAsk text="Knowing your pain points helps us recommend safe exercises and suggest stretches or therapies specific to your problem areas." />
      </h2>
      <p className="text-text-light text-sm mb-4">Tap areas where you experience pain or discomfort</p>

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
            bodyView === "front" ? "bg-primary text-white shadow-sm" : "text-text-mid"
          }`}
          data-testid="body-view-front"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setBodyView("back")}
          className={`flex-1 py-2 text-xs font-semibold rounded-[100px] transition-all ${
            bodyView === "back" ? "bg-primary text-white shadow-sm" : "text-text-mid"
          }`}
          data-testid="body-view-back"
        >
          Back
        </button>
      </div>

      {/* SVG Body Diagrams */}
      <div className="flex justify-center mb-4">
        {bodyView === "front" ? (
          <svg viewBox="0 0 220 380" className="w-[240px] h-[350px]" aria-label="Human body front view pain map">
            {/* Head */}
            <ellipse cx="110" cy="28" rx="20" ry="22" className={`${regionFill("Head")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Head")} data-testid="svg-head" />
            {/* Neck */}
            <rect x="101" y="51" width="18" height="14" rx="5" className={`${regionFill("Neck")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Neck")} data-testid="svg-neck" />
            {/* Left Shoulder */}
            <ellipse cx="68" cy="78" rx="18" ry="11" className={`${regionFill("Left Shoulder")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Shoulder")} data-testid="svg-left-shoulder" />
            {/* Right Shoulder */}
            <ellipse cx="152" cy="78" rx="18" ry="11" className={`${regionFill("Right Shoulder")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Shoulder")} data-testid="svg-right-shoulder" />
            {/* Chest */}
            <rect x="82" y="68" width="56" height="38" rx="8" className={`${regionFill("Chest")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Chest")} data-testid="svg-chest" />
            {/* Left Upper Arm */}
            <rect x="44" y="86" width="16" height="36" rx="6" className={`${regionFill("Left Upper Arm")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Upper Arm")} data-testid="svg-left-upper-arm" />
            {/* Right Upper Arm */}
            <rect x="160" y="86" width="16" height="36" rx="6" className={`${regionFill("Right Upper Arm")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Upper Arm")} data-testid="svg-right-upper-arm" />
            {/* Left Elbow */}
            <ellipse cx="52" cy="130" rx="10" ry="8" className={`${regionFill("Left Elbow")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Elbow")} data-testid="svg-left-elbow" />
            {/* Right Elbow */}
            <ellipse cx="168" cy="130" rx="10" ry="8" className={`${regionFill("Right Elbow")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Elbow")} data-testid="svg-right-elbow" />
            {/* Left Forearm */}
            <rect x="40" y="140" width="14" height="30" rx="5" className={`${regionFill("Left Forearm")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Forearm")} data-testid="svg-left-forearm" />
            {/* Right Forearm */}
            <rect x="166" y="140" width="14" height="30" rx="5" className={`${regionFill("Right Forearm")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Forearm")} data-testid="svg-right-forearm" />
            {/* Left Wrist */}
            <rect x="36" y="172" width="14" height="12" rx="4" className={`${regionFill("Left Wrist")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Wrist")} data-testid="svg-left-wrist" />
            {/* Right Wrist */}
            <rect x="170" y="172" width="14" height="12" rx="4" className={`${regionFill("Right Wrist")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Wrist")} data-testid="svg-right-wrist" />
            {/* Left Hand */}
            <ellipse cx="40" cy="194" rx="8" ry="10" className={`${regionFill("Left Hand")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Hand")} data-testid="svg-left-hand" />
            {/* Right Hand */}
            <ellipse cx="180" cy="194" rx="8" ry="10" className={`${regionFill("Right Hand")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Hand")} data-testid="svg-right-hand" />
            {/* Abdomen */}
            <rect x="82" y="108" width="56" height="44" rx="8" className={`${regionFill("Abdomen")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Abdomen")} data-testid="svg-abdomen" />
            {/* Left Hip */}
            <ellipse cx="88" cy="168" rx="16" ry="14" className={`${regionFill("Left Hip")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Hip")} data-testid="svg-left-hip" />
            {/* Right Hip */}
            <ellipse cx="132" cy="168" rx="16" ry="14" className={`${regionFill("Right Hip")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Hip")} data-testid="svg-right-hip" />
            {/* Left Thigh */}
            <rect x="78" y="184" width="20" height="54" rx="7" className={`${regionFill("Left Thigh")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Thigh")} data-testid="svg-left-thigh" />
            {/* Right Thigh */}
            <rect x="122" y="184" width="20" height="54" rx="7" className={`${regionFill("Right Thigh")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Thigh")} data-testid="svg-right-thigh" />
            {/* Left Knee */}
            <ellipse cx="88" cy="248" rx="13" ry="14" className={`${regionFill("Left Knee")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Knee")} data-testid="svg-left-knee" />
            {/* Right Knee */}
            <ellipse cx="132" cy="248" rx="13" ry="14" className={`${regionFill("Right Knee")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Knee")} data-testid="svg-right-knee" />
            {/* Left Shin/Calf */}
            <rect x="80" y="264" width="16" height="48" rx="6" className={`${regionFill("Left Shin/Calf")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Shin/Calf")} data-testid="svg-left-shin" />
            {/* Right Shin/Calf */}
            <rect x="124" y="264" width="16" height="48" rx="6" className={`${regionFill("Right Shin/Calf")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Shin/Calf")} data-testid="svg-right-shin" />
            {/* Left Ankle */}
            <ellipse cx="88" cy="320" rx="10" ry="8" className={`${regionFill("Left Ankle")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Ankle")} data-testid="svg-left-ankle" />
            {/* Right Ankle */}
            <ellipse cx="132" cy="320" rx="10" ry="8" className={`${regionFill("Right Ankle")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Ankle")} data-testid="svg-right-ankle" />
            {/* Left Foot */}
            <ellipse cx="88" cy="340" rx="12" ry="10" className={`${regionFill("Left Foot")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Foot")} data-testid="svg-left-foot" />
            {/* Right Foot */}
            <ellipse cx="132" cy="340" rx="12" ry="10" className={`${regionFill("Right Foot")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Foot")} data-testid="svg-right-foot" />
          </svg>
        ) : (
          <svg viewBox="0 0 220 380" className="w-[240px] h-[350px]" aria-label="Human body back view pain map">
            {/* Head (rear) */}
            <ellipse cx="110" cy="28" rx="20" ry="22" className={`${regionFill("Head")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Head")} data-testid="svg-head-back" />
            {/* Neck (rear) */}
            <rect x="101" y="51" width="18" height="14" rx="5" className={`${regionFill("Neck (rear)")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Neck (rear)")} data-testid="svg-neck-rear" />
            {/* Left Rear Shoulder */}
            <ellipse cx="68" cy="78" rx="18" ry="11" className={`${regionFill("Left Rear Shoulder")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Rear Shoulder")} data-testid="svg-left-rear-shoulder" />
            {/* Right Rear Shoulder */}
            <ellipse cx="152" cy="78" rx="18" ry="11" className={`${regionFill("Right Rear Shoulder")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Rear Shoulder")} data-testid="svg-right-rear-shoulder" />
            {/* Upper Back */}
            <rect x="82" y="68" width="56" height="30" rx="8" className={`${regionFill("Upper Back")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Upper Back")} data-testid="svg-upper-back" />
            {/* Mid Back */}
            <rect x="82" y="100" width="56" height="26" rx="6" className={`${regionFill("Mid Back")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Mid Back")} data-testid="svg-mid-back" />
            {/* Lower Back */}
            <rect x="82" y="128" width="56" height="28" rx="6" className={`${regionFill("Lower Back")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Lower Back")} data-testid="svg-lower-back" />
            {/* Left Tricep */}
            <rect x="44" y="86" width="16" height="44" rx="6" className={`${regionFill("Left Tricep")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Tricep")} data-testid="svg-left-tricep" />
            {/* Right Tricep */}
            <rect x="160" y="86" width="16" height="44" rx="6" className={`${regionFill("Right Tricep")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Tricep")} data-testid="svg-right-tricep" />
            {/* Forearms (cosmetic) */}
            <rect x="40" y="134" width="14" height="40" rx="5" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
            <rect x="166" y="134" width="14" height="40" rx="5" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
            {/* Glutes */}
            <ellipse cx="110" cy="170" rx="30" ry="18" className={`${regionFill("Glutes")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Glutes")} data-testid="svg-glutes" />
            {/* Left Hamstring */}
            <rect x="78" y="190" width="20" height="54" rx="7" className={`${regionFill("Left Hamstring")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Hamstring")} data-testid="svg-left-hamstring" />
            {/* Right Hamstring */}
            <rect x="122" y="190" width="20" height="54" rx="7" className={`${regionFill("Right Hamstring")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Hamstring")} data-testid="svg-right-hamstring" />
            {/* Knees (cosmetic) */}
            <ellipse cx="88" cy="252" rx="13" ry="12" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
            <ellipse cx="132" cy="252" rx="13" ry="12" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
            {/* Left Calf (rear) */}
            <rect x="80" y="266" width="16" height="48" rx="6" className={`${regionFill("Left Calf (rear)")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Left Calf (rear)")} data-testid="svg-left-calf-rear" />
            {/* Right Calf (rear) */}
            <rect x="124" y="266" width="16" height="48" rx="6" className={`${regionFill("Right Calf (rear)")} stroke-[1.5] cursor-pointer transition-colors`} onClick={() => togglePain("Right Calf (rear)")} data-testid="svg-right-calf-rear" />
            {/* Feet (cosmetic) */}
            <ellipse cx="88" cy="330" rx="10" ry="12" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
            <ellipse cx="132" cy="330" rx="10" ry="12" className="fill-transparent stroke-text-light/20 stroke-[1.5]" />
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
            : "border-border text-text-mid hover:bg-muted/50"
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
    <div data-testid="screen-4">
      <h2 className="font-display text-2xl font-bold mb-1">
        Exercise & activity
        <WhyWeAsk text="Your exercise background helps us set realistic starting points and suggest activities you're likely to enjoy and stick with." />
      </h2>
      <p className="text-text-light text-sm mb-8">Understanding your movement patterns</p>

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
    <div data-testid="screen-5">
      <h2 className="font-display text-2xl font-bold mb-1">
        Diet & eating
        <WhyWeAsk text="Understanding your dietary preferences and patterns lets us suggest realistic, culturally appropriate meal plans instead of generic advice." />
      </h2>
      <p className="text-text-light text-sm mb-8">Your food preferences and patterns</p>

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
            <div className="bg-card rounded-[14px] border border-border p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Flexitarian</p>
                  <p className="text-xs text-text-light mt-1">Primarily plant-based but occasionally includes meat, fish, or dairy. Focuses on whole foods, vegetables, and plant proteins while allowing flexibility for social situations or personal preference.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Low FODMAP") && (
            <div className="bg-card rounded-[14px] border border-border p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Low FODMAP</p>
                  <p className="text-xs text-text-light mt-1">A diet that limits fermentable carbohydrates that can trigger IBS symptoms. Common high-FODMAP foods to avoid: wheat, onions, garlic, beans, certain fruits. Usually done in phases with a dietitian.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Sattvic") && (
            <div className="bg-card rounded-[14px] border border-border p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sattvic</p>
                  <p className="text-xs text-text-light mt-1">A yogic diet emphasizing fresh, seasonal, and minimally processed vegetarian foods. Avoids onion, garlic, caffeine, and alcohol. Focuses on grains, fruits, vegetables, nuts, and dairy for physical and mental clarity.</p>
                </div>
              </div>
            </div>
          )}
          {data.dietaryPrefs.includes("Jain") && (
            <div className="bg-card rounded-[14px] border border-border p-4 mt-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Jain</p>
                  <p className="text-xs text-text-light mt-1">Strictly vegetarian, avoids root vegetables (potatoes, onions, garlic, carrots), mushrooms, and foods that may involve harming organisms. Eating before sunset is common practice.</p>
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
          <label className="vitallity-label">Additional Notes <span className="normal-case text-text-faint">(optional)</span></label>
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
    <div data-testid="screen-6">
      <h2 className="font-display text-2xl font-bold mb-1">Sleep, stress & constraints</h2>
      <p className="text-text-light text-sm mb-8">Factors that shape your capacity for change</p>

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
    <div data-testid="screen-7">
      <h2 className="font-display text-2xl font-bold mb-1">What worked vs. what didn't</h2>
      <p className="text-text-light text-sm mb-8">Now that we know your history, reflect on past attempts</p>

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

// ─── Screen 8: Goals ─────────────────────────────────────────
function Screen8({ data, update, bmi }: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  bmi: number;
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

  return (
    <div data-testid="screen-8">
      <h2 className="font-display text-2xl font-bold mb-1">Your health goals</h2>
      <p className="text-text-light text-sm mb-8">What matters most to you right now?</p>

      <div className="space-y-6">
        {/* BMI cards */}
        {bmi < 18.5 && (
          <div className="bg-slate-faded rounded-[14px] p-4 border border-slate/20" data-testid="bmi-card-underweight">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate">Your BMI suggests you're underweight</p>
                <p className="text-xs text-text-mid mt-1">Focus on nourishment and strength building.</p>
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
                <p className="text-xs text-text-mid mt-1">Based on your BMI, weight management could improve your overall health.</p>
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
                <p className="text-xs text-text-mid mt-1">Weight loss should be a priority for your health. We recommend discussing with your doctor.</p>
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
                <p className="text-xs text-text-mid mt-1">Your BMI requires medical attention. We strongly recommend consulting your doctor before starting any program.</p>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.bmiUnderstand}
                    onChange={e => update("bmiUnderstand", e.target.checked)}
                    className="rounded border-border"
                    data-testid="bmi-understand-checkbox"
                  />
                  <span className="text-xs font-medium text-text-mid">I understand and want to proceed</span>
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

        {/* Goal selection */}
        <div>
          <label className="vitallity-label">Select Your Goals</label>
          <ChipGroup
            options={filteredGoals}
            selected={data.goals}
            onChange={handleGoalChange}
            multiple
          />
        </div>

        {/* Custom goal */}
        <div>
          <label className="vitallity-label">Custom Goal <span className="normal-case text-text-faint">(optional)</span></label>
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

// ─── Screen 9: Calibration / Self-Assessment ─────────────────
function Screen9({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
  const pastText = (data.pastAttemptsWorked || "").toLowerCase();
  const showCrossValidation = data.selfDiscipline >= 8 &&
    (pastText.includes("fall off") || pastText.includes("couldn't maintain") || pastText.includes("stopped after") || pastText.includes("inconsist"));

  return (
    <div data-testid="screen-9">
      <h2 className="font-display text-2xl font-bold mb-1">Self-assessment</h2>
      <p className="text-text-light text-sm mb-6">Honest answers lead to realistic, lasting plans</p>

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
      <span className="absolute left-[9px] top-5 bottom-0 w-px bg-border last:hidden" aria-hidden />
      {/* dot */}
      <span className={`absolute left-0 top-1 w-[18px] h-[18px] rounded-full ${style.dot} flex items-center justify-center`}>
        <Check className="w-2.5 h-2.5 text-white" />
      </span>

      <div className="mb-1 flex items-center gap-2">
        <span className={`text-xs font-semibold ${style.label}`}>{step.weekLabel}</span>
        <button
          type="button"
          onClick={() => setEditing(e => !e)}
          className="ml-auto text-text-faint hover:text-primary transition-colors"
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
          <p className="text-xs text-text-light mt-1 italic leading-relaxed">{step.why}</p>
        </div>
      )}
    </div>
  );
}

// ─── Screen 10: Smart Glide Path ────────────────────────────────
function Screen10({ data, update }: { data: OnboardingData; update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void }) {
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
    <div data-testid="screen-10">
      <h2 className="font-display text-2xl font-bold mb-1">Your glide path</h2>
      <p className="text-text-light text-sm mb-6">A step-by-step runway to your goals, built around your reality</p>

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
          <p className="text-xs text-text-light mt-1">Go back to Step 8 and select your goals to generate your glide path</p>
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
                    <p className="text-xs text-text-light mt-0.5">{m.target}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(mIdx)}
                  className="text-text-faint hover:text-rose transition-colors shrink-0 mt-0.5"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Timeframe badge */}
              <div className="flex items-center gap-1.5 mb-5">
                <Clock className="w-3.5 h-3.5 text-text-light" />
                <span className="text-xs text-text-light font-medium">{m.timeframe}</span>
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
                          <span className="text-xs text-text-faint ml-auto">{phase.weeks}</span>
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
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{endGoalLine}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={regenerate}
          className="flex-1 border border-border rounded-[12px] p-3 flex items-center justify-center gap-2 text-sm text-text-mid hover:bg-card transition-colors"
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
    </div>
  );
}

// ─── Screen 11: Journey Review ───────────────────────────────
function Screen11({ data, bmi, bmiCategory }: { data: OnboardingData; bmi: number; bmiCategory: string }) {
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
    <div data-testid="screen-11">
      <h2 className="font-display text-2xl font-bold mb-1">Your journey map</h2>
      <p className="text-text-light text-sm mb-8">Review your information before we begin</p>

      <div className="space-y-5">
        {/* Profile card */}
        <div className="vitallity-card" data-testid="review-profile">
          <h3 className="vitallity-label">Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-light">Name</span>
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Age</span>
              <span className="font-medium">{data.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Height</span>
              <span className="font-medium">{data.heightCm} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Weight</span>
              <span className="font-medium">{data.weightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">BMI</span>
              <span className="font-medium">
                {bmi.toFixed(1)} <span className="text-text-light">({bmiCategory})</span>
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
                      {c.duration && <span className="text-[10px] text-text-light">{c.duration}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.familyConditions.length > 0 && !data.familyConditions.includes("None known") && (
              <div className="mb-3">
                <div className="text-xs text-text-light mb-1">Family History</div>
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
                <div className="text-xs text-text-light mb-1">Pain Areas</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.painAreas.map(p => (
                    <span key={p} className="bg-rose/8 text-rose text-xs rounded-full px-2.5 py-1">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {data.medications.length > 0 && (
              <div>
                <div className="text-xs text-text-light mb-1">Medications</div>
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
                <span className="text-text-light">Occupation</span>
                <span className="font-medium">{data.occupationActivity}</span>
              </div>
            )}
            {data.exerciseHistoryOption && (
              <div className="flex justify-between">
                <span className="text-text-light">Exercise History</span>
                <span className="font-medium text-right max-w-[200px]">{data.exerciseHistoryOption}</span>
              </div>
            )}
            {data.exerciseComfort && (
              <div className="flex justify-between">
                <span className="text-text-light">Exercise Comfort</span>
                <span className="font-medium text-right max-w-[200px]">{data.exerciseComfort}</span>
              </div>
            )}
            {data.sleepHours && (
              <div className="flex justify-between">
                <span className="text-text-light">Sleep</span>
                <span className="font-medium">{data.sleepHours} ({data.sleepQuality || "N/A"})</span>
              </div>
            )}
            {data.stressLevel && (
              <div className="flex justify-between">
                <span className="text-text-light">Stress</span>
                <span className="font-medium">{data.stressLevel}</span>
              </div>
            )}
          </div>
          {data.constraintChoices.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-text-light mb-1">Constraints</div>
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
            <p className="text-sm text-text-mid italic">"{data.customGoal}"</p>
          )}
          {data.goals.includes("Lose Weight") && data.targetWeightKg && (
            <div className="text-sm text-text-mid mt-2">
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
                <div className="text-xs text-text-light mt-0.5">{item.label}</div>
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
                    {m.timeframe && <span className="text-text-light ml-2">({m.timeframe})</span>}
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
