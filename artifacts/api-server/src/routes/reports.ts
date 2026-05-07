import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { store, type Report } from "../lib/store.js";
import { userStore, POINTS } from "../lib/userStore.js";
import { broadcastPush } from "../lib/push.js";
import { sanitizeShort, sanitizeMedium, sanitizeLong } from "../lib/sanitize.js";

const router = Router();

const ALLOWED_TYPES = ["phone", "upi", "message"] as const;

router.post("/reports", (req, res) => {
  const { type, value, category, description, submitterUid } = req.body as {
    type?: string;
    value?: string;
    category?: string;
    description?: string;
    submitterUid?: string;
  };

  const cleanType = sanitizeShort(type);
  const cleanValue = sanitizeMedium(value);
  const cleanCategory = sanitizeShort(category);
  const cleanDescription = sanitizeLong(description);
  const cleanUid = submitterUid
    ? sanitizeShort(submitterUid).replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 64) || undefined
    : undefined;

  if (!cleanType || !cleanValue) {
    res.status(400).json({ error: "type and value are required" });
    return;
  }

  if (!(ALLOWED_TYPES as readonly string[]).includes(cleanType)) {
    res.status(400).json({ error: "type must be phone, upi, or message" });
    return;
  }

  if (cleanValue.length < 3) {
    res.status(400).json({ error: "value is too short" });
    return;
  }

  const report: Report = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    type: cleanType as Report["type"],
    value: cleanValue,
    category: cleanCategory || "Other",
    description: cleanDescription,
    status: "pending",
    submittedAt: Date.now(),
    submitterUid: cleanUid,
  };

  store.addReport(report);

  // Award +5 points immediately on submission
  if (cleanUid) {
    userStore.incrementSubmitted(cleanUid);
    req.log.info({ reportId: report.id, uid: cleanUid, pts: POINTS.REPORT_SUBMITTED }, "Submission points awarded");
  }

  req.log.info({ reportId: report.id }, "Report submitted");
  res.status(201).json(report);
});

router.get("/reports", adminAuth, (_req, res) => {
  res.json(store.getReports());
});

router.put("/reports/:id/verify", adminAuth, async (req, res) => {
  const { scamInfo } = req.body as { scamInfo?: Report["scamInfo"] };

  let cleanScamInfo: Report["scamInfo"] | undefined;
  if (scamInfo && typeof scamInfo === "object") {
    cleanScamInfo = {
      title: sanitizeShort(scamInfo.title),
      description: sanitizeMedium(scamInfo.description),
      modus: sanitizeMedium(scamInfo.modus),
      severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(scamInfo.severity)
        ? scamInfo.severity
        : "HIGH",
    };
  }

  const updated = store.updateReport(req.params["id"]!, {
    status: "verified",
    verifiedAt: Date.now(),
    scamInfo: cleanScamInfo,
  });

  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  // Award +20 points to reporter — read uid from stored report (no need to re-send from client)
  const reporterUid = updated.submitterUid ?? (req.body as { submitterUid?: string }).submitterUid;
  if (reporterUid && typeof reporterUid === "string") {
    userStore.addPoints(reporterUid, POINTS.REPORT_VERIFIED);
    req.log.info({ uid: reporterUid, pts: POINTS.REPORT_VERIFIED }, "Verification points awarded");
  }

  const pushTitle = "✅ Verified Scam Alert";
  const scamValue = updated.value.length > 30 ? updated.value.slice(0, 30) + "…" : updated.value;
  const pushBody = cleanScamInfo?.title
    ? `${cleanScamInfo.title}: ${scamValue}`
    : `A new ${updated.type} scam has been verified: ${scamValue}`;

  await broadcastPush(pushTitle, pushBody, {
    type: "verified_report",
    reportId: updated.id,
    scamType: updated.type,
    scamValue: updated.value.slice(0, 100),
  });

  req.log.info({ reportId: updated.id }, "Report verified and FCM push sent");
  res.json(updated);
});

router.put("/reports/:id/reject", adminAuth, (req, res) => {
  const updated = store.updateReport(req.params["id"]!, { status: "rejected" });
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  // Deduct -10 points from reporter
  const reporterUid = updated.submitterUid;
  if (reporterUid) {
    userStore.addPoints(reporterUid, POINTS.REPORT_REJECTED);
    req.log.info({ uid: reporterUid, pts: POINTS.REPORT_REJECTED }, "Rejection points deducted");
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
