// Shared Glidepath Generator - used by both form-based and chat-based onboarding
// Evidence-based milestone generation for all goal types

export interface MilestoneData {
  title: string;
  target: string;
  timeframe: string;
  steps: { weekLabel: string; description: string; why: string }[];
  phases?: { name: string; weeks: string; color: string }[];
  trackingMetric?: string; // e.g. "weight_kg", "sleep_hours", "pain_level", etc.
}

// Minimal data shape needed for glidepath generation
// Both onboarding paths must provide this
export interface GlidepathInput {
  weightKg: number;
  heightCm: number;
  age: string;
  gender: string;
  targetWeightKg: number;
  weightTimeline: string;
  goals: string[];
  painAreas: string[];
  activities: string[];
  healthConditions: { condition: string; duration: string; notes: string }[];
  exerciseComfort: string;
  exerciseHistoryOption: string;
  sleepHours: string;
  sleepQuality: string;
  sleepIssues: string[];
  stressLevel: string;
  stressSources: string[];
  nutritionKnowledge: string | number;
  selfDiscipline: string | number;
  consistencyHistory: string | number;
  occupationActivity?: string;
  cookingStyle?: string;
  eatingChallenges?: string[];
}

export function calculateTDEE(weightKg: number, heightCm: number, age: number, gender: string, activityLevel: string): number {
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

export function calculateWeightLossParams(data: GlidepathInput) {
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

export const MILESTONE_SUGGESTIONS: Record<string, { title: string; target: string; timeframe: string; steps: { weekLabel: string; description: string; why: string }[]; phases?: { name: string; weeks: string; color: string }[] }> = {
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

export function generateGlidePath(data: GlidepathInput): MilestoneData[] {
  const conditionNames = data.healthConditions.map(c => c.condition.toLowerCase());
  const hasKneeOrBack = conditionNames.some(c =>
    c.includes("knee") || c.includes("back") || c.includes("sciatica") || c.includes("spondylosis")
  );
  const hasHeart = conditionNames.some(c => c.includes("heart"));
  const hasAsthma = conditionNames.some(c => c.includes("asthma"));
  const lowConsistency = Number(data.consistencyHistory) <= 3;
  const highConsistency = Number(data.consistencyHistory) >= 7;
  const lowDiscipline = Number(data.selfDiscipline) <= 3;

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
    const skipsBreakfast = data.eatingChallenges?.includes("Skipping breakfast");
    const hasBloodSugarIssue =
      conditionNames.some(c => c.includes("diabetes")) ||
      data.eatingChallenges?.includes("Too much sugar");
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
      data.eatingChallenges?.includes("Too much sugar") ||
      data.eatingChallenges?.includes("Not enough vegetables");

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
