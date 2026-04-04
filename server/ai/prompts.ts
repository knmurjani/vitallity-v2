import { storage } from "../storage";

export interface UserContext {
  profile: any;
  conditions: any[];
  medications: any[];
  painAreas: any[];
  dietaryPrefs: any[];
  goals: any[];
  milestones: any[];
  todayCheckIn: any | null;
  todayFoods: any[];
  todayWater: any[];
  recentCheckIns: any[];
}

export function getUserContext(userId: number): UserContext {
  const profile = storage.getProfile(userId);
  const conditions = storage.getConditions(userId);
  const medications = storage.getMedications(userId);
  const painAreas = storage.getPainAreas(userId);
  const dietaryPrefs = storage.getDietaryPrefs(userId);
  const goals = storage.getGoals(userId);
  const milestones = storage.getMilestones(userId);
  const todayCheckIn = storage.getTodayCheckIn(userId);
  const todayFoods = todayCheckIn ? storage.getFoodLogsForCheckIn(todayCheckIn.id) : [];
  const todayWater = todayCheckIn ? storage.getWaterLogsForCheckIn(todayCheckIn.id) : [];
  const recentCheckIns = storage.getCheckInsByUser(userId, 7);

  return {
    profile,
    conditions,
    medications,
    painAreas,
    dietaryPrefs,
    goals,
    milestones,
    todayCheckIn,
    todayFoods,
    todayWater,
    recentCheckIns,
  };
}

