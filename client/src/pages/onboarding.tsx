import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import bodyFrontImg from "@assets/body-front.png";
import bodyBackImg from "@assets/body-back.png";
import bodyFemaleFrontImg from "@assets/body-female-front.png";
import bodyFemaleBackImg from "@assets/body-female-back.png";
import { generateGlidePath, calculateWeightLossParams, calculateTDEE, MILESTONE_SUGGESTIONS, type MilestoneData, type GlidepathInput } from "@shared/glidepath";
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
// MILESTONE_SUGGESTIONS imported from @shared/glidepath

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

// MilestoneData imported from @shared/glidepath

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
  guiltyPleasures: string[];
  guiltyPleasuresFrequency: string;
  restrictedDietExperience: string[];
  snackingTiming: string[];
  foodType: string;
  waterIntake: string;
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
  guiltyPleasures: [], guiltyPleasuresFrequency: "", restrictedDietExperience: [],
  snackingTiming: [], foodType: "", waterIntake: "",
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
        // Only skip the choice screen if user has meaningfully progressed (step >= 2).
        // Steps 0 and 1 are treated as "not started" so new or barely-started
        // users always see the choice screen.
        if (progress.step && progress.step >= 2) {
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
                  <span className="font-semibold text-sm">AI Chat Consultation</span>
                  <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Recommended</span>
                </div>
                <p className="text-xs text-gray-600">
                  A conversational, chat-based intake with your AI health coach. It asks questions naturally, reacts to your answers, and builds your profile through dialogue. About 5-7 minutes.
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
                <span className="font-semibold text-sm block mb-1">Form-Based Setup</span>
                <p className="text-xs text-gray-500">
                  A structured questionnaire with screens for each topic -- health history, lifestyle, goals, and more. Faster to skim, easier to go back and edit. About 8-10 minutes.
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

// ─── Body Diagram: image-based with CSS hotspot overlays ──────

interface BodyHotspot {
  area: string;
  top: string;
  left: string;
  w: string;
  h: string;
}

const FRONT_HOTSPOTS: BodyHotspot[] = [
  { area: "Head", top: "3%", left: "44%", w: "12%", h: "7%" },
  { area: "Neck", top: "11%", left: "45%", w: "10%", h: "3%" },
  { area: "Left Shoulder", top: "15%", left: "28%", w: "12%", h: "5%" },
  { area: "Right Shoulder", top: "15%", left: "60%", w: "12%", h: "5%" },
  { area: "Chest", top: "20%", left: "38%", w: "24%", h: "8%" },
  { area: "Left Upper Arm", top: "22%", left: "18%", w: "10%", h: "10%" },
  { area: "Right Upper Arm", top: "22%", left: "72%", w: "10%", h: "10%" },
  { area: "Left Elbow", top: "33%", left: "14%", w: "8%", h: "5%" },
  { area: "Right Elbow", top: "33%", left: "78%", w: "8%", h: "5%" },
  { area: "Left Forearm", top: "38%", left: "10%", w: "10%", h: "8%" },
  { area: "Right Forearm", top: "38%", left: "80%", w: "10%", h: "8%" },
  { area: "Abdomen", top: "30%", left: "38%", w: "24%", h: "10%" },
  { area: "Left Hip", top: "42%", left: "33%", w: "12%", h: "6%" },
  { area: "Right Hip", top: "42%", left: "55%", w: "12%", h: "6%" },
  { area: "Left Thigh", top: "50%", left: "32%", w: "14%", h: "12%" },
  { area: "Right Thigh", top: "50%", left: "54%", w: "14%", h: "12%" },
  { area: "Left Knee", top: "63%", left: "33%", w: "10%", h: "5%" },
  { area: "Right Knee", top: "63%", left: "57%", w: "10%", h: "5%" },
  { area: "Left Shin", top: "70%", left: "33%", w: "10%", h: "10%" },
  { area: "Right Shin", top: "70%", left: "57%", w: "10%", h: "10%" },
  { area: "Left Ankle", top: "82%", left: "33%", w: "8%", h: "4%" },
  { area: "Right Ankle", top: "82%", left: "59%", w: "8%", h: "4%" },
  { area: "Left Foot", top: "87%", left: "30%", w: "12%", h: "5%" },
  { area: "Right Foot", top: "87%", left: "58%", w: "12%", h: "5%" },
];

const BACK_HOTSPOTS: BodyHotspot[] = [
  { area: "Head", top: "3%", left: "44%", w: "12%", h: "7%" },
  { area: "Neck", top: "11%", left: "45%", w: "10%", h: "3%" },
  { area: "Left Shoulder", top: "15%", left: "28%", w: "12%", h: "5%" },
  { area: "Right Shoulder", top: "15%", left: "60%", w: "12%", h: "5%" },
  { area: "Upper Back", top: "20%", left: "38%", w: "24%", h: "8%" },
  { area: "Mid Back", top: "28%", left: "38%", w: "24%", h: "6%" },
  { area: "Lower Back", top: "35%", left: "38%", w: "24%", h: "7%" },
  { area: "Left Tricep", top: "22%", left: "18%", w: "10%", h: "10%" },
  { area: "Right Tricep", top: "22%", left: "72%", w: "10%", h: "10%" },
  { area: "Glutes", top: "42%", left: "35%", w: "30%", h: "8%" },
  { area: "Left Hamstring", top: "52%", left: "32%", w: "14%", h: "12%" },
  { area: "Right Hamstring", top: "52%", left: "54%", w: "14%", h: "12%" },
  { area: "Left Knee", top: "63%", left: "33%", w: "10%", h: "5%" },
  { area: "Right Knee", top: "63%", left: "57%", w: "10%", h: "5%" },
  { area: "Left Calf", top: "70%", left: "33%", w: "10%", h: "10%" },
  { area: "Right Calf", top: "70%", left: "57%", w: "10%", h: "10%" },
  { area: "Left Foot", top: "87%", left: "30%", w: "12%", h: "5%" },
  { area: "Right Foot", top: "87%", left: "58%", w: "12%", h: "5%" },
];

function BodyDiagramImage({
  view,
  selectedAreas,
  onToggle,
  gender,
}: {
  view: "front" | "back";
  selectedAreas: string[];
  onToggle: (area: string) => void;
  gender?: string;
}) {
  const hotspots = view === "front" ? FRONT_HOTSPOTS : BACK_HOTSPOTS;
  const isFemale = gender === "Female";
  const imgSrc = view === "front"
    ? (isFemale ? bodyFemaleFrontImg : bodyFrontImg)
    : (isFemale ? bodyFemaleBackImg : bodyBackImg);

  return (
    <div
      className="relative w-[260px] h-[460px] mx-auto"
      aria-label={`Human body ${view} view`}
    >
      <img
        src={imgSrc}
        alt={`Body ${view} view`}
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
      {hotspots.map(spot => {
        const selected = selectedAreas.includes(spot.area);
        // Center of the hotspot for the pulse indicator
        const centerTop = `calc(${spot.top} + ${spot.h} / 2)`;
        const centerLeft = `calc(${spot.left} + ${spot.w} / 2)`;
        return (
          <React.Fragment key={spot.area}>
            {/* Invisible clickable hotspot */}
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={spot.area}
              onClick={() => onToggle(spot.area)}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle(spot.area)}
              data-testid={`spot-${spot.area.toLowerCase().replace(/[\s/()]+/g, "-")}`}
              style={{
                position: "absolute",
                top: spot.top,
                left: spot.left,
                width: spot.w,
                height: spot.h,
                cursor: "pointer",
                borderRadius: "4px",
              }}
            />
            {/* Pain pulse indicator -- centered at hotspot midpoint via negative margin */}
            {selected && (
              <div
                style={{
                  position: "absolute",
                  top: centerTop,
                  left: centerLeft,
                  marginLeft: "-20px",
                  marginTop: "-20px",
                  width: "40px",
                  height: "40px",
                  background: "radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0.3) 40%, transparent 70%)",
                  animation: "painPulse 1.8s ease-in-out infinite",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "7px",
                    color: "#ef4444",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    marginTop: "42px",
                    textShadow: "0 0 3px white",
                    pointerEvents: "none",
                  }}
                >
                  {spot.area}
                </span>
              </div>
            )}
          </React.Fragment>
        );
      })}
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

      {/* Image-based body diagram with CSS hotspots */}
      <div className="flex justify-center mb-4" data-testid="body-diagram-container">
        <BodyDiagramImage
          view={bodyView}
          selectedAreas={data.painAreas}
          onToggle={togglePain}
          gender={data.gender}
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

        {/* Snacking timing */}
        <div>
          <label className="vitallity-label">When do you typically snack?</label>
          <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
          <ChipGroup
            options={[
              { label: "Mid-morning" }, { label: "Afternoon" }, { label: "Evening with tea/chai" },
              { label: "Late night" }, { label: "While watching TV" }, { label: "When stressed" },
              { label: "Not a snacker" },
            ]}
            selected={data.snackingTiming}
            onChange={vals => update("snackingTiming", vals)}
            multiple
          />
        </div>

        {/* Water intake */}
        <div>
          <label className="vitallity-label">Daily water intake</label>
          <ChipGroup
            options={[
              { label: "Less than 1L" }, { label: "1-2L" }, { label: "2-3L" }, { label: "More than 3L" }
            ]}
            selected={data.waterIntake ? [data.waterIntake] : []}
            onChange={vals => update("waterIntake", vals[0] || "")}
          />
        </div>

        {/* Guilty pleasures */}
        <div>
          <label className="vitallity-label">Guilty pleasures</label>
          <p className="text-xs text-gray-400 mb-2">Everyone has them -- be honest, no judgment. Select all that apply.</p>
          <ChipGroup
            options={[
              { label: "Sweet tooth / desserts" }, { label: "Fried food" }, { label: "Salty snacks / chips" },
              { label: "Alcohol" }, { label: "Sugary drinks / soda" }, { label: "Late night eating" },
              { label: "Weekend binge eating" }, { label: "None really" },
            ]}
            selected={data.guiltyPleasures}
            onChange={vals => update("guiltyPleasures", vals)}
            multiple
          />
          {data.guiltyPleasures.length > 0 && !data.guiltyPleasures.includes("None really") && (
            <div className="mt-3">
              <label className="vitallity-label">How often?</label>
              <ChipGroup
                options={[
                  { label: "Daily" }, { label: "Few times a week" }, { label: "Weekends only" },
                  { label: "Occasionally" }, { label: "Rarely but in excess when I do" },
                ]}
                selected={data.guiltyPleasuresFrequency ? [data.guiltyPleasuresFrequency] : []}
                onChange={vals => update("guiltyPleasuresFrequency", vals[0] || "")}
              />
            </div>
          )}
        </div>

        {/* Restricted diet experience */}
        <div>
          <label className="vitallity-label">Diet approaches tried or currently using</label>
          <p className="text-xs text-gray-400 mb-2">Have you tried or are you currently on any of these?</p>
          <ChipGroup
            options={[
              { label: "Intermittent fasting (IF)" }, { label: "CICO (Calories in, calories out)" },
              { label: "Keto / Low carb" }, { label: "High protein" }, { label: "Calorie counting app" },
              { label: "Ayurvedic diet" }, { label: "No specific approach" },
            ]}
            selected={data.restrictedDietExperience}
            onChange={vals => update("restrictedDietExperience", vals)}
            multiple
          />
        </div>

        {/* Diet History */}
        <div>
          <label className="vitallity-label">Diet history (optional)</label>
          <textarea
            value={data.dietHistory}
            onChange={e => update("dietHistory", e.target.value)}
            rows={3}
            placeholder="Anything else about your eating history or what's worked / not worked..."
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
// calculateTDEE, calculateWeightLossParams, and generateGlidePath imported from @shared/glidepath


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
