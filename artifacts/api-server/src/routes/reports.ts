import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { store, type Report } from "../lib/store.js";
import { broadcastPush } from "../lib/push.js";

const router = Router();

router.post("/reports", (req, res) => {
  const { type, value, category, description } = req.body as {
    type?: string;
    value?: string;
    category?: string;
    description?: string;
  };

  if (!type || !value) {
    res.status(400).json({ error: "type and value are required" });
    return;
  }

  if (!["phone", "upi", "message"].includes(type)) {
    res.status(400).json({ error: "type must be phone, upi, or message" });
    return;
  }

  const report: Report = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    type: type as Report["type"],
    value: String(value).trim(),
    category: String(category ?? "Other").trim(),
    description: String(description ?? "").trim(),
    status: "pending",
    submittedAt: Date.now(),
  };

  store.addReport(report);
  req.log.info({ reportId: report.id }, "Report submitted");
  res.status(201).json(report);
});

router.get("/reports", adminAuth, (_req, res) => {
  res.json(store.getReports());
});

router.put("/reports/:id/verify", adminAuth, async (req, res) => {
  const { scamInfo } = req.body as { scamInfo?: Report["scamInfo"] };
  const updated = store.updateReport(req.params["id"]!, {
    status: "verified",
    verifiedAt: Date.now(),
    scamInfo,
  });

  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const pushTitle = "Verified Scam Alert";
  const scamValue = updated.value.length > 30 ? updated.value.slice(0, 30) + "…" : updated.value;
  const pushBody = scamInfo?.title
    ? `${scamInfo.title}: ${scamValue}`
    : `A new ${updated.type} scam has been verified: ${scamValue}`;

  await broadcastPush(pushTitle, pushBody, {
    type: "verified_report",
    reportId: updated.id,
    scamType: updated.type,
    scamValue: updated.value,
    scamInfo,
  });

  req.log.info({ reportId: updated.id }, "Report verified and push sent");
  res.json(updated);
});

router.put("/reports/:id/reject", adminAuth, (req, res) => {
  const updated = store.updateReport(req.params["id"]!, { status: "rejected" });
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(updated);
});

router.delete("/reports/:id", adminAuth, (req, res) => {
  const deleted = store.deleteReport(req.params["id"]!);
  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
