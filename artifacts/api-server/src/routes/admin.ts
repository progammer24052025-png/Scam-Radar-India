import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { broadcastPush } from "../lib/push.js";
import { store } from "../lib/store.js";
import { getFirebaseUserCount, cleanupGhostDevices } from "../lib/firebase.js";
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

  const firebaseCount = await getFirebaseUserCount();
  const registeredDevices = firebaseCount ?? 0;

  res.json({
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    verifiedReports: reports.filter((r) => r.status === "verified").length,
    rejectedReports: reports.filter((r) => r.status === "rejected").length,
    totalAlerts: alerts.length,
    registeredDevices,
  });
});

router.post("/admin/cleanup", adminAuth, async (req, res) => {
  const removed = await cleanupGhostDevices();
  req.log.info({ removed }, "Ghost devices cleaned up");
  res.json({ ok: true, removed });
});

export default router;
