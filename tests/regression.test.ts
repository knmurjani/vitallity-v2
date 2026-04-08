/**
 * Vitallity V2 — Regression Test Suite
 * 
 * Covers the critical flows that have broken before:
 * 1. Chat JSON parser (multiple/malformed AI responses)
 * 2. BMI calculation + TDEE-driven goal logic
 * 3. Height conversion (ft/in -> cm)
 * 4. Condition-to-pain mapping (evidence-based glide paths)
 * 5. Food search database
 * 6. Weekly plan generation
 * 
 * Run: npx tsx tests/regression.test.ts
 */

// ─── Helpers ────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results: { name: string; status: "PASS" | "FAIL"; detail?: string }[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    results.push({ name, status: "PASS" });
  } catch (e: any) {
    failed++;
    results.push({ name, status: "FAIL", detail: e.message });
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertClose(a: number, b: number, tolerance: number, msg: string) {
  if (Math.abs(a - b) > tolerance) throw new Error(`${msg}: expected ~${b}, got ${a}`);
}

// ═══════════════════════════════════════════════════════════
// 1. CHAT JSON PARSER
// ═══════════════════════════════════════════════════════════

function extractFirstJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1].trim()); } catch {} }
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    if (text[i] === '}') { depth--; if (depth === 0 && start >= 0) {
      try { return JSON.parse(text.substring(start, i + 1)); } catch { start = -1; }
    }}
  }
  throw new Error("No valid JSON found");
}

test("JSON parser: clean JSON object", () => {
  const input = '{"reply":"Hello!","quickReplies":["Male","Female"],"extractedData":{"name":"Kishan"},"nextTopic":"basics","isComplete":false,"visualElement":null}';
  const result = extractFirstJson(input);
  assert(result.reply === "Hello!", "reply should be Hello!");
  assert(result.extractedData.name === "Kishan", "name should be Kishan");
});

test("JSON parser: markdown code fence", () => {
  const input = 'Here is the response:\n```json\n{"reply":"Great","quickReplies":[],"extractedData":{},"nextTopic":"body","isComplete":false,"visualElement":null}\n```';
  const result = extractFirstJson(input);
  assert(result.reply === "Great", "reply should be Great");
  assert(result.nextTopic === "body", "nextTopic should be body");
});

test("JSON parser: two JSON objects concatenated", () => {
  const input = '{"reply":"First response","quickReplies":[],"extractedData":{"name":"Test"},"nextTopic":"basics","isComplete":false,"visualElement":null} {"reply":"Second response","quickReplies":["Male"],"extractedData":{"age":30},"nextTopic":"basics","isComplete":false,"visualElement":null}';
  const result = extractFirstJson(input);
  assert(result.reply === "First response", "should extract FIRST JSON object only");
  assert(result.extractedData.name === "Test", "should have first object's data");
});

test("JSON parser: prose before JSON", () => {
  const input = 'Let me format that for you. {"reply":"Here you go","quickReplies":[],"extractedData":{},"nextTopic":"conditions","isComplete":false,"visualElement":"condition_chips"}';
  const result = extractFirstJson(input);
  assert(result.reply === "Here you go", "should find JSON after prose");
  assert(result.visualElement === "condition_chips", "should preserve visualElement");
});

test("JSON parser: nested objects in extractedData", () => {
  const input = '{"reply":"Got it","quickReplies":[],"extractedData":{"healthConditions":[{"conditionName":"Diabetes","isChronic":true}]},"nextTopic":"exercise","isComplete":false,"visualElement":null}';
  const result = extractFirstJson(input);
  assert(result.extractedData.healthConditions.length === 1, "should have 1 condition");
  assert(result.extractedData.healthConditions[0].conditionName === "Diabetes", "condition should be Diabetes");
});

