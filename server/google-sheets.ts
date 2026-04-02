import { storage } from "./storage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export function isGoogleSheetsConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;
}

function getRedirectUri(): string {
  const base = process.env.APP_URL || "http://localhost:5000";
  return `${base}/api/google-sheets/callback`;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error("Failed to exchange code for tokens");
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error("Failed to refresh access token");
  return data.access_token;
}

const SHEET_HEADERS = [
  "Date", "Calories", "Protein", "Carbs", "Fat", "Sugar", "Fiber",
  "Water (ml)", "Steps", "Active Min", "Activity", "Sleep (hrs)",
  "Sleep Quality", "Stress", "Mood", "Energy", "Pain", "Notes",
];

async function createSpreadsheet(accessToken: string): Promise<string> {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: "Vitallity Daily Log" },
      sheets: [{
        properties: { title: "Daily Log" },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: SHEET_HEADERS.map(h => ({
              userEnteredValue: { stringValue: h },
              userEnteredFormat: { textFormat: { bold: true } },
            })),
          }],
        }],
      }],
    }),
  });
  const data = await res.json() as any;
  if (!data.spreadsheetId) throw new Error("Failed to create spreadsheet");
  return data.spreadsheetId;
}

function logToRow(log: any): (string | number)[] {
  return [
    log.date || "",
    log.calories || "",
    log.protein || "",
    log.carbs || "",
    log.fat || "",
    log.sugar || "",
    log.fiber || "",
    log.waterMl || "",
    log.steps || "",
    log.activeMinutes || "",
    log.activityType || "",
    log.sleepHours || "",
    log.sleepQuality || "",
    log.stressLevel || "",
    log.mood || "",
    log.energyLevel || "",
    log.painLevel || "",
    log.notes || "",
  ];
}

export async function handleOAuthCallback(code: string, userId: number): Promise<string> {
  const { accessToken, refreshToken } = await exchangeCodeForTokens(code);
  const spreadsheetId = await createSpreadsheet(accessToken);
  storage.setGoogleSheetsConnection(userId, refreshToken, spreadsheetId);

  // Backfill existing logs
  try {
    await backfillLogs(userId, accessToken, spreadsheetId);
  } catch (err) {
    console.error("[GoogleSheets] Backfill error:", err);
  }

  return spreadsheetId;
}

async function backfillLogs(userId: number, accessToken: string, spreadsheetId: string): Promise<void> {
  const logs = storage.getAllDailyLogs(userId);
  if (logs.length === 0) return;

  const rows = logs.map(logToRow);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Log!A2:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    }
  );
}

export async function syncDailyLog(userId: number, log: any): Promise<void> {
  if (!isGoogleSheetsConfigured()) return;

  const user = storage.getUserById(userId);
  if (!user || !user.googleSheetsConnected || !user.googleSheetsRefreshToken || !user.googleSheetsSpreadsheetId) return;

  try {
    const accessToken = await refreshAccessToken(user.googleSheetsRefreshToken);
    const spreadsheetId = user.googleSheetsSpreadsheetId;

    // Read existing data to find the row for this date
    const getRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Log!A:A`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const getData = await getRes.json() as any;
    const values = getData.values || [];

    const dateStr = log.date;
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i]?.[0] === dateStr) {
        rowIndex = i + 1; // 1-based for Sheets API
        break;
      }
    }

    const row = logToRow(log);

    if (rowIndex > 0) {
      // Update existing row
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Log!A${rowIndex}:R${rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
    } else {
      // Append new row
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Log!A2:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: [row] }),
        }
      );
    }
  } catch (err) {
    console.error("[GoogleSheets] Sync error:", err);
  }
}

export async function fullSync(userId: number): Promise<void> {
  if (!isGoogleSheetsConfigured()) return;

  const user = storage.getUserById(userId);
  if (!user || !user.googleSheetsConnected || !user.googleSheetsRefreshToken || !user.googleSheetsSpreadsheetId) return;

  const accessToken = await refreshAccessToken(user.googleSheetsRefreshToken);
  const spreadsheetId = user.googleSheetsSpreadsheetId;

  // Clear existing data (keep header)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daily%20Log!A2:R?clear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  await backfillLogs(userId, accessToken, spreadsheetId);
}
