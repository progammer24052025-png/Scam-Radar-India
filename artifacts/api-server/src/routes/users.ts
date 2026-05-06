import { Router } from "express";
import { store } from "../lib/store.js";
import {
  registerUserInFirebase,
  savePushTokenToFirebase,
  saveFcmTokenToFirebase,
} from "../lib/firebase.js";
import { sanitizeShort, sanitizeToken } from "../lib/sanitize.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion, pushToken, fcmToken } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
    pushToken?: string;
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

  // Save Expo push token if provided
  if (pushToken) {
    const token = sanitizeToken(pushToken);
    if (
      token &&
      (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
    ) {
      store.addPushToken(token);
      await savePushTokenToFirebase(token, devicePlatform);
      req.log.info({ platform: devicePlatform, type: "expo" }, "Expo push token registered");
    }
  }

  // Save raw FCM token if provided
  if (fcmToken) {
    const token = sanitizeToken(fcmToken);
    if (token && token.length > 20 && /^[A-Za-z0-9_\-:]+$/.test(token)) {
      await saveFcmTokenToFirebase(deviceUid, token, devicePlatform);
      req.log.info({ platform: devicePlatform, type: "fcm" }, "FCM token registered");
    }
  }

  res.json({ ok: true, uid: deviceUid });
});

export default router;