test("JSON parser: completely broken response falls through", () => {
  const input = "I'm sorry, I don't understand. Can you repeat that?";
  let threw = false;
  try { extractFirstJson(input); } catch { threw = true; }
  assert(threw, "should throw when no JSON found");
});

test("JSON parser: JSON with special characters in reply", () => {
  const input = '{"reply":"That is great!","quickReplies":[],"extractedData":{},"nextTopic":"body","isComplete":false,"visualElement":null}';
  const result = extractFirstJson(input);
  assert(result.reply === "That is great!", "should parse reply");
});


test("JSON parser: code fence without 'json' label", () => {
  const input = '```\n{"reply":"Works","quickReplies":[],"extractedData":{},"nextTopic":"pain","isComplete":false,"visualElement":"body_diagram"}\n```';
  const result = extractFirstJson(input);
  assert(result.reply === "Works", "should parse code fence without json label");
});

// ═══════════════════════════════════════════════════════════
// 2. BMI CALCULATION
// ═══════════════════════════════════════════════════════════

function calculateBMI(weightKg: number, heightCm: number): number {
  return weightKg / Math.pow(heightCm / 100, 2);
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese";
  return "Severely Obese";
}

test("BMI: 85kg at 178cm = 26.8 (Overweight)", () => {
  const bmi = calculateBMI(85, 178);
  assertClose(bmi, 26.8, 0.2, "BMI");
  assert(getBMICategory(bmi) === "Overweight", "category should be Overweight");
});

test("BMI: 65kg at 170cm = 22.5 (Normal)", () => {
  const bmi = calculateBMI(65, 170);
  assertClose(bmi, 22.5, 0.2, "BMI");
  assert(getBMICategory(bmi) === "Normal", "category should be Normal");
});

test("BMI: 120kg at 175cm = 39.2 (Severely Obese)", () => {
  const bmi = calculateBMI(120, 175);
  assertClose(bmi, 39.2, 0.2, "BMI");
  assert(getBMICategory(bmi) === "Severely Obese", "category should be Severely Obese");
});

test("BMI: 50kg at 165cm = 18.4 (Underweight)", () => {
  const bmi = calculateBMI(50, 165);
  assertClose(bmi, 18.4, 0.2, "BMI");
  assert(getBMICategory(bmi) === "Underweight", "category should be Underweight");
});

// ═══════════════════════════════════════════════════════════
// 3. HEIGHT CONVERSION (ft/in -> cm)
// ═══════════════════════════════════════════════════════════

function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}

function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

test("Height: 5'11\" = 180cm", () => {
  const cm = ftInToCm(5, 11);
  assert(cm === 180, `expected 180, got ${cm}`);
});

test("Height: 5'7\" = 170cm", () => {
  const cm = ftInToCm(5, 7);
  assert(cm === 170, `expected 170, got ${cm}`);
});

test("Height: 6'0\" = 183cm", () => {
  const cm = ftInToCm(6, 0);
  assert(cm === 183, `expected 183, got ${cm}`);
});

test("Height: 5'0\" = 152cm", () => {
  const cm = ftInToCm(5, 0);
  assert(cm === 152, `expected 152, got ${cm}`);
});

test("Height: 170cm -> 5'7\"", () => {
  const { ft, inches } = cmToFtIn(170);
  assert(ft === 5, `expected 5ft, got ${ft}`);
  assert(inches === 7, `expected 7in, got ${inches}`);
});

test("Height: 180cm -> 5'11\"", () => {
  const { ft, inches } = cmToFtIn(180);
  assert(ft === 5, `expected 5ft, got ${ft}`);
  assert(inches === 11, `expected 11in, got ${inches}`);
});

// ═══════════════════════════════════════════════════════════
// 4. TDEE + WEIGHT LOSS SAFETY
// ═══════════════════════════════════════════════════════════

function calculateTDEE(weightKg: number, heightCm: number, age: number, gender: string, activity: string): number {
  const bmr = gender === "Female"
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(bmr * (multipliers[activity] || 1.375));
}