function bmiClass(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function calorieTarget(profile: any): number {
  const { weightKg, heightCm, age, gender, activityLevel } = profile || {};
  if (!weightKg || !heightCm || !age) return 2000;
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr += gender === "Male" || gender === "male" ? 5 : -161;
  const multiplier = activityLevel === "Sedentary" ? 1.2 : activityLevel === "Lightly Active" || activityLevel === "Light" ? 1.375 : 1.55;
  const tdee = bmr * multiplier;
  return Math.round(tdee - 500);
}

function buildProfileBlock(ctx: UserContext): string {
  const p = ctx.profile || {};
  const bmi = p.bmi ? parseFloat(p.bmi) : null;
  const calTarget = calorieTarget(p);
  const lines: string[] = [
    "## USER PROFILE",
    `Name: ${p.name || "Unknown"}`,
    `Age: ${p.age || "?"}, Gender: ${p.gender || "?"}`,
    `Height: ${p.heightCm || "?"}cm, Weight: ${p.weightKg || "?"}kg`,
  ];
  if (bmi) lines.push(`BMI: ${bmi} (${bmiClass(bmi)})`);
  lines.push(`Activity Level: ${p.activityLevel || "Moderate"}`);
  lines.push(`Daily Calorie Target: ${calTarget} kcal`);

  if (ctx.conditions.length > 0) {
    lines.push(`\n## CONDITIONS\n${ctx.conditions.map(c => `- ${c.conditionName}${c.isChronic ? " (chronic)" : ""}`).join("\n")}`);
  }
  if (ctx.medications.length > 0) {
    lines.push(`\n## MEDICATIONS\n${ctx.medications.map(m => `- ${m.medicationName}`).join("\n")}`);
  }
  if (ctx.painAreas.length > 0) {
    lines.push(`\n## PAIN AREAS\n${ctx.painAreas.map(a => `- ${a.areaName}`).join("\n")}`);
  }
  if (ctx.dietaryPrefs.length > 0) {
    lines.push(`\n## DIETARY PREFERENCES\n${ctx.dietaryPrefs.map(d => `- ${d.preferenceName}`).join("\n")}`);
  }
  if (ctx.goals.length > 0) {
    lines.push(`\n## GOALS\n${ctx.goals.map(g => `- ${g.goalType}${g.targetValue ? ` (target: ${g.targetValue})` : ""}`).join("\n")}`);
  }
  if (ctx.milestones.length > 0) {
    lines.push(`\n## MILESTONES\n${ctx.milestones.map(m => `- ${m.title}${m.target ? ` — ${m.target}` : ""}${m.timeframe ? ` (${m.timeframe})` : ""} [status: ${m.status}]`).join("\n")}`);
  }

  const cal = ctx.profile;
  if (cal?.nutritionKnowledge || cal?.exerciseKnowledge || cal?.selfDiscipline || cal?.consistencyHistory) {
    lines.push(`\n## CALIBRATION`);
    if (cal.nutritionKnowledge) lines.push(`Nutrition Knowledge: ${cal.nutritionKnowledge}`);
    if (cal.exerciseKnowledge) lines.push(`Exercise Knowledge: ${cal.exerciseKnowledge}`);
    if (cal.selfDiscipline) lines.push(`Self-Discipline: ${cal.selfDiscipline}`);
    if (cal.consistencyHistory) lines.push(`Consistency History: ${cal.consistencyHistory}`);
  }

  return lines.join("\n");
}

function buildRecentCheckInsBlock(ctx: UserContext): string {
  if (ctx.recentCheckIns.length === 0) return "";
  const lines = ["\n## LAST 7 DAYS"];
  for (const ci of ctx.recentCheckIns) {
    lines.push(`${ci.date}: E=${ci.energy || "?"} M=${ci.mood || "?"} S=${ci.stress || "?"} Sleep=${ci.sleepQuality || "?"} Pain=${ci.painLevel || "?"} Cal=${ci.totalCalories || 0} Water=${ci.totalWaterMl || 0}ml`);
  }
  return lines.join("\n");
}

function buildTodayBlock(ctx: UserContext): string {
  const ci = ctx.todayCheckIn;
  if (!ci) return "\n## TODAY'S CHECK-IN\nNo check-in yet today.";

  const lines = [
    "\n## TODAY'S CHECK-IN",
    `Time: ${ci.timeOfDay || "?"}`,
    `Energy: ${ci.energy || "?"}/10, Mood: ${ci.mood || "?"}/10, Stress: ${ci.stress || "?"}/10, Sleep: ${ci.sleepQuality || "?"}/10`,
    `Pain: ${ci.painLevel || "?"}/10, Skin: ${ci.skinRating || "?"}/10`,
  ];
  if (ci.weight) lines.push(`Weight: ${(ci.weight / 10).toFixed(1)}kg`);
  if (ci.painNotes) lines.push(`Pain Notes: ${ci.painNotes}`);
  if (ci.helpRequest) lines.push(`Help Request: ${ci.helpRequest}`);
  if (ci.exerciseTypes) {
    try {
      const types = JSON.parse(ci.exerciseTypes);
      lines.push(`Exercise: ${types.join(", ")}${ci.exerciseDuration ? ` for ${ci.exerciseDuration}min` : ""}`);
    } catch {}
  }
  if (ci.traveling) lines.push("TRAVELING TODAY");
  if (ci.plans) lines.push(`Plans: ${ci.plans}`);
  if (ci.notes) lines.push(`Notes: ${ci.notes}`);

  const calTarget = calorieTarget(ctx.profile);
  const calConsumed = ci.totalCalories || ctx.todayFoods.reduce((s: number, f: any) => s + (f.calories || 0), 0);
  const waterConsumed = ci.totalWaterMl || ctx.todayWater.reduce((s: number, w: any) => s + w.amountMl * (w.quantity || 1), 0);

  lines.push(`\nCalories consumed: ${calConsumed} / ${calTarget} target`);
  lines.push(`Water consumed: ${waterConsumed}ml / 2500ml target`);

  if (ctx.todayFoods.length > 0) {
    lines.push(`\nFoods logged:`);
    for (const f of ctx.todayFoods) {
      lines.push(`- ${f.foodName} (${f.mealType}) x${f.quantity} ${f.unit} — ${f.calories}cal`);
    }
  }

  return lines.join("\n");
}

export function buildInsightSystemPrompt(ctx: UserContext): string {
  return `You are Vitallity's wellness insight engine. You analyze daily check-in data to provide personalized, actionable health insights.

${buildProfileBlock(ctx)}
${buildRecentCheckInsBlock(ctx)}
${buildTodayBlock(ctx)}

## CONDITION RULES
- If user has Fibromyalgia and pain >= 5: Emphasize rest, gentle movement, self-compassion
- If user has Type 2 Diabetes and carbs > 160g: Flag high carb intake, suggest alternatives
- If user has IBS and stress >= 7: Recommend low-FODMAP, stress management
- If user has Chronic Migraine and sleep <= 4: Warn about migraine trigger
- If user has Compressed Nerve and doing heavy lifting: Redirect to core stability

## CALIBRATION RULES
- If nutrition knowledge is low: Explain WHY not just WHAT to eat
- If self-discipline is low: Keep suggestions small and achievable
- If consistency history is low: Focus on maintaining streaks, not perfection

## RESPONSE FORMAT
Respond with a JSON array of insight objects. Each has:
- "text": The insight text (1-2 concise sentences, no emoji)
- "priority": "high" | "medium" | "low"
- "category": one of "vitals", "nutrition", "hydration", "exercise", "pain", "sleep", "mental", "condition", "general"

Prioritize: high = needs immediate attention (pain, critical values), medium = worth noting, low = positive reinforcement.
Return 3-6 insights, most important first. Be specific to this user's conditions and data.
Return ONLY the raw JSON array — no markdown code fences, no backticks, no prose before or after.`;
}

export function buildChatSystemPrompt(ctx: UserContext, travelMode: boolean, illnessMode: boolean, illnessDetails?: string): string {
  const calTarget = calorieTarget(ctx.profile);
  const calConsumed = ctx.todayCheckIn?.totalCalories || ctx.todayFoods.reduce((s: number, f: any) => s + (f.calories || 0), 0);
  const waterConsumed = ctx.todayCheckIn?.totalWaterMl || ctx.todayWater.reduce((s: number, w: any) => s + w.amountMl * (w.quantity || 1), 0);
  const proteinConsumed = ctx.todayFoods.reduce((s: number, f: any) => s + (f.protein || 0) / 10, 0);

  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });

  let prompt = `You are Vitallity's AI wellness companion. You're warm, knowledgeable, and empathetic. You help users track their health journey with personalized advice grounded in their specific conditions and goals.

${buildProfileBlock(ctx)}

## TODAY SO FAR
- Calories: ${calConsumed} consumed / ${calTarget} target (${calTarget - calConsumed} remaining)
- Protein: ${Math.round(proteinConsumed)}g consumed
- Water: ${waterConsumed}ml / 2500ml target (${Math.max(0, 2500 - waterConsumed)}ml remaining)

## CONVERSATION CONTEXT
- Time: ${timeLabel} (${day})
- Travel mode: ${travelMode ? "ACTIVE" : "inactive"}
- Illness mode: ${illnessMode ? "ACTIVE" : "inactive"}

## CAPABILITIES
You can help with:
- Meal suggestions based on remaining calories/macros and dietary preferences
- Exercise recommendations adjusted for conditions and pain levels
- Motivation and emotional support
- Explaining nutrition concepts (calibrated to user's knowledge level)
- Food logging via conversation

## FOOD LOGGING FORMAT
When the user tells you what they ate, extract the food items and respond with both a conversational message AND a structured block:
[FOOD_LOG]
[{"name": "food name", "qty": 1, "unit": "piece", "calories": 150, "protein": 10, "carbs": 15, "fat": 5, "meal": "breakfast", "source": "Homemade"}]
[/FOOD_LOG]
Include this block ONLY when the user's CURRENT message is clearly reporting food they ate (e.g. "I had...", "ate...", "for lunch I had..."). NEVER include [FOOD_LOG] when the user is asking questions, requesting advice, or discussing anything other than reporting a meal. Estimate calories/macros for Indian foods using typical portions.

## RULES
- Keep responses concise (2-4 sentences unless explaining something)
- Never use emoji — use plain text only
- Always consider the user's conditions when giving advice
- If pain is high, prioritize rest over activity
- Be encouraging but honest
- Don't diagnose — you're a wellness companion, not a doctor
- When unsure about medical specifics, suggest consulting their healthcare provider`;

  if (travelMode) {
    prompt += `

## TRAVEL MODE ACTIVE
The user is traveling today. Adjust all advice for travel context:
- Suggest portable, easy-to-find foods (airport/hotel/restaurant options)
- Remind about hydration (especially if flying)
- Suggest light exercises doable in a hotel room
- Be understanding about routine disruption
- On first message in travel mode, provide a brief pre-travel health briefing`;
  }

  if (illnessMode) {
    prompt += `

## ILLNESS MODE ACTIVE
${illnessDetails ? `Details: ${illnessDetails}` : "The user appears to be ill."}
- Priority is REST and RECOVERY
- Suggest easy-to-digest, comforting foods (khichdi, dal rice, soups, ORS)
- Do NOT suggest exercise — recommend gentle movement only if they feel up to it
- Remind about medication timing if on medications
- Be extra empathetic and supportive
- Monitor hydration closely`;
  }

  return prompt;
}

