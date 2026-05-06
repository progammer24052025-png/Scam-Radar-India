import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { broadcastPush } from "../lib/push.js";
import { store } from "../lib/store.js";
import { getFirebaseUserCount, cleanupGhostDevices } from "../lib/firebase.js";

const router = Router();

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "scamradar-admin-2024";
  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ token: adminPassword });
});

router.post("/admin/notify", adminAuth, async (req, res) => {
  const { title, body, data } = req.body as {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  };

  if (!title || !body) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }

  const result = await broadcastPush(title, body, data ?? { type: "admin_broadcast" });
  req.log.info({ ...result }, "Broadcast notification sent");
  res.json({ ok: true, ...result });
});

router.get("/admin/stats", adminAuth, async (_req, res) => {
  const reports = store.getReports();
  const tokens = store.getPushTokens();
  const alerts = store.getAlerts();

  const firebaseCount = await getFirebaseUserCount();
  const registeredDevices = firebaseCount !== null ? firebaseCount : tokens.length;

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