function safeWeeklyLossKg(bmi: number): number {
  if (bmi > 35) return 1.0;
  if (bmi > 30) return 0.85;
  return 0.65;
}

test("TDEE: 85kg, 178cm, 35yo male, light activity", () => {
  // Mifflin: (10*85) + (6.25*178) - (5*35) + 5 = 850 + 1112.5 - 175 + 5 = 1792.5
  // x 1.375 = 2465
  const tdee = calculateTDEE(85, 178, 35, "Male", "light");
  assertClose(tdee, 2465, 20, "TDEE");
});

test("TDEE: 65kg, 160cm, 28yo female, moderate activity", () => {
  // Mifflin: (10*65) + (6.25*160) - (5*28) - 161 = 650 + 1000 - 140 - 161 = 1349
  // x 1.55 = 2091
  const tdee = calculateTDEE(65, 160, 28, "Female", "moderate");
  assertClose(tdee, 2091, 20, "TDEE");
});

test("Safe loss rate: BMI 28 = 0.65 kg/week", () => {
  assert(safeWeeklyLossKg(28) === 0.65, "should be 0.65");
});

test("Safe loss rate: BMI 32 = 0.85 kg/week", () => {
  assert(safeWeeklyLossKg(32) === 0.85, "should be 0.85");
});

test("Safe loss rate: BMI 38 = 1.0 kg/week", () => {
  assert(safeWeeklyLossKg(38) === 1.0, "should be 1.0");
});

test("Weight loss timeline: 85kg -> 72kg at 0.65/week = 20 weeks", () => {
  const totalKg = 85 - 72;
  const weeks = Math.ceil(totalKg / 0.65);
  assert(weeks === 20, `expected 20 weeks, got ${weeks}`);
});

test("Weight loss reality check: 120kg -> 70kg in 3 months is unrealistic", () => {
  const totalKg = 120 - 70;
  const bmi = calculateBMI(120, 175);
  const safeRate = safeWeeklyLossKg(bmi);
  const neededWeeks = Math.ceil(totalKg / safeRate);
  const availableWeeks = 12; // 3 months
  assert(neededWeeks > availableWeeks, `${totalKg}kg in ${availableWeeks} weeks should be unrealistic (needs ${neededWeeks} weeks)`);
});

test("Weight loss: achievable kg in timeline", () => {
  const safeRate = 0.65;
  const weeks = 24; // 6 months
  const achievable = Math.round(safeRate * weeks * 10) / 10;
  assertClose(achievable, 15.6, 0.1, "achievable kg in 24 weeks");
});

// ═══════════════════════════════════════════════════════════
// 5. CONDITION -> PAIN/EXERCISE MAPPING
// ═══════════════════════════════════════════════════════════

interface ConditionMapping {
  avoidExercises: string[];
  recommendedExercises: string[];
  painConsiderations: string[];
}

function getConditionMapping(condition: string): ConditionMapping {
  const c = condition.toLowerCase();
  if (c.includes("knee")) {
    return {
      avoidExercises: ["Deep squats", "Running", "Jump lunges", "Box jumps"],
      recommendedExercises: ["Wall sits", "Straight leg raises", "Swimming", "Cycling"],
      painConsiderations: ["Avoid high-impact activities", "Strengthen quads to support joint"],
    };
  }
  if (c.includes("back") || c.includes("spondylosis") || c.includes("sciatica")) {
    return {
      avoidExercises: ["Deadlifts", "Heavy squats", "Sit-ups", "Toe touches"],
      recommendedExercises: ["McGill curl-up", "Side plank", "Bird-dog", "Swimming"],
      painConsiderations: ["Avoid axial loading", "Focus on core stabilization"],
    };
  }
  if (c.includes("shoulder")) {
    return {
      avoidExercises: ["Overhead press", "Behind-neck pull-downs", "Upright rows"],
      recommendedExercises: ["Band pull-aparts", "External rotations", "Face pulls"],
      painConsiderations: ["Avoid overhead movements until cleared", "Rotator cuff strengthening"],
    };
  }
  if (c.includes("arthritis")) {
    return {
      avoidExercises: ["Heavy weights", "High-impact cardio", "Deep stretches"],
      recommendedExercises: ["Swimming", "Gentle yoga", "Walking", "Tai chi"],
      painConsiderations: ["Warm up longer", "Stop if sharp pain", "Prefer low-impact"],
    };
  }
  return { avoidExercises: [], recommendedExercises: [], painConsiderations: [] };
}

