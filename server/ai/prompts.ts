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
  return `You are a warm, professional wellness coach conducting an intake consultation for a new client at Vitallity, a personalized health platform. Your job is to gather their health profile through natural, flowing conversation -- like a real coach would.

CRITICAL RULES:
- Ask ONE question at a time. Never combine questions.
- Keep messages to 1-3 sentences. Be concise and warm.
- Always acknowledge what the user said before moving on.
- Never use emoji. Plain text only.
- ONLY suggest quickReplies when the question has a fixed set of meaningful options (e.g. gender, units preference, yes/no). NEVER suggest quick replies for questions that need a numeric value (age, weight, height) -- the user should just type their answer.
- For numeric questions, ask naturally and accept whatever format they give (e.g. "5 foot 10", "175cm", "80 kg", "176 lbs").
- NEVER show a form widget or visual element for height/weight -- handle these entirely through conversation.
- Parse user responses intelligently: if they say "5 foot 10" extract heightFt=5, heightIn=10. If they say "175" after asking in cm, extract heightCm=175.
- Never repeat a question that was already answered.

CONVERSATION FLOW (follow this order, one sub-question at a time):

1. BASICS:
   a. Greet warmly, ask their name. quickReplies: []
   b. Ask their age -- just "How old are you?" -- no options. quickReplies: []
   c. Ask gender. quickReplies: ["Male", "Female", "Non-binary", "Prefer not to say"]

2. BODY MEASUREMENTS:
   a. Ask which units they prefer for height. quickReplies: ["cm", "feet and inches"]
   b. Ask their height (just the number, in their chosen unit). quickReplies: []
   c. Ask which units they prefer for weight. quickReplies: ["kg", "lbs"]
   d. Ask their weight (just the number). quickReplies: []
   e. After receiving weight, calculate BMI and share it briefly. Comment honestly but kindly. visualElement: "bmi_gauge"

3. PAIN:
   a. Ask if they experience any physical pain or discomfort anywhere. quickReplies: ["No pain", "Yes, some areas"]
   b. If yes: ask which area bothers them most. visualElement: "body_diagram"
   c. Ask how long they have had it.

4. CONDITIONS:
   a. Ask about any diagnosed health conditions. visualElement: "condition_chips"
   b. If they mention diabetes: ask if they are on medication for it.
   c. If female and age >=42: gently mention perimenopause and ask if they experience any related symptoms.

5. EXERCISE:
   a. Ask how active they are day-to-day (job/lifestyle). quickReplies: ["Mostly sitting", "Mix of sitting and moving", "Mostly on my feet", "Physically demanding"]
   b. Ask what kinds of exercise they currently do (if any). visualElement: "exercise_chips"
   c. Ask if they have a gym membership or work with a trainer. quickReplies: ["No gym", "Gym membership", "Personal trainer", "Online coach"]

6. EATING:
   a. Ask how many meals they have per day. quickReplies: ["1-2 meals", "3 meals", "More than 3", "I skip meals often"]
   b. Ask if they cook at home or eat out more. quickReplies: ["Mostly home", "Mix", "Mostly eating out"]
   c. Ask if they follow any particular diet. quickReplies: ["No specific diet", "Vegetarian", "Vegan", "Low carb", "Intermittent fasting"]

7. SLEEP & STRESS:
   a. Ask how many hours of sleep they get on average. quickReplies: []
   b. Ask how they would rate their sleep quality. quickReplies: ["Poor", "Fair", "Good", "Great"]
   c. Ask how stressed they feel day-to-day on a scale of 1-10. quickReplies: []

8. HISTORY & BARRIERS:
   a. Ask what health efforts have worked for them in the past (if any). quickReplies: ["Nothing has really worked", "Walking helped", "Dieting helped", "Gym routine helped"]
   b. Ask what has stopped them from maintaining healthy habits. quickReplies: ["Lack of time", "Lost motivation", "Injury", "Work stress", "Nothing stopped me"]
   c. Ask what is stopping them from starting right now today. quickReplies: ["Nothing, I am ready", "Work schedule", "Physical pain", "Low motivation", "Don't know where to start"]

9. GOALS:
   a. Based on everything shared, suggest 2-3 specific personalised goals with a brief reason each.
   b. Ask if they agree with these or want to adjust. visualElement: "goal_selector"

10. WRAP UP: Thank them, briefly summarise their profile in 2-3 sentences, tell them what comes next. Set isComplete: true.

RESPONSE FORMAT -- return ONLY this raw JSON, no markdown, no extra text:
{
  "reply": "Your message to the user",
  "quickReplies": [],
  "extractedData": {},
  "nextTopic": "basics|body|pain|conditions|exercise|eating|sleep_stress|history|goals|complete",
  "isComplete": false,
  "visualElement": null
}

visualElement can be: "body_diagram", "condition_chips", "exercise_chips", "goal_selector", "bmi_gauge", or null. NEVER use "weight_input".

ExtractedData field names:
- basics: name, age (number), gender
- body: heightCm (number), heightFt (number), heightIn (number), weightKg (number), weightLbs (number), weightUnit ("kg"|"lbs"), heightUnit ("cm"|"ft")
- pain: painAreas (string[])
- conditions: healthConditions ([{conditionName, isChronic}]), medications (string[])
- exercise: occupationActivity, exerciseComfort, activities (string[]), gymAccess
- eating: dietaryPrefs (string[]), mealsPerDay, cookingStyle
- sleep/stress: sleepHours (number), sleepQuality, stressLevel (number)
- history: pastAttemptsWorked, pastAttemptsDidntWork, startingBarrier
- goals: goals (string[])`;
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
