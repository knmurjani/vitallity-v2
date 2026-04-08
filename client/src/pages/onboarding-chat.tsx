import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import {
  ArrowLeft, Send, Mic, MicOff, Sparkles, Loader2,
  MessageCircle, Check, AlertTriangle, Eye, Star,
  Target, Compass, Shield, Brain,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "ai" | "user" | "system";
  content: string;
  quickReplies?: string[];
  visualElement?: string | null;
}

interface AIChatResponse {
  reply: string;
  quickReplies: string[];
  extractedData: Record<string, unknown>;
  nextTopic: string;
  isComplete: boolean;
  visualElement: string | null;
}

interface OnboardingChatData {
  name: string;
  age: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  heightFt: number;
  heightIn: number;
  heightUnit: "cm" | "ftin";
  weightUnit: "kg" | "lbs";
  healthConditions: { condition: string; duration: string; notes: string }[];
  acuteConditions: string[];
  medications: string[];
  familyConditions: string[];
  painAreas: string[];
  occupationActivity: string;
  exerciseHistoryOption: string;
  exerciseComfort: string;
  activities: string[];
  gymAccess: string;
  dietaryPrefs: string[];
  mealsPerDay: string;
  cookingStyle: string;
  dietHistory: string;
  eatingChallenges: string[];
  sleepHours: string;
  sleepQuality: string;
  sleepIssues: string[];
  stressLevel: string;
  stressSources: string[];
  pastAttemptsWorked: string;
  pastAttemptsDidntWork: string;
  startingBarrier: string;
  goals: string[];
  nutritionKnowledge: number;
  exerciseKnowledge: number;
  selfDiscipline: number;
  consistencyHistory: number;
  whyNow: string;
  snackingHabit: string;
  customDietPref: string;
  customGoal: string;
  targetWeightKg: number;
  targetWeightUnit: "kg" | "lbs";
  weightTimeline: string;
  bmiUnderstand: boolean;
  constraintChoices: string[];
  milestones: unknown[];
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

// ─── Stage Config ─────────────────────────────────────────────

const STAGES = [
  { key: "basics", label: "Basics" },
  { key: "body", label: "Body" },
  { key: "pain", label: "Pain" },
  { key: "conditions", label: "Conditions" },
  { key: "exercise", label: "Lifestyle" },
  { key: "eating", label: "Lifestyle" },
  { key: "sleep_stress", label: "Lifestyle" },
  { key: "history", label: "History" },
  { key: "goals", label: "Goals" },
  { key: "complete", label: "Summary" },
];

const DISPLAY_STAGES = [
  { keys: ["basics"], label: "Basics" },
  { keys: ["body"], label: "Body" },
  { keys: ["pain", "conditions"], label: "Health" },
  { keys: ["exercise", "eating", "sleep_stress"], label: "Lifestyle" },
  { keys: ["history"], label: "History" },
  { keys: ["goals"], label: "Goals" },
  { keys: ["complete"], label: "Summary" },
];

function getStageIndex(nextTopic: string): number {
  return DISPLAY_STAGES.findIndex(s => s.keys.includes(nextTopic));
}

// ─── Voice Input Hook ────────────────────────────────────────

function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);

  const start = () => {
    setError(null);
    try {
      const SpeechRecognition =
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition ||
        (window as unknown as Record<string, unknown>).SpeechRecognition;
      if (!SpeechRecognition) {
        setError("Voice input not supported in this browser");
        return;
      }
      const recognition = new (SpeechRecognition as { new(): unknown })() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: Array<{ [key: number]: { transcript: string } }> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      recognition.onresult = (e) => {
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
    (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
    setIsListening(false);
  };

  return { isListening, error, start, stop };
}

// ─── Default Onboarding Data ─────────────────────────────────

const defaultChatData: OnboardingChatData = {
  name: "", age: "", gender: "",
  heightCm: 170, weightKg: 70,
  heightFt: 5, heightIn: 7,
  heightUnit: "cm", weightUnit: "kg",
  healthConditions: [], acuteConditions: [], medications: [],
  familyConditions: [], painAreas: [],
  occupationActivity: "", exerciseHistoryOption: "", exerciseComfort: "",
  activities: [], gymAccess: "",
  dietaryPrefs: [], mealsPerDay: "", cookingStyle: "",
  dietHistory: "", eatingChallenges: [],
  sleepHours: "", sleepQuality: "", sleepIssues: [],
  stressLevel: "", stressSources: [],
  pastAttemptsWorked: "", pastAttemptsDidntWork: "",
  startingBarrier: "", goals: [],
  nutritionKnowledge: 5, exerciseKnowledge: 5,
  selfDiscipline: 5, consistencyHistory: 5, whyNow: "",
  snackingHabit: "", customDietPref: "", customGoal: "",
  targetWeightKg: 65, targetWeightUnit: "kg",
  weightTimeline: "", bmiUnderstand: false,
  constraintChoices: [], milestones: [],
};

// ─── Visual Element Components ───────────────────────────────

const PAIN_OPTIONS = [
  "Head", "Neck", "Left Shoulder", "Right Shoulder", "Chest",
  "Upper Back", "Mid Back", "Lower Back",
  "Left Hip", "Right Hip", "Abdomen",
  "Left Knee", "Right Knee", "Left Ankle", "Right Ankle",
  "Left Wrist", "Right Wrist", "Full Body", "None",
];

const HEALTH_CONDITIONS = [
  "Type 2 Diabetes", "Type 1 Diabetes", "Hypertension",
  "Heart Condition", "Thyroid", "PCOD/PCOS", "Fibromyalgia",
  "Arthritis", "Chronic Back Pain", "Knee Issues",
  "IBS/Digestive Issues", "Chronic Migraine", "Depression/Anxiety",
  "Sleep Apnea", "Sciatica", "Acid Reflux/GERD",
  "Asthma", "Burnout", "Perimenopause", "None currently",
];

const EXERCISE_OPTIONS = [
  "Walking", "Yoga", "Gym / Weight Training", "Running",
  "Swimming", "Cycling", "Dance", "Home Workouts",
  "Stretching", "Pilates", "Badminton", "Cricket",
  "Zumba", "CrossFit", "None yet",
];

const GOAL_OPTIONS = [
  "Lose Weight", "Build Strength", "Manage Pain",
  "Better Sleep", "More Energy", "Reduce Stress",
  "Improve Blood Markers", "Manage Diabetes",
  "Improve Fitness",
];

function BodyDiagramVisual({ onSelect }: { onSelect: (areas: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (area: string) => {
    setSelected(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3" data-testid="visual-body-diagram">
      <p className="text-xs text-gray-500 mb-3 font-medium">Select areas of pain or discomfort</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PAIN_OPTIONS.map(area => (
          <button
            key={area}
            type="button"
            onClick={() => toggle(area)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(area)
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            data-testid={`pain-area-${area.toLowerCase().replace(/\s/g, "-")}`}
          >
            {area}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(selected)}
        disabled={selected.length === 0}
        className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-40 transition-opacity"
        data-testid="pain-area-confirm"
      >
        {selected.length === 0 ? "Select areas above" : `Confirm ${selected.length} area${selected.length > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

function WeightInputVisual({ onSelect }: { onSelect: (data: { heightCm: number; weightKg: number }) => void }) {
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obese" : "Severely Obese";
  const bmiColor = bmi < 25 ? "#16a34a" : bmi < 30 ? "#f59e0b" : bmi < 35 ? "#f97316" : "#ef4444";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3" data-testid="visual-weight-input">
      <p className="text-xs text-gray-500 mb-3 font-medium">Enter your measurements</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Height (cm)</label>
          <input
            type="number"
            value={heightCm}
            onChange={e => setHeightCm(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            min={100} max={250}
            data-testid="input-height-cm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Weight (kg)</label>
          <input
            type="number"
            value={weightKg}
            onChange={e => setWeightKg(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            min={30} max={300}
            data-testid="input-weight-kg"
          />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center mb-4">
        <span className="text-lg font-bold" style={{ color: bmiColor }}>{bmi.toFixed(1)}</span>
        <span className="text-xs text-gray-500 ml-2">BMI</span>
        <span className="text-xs ml-2 font-medium" style={{ color: bmiColor }}>({bmiCategory})</span>
      </div>
      <button
        type="button"
        onClick={() => onSelect({ heightCm, weightKg })}
        className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white"
        data-testid="weight-input-confirm"
      >
        Confirm measurements
      </button>
    </div>
  );
}

function ConditionChipsVisual({ onSelect }: { onSelect: (conditions: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (c: string) => {
    setSelected(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3" data-testid="visual-condition-chips">
      <p className="text-xs text-gray-500 mb-3 font-medium">Select any conditions that apply</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {HEALTH_CONDITIONS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(c)
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            data-testid={`condition-${c.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(selected)}
        className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white"
        data-testid="condition-chips-confirm"
      >
        {selected.length === 0 ? "None of these apply" : `Confirm ${selected.length} condition${selected.length > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

function ExerciseChipsVisual({ onSelect }: { onSelect: (activities: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (a: string) => {
    setSelected(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3" data-testid="visual-exercise-chips">
      <p className="text-xs text-gray-500 mb-3 font-medium">What activities do you do or enjoy?</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {EXERCISE_OPTIONS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => toggle(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selected.includes(a)
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            data-testid={`exercise-${a.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {a}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(selected)}
        className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white"
        data-testid="exercise-chips-confirm"
      >
        {selected.length === 0 ? "I don't exercise currently" : `Confirm selection`}
      </button>
    </div>
  );
}

function GoalSelectorVisual({ onSelect }: { onSelect: (goals: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (g: string) => {
    setSelected(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3" data-testid="visual-goal-selector">
      <p className="text-xs text-gray-500 mb-3 font-medium">Select your goals (choose all that apply)</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {GOAL_OPTIONS.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
              selected.includes(g)
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            data-testid={`goal-${g.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
          >
            {g}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSelect(selected)}
        disabled={selected.length === 0}
        className="w-full py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-40 transition-opacity"
        data-testid="goal-selector-confirm"
      >
        {selected.length === 0 ? "Select at least one goal" : `Confirm goals`}
      </button>
    </div>
  );
}

function BmiGaugeVisual({ heightCm, weightKg }: { heightCm: number; weightKg: number }) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obese" : "Severely Obese";
  const bmiColor = bmi < 25 ? "#16a34a" : bmi < 30 ? "#f59e0b" : bmi < 35 ? "#f97316" : "#ef4444";
  const needle = Math.min(Math.max((bmi - 15) / (45 - 15), 0), 1);
  const needleAngle = -180 + needle * 180;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 my-3 flex flex-col items-center" data-testid="visual-bmi-gauge">
      <svg viewBox="0 0 220 110" width="160" height="80" aria-label="BMI gauge">
        <path d="M 20 90 A 90 90 0 0 1 110 0" fill="none" stroke="#16a34a" strokeWidth="10" />
        <path d="M 110 0 A 90 90 0 0 1 164 22" fill="none" stroke="#f59e0b" strokeWidth="10" />
        <path d="M 164 22 A 90 90 0 0 1 195 68" fill="none" stroke="#f97316" strokeWidth="10" />
        <path d="M 195 68 A 90 90 0 0 1 200 90" fill="none" stroke="#ef4444" strokeWidth="10" />
        <line
          x1="110" y1="90"
          x2={110 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
          y2={90 + 70 * Math.sin((needleAngle * Math.PI) / 180)}
          stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx="110" cy="90" r="5" fill="#1A1A1A" />
        <text x="110" y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill={bmiColor}>{bmi.toFixed(1)}</text>
      </svg>
      <p className="text-sm font-semibold mt-1" style={{ color: bmiColor }}>{bmiCategory}</p>
      <p className="text-xs text-gray-500 mt-0.5">BMI: {bmi.toFixed(1)} | {heightCm}cm, {weightKg}kg</p>
    </div>
  );
}

// ─── Health Summary Display ──────────────────────────────────

function HealthSummaryDisplay({ data, summary }: { data: OnboardingChatData; summary: HealthSummaryData }) {
  const bmi = data.heightCm && data.weightKg ? data.weightKg / Math.pow(data.heightCm / 100, 2) : 0;
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obese" : "Severely Obese";
  const bmiColor = bmi < 25 ? "#16a34a" : bmi < 30 ? "#f59e0b" : bmi < 35 ? "#f97316" : "#ef4444";
  const needle = bmi > 0 ? Math.min(Math.max((bmi - 15) / (45 - 15), 0), 1) : 0;
  const needleAngle = -180 + needle * 180;

  const sections = [
    { key: "observations" as const, label: "Key Observations", icon: <Eye className="w-4 h-4" />, border: "border-l-amber-400" },
    { key: "healthConsiderations" as const, label: "Health Considerations", icon: <Shield className="w-4 h-4" />, border: "border-l-red-400" },
    { key: "strengths" as const, label: "Your Strengths", icon: <Star className="w-4 h-4" />, border: "border-l-green-400" },
    { key: "focusAreas" as const, label: "Focus Areas", icon: <Target className="w-4 h-4" />, border: "border-l-primary" },
  ];

  return (
    <div className="my-3 space-y-3" data-testid="health-summary-display">
      {/* Profile snapshot + BMI */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-3">Profile Snapshot</p>
        {bmi > 0 && (
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0">
              <svg viewBox="0 0 220 110" width="110" height="55" aria-label="BMI gauge">
                <path d="M 20 90 A 90 90 0 0 1 110 0" fill="none" stroke="#16a34a" strokeWidth="10" />
                <path d="M 110 0 A 90 90 0 0 1 164 22" fill="none" stroke="#f59e0b" strokeWidth="10" />
                <path d="M 164 22 A 90 90 0 0 1 195 68" fill="none" stroke="#f97316" strokeWidth="10" />
                <path d="M 195 68 A 90 90 0 0 1 200 90" fill="none" stroke="#ef4444" strokeWidth="10" />
                <line
                  x1="110" y1="90"
                  x2={110 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
                  y2={90 + 70 * Math.sin((needleAngle * Math.PI) / 180)}
                  stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"
                />
                <circle cx="110" cy="90" r="5" fill="#1A1A1A" />
                <text x="110" y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill={bmiColor}>{bmi.toFixed(1)}</text>
              </svg>
              <p className="text-[10px] text-center text-gray-500">{bmiCategory}</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 flex-1 self-center">
              {[
                { label: "Age", value: data.age ? `${data.age} yrs` : "--" },
                { label: "Weight", value: data.weightKg ? `${data.weightKg}kg` : "--" },
                { label: "Goals", value: `${data.goals.length}` },
                { label: "Conditions", value: `${data.healthConditions.length}` },
              ].map(s => (
                <div key={s.label} className="bg-white/60 rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-foreground leading-relaxed">{summary.profileSnapshot}</p>
      </div>

      {/* Sections */}
      {sections.map(({ key, label, icon, border }) => {
        const items = summary[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key} className={`bg-white border-l-4 ${border} rounded-xl p-3.5`}>
            <div className="flex items-center gap-2 mb-2 text-gray-700">
              {icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">-</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {summary.recommendedApproach && (
        <div className="bg-white border-l-4 border-l-blue-400 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2 text-gray-700">
            <Compass className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Recommended Approach</span>
          </div>
          <p className="text-sm text-gray-700">{summary.recommendedApproach}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function OnboardingChat() {
  const { user, refreshUser } = useAuth();
  const authFetch = useAuthFetch();
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: string; content: string }[]>([]);
  const [currentData, setCurrentData] = useState<OnboardingChatData>(defaultChatData);
  const [nextTopic, setNextTopic] = useState("basics");
  const [isComplete, setIsComplete] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [healthSummary, setHealthSummary] = useState<HealthSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [usedQuickReplies, setUsedQuickReplies] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get latest message quick replies
  const latestAiMessage = [...messages].reverse().find(m => m.role === "ai");
  const activeQuickReplies = latestAiMessage?.quickReplies?.filter(qr => !usedQuickReplies.has(qr)) ?? [];

  // Send to AI and get response
  const sendToAI = useCallback(async (
    userContent: string,
    updatedApiMessages: { role: string; content: string }[]
  ) => {
    setIsLoading(true);
    try {
      const res = await authFetch("POST", "/api/ai/onboarding-chat", {
        messages: updatedApiMessages,
        currentData,
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      const json: AIChatResponse = await res.json();

      // Merge extracted data
      if (json.extractedData && Object.keys(json.extractedData).length > 0) {
        setCurrentData(prev => {
          const merged = { ...prev };
          const d = json.extractedData as Partial<OnboardingChatData>;

          if (d.name) merged.name = d.name;
          if (d.age) merged.age = String(d.age);
          if (d.gender) merged.gender = String(d.gender);

          // Height: handle cm, ft/in, and convert between them
          if (d.heightCm) merged.heightCm = Number(d.heightCm);
          if ((d as any).heightFt) merged.heightFt = Number((d as any).heightFt);
          if ((d as any).heightIn !== undefined) merged.heightIn = Number((d as any).heightIn);
          if ((d as any).heightUnit) merged.heightUnit = String((d as any).heightUnit);
          // Convert ft/in to cm if we got feet but no cm
          if ((d as any).heightFt && !d.heightCm) {
            const ft = Number((d as any).heightFt);
            const inches = Number((d as any).heightIn) || 0;
            merged.heightCm = Math.round((ft * 12 + inches) * 2.54);
            merged.heightFt = ft;
            merged.heightIn = inches;
          }
          // If we already have ft/in stored, recalculate cm from them
          if (merged.heightFt && merged.heightUnit === "ft") {
            merged.heightCm = Math.round((merged.heightFt * 12 + (merged.heightIn || 0)) * 2.54);
          }

          // Weight: handle kg, lbs, and convert
          if (d.weightKg) merged.weightKg = Number(d.weightKg);
          if ((d as any).weightLbs) {
            merged.weightKg = Math.round(Number((d as any).weightLbs) / 2.20462 * 10) / 10;
          }
          if ((d as any).weightUnit) merged.weightUnit = String((d as any).weightUnit);
          if (d.painAreas) merged.painAreas = d.painAreas as string[];
          if (d.activities) merged.activities = d.activities as string[];
          if (d.goals) merged.goals = d.goals as string[];
          if (d.dietaryPrefs) merged.dietaryPrefs = d.dietaryPrefs as string[];
          if (d.stressSources) merged.stressSources = d.stressSources as string[];
          if (d.sleepIssues) merged.sleepIssues = d.sleepIssues as string[];
          if (d.eatingChallenges) merged.eatingChallenges = d.eatingChallenges as string[];

          // Simple string fields
          const stringFields = [
            "occupationActivity", "exerciseComfort", "exerciseHistoryOption",
            "gymAccess", "mealsPerDay", "cookingStyle", "dietHistory",
            "sleepHours", "sleepQuality", "stressLevel",
            "pastAttemptsWorked", "pastAttemptsDidntWork", "startingBarrier",
          ] as const;
          for (const f of stringFields) {
            if (d[f]) (merged as Record<string, unknown>)[f] = d[f];
          }

          if (d.healthConditions) {
            const hc = d.healthConditions as Array<{ conditionName?: string; condition?: string; isChronic?: boolean }>;
            merged.healthConditions = hc.map(c => ({
              condition: c.conditionName || c.condition || String(c),
              duration: "",
              notes: "",
            }));
          }
          if (d.medications) merged.medications = (d.medications as string[]);

          return merged;
        });
      }

      setNextTopic(json.nextTopic || "basics");

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: json.reply,
        quickReplies: json.quickReplies,
        visualElement: json.visualElement,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Append AI response to api messages
      setApiMessages(prev => [...prev, { role: "assistant", content: json.reply }]);

      if (json.isComplete) {
        setIsComplete(true);
      }
    } catch (err) {
      console.error("[OnboardingChat] AI error:", err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "system",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, currentData]);

  // Initialize conversation
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initMessages: { role: string; content: string }[] = [
      { role: "user", content: "Hello, I am ready to start my health consultation." }
    ];
    setApiMessages(initMessages);
    sendToAI("Hello, I am ready to start my health consultation.", initMessages);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle sending a message
  const handleSend = useCallback(async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || isLoading) return;

    setInputText("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages(prev => [...prev, userMsg]);

    const newApiMessages = [...apiMessages, { role: "user", content }];
    setApiMessages(newApiMessages);

    await sendToAI(content, newApiMessages);
  }, [inputText, isLoading, apiMessages, sendToAI]);

  // Handle quick reply tap
  const handleQuickReply = (qr: string) => {
    setUsedQuickReplies(prev => { const s = new Set(Array.from(prev)); s.add(qr); return s; });
    handleSend(qr);
  };

  // Handle visual element selection
  const handleVisualSelect = (visualType: string, value: unknown) => {
    let messageText = "";

    if (visualType === "body_diagram") {
      const areas = value as string[];
      messageText = areas.length === 0 || areas.includes("None")
        ? "I do not have any pain or discomfort currently."
        : `I experience pain in: ${areas.join(", ")}.`;
      setCurrentData(prev => ({ ...prev, painAreas: areas }));
    } else if (visualType === "weight_input") {
      const d = value as { heightCm: number; weightKg: number };
      messageText = `My height is ${d.heightCm}cm and my weight is ${d.weightKg}kg.`;
      setCurrentData(prev => ({ ...prev, heightCm: d.heightCm, weightKg: d.weightKg }));
    } else if (visualType === "condition_chips") {
      const conditions = value as string[];
      if (conditions.length === 0 || conditions.includes("None currently")) {
        messageText = "I do not have any diagnosed health conditions.";
      } else {
        messageText = `I have been diagnosed with: ${conditions.join(", ")}.`;
        setCurrentData(prev => ({
          ...prev,
          healthConditions: conditions.map(c => ({ condition: c, duration: "", notes: "" })),
        }));
      }
    } else if (visualType === "exercise_chips") {
      const activities = value as string[];
      if (activities.length === 0 || activities.includes("None yet")) {
        messageText = "I do not currently exercise.";
      } else {
        messageText = `I do: ${activities.join(", ")}.`;
        setCurrentData(prev => ({ ...prev, activities }));
      }
    } else if (visualType === "goal_selector") {
      const goals = value as string[];
      messageText = `My goals are: ${goals.join(", ")}.`;
      setCurrentData(prev => ({ ...prev, goals }));
    }

    if (messageText) {
      handleSend(messageText);
    }
  };

  // Voice input
  const { isListening, error: voiceError, start: startVoice, stop: stopVoice } = useVoiceInput((transcript) => {
    setInputText(transcript);
  });

  // Fetch health summary when complete
  useEffect(() => {
    if (!isComplete || healthSummary || summaryLoading) return;
    setSummaryLoading(true);
    setSummaryError(null);

    const payload = {
      profile: {
        name: currentData.name,
        age: currentData.age,
        gender: currentData.gender,
        heightCm: currentData.heightCm,
        weightKg: currentData.weightKg,
      },
      conditions: currentData.healthConditions,
      medications: currentData.medications,
      painAreas: currentData.painAreas,
      exercise: {
        occupationActivity: currentData.occupationActivity,
        exerciseComfort: currentData.exerciseComfort,
        exerciseHistory: currentData.exerciseHistoryOption,
        activities: currentData.activities,
      },
      eating: {
        mealsPerDay: currentData.mealsPerDay,
        cookingStyle: currentData.cookingStyle,
        dietaryPrefs: currentData.dietaryPrefs,
        dietHistory: currentData.dietHistory,
      },
      sleep: {
        sleepHours: currentData.sleepHours,
        sleepQuality: currentData.sleepQuality,
      },
      stress: {
        stressLevel: currentData.stressLevel,
        stressSources: currentData.stressSources,
      },
      pastAttemptsWorked: currentData.pastAttemptsWorked,
      goals: currentData.goals,
    };

    authFetch("POST", "/api/ai/health-summary", payload)
      .then(res => res.json())
      .then(json => setHealthSummary(json))
      .catch(() => setSummaryError("Could not generate your health summary."))
      .finally(() => setSummaryLoading(false));
  }, [isComplete, healthSummary, summaryLoading, currentData, authFetch]);

  // Save onboarding data and complete
  const handleCompleteOnboarding = async () => {
    setCompletionSaving(true);
    try {
      // Save profile step 1
      await authFetch("POST", "/api/onboarding/step/1", {
        name: currentData.name,
        age: currentData.age,
        gender: currentData.gender,
        heightCm: currentData.heightCm,
        weightKg: currentData.weightKg,
      });

      // Save conditions step 2
      await authFetch("POST", "/api/onboarding/step/2", {
        conditions: currentData.healthConditions.map(c => ({
          conditionName: c.condition,
          isChronic: true,
        })),
        medications: currentData.medications,
        healthHistory: currentData.healthConditions.map(c => c.condition).join(", "),
        familyHistory: "",
      });

      // Save pain areas step 3
      await authFetch("POST", "/api/onboarding/step/3", {
        painAreas: currentData.painAreas,
      });

      // Save exercise step 4
      await authFetch("POST", "/api/onboarding/step/4", {
        occupationActivity: currentData.occupationActivity,
        exerciseComfort: currentData.exerciseComfort,
        exerciseHistoryOption: currentData.exerciseHistoryOption,
        activities: currentData.activities,
        gymAccess: currentData.gymAccess,
      });

      // Save diet step 5
      await authFetch("POST", "/api/onboarding/step/5", {
        dietaryPrefs: currentData.dietaryPrefs,
        currentEating: currentData.cookingStyle,
        dietHistory: currentData.dietHistory,
      });

      // Save sleep/stress step 6
      await authFetch("POST", "/api/onboarding/step/6", {
        sleepStress: `Sleep: ${currentData.sleepHours}, ${currentData.sleepQuality}. Stress: ${currentData.stressLevel}`,
        constraints: "",
      });

      // Save history step 7
      await authFetch("POST", "/api/onboarding/step/7", {
        pastAttemptsWorked: currentData.pastAttemptsWorked,
      });

      // Save goals step 8
      await authFetch("POST", "/api/onboarding/step/8", {
        goals: currentData.goals,
        targetWeightKg: currentData.targetWeightKg,
        weightTimeline: currentData.weightTimeline,
      });

      // Complete onboarding
      await authFetch("POST", "/api/onboarding/complete");
      await refreshUser();
    } catch (err) {
      console.error("[OnboardingChat] completion error:", err);
      setCompletionSaving(false);
    }
  };

  // Stage index for progress dots
  const stageIndex = Math.max(0, getStageIndex(nextTopic));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="onboarding-chat">
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 shrink-0" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 bg-white z-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-label="Vitallity">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <path d="M9 17L13 22L23 10" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold tracking-tight">Vitallity</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5" data-testid="progress-dots">
          {DISPLAY_STAGES.map((stage, i) => (
            <div
              key={stage.label + i}
              title={stage.label}
              className={`rounded-full transition-all duration-300 ${
                i < stageIndex
                  ? "w-2 h-2 bg-primary"
                  : i === stageIndex
                  ? "w-3 h-2 bg-primary"
                  : "w-2 h-2 bg-gray-200"
              }`}
              data-testid={`stage-dot-${i}`}
            />
          ))}
        </div>

        {/* Switch to Quick Setup */}
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="text-xs text-gray-500 hover:text-primary transition-colors"
          data-testid="switch-to-quick-setup"
        >
          Quick Setup
        </button>
      </div>

      {/* Stage label */}
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 shrink-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium text-center">
          {DISPLAY_STAGES[stageIndex]?.label ?? "Consultation"}
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="chat-area">
        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (msg.role === "ai") {
            return (
              <div key={msg.id} className="flex items-start gap-2.5" data-testid={`msg-ai-${msg.id}`}>
                {/* Coach avatar */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-900 leading-relaxed max-w-xs">
                    {msg.content}
                  </div>

                  {/* Visual element inline */}
                  {msg.visualElement === "body_diagram" && (
                    <BodyDiagramVisual
                      onSelect={(areas) => handleVisualSelect("body_diagram", areas)}
                    />
                  )}
                  {msg.visualElement === "weight_input" && (
                    <WeightInputVisual
                      onSelect={(d) => handleVisualSelect("weight_input", d)}
                    />
                  )}
                  {msg.visualElement === "condition_chips" && (
                    <ConditionChipsVisual
                      onSelect={(conditions) => handleVisualSelect("condition_chips", conditions)}
                    />
                  )}
                  {msg.visualElement === "exercise_chips" && (
                    <ExerciseChipsVisual
                      onSelect={(activities) => handleVisualSelect("exercise_chips", activities)}
                    />
                  )}
                  {msg.visualElement === "goal_selector" && (
                    <GoalSelectorVisual
                      onSelect={(goals) => handleVisualSelect("goal_selector", goals)}
                    />
                  )}
                  {msg.visualElement === "bmi_gauge" && currentData.heightCm > 0 && currentData.weightKg > 0 && (
                    <BmiGaugeVisual
                      heightCm={currentData.heightCm}
                      weightKg={currentData.weightKg}
                    />
                  )}
                </div>
              </div>
            );
          }

          // User message
          return (
            <div key={msg.id} className="flex justify-end" data-testid={`msg-user-${msg.id}`}>
              <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-xs">
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5" data-testid="typing-indicator">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Health summary on completion */}
        {isComplete && (
          <div className="space-y-3">
            {summaryLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
                Generating your health summary...
              </div>
            )}
            {summaryError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{summaryError}</span>
              </div>
            )}
            {healthSummary && (
              <HealthSummaryDisplay data={currentData} summary={healthSummary} />
            )}

            {(healthSummary || summaryError) && (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={completionSaving}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                data-testid="complete-onboarding"
              >
                {completionSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up your profile...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Go to my dashboard
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom bar: quick replies + input */}
      {!isComplete && (
        <div className="shrink-0 bg-white border-t border-gray-100 px-4 pt-2 pb-4 safe-area-bottom">
          {/* Quick reply chips */}
          {activeQuickReplies.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" data-testid="quick-replies">
              {activeQuickReplies.map(qr => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-primary/30 text-xs text-primary font-medium bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-40"
                  data-testid={`quick-reply-${qr.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-4 py-2.5 gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
                data-testid="chat-input"
              />
            </div>

            {/* Mic button */}
            <button
              type="button"
              onClick={isListening ? stopVoice : startVoice}
              disabled={isLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                isListening
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

            {/* Send button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-40 transition-opacity shrink-0"
              data-testid="chat-send"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Voice error */}
          {voiceError && (
            <p className="text-xs text-red-500 mt-1 px-1">{voiceError}</p>
          )}
        </div>
      )}
    </div>
  );
}