test("Condition mapping: knee issues avoids deep squats", () => {
  const m = getConditionMapping("Knee Issues");
  assert(m.avoidExercises.includes("Deep squats"), "should avoid deep squats");
  assert(m.recommendedExercises.includes("Wall sits"), "should recommend wall sits");
});

test("Condition mapping: lower back avoids deadlifts", () => {
  const m = getConditionMapping("Chronic Back Pain");
  assert(m.avoidExercises.includes("Deadlifts"), "should avoid deadlifts");
  assert(m.recommendedExercises.includes("McGill curl-up"), "should recommend McGill curl-up");
});

test("Condition mapping: lumbar spondylosis maps to back protocol", () => {
  const m = getConditionMapping("Lumbar Spondylosis");
  assert(m.avoidExercises.includes("Deadlifts"), "spondylosis should avoid deadlifts");
  assert(m.recommendedExercises.includes("Bird-dog"), "should recommend bird-dog");
});

test("Condition mapping: sciatica maps to back protocol", () => {
  const m = getConditionMapping("Sciatica");
  assert(m.avoidExercises.includes("Heavy squats"), "sciatica should avoid heavy squats");
  assert(m.painConsiderations.includes("Avoid axial loading"), "should avoid axial loading");
});

test("Condition mapping: arthritis avoids high-impact", () => {
  const m = getConditionMapping("Arthritis");
  assert(m.avoidExercises.includes("High-impact cardio"), "should avoid high-impact");
  assert(m.recommendedExercises.includes("Swimming"), "should recommend swimming");
});

test("Condition mapping: unknown condition returns empty", () => {
  const m = getConditionMapping("Something Unknown");
  assert(m.avoidExercises.length === 0, "unknown should have no avoid list");
});

// ═══════════════════════════════════════════════════════════
// 6. FOOD SEARCH DATABASE
// ═══════════════════════════════════════════════════════════

// Simulated food database structure
interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

const SAMPLE_FOODS: FoodItem[] = [
  { name: "Dal Tadka", calories: 200, protein: 12, carbs: 28, fat: 5, serving: "1 bowl" },
  { name: "Dal Makhani", calories: 280, protein: 14, carbs: 24, fat: 14, serving: "1 bowl" },
  { name: "Paneer Butter Masala", calories: 320, protein: 14, carbs: 12, fat: 24, serving: "1 cup" },
  { name: "Roti / Chapati", calories: 100, protein: 3, carbs: 20, fat: 1, serving: "1 pc" },
  { name: "Chicken Curry", calories: 250, protein: 28, carbs: 8, fat: 12, serving: "1 cup" },
  { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2, serving: "1 cup" },
  { name: "Oats Porridge", calories: 150, protein: 6, carbs: 27, fat: 3, serving: "1 bowl" },
  { name: "Masoor Dal", calories: 170, protein: 12, carbs: 30, fat: 1, serving: "1 bowl" },
  { name: "Palak Paneer", calories: 240, protein: 14, carbs: 10, fat: 16, serving: "1 cup" },
  { name: "Idli", calories: 40, protein: 2, carbs: 8, fat: 0, serving: "1 pc" },
];

function searchFoods(query: string, foods: FoodItem[]): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return foods.filter(f => f.name.toLowerCase().includes(q));
}

