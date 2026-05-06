import { Router } from "express";
import {
  registerUserInFirebase,
  saveFcmTokenToFirebase,
} from "../lib/firebase.js";
import { sanitizeShort, sanitizeToken } from "../lib/sanitize.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion, fcmToken } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
    fcmToken?: string;
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

  // Save raw FCM token for Firebase Cloud Messaging
  if (fcmToken) {
    const token = sanitizeToken(fcmToken);
    if (token && token.length > 20 && /^[A-Za-z0-9_\-:]+$/.test(token)) {
      await saveFcmTokenToFirebase(deviceUid, token, devicePlatform);
      req.log.info({ platform: devicePlatform }, "FCM token registered");
    }
  }

  res.json({ ok: true, uid: deviceUid });
});

export default router;
