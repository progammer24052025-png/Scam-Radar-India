import { Router } from "express";
import {
  registerUserInFirebase,
  saveFcmTokenToFirebase,
} from "../lib/firebase.js";
import { sanitizeShort, sanitizeToken } from "../lib/sanitize.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { userStore, POINTS } from "../lib/userStore.js";
import { store } from "../lib/store.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion, fcmToken, email, displayName, photoUrl } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
    fcmToken?: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
  };

  const deviceUid = uid
    ? sanitizeShort(uid).replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 64) || crypto.randomUUID()
    : crypto.randomUUID();

  const rawPlatform = sanitizeShort(platform);
  const devicePlatform = ["android", "ios", "web"].includes(rawPlatform)
    ? rawPlatform
    : "unknown";

  const cleanAppVersion = appVersion ? sanitizeShort(appVersion) : undefined;

  await registerUserInFirebase(deviceUid, {
    platform: devicePlatform,
    appVersion: cleanAppVersion,
    registeredAt: Date.now(),
  });

  if (fcmToken) {
    const token = sanitizeToken(fcmToken);
    if (token && token.length > 20 && /^[A-Za-z0-9_\-:]+$/.test(token)) {
      await saveFcmTokenToFirebase(deviceUid, token, devicePlatform);
      req.log.info({ platform: devicePlatform }, "FCM token registered");
    }
  }

  if (email || displayName) {
    userStore.upsert(deviceUid, {
      uid: deviceUid,
      email: email ?? "",
      displayName: displayName ?? "Anonymous",
      photoUrl,
    });
  }

  res.json({ ok: true, uid: deviceUid });
});

router.post("/users/profile", (req, res) => {
  const { uid, email, displayName, photoUrl } = req.body as {
    uid?: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
  };
  if (!uid || typeof uid !== "string") {
    res.status(400).json({ error: "uid required" });
    return;
  }
  const profile = userStore.upsert(uid, { uid, email, displayName, photoUrl });
  res.json(profile);
});

router.get("/users/:uid/profile", (req, res) => {
  const uid = req.params["uid"]!;
  const profile = userStore.get(uid);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(profile);
});

router.get("/leaderboard", (_req, res) => {
  res.json(userStore.getLeaderboard(50));
});

router.get("/verified-reports", (_req, res) => {
  const verified = store
    .getReports()
    .filter((r) => r.status === "verified")
    .sort((a, b) => (b.verifiedAt ?? 0) - (a.verifiedAt ?? 0))
    .slice(0, 50);
  res.json(verified);
});

router.post("/admin/reports/:id/award-points", adminAuth, (req, res) => {
  const { uid, action } = req.body as { uid?: string; action?: "verify" | "reject" };
  if (!uid || !action) {
    res.status(400).json({ error: "uid and action required" });
    return;
  }
  const delta = action === "verify" ? POINTS.REPORT_VERIFIED : POINTS.REPORT_REJECTED;
  const updated = userStore.addPoints(uid, delta);
  req.log.info({ uid, delta, action }, "Points awarded");
  res.json({ ok: true, user: updated });
});

export default router;
