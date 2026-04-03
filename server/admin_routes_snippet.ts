
// ==================== ADMIN AUTH ====================

const ADMIN_JWT_SECRET = process.env.JWT_SECRET || "vitallity-dev-secret-2026";
const ADMIN_EMAIL = "admin@vitallity.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vitallity-admin-2026";

interface AdminJwtPayload {
  isAdmin: boolean;
  email: string;
}

function extractAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminJwtPayload;
    if (!decoded.isAdmin) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
  }
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ==================== ADMIN LOGIN ====================

app.post("/api/admin/login", (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = jwt.sign(
    { isAdmin: true, email: ADMIN_EMAIL },
    ADMIN_JWT_SECRET,
    { expiresIn: "24h" }
  );
  res.json({ token, email: ADMIN_EMAIL });
});

// ==================== ADMIN DASHBOARD KPIs ====================

app.get("/api/admin/dashboard/kpis", extractAdmin, (_req: Request, res: Response) => {
  const today = todayStr();
  const weekAgo = daysAgoStr(7);

  const totalUsers = rawDb.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };

  const activeToday = rawDb.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id FROM check_ins WHERE date = ?
      UNION
      SELECT user_id FROM daily_logs WHERE date = ?
    )
  `).get(today, today) as { count: number };

  const newThisWeek = rawDb.prepare(`
    SELECT COUNT(*) as count FROM users WHERE created_at >= ?
  `).get(weekAgo) as { count: number };

  const onboardingStats = rawDb.prepare(`
    SELECT
      COUNT(CASE WHEN onboarding_completed = 1 THEN 1 END) as completed,
      COUNT(*) as total
    FROM users
  `).get() as { completed: number; total: number };

  const checkInStats = rawDb.prepare(`
    SELECT COUNT(*) as total FROM check_ins
  `).get() as { total: number };

  res.json({
    totalUsers: totalUsers.count,
    activeToday: activeToday.count,
    newThisWeek: newThisWeek.count,
    onboardingRate:
      onboardingStats.total > 0
        ? Math.round((onboardingStats.completed / onboardingStats.total) * 100)
        : 0,
    avgCheckInsPerUser:
      totalUsers.count > 0
        ? parseFloat((checkInStats.total / totalUsers.count).toFixed(1))
        : 0,
  });
});

// ==================== ADMIN DASHBOARD CHARTS ====================

app.get("/api/admin/dashboard/signups", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(daysAgoStr(30)) as { date: string; count: number }[];
  res.json(data);
});

app.get("/api/admin/dashboard/dau", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT date, COUNT(DISTINCT user_id) as count FROM (
      SELECT user_id, date FROM check_ins WHERE date >= ?
      UNION ALL
      SELECT user_id, date FROM daily_logs WHERE date >= ?
    ) GROUP BY date ORDER BY date
  `).all(daysAgoStr(14), daysAgoStr(14)) as { date: string; count: number }[];
  res.json(data);
});