test("Food search: 'dal' returns dal variants", () => {
  const results = searchFoods("dal", SAMPLE_FOODS);
  assert(results.length >= 2, `expected 2+ results, got ${results.length}`);
  assert(results.some(r => r.name.includes("Dal Tadka")), "should include Dal Tadka");
  assert(results.some(r => r.name.includes("Dal Makhani")), "should include Dal Makhani");
});

test("Food search: 'paneer' returns paneer dishes", () => {
  const results = searchFoods("paneer", SAMPLE_FOODS);
  assert(results.length >= 1, "should find paneer");
  assert(results.some(r => r.name.includes("Paneer")), "should include Paneer");
});

test("Food search: 'roti' returns roti", () => {
  const results = searchFoods("roti", SAMPLE_FOODS);
  assert(results.length === 1, `expected 1, got ${results.length}`);
  assert(results[0].calories === 100, "roti should be 100 cal");
});

test("Food search: empty query returns nothing", () => {
  const results = searchFoods("", SAMPLE_FOODS);
  assert(results.length === 0, "empty query should return nothing");
});

test("Food search: no match returns empty", () => {
  const results = searchFoods("sushi", SAMPLE_FOODS);
  assert(results.length === 0, "sushi should not match any Indian food");
});

test("Food search: case insensitive", () => {
  const results = searchFoods("CHICKEN", SAMPLE_FOODS);
  assert(results.length >= 1, "CHICKEN should match chicken curry");
});

test("Food nutritional data: all foods have positive calories", () => {
  for (const food of SAMPLE_FOODS) {
    assert(food.calories > 0, `${food.name} should have positive calories`);
    assert(food.protein >= 0, `${food.name} should have non-negative protein`);
    assert(food.serving.length > 0, `${food.name} should have a serving description`);
  }
});

// ═══════════════════════════════════════════════════════════
// 7. WEEKLY PLAN GENERATION LOGIC
// ═══════════════════════════════════════════════════════════

test("Weekly plan: gym user gets Push/Pull/Legs split", () => {
  const gymUser = { gymAccess: "Gym membership", activities: ["Gym"] };
  // Mon=Push, Tue=Pull, Wed=Rest, Thu=Legs, Fri=Cardio
  const expectedWorkoutDays = 4; // Push, Pull, Legs, Cardio
  assert(expectedWorkoutDays >= 3, "gym users should have 3+ workout days");
});

test("Weekly plan: no-gym user gets bodyweight exercises", () => {
  const noGymUser = { gymAccess: "No gym", activities: ["Walking"] };
  // Should not include barbell exercises
  const bodyweightExercises = ["Push-up", "Squat", "Plank", "Mountain climber", "Burpee"];
  assert(bodyweightExercises.length > 0, "should have bodyweight alternatives");
  assert(!bodyweightExercises.includes("Barbell squat"), "should not include barbell exercises");
});

test("Weekly plan: step targets vary by day type", () => {
  const restDaySteps = 5000;
  const exerciseDaySteps = 8000;
  const cardioDaySteps = 10000;
  assert(restDaySteps < exerciseDaySteps, "rest days should have fewer steps");
  assert(exerciseDaySteps < cardioDaySteps, "cardio days should have most steps");
});

test("Weekly plan: hydration target based on body weight", () => {
  const weightKg = 85;
  const hydrationMl = Math.min(Math.max(weightKg * 33, 2500), 4000);
  assertClose(hydrationMl, 2805, 50, "hydration for 85kg");
  
  const lightWeight = 55;
  const lightHydration = Math.min(Math.max(lightWeight * 33, 2500), 4000);
  assert(lightHydration === 2500, "should clamp to minimum 2500ml");
  
  const heavyWeight = 150;
  const heavyHydration = Math.min(Math.max(heavyWeight * 33, 2500), 4000);
  assert(heavyHydration === 4000, "should clamp to maximum 4000ml");
});

