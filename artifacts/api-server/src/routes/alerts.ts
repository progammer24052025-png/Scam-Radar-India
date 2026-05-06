import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { store, type Alert } from "../lib/store.js";
import { broadcastPush } from "../lib/push.js";
import { sanitizeShort, sanitizeMedium } from "../lib/sanitize.js";

const router = Router();

router.get("/alerts", (_req, res) => {
  res.json(store.getAlerts());
});

router.post("/alerts", adminAuth, async (req, res) => {
  const body = req.body as Partial<Alert> & { notify?: boolean };

  const cleanTitle = sanitizeShort(body.title);
  const cleanDescription = sanitizeMedium(body.description);
  const cleanCategory = sanitizeShort(body.category);
  const cleanLocation = sanitizeShort(body.location);

  if (!cleanTitle || !cleanDescription || !body.severity) {
    res.status(400).json({ error: "title, description, and severity are required" });
    return;
  }

  const allowedSeverity = ["CRITICAL", "HIGH", "MEDIUM"] as const;
  if (!(allowedSeverity as readonly string[]).includes(body.severity)) {
    res.status(400).json({ error: "severity must be CRITICAL, HIGH, or MEDIUM" });
    return;
  }

  const allowedTrend = ["rising", "stable", "declining"] as const;
  const trend = (allowedTrend as readonly string[]).includes(body.trend ?? "")
    ? (body.trend as typeof allowedTrend[number])
    : "rising";

  const rawIndicators = Array.isArray(body.indicators) ? body.indicators : [];
  const cleanIndicators = rawIndicators
    .filter((i): i is string => typeof i === "string")
    .map((i) => sanitizeShort(i))
    .filter(Boolean)
    .slice(0, 20);

  const reportCount =
    typeof body.reportCount === "number" && body.reportCount >= 0
      ? Math.floor(body.reportCount)
      : 0;

  const alert: Alert = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: cleanTitle,
    description: cleanDescription,
    category: cleanCategory || "Other",
    severity: body.severity,
    reportCount,
    location: cleanLocation || "India",
    timeAgo: "just now",
    trend,
    indicators: cleanIndicators,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  store.addAlert(alert);

  if (body.notify) {
    const emoji = alert.severity === "CRITICAL" ? "🚨" : alert.severity === "HIGH" ? "⚠️" : "ℹ️";
    await broadcastPush(
      `${emoji} ${alert.severity} Alert: ${alert.title}`,
      alert.description.slice(0, 150),
      { type: "new_alert", alertId: alert.id }
    );
  }

  req.log.info({ alertId: alert.id }, "Alert created");
  res.status(201).json(alert);
});

router.put("/alerts/:id", adminAuth, (req, res) => {
  const body = req.body as Partial<Alert>;

  const updates: Partial<Alert> = {};

  if (body.title !== undefined) updates.title = sanitizeShort(body.title);
  if (body.description !== undefined) updates.description = sanitizeMedium(body.description);
  if (body.category !== undefined) updates.category = sanitizeShort(body.category);
  if (body.location !== undefined) updates.location = sanitizeShort(body.location);

  if (body.severity !== undefined) {
    const allowed = ["CRITICAL", "HIGH", "MEDIUM"] as const;
    if ((allowed as readonly string[]).includes(body.severity)) {
      updates.severity = body.severity;
    }
  }

  if (body.trend !== undefined) {
    const allowed = ["rising", "stable", "declining"] as const;
    if ((allowed as readonly string[]).includes(body.trend)) {
      updates.trend = body.trend;
    }
  }

  if (typeof body.reportCount === "number" && body.reportCount >= 0) {
    updates.reportCount = Math.floor(body.reportCount);
  }

  if (Array.isArray(body.indicators)) {
    updates.indicators = body.indicators
      .filter((i): i is string => typeof i === "string")
      .map((i) => sanitizeShort(i))
      .filter(Boolean)
      .slice(0, 20);
  }

  const updated = store.updateAlert(req.params["id"]!, updates);
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(updated);
});

router.delete("/alerts/:id", adminAuth, (req, res) => {
  const deleted = store.deleteAlert(req.params["id"]!);
  if (!deleted) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
