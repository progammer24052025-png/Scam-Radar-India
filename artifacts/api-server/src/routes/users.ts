import { Router } from "express";
import { store } from "../lib/store.js";
import {
  registerUserInFirebase,
  savePushTokenToFirebase,
  saveFcmTokenToFirebase,
} from "../lib/firebase.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion, pushToken, fcmToken } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
    pushToken?: string;  // Expo push token: ExponentPushToken[...]
    fcmToken?: string;   // Raw FCM device token (long alphanumeric string)
  };

  const deviceUid = uid ?? crypto.randomUUID();
  const devicePlatform = platform ?? "unknown";

  await registerUserInFirebase(deviceUid, {
    platform: devicePlatform,
    appVersion,
    registeredAt: Date.now(),
  });

  // Save Expo push token if provided
  if (pushToken && typeof pushToken === "string" && pushToken.trim()) {
    const token = pushToken.trim();
    store.addPushToken(token);
    await savePushTokenToFirebase(token, devicePlatform);
    req.log.info({ platform: devicePlatform, type: "expo" }, "Expo push token registered");
  }

  // Save raw FCM token if provided (takes priority for direct FCM delivery)
  if (fcmToken && typeof fcmToken === "string" && fcmToken.trim().length > 20) {
    await saveFcmTokenToFirebase(deviceUid, fcmToken.trim(), devicePlatform);
    req.log.info({ platform: devicePlatform, type: "fcm" }, "FCM token registered");
  }

  res.json({ ok: true, uid: deviceUid });
});

export default router;