app.get("/api/admin/dashboard/onboarding-funnel", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT onboarding_step as step, COUNT(*) as count
    FROM users
    GROUP BY onboarding_step
    ORDER BY onboarding_step
  `).all() as { step: number; count: number }[];
  res.json(data);
});

app.get("/api/admin/dashboard/feature-usage", extractAdmin, (_req: Request, res: Response) => {
  const checkInCount = rawDb.prepare("SELECT COUNT(*) as count FROM check_ins").get() as { count: number };
  const dailyLogCount = rawDb.prepare("SELECT COUNT(*) as count FROM daily_logs").get() as { count: number };
  const chatCount = rawDb.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE role = 'user'").get() as { count: number };
  const healthRecordCount = rawDb.prepare("SELECT COUNT(*) as count FROM health_records").get() as { count: number };
  const foodLogCount = rawDb.prepare("SELECT COUNT(*) as count FROM food_logs").get() as { count: number };

  res.json([
    { name: "Check-ins", value: checkInCount.count },
    { name: "Daily Logs", value: dailyLogCount.count },
    { name: "Chat Messages", value: chatCount.count },
    { name: "Health Records", value: healthRecordCount.count },
    { name: "Meal Photos", value: foodLogCount.count },
  ]);
});

app.get("/api/admin/dashboard/retention", extractAdmin, (_req: Request, res: Response) => {
  const cohorts = [1, 7, 30];
  const results: { day: number; rate: number }[] = [];

  for (const day of cohorts) {
    const cohortStart = daysAgoStr(day + 7);
    const cohortEnd = daysAgoStr(day);

    const stat = rawDb.prepare(`
      SELECT
        COUNT(DISTINCT u.id) as cohort_size,
        COUNT(DISTINCT CASE WHEN ci.user_id IS NOT NULL THEN u.id END) as retained
      FROM users u
      LEFT JOIN check_ins ci ON ci.user_id = u.id AND ci.date >= ? AND ci.date <= ?
      WHERE DATE(u.created_at) >= ? AND DATE(u.created_at) <= ?
    `).get(daysAgoStr(day), todayStr(), cohortStart, cohortEnd) as { cohort_size: number; retained: number };

    results.push({
      day,
      rate:
        stat.cohort_size > 0
          ? Math.round((stat.retained / stat.cohort_size) * 100)
          : 0,
    });
  }

  res.json(results);
});

// ==================== ADMIN USERS ====================

app.get("/api/admin/users", extractAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string) || "";
  const sortBy = (req.query.sortBy as string) || "id";
  const sortDir = (req.query.sortDir as string) || "desc";
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const params: any[] = [];
  if (search) {
    whereClause = "WHERE u.email LIKE ? OR p.name LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const validSortCols: Record<string, string> = {
    id: "u.id",
    email: "u.email",
    name: "p.name",
    createdAt: "u.created_at",
    checkIns: "checkin_count",
  };
  const sortCol = validSortCols[sortBy] || "u.id";
  const direction = sortDir === "asc" ? "ASC" : "DESC";

  const countResult = rawDb.prepare(`
    SELECT COUNT(*) as total FROM users u LEFT JOIN profiles p ON p.user_id = u.id ${whereClause}
  `).get(...params) as { total: number };

  const rows = rawDb.prepare(`
    SELECT
      u.id, u.email, u.onboarding_completed, u.onboarding_step, u.created_at,
      u.telegram_linked, u.google_sheets_connected,
      p.name, p.age, p.gender, p.bmi, p.consistency_history,
      (SELECT COUNT(*) FROM check_ins ci WHERE ci.user_id = u.id) as checkin_count,
      (SELECT MAX(date) FROM check_ins ci WHERE ci.user_id = u.id) as last_active,
      (SELECT COALESCE(SUM(amount), 0) FROM user_points up WHERE up.user_id = u.id) as total_points
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ${whereClause}
    ORDER BY ${sortCol} ${direction}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ users: rows, total: countResult.total, page, limit });
});

app.get("/api/admin/users/:id", extractAdmin, (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);

  const user = rawDb.prepare(`
    SELECT u.*, p.name, p.age, p.gender, p.height_cm, p.weight_kg, p.target_weight_kg, p.bmi,
      p.activity_level, p.consistency_history, p.health_history, p.why_now
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `).get(userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const conditions = rawDb.prepare("SELECT * FROM user_conditions WHERE user_id = ?").all(userId);
  const goals = rawDb.prepare("SELECT * FROM user_goals WHERE user_id = ?").all(userId);
  const medications = rawDb.prepare("SELECT * FROM user_medications WHERE user_id = ?").all(userId);

  const recentActivity = rawDb.prepare(`
    SELECT 'check_in' as type, date, 'Check-in: energy=' || energy || ' mood=' || mood as description, created_at
    FROM check_ins WHERE user_id = ?
    UNION ALL
    SELECT 'chat' as type, date, 'Chat: ' || SUBSTR(content, 1, 80) as description, created_at
    FROM chat_messages WHERE user_id = ? AND role = 'user'
    UNION ALL
    SELECT 'daily_log' as type, date, 'Daily log: ' || COALESCE(calories, 0) || ' cal' as description, created_at
    FROM daily_logs WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId, userId, userId);

  const healthRecs = rawDb.prepare("SELECT id, type, title, date, provider FROM health_records WHERE user_id = ?").all(userId);

  const earnedBadges = rawDb.prepare(`
    SELECT b.name, b.slug, b.description, b.tier, b.points_awarded, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = ?
  `).all(userId);

  const totalPointsRow = rawDb.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = ?").get(userId) as { total: number };

  res.json({
    user,
    conditions,
    goals,
    medications,
    recentActivity,
    healthRecords: healthRecs,
    badges: earnedBadges,
    totalPoints: totalPointsRow.total,
  });
});

// ==================== ADMIN ANALYTICS ====================

app.get("/api/admin/analytics/goals", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT goal_type as name, COUNT(*) as count
    FROM user_goals
    GROUP BY goal_type
    ORDER BY count DESC
  `).all();
  res.json(data);
});