export function buildHealthSummarySystemPrompt(): string {
  return `You are a compassionate, evidence-based health advisor analyzing a new client's intake form.
Provide a clear, honest, non-judgmental health assessment. Be specific -- reference their actual data.
Do not use emoji. Be warm but direct. Use "you" language.
Format your response as JSON with these exact keys:
{
  "profileSnapshot": "string",
  "observations": ["string", "string"],
  "healthConsiderations": ["string"],
  "strengths": ["string"],
  "focusAreas": ["string"],
  "recommendedApproach": "string",
  "clarifyingQuestions": [] 
}
The clarifyingQuestions array should only contain questions if there is genuinely unclear or contradictory data. Leave it as an empty array if the data is clear.
Return ONLY the raw JSON object -- no markdown code fences, no backticks, no prose before or after.`;
}

export function buildOnboardingChatSystemPrompt(): string {
  return `You are a warm, professional wellness coach conducting an intake consultation for a new client at Vitallity, a personalized health platform. Your job is to gather their health profile through natural conversation.

RULES:
- Ask ONE question at a time. Never ask multiple questions in one message.
- Keep messages to 1-3 sentences. Be concise but warm.
- React to their answers before moving on. Acknowledge what they said.
- Never use emoji. Use plain text only.
- Suggest 2-4 quick reply options for each question as chips.
- Extract structured data from every response.

CONVERSATION FLOW (follow this order):
1. BASICS: Greet them, ask their name. Then age. Then gender.
2. BODY: Ask height and weight. Calculate BMI and comment on it honestly but kindly. Trigger the weight_input visual.
3. PAIN: Ask if they experience any pain or discomfort. If yes, trigger body_diagram visual. Ask about duration and severity.
4. CONDITIONS: Ask about diagnosed health conditions. Trigger condition_chips. If they mention diabetes, ask about medication and HbA1c. If female and 42+, gently ask about perimenopause symptoms.
5. EXERCISE: Ask about current activity. Trigger exercise_chips. Ask about gym/trainer access.
6. EATING: Ask about typical eating patterns (meals per day, cooking vs eating out, any diet they follow).
7. SLEEP & STRESS: Ask about sleep (hours, quality) and stress (level, sources).
8. HISTORY: Ask what they have tried before and what worked or did not. Ask what is stopping them from starting today.
9. GOALS: Based on everything, suggest 2-3 specific goals with rationale. Ask if they agree or want different goals. Trigger goal_selector.
10. WRAP UP: Summarize what you have learned. Set isComplete to true.

RESPONSE FORMAT (JSON):
{
  "reply": "Your message to the user",
  "quickReplies": ["Option 1", "Option 2", "Option 3"],
  "extractedData": { ...partial onboarding data fields... },
  "nextTopic": "basics|body|pain|conditions|exercise|eating|sleep_stress|history|goals|complete",
  "isComplete": false,
  "visualElement": null
}

For visualElement, use one of: "body_diagram", "weight_input", "condition_chips", "exercise_chips", "goal_selector", "bmi_gauge", or null.

ExtractedData should use these field names matching the onboarding data model:
- basics: name, age, gender
- body: heightCm, weightKg (or heightFt/heightIn for feet, weightUnit for lbs)
- pain: painAreas (array of strings)
- conditions: healthConditions (array of {conditionName, isChronic}), medications (array of strings)
- exercise: occupationActivity, exerciseComfort, activities (array), gymAccess
- eating: dietaryPrefs (array), mealsPerDay, cookingStyle, dietHistory
- sleep/stress: sleepHours, sleepQuality, stressLevel, stressSources (array)
- history: pastAttemptsWorked, pastAttemptsDidntWork, startingBarrier
- goals: goals (array of strings)

Return ONLY the raw JSON object -- no markdown code fences, no backticks, no prose before or after.`;
}

