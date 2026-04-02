import { storage } from "./storage";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_BOT_TOKEN;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch (err) {
    console.error("[Telegram] Send error:", err);
  }
}

export async function handleTelegramWebhook(update: any): Promise<void> {
  if (!update.message) return;

  const chatId = String(update.message.chat.id);
  const text = (update.message.text || "").trim();

  if (text.startsWith("/start")) {
    const token = text.replace("/start", "").trim();
    if (token) {
      const user = storage.findUserByTelegramToken(token);
      if (user) {
        storage.linkTelegram(user.id, chatId);
        await sendTelegramMessage(chatId,
          "Connected! I'll send you daily reminders and you can log check-ins right here.\n\n" +
          "Commands:\n/log - Quick daily log\n/checkin - Check-in prompts\n/status - Today's summary\n/help - List commands"
        );
        return;
      }
    }
    await sendTelegramMessage(chatId, "Welcome to Vitallity! To link your account, use the Connect button in the app Settings.");
    return;
  }

  // Find user by chatId
  const allLinked = storage.getLinkedTelegramUsers();
  const user = allLinked.find(u => u.telegramChatId === chatId);
  if (!user) {
    await sendTelegramMessage(chatId, "Your account isn't linked yet. Open Vitallity Settings and tap 'Connect Telegram'.");
    return;
  }

  if (text === "/log") {
    await sendTelegramMessage(chatId,
      "Quick log! Reply with your data in this format:\n\n" +
      "`cal:1800 steps:5000 mood:7 sleep:7.5`\n\n" +
      "All fields are optional. You can include: cal, protein, carbs, fat, steps, mood, energy, stress, pain, sleep"
    );
    return;
  }

  if (text === "/checkin") {
    await sendTelegramMessage(chatId,
      "Quick check-in! How are you doing?\n\n" +
      "Reply with: `mood:7 energy:6 stress:4`\n\n" +
      "Or just tell me how you're feeling in plain text."
    );
    return;
  }

  if (text === "/status") {
    const today = new Date().toISOString().split("T")[0];
    const log = storage.getDailyLog(user.id, today);
    const streak = storage.getDailyLogStreak(user.id);
    const points = storage.getTotalPoints(user.id);

    let msg = `*Today's Status*\n`;
    msg += `Streak: ${streak} days\n`;
    msg += `Points: ${points}\n\n`;
    if (log) {
      if (log.calories) msg += `Calories: ${log.calories}\n`;
      if (log.steps) msg += `Steps: ${log.steps}\n`;
      if (log.mood) msg += `Mood: ${log.mood}/10\n`;
      if (log.sleepHours) msg += `Sleep: ${log.sleepHours}h\n`;
      if (log.stressLevel) msg += `Stress: ${log.stressLevel}/10\n`;
    } else {
      msg += "No log yet today. Send /log to start!";
    }
    await sendTelegramMessage(chatId, msg);
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(chatId,
      "*Vitallity Bot Commands*\n\n" +
      "/log - Quick daily log\n" +
      "/checkin - Check-in prompts\n" +
      "/status - Today's summary\n" +
      "/help - This message\n\n" +
      "Or just send data like:\n`cal:1800 steps:5000 mood:7`"
    );
    return;
  }

  // Try to parse structured data
  const parsed = parseLogMessage(text);
  if (parsed && Object.keys(parsed).length > 0) {
    const today = new Date().toISOString().split("T")[0];
    storage.upsertDailyLog({ userId: user.id, date: today, ...parsed });
    const fields = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(", ");
    await sendTelegramMessage(chatId, `Logged! ${fields}`);
    return;
  }

  await sendTelegramMessage(chatId,
    "I didn't quite get that. Try /log for a guided entry or /help for commands."
  );
}

function parseLogMessage(text: string): Record<string, number> | null {
  const result: Record<string, number> = {};
  const mappings: Record<string, string> = {
    cal: "calories", calories: "calories",
    protein: "protein", prot: "protein",
    carbs: "carbs", fat: "fat",
    steps: "steps",
    mood: "mood", energy: "energyLevel",
    stress: "stressLevel", pain: "painLevel",
    sleep: "sleepHours", water: "waterMl",
  };

  const parts = text.split(/[\s,]+/);
  for (const part of parts) {
    const match = part.match(/^(\w+)[:\s=]+(\d+\.?\d*)$/);
    if (match) {
      const key = mappings[match[1].toLowerCase()];
      if (key) {
        result[key] = parseFloat(match[2]);
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export async function sendReminders(): Promise<number> {
  if (!TELEGRAM_BOT_TOKEN) return 0;
  const linkedUsers = storage.getLinkedTelegramUsers();
  let sent = 0;
  for (const user of linkedUsers) {
    if (user.telegramChatId) {
      await sendTelegramMessage(user.telegramChatId,
        "Time for your daily check-in! How are you feeling today? Reply with /checkin or /log"
      );
      sent++;
    }
  }
  return sent;
}