app.get("/api/admin/analytics/conditions", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT condition_name as name, COUNT(*) as count
    FROM user_conditions
    GROUP BY condition_name
    ORDER BY count DESC
  `).all();
  res.json(data);
});

app.get("/api/admin/analytics/bmi", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT
      CASE
        WHEN CAST(bmi AS REAL) < 18.5 THEN 'Underweight'
        WHEN CAST(bmi AS REAL) < 25 THEN 'Normal'
        WHEN CAST(bmi AS REAL) < 30 THEN 'Overweight'
        ELSE 'Obese'
      END as category,
      COUNT(*) as count
    FROM profiles
    WHERE bmi IS NOT NULL AND bmi != ''
    GROUP BY category
    ORDER BY
      CASE category
        WHEN 'Underweight' THEN 1
        WHEN 'Normal' THEN 2
        WHEN 'Overweight' THEN 3
        ELSE 4
      END
  `).all();
  res.json(data);
});

app.get("/api/admin/analytics/consistency", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT consistency_history as value, COUNT(*) as count
    FROM profiles
    WHERE consistency_history IS NOT NULL
    GROUP BY consistency_history
    ORDER BY consistency_history
  `).all();
  res.json(data);
});

app.get("/api/admin/analytics/ai-usage", extractAdmin, (_req: Request, res: Response) => {
  const chatPerUser = rawDb.prepare(`
    SELECT user_id, COUNT(*) as msg_count
    FROM chat_messages
    WHERE role = 'user'
    GROUP BY user_id
  `).all() as { user_id: number; msg_count: number }[];

  const totalChatUsers = chatPerUser.length;
  const avgMessages =
    totalChatUsers > 0
      ? parseFloat(
          (
            chatPerUser.reduce((s, r) => s + r.msg_count, 0) / totalChatUsers
          ).toFixed(1)
        )
      : 0;

  const weeklyReviewCount = rawDb.prepare("SELECT COUNT(*) as count FROM weekly_reviews").get() as { count: number };
  const foodLogAnalyses = rawDb.prepare("SELECT COUNT(*) as count FROM food_logs").get() as { count: number };

  res.json({
    totalChatUsers,
    avgMessagesPerUser: avgMessages,
    weeklyReviews: weeklyReviewCount.count,
    mealAnalyses: foodLogAnalyses.count,
  });
});

app.get("/api/admin/analytics/time-of-day", extractAdmin, (_req: Request, res: Response) => {
  const data = rawDb.prepare(`
    SELECT
      CAST(SUBSTR(created_at, 12, 2) AS INTEGER) as hour,
      COUNT(*) as count
    FROM check_ins
    WHERE created_at IS NOT NULL AND LENGTH(created_at) > 11
    GROUP BY hour
    ORDER BY hour
  `).all() as { hour: number; count: number }[];

  const filled: { hour: number; count: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const found = data.find((d) => d.hour === h);
    filled.push({ hour: h, count: found ? found.count : 0 });
  }
  res.json(filled);
});

// ==================== ADMIN CONTENT: BADGES ====================

app.get("/api/admin/content/badges", extractAdmin, (_req: Request, res: Response) => {
  const allBadges = rawDb.prepare("SELECT * FROM badges ORDER BY id").all();
  res.json(allBadges);
});

app.put("/api/admin/content/badges/:id", extractAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { description, pointsAwarded } = req.body;
  rawDb.prepare("UPDATE badges SET description = ?, points_awarded = ? WHERE id = ?").run(description, pointsAwarded, id);
  const updated = rawDb.prepare("SELECT * FROM badges WHERE id = ?").get(id);
  res.json(updated);
});

// ==================== ADMIN CONTENT: MEDICATIONS ====================

app.get("/api/admin/content/medications", extractAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string) || "";
  let query = "SELECT * FROM admin_medications";
  const params: any[] = [];
  if (search) {
    query += " WHERE name LIKE ? OR generic_name LIKE ? OR category LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += " ORDER BY name";
  try {
    const data = rawDb.prepare(query).all(...params);
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post("/api/admin/content/medications", extractAdmin, (req: Request, res: Response) => {
  const { name, genericName, category, commonUse } = req.body;
  if (!name) {
    res.status(400).json({ message: "Name is required" });
    return;
  }
  try {
    const result = rawDb.prepare(`
      INSERT INTO admin_medications (name, generic_name, category, common_use)
      VALUES (?, ?, ?, ?)
    `).run(name, genericName || null, category || null, commonUse || null);
    const created = rawDb.prepare("SELECT * FROM admin_medications WHERE id = ?").get(result.lastInsertRowid);
    res.json(created);
  } catch {
    res.status(500).json({ message: "Failed to create medication" });
  }
});

// ==================== ADMIN CONTENT: TEMPLATES ====================

app.get("/api/admin/content/templates", extractAdmin, (_req: Request, res: Response) => {
  try {
    const data = rawDb.prepare("SELECT * FROM admin_notification_templates ORDER BY id").all();
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.put("/api/admin/content/templates/:id", extractAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { body, subject } = req.body;
  try {
    rawDb
      .prepare(
        "UPDATE admin_notification_templates SET body = ?, subject = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(body, subject || null, id);
    const updated = rawDb.prepare("SELECT * FROM admin_notification_templates WHERE id = ?").get(id);
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Failed to update template" });
  }
});

// ==================== ADMIN SETTINGS ====================

app.get("/api/admin/settings/db-stats", extractAdmin, (_req: Request, res: Response) => {
  let fileSize = 0;
  try {
    const stat = fs.statSync(dbFilePath);
    fileSize = stat.size;
  } catch { /* ignore */ }

  const tables = [
    "users", "profiles", "user_conditions", "user_goals", "check_ins",
    "daily_logs", "chat_messages", "weekly_reviews", "badges", "user_badges",
    "user_points", "health_records", "food_logs", "user_medications",
    "notification_prefs", "admin_notification_templates", "admin_medications",
  ];

  const tableCounts: { table: string; count: number }[] = [];
  for (const t of tables) {
    try {
      const result = rawDb.prepare(`SELECT COUNT(*) as count FROM ${t}`).get() as { count: number };
      tableCounts.push({ table: t, count: result.count });
    } catch {
      tableCounts.push({ table: t, count: 0 });
    }
  }

  res.json({ fileSize, tableCounts });
});

app.get("/api/admin/settings/export-db", extractAdmin, (_req: Request, res: Response) => {
  try {
    res.setHeader("Content-Disposition", "attachment; filename=vitallity-data.db");
    res.setHeader("Content-Type", "application/octet-stream");
    const stream = fs.createReadStream(dbFilePath);
    stream.pipe(res);
  } catch {
    res.status(500).json({ message: "Failed to export database" });
  }
});

app.post("/api/admin/settings/clear-test-data", extractAdmin, (_req: Request, res: Response) => {
  try {
    const tablesToClear = [
      "user_points", "user_badges", "food_logs", "water_logs", "chat_messages",
      "weekly_reviews", "health_records", "health_parameters", "check_ins", "daily_logs",
      "user_medications", "user_conditions", "user_goals", "user_pain_areas",
      "user_dietary_prefs", "user_activities", "milestone_history", "milestone_steps",
      "milestones", "calibration_snapshots", "notification_prefs", "phone_otps",
      "profiles",
    ];

    for (const t of tablesToClear) {
      try { rawDb.prepare(`DELETE FROM ${t}`).run(); } catch { /* table might not exist */ }
    }
    rawDb.prepare("DELETE FROM users").run();

    res.json({ message: "All test data cleared successfully" });
  } catch (e: any) {
    res.status(500).json({ message: "Failed to clear data: " + e.message });
  }
});