export function buildMotivationPrompt(energy: number, mood: number, stress: number, pain: number): string {
  return `Given: energy=${energy}, mood=${mood}, stress=${stress}, pain=${pain}
Generate a single motivational line (max 20 words) appropriate for someone feeling this way.
If pain is high, focus on self-compassion.
If stress is high, focus on permission to be imperfect.
If everything is good, focus on momentum.
Respond with ONLY the quote, no quotes around it.`;
}

export function buildWeeklyReviewPrompt(ctx: UserContext, weeklyData: { checkIn: any; foods: any[]; water: any[] }[]): string {
  const profileBlock = buildProfileBlock(ctx);

  let dataBlock = "\n## 7-DAY DETAILED BREAKDOWN\n";
  for (const day of weeklyData) {
    const ci = day.checkIn;
    dataBlock += `\n### ${ci.date}\n`;
    dataBlock += `Energy: ${ci.energy || "?"}, Mood: ${ci.mood || "?"}, Stress: ${ci.stress || "?"}, Sleep: ${ci.sleepQuality || "?"}\n`;
    dataBlock += `Pain: ${ci.painLevel || "?"}, Skin: ${ci.skinRating || "?"}\n`;
    dataBlock += `Calories: ${ci.totalCalories || 0}, Water: ${ci.totalWaterMl || 0}ml\n`;
    if (ci.exerciseTypes) {
      try {
        const types = JSON.parse(ci.exerciseTypes);
        dataBlock += `Exercise: ${types.join(", ")}${ci.exerciseDuration ? ` (${ci.exerciseDuration}min)` : ""}\n`;
      } catch {}
    }
    if (day.foods.length > 0) {
      dataBlock += `Foods: ${day.foods.map((f: any) => f.foodName).join(", ")}\n`;
    }
  }

  return `You are Vitallity's deep analysis engine performing a weekly health review.

${profileBlock}
${dataBlock}

## ANALYZE
1. Trends in energy, mood, stress, sleep, and pain over the week
2. Nutrition patterns — calorie consistency, macro balance, meal timing
3. Exercise adherence vs goals and conditions
4. Hydration patterns
5. Condition-specific observations (flare patterns, triggers)

## GENERATE
Respond with a JSON object:
{
  "summary": "2-3 sentence overall summary of the week",
  "wins": ["list of 2-4 positive observations"],
  "improvements": ["list of 2-3 areas to improve with specific suggestions"],
  "milestoneSuggestion": "suggestion for milestone adjustment if needed, or null",
  "nextWeekFocus": "one key focus area for next week",
  "calibrationUpdate": "observation about user's engagement level and any calibration adjustments"
}

Be specific, reference actual data points, and tailor advice to this user's conditions and goals.
Return ONLY the raw JSON object — no markdown code fences, no backticks, no prose before or after.`;
}
