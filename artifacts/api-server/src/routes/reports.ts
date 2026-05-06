import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.js";
import { store, type Report } from "../lib/store.js";
import { sanitizeShort, sanitizeMedium, sanitizeLong } from "../lib/sanitize.js";

const router = Router();

const ALLOWED_TYPES = ["phone", "upi", "message"] as const;

router.post("/reports", (req, res) => {
  const { type, value, category, description } = req.body as {
    type?: string;
    value?: string;
    category?: string;
    description?: string;
  };

  const cleanType = sanitizeShort(type);
  const cleanValue = sanitizeMedium(value);
  const cleanCategory = sanitizeShort(category);
  const cleanDescription = sanitizeLong(description);

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

  req.log.info({ reportId: updated.id }, "Report verified");
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
