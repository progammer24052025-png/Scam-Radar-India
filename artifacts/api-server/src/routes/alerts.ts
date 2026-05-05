import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { store, type Alert } from "../lib/store.js";
import { broadcastPush } from "../lib/push.js";

const router = Router();

router.get("/alerts", (_req, res) => {
  res.json(store.getAlerts());
});

router.post("/alerts", adminAuth, async (req, res) => {
  const body = req.body as Partial<Alert> & { notify?: boolean };

  if (!body.title || !body.description || !body.severity) {
    res.status(400).json({ error: "title, description, and severity are required" });
    return;
  }

  const alert: Alert = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: body.title,
    description: body.description,
    category: body.category ?? "Other",
    severity: body.severity,
    reportCount: body.reportCount ?? 0,
    location: body.location ?? "India",
    timeAgo: "just now",
    trend: body.trend ?? "rising",
    indicators: body.indicators ?? [],
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
  const updated = store.updateAlert(req.params["id"]!, req.body as Partial<Alert>);
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
