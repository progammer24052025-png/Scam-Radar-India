import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { broadcastPush } from "../lib/push.js";
import { store } from "../lib/store.js";
import { userStore } from "../lib/userStore.js";
import { getFirebaseUserCount, getFcmTokenCount, isFirebaseConnected, cleanupGhostDevices, clearAllFcmTokens } from "../lib/firebase.js";
import { signAdminToken } from "../lib/jwt.js";
import { sanitizeShort, sanitizeMedium } from "../lib/sanitize.js";
import crypto from "crypto";

const router = Router();

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  if (password.length > 256) {
    res.status(400).json({ error: "Invalid password" });
    return;
  }

  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "scamradar-admin-2024";

  if (!timingSafeEqual(password, adminPassword)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = signAdminToken();
  res.json({ token });
});

router.post("/admin/notify", adminAuth, async (req, res) => {
  const { title, body, data } = req.body as {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };

  const cleanTitle = sanitizeShort(title);
  const cleanBody = sanitizeMedium(body);

  if (!cleanTitle || !cleanBody) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }

  const result = await broadcastPush(cleanTitle, cleanBody, data ?? { type: "admin_broadcast" });
  req.log.info({ ...result }, "FCM broadcast sent");
  res.json({ ok: true, ...result });
});

router.get("/admin/stats", adminAuth, async (_req, res) => {
  const reports = store.getReports();
  const alerts = store.getAlerts();

  const firebaseConnected = isFirebaseConnected();
  const [firebaseCount, fcmTokenCount] = await Promise.all([
    getFirebaseUserCount(),
    getFcmTokenCount(),
  ]);

  res.json({
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    verifiedReports: reports.filter((r) => r.status === "verified").length,
    rejectedReports: reports.filter((r) => r.status === "rejected").length,
    totalAlerts: alerts.length,
    registeredDevices: firebaseCount ?? 0,
    fcmTokens: fcmTokenCount,
    firebaseConnected,
  });
});

router.get("/admin/analytics", adminAuth, (_req, res) => {
  const reports = store.getReports();

  // Reports per day — last 30 days
  const now = Date.now();
  const dayMs = 86400000;
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap[key] = 0;
  }
  for (const r of reports) {
    const d = new Date(r.submittedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (key in dayMap) dayMap[key]++;
  }
  const reportsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // By category
  const catMap: Record<string, number> = {};
  for (const r of reports) {
    catMap[r.category] = (catMap[r.category] ?? 0) + 1;
  }
  const reportsByCategory = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // By type
  const typeMap: Record<string, number> = { phone: 0, upi: 0, message: 0 };
  for (const r of reports) typeMap[r.type] = (typeMap[r.type] ?? 0) + 1;
  const reportsByType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

  // Leaderboard top 10
  const leaderboard = userStore.getLeaderboard(10);

  res.json({ reportsByDay, reportsByCategory, reportsByType, leaderboard });
});

router.post("/admin/cleanup", adminAuth, async (req, res) => {
  const removed = await cleanupGhostDevices();
  req.log.info({ removed }, "Ghost devices cleaned up");
  res.json({ ok: true, removed });
});

router.post("/admin/clear-fcm-tokens", adminAuth, async (req, res) => {
  const cleared = await clearAllFcmTokens();
  req.log.info({ cleared }, "FCM tokens cleared");
  res.json({ ok: true, cleared });
});

export default router;