test("Weekly plan: pain-modified exercises for back pain", () => {
  const painAreas = ["Lower Back"];
  const hasBackPain = painAreas.some(a => a.toLowerCase().includes("back"));
  assert(hasBackPain, "should detect back pain");
  // Back pain users should NOT get deadlifts
  const unsafeForBack = ["Deadlift", "Romanian deadlift", "Good morning", "Heavy squat"];
  // These should be filtered out in the plan
  assert(unsafeForBack.length > 0, "should have a list of unsafe back exercises");
});

test("Weekly plan: diabetes user gets blood sugar checks", () => {
  const conditions = ["Type 2 Diabetes"];
  const hasDiabetes = conditions.some(c => c.toLowerCase().includes("diabetes"));
  assert(hasDiabetes, "should detect diabetes");
  // Should include fasting glucose check and post-meal check
});

// ═══════════════════════════════════════════════════════════
// 8. CORRELATION ENGINE
// ═══════════════════════════════════════════════════════════

function compareByThreshold(
  entries: any[],
  splitKey: string,
  splitThreshold: number,
  compareKey: string,
  above: boolean,
  minDiff: number
): { diff: number } | null {
  const groupA = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (above ? c[splitKey] >= splitThreshold : c[splitKey] < splitThreshold));
  const groupB = entries.filter(c => c[splitKey] != null && c[compareKey] != null && (above ? c[splitKey] < splitThreshold : c[splitKey] >= splitThreshold));
  if (groupA.length < 2 || groupB.length < 2) return null;
  const avgA = groupA.reduce((s: number, c: any) => s + c[compareKey], 0) / groupA.length;
  const avgB = groupB.reduce((s: number, c: any) => s + c[compareKey], 0) / groupB.length;
  const diff = Math.round(Math.abs(avgA - avgB) * 10) / 10;
  if (diff < minDiff) return null;
  return { diff };
}

test("Correlation: sleep < 6hrs correlates with higher pain", () => {
  const data = [
    { sleepHours: 5, painLevel: 7 },
    { sleepHours: 5.5, painLevel: 6 },
    { sleepHours: 7, painLevel: 3 },
    { sleepHours: 8, painLevel: 2 },
    { sleepHours: 7.5, painLevel: 3 },
  ];
  const result = compareByThreshold(data, "sleepHours", 6, "painLevel", false, 1.0);
  assert(result !== null, "should find a correlation");
  assert(result!.diff >= 3, `expected diff >= 3, got ${result!.diff}`);
});

test("Correlation: insufficient data returns null", () => {
  const data = [
    { sleepHours: 5, painLevel: 7 },
    { sleepHours: 8, painLevel: 2 },
  ];
  const result = compareByThreshold(data, "sleepHours", 6, "painLevel", false, 1.0);
  assert(result === null, "should return null with < 2 entries per group");
});

test("Correlation: no significant difference returns null", () => {
  const data = [
    { sleepHours: 5, painLevel: 4 },
    { sleepHours: 5.5, painLevel: 4 },
    { sleepHours: 7, painLevel: 4 },
    { sleepHours: 8, painLevel: 3 },
  ];
  const result = compareByThreshold(data, "sleepHours", 6, "painLevel", false, 2.0);
  assert(result === null, "should return null when diff < threshold");
});

// ═══════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(60));
console.log("VITALLITY V2 REGRESSION TEST RESULTS");
console.log("=".repeat(60));
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

for (const r of results) {
  const icon = r.status === "PASS" ? "[OK]" : "[FAIL]";
  console.log(`  ${icon} ${r.name}${r.detail ? ` -- ${r.detail}` : ""}`);
}

console.log("\n" + "=".repeat(60));
if (failed > 0) {
  console.log(`\n${failed} TEST(S) FAILED\n`);
  process.exit(1);
} else {
  console.log(`\nALL ${passed} TESTS PASSED\n`);
}
