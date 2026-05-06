import { Router } from "express";
import { store } from "../lib/store.js";
import {
  registerUserInFirebase,
  savePushTokenToFirebase,
} from "../lib/firebase.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion, pushToken } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
    pushToken?: string;
  };

  const deviceUid = uid ?? crypto.randomUUID();
  const devicePlatform = platform ?? "unknown";

  await registerUserInFirebase(deviceUid, {
    platform: devicePlatform,
    appVersion,
    registeredAt: Date.now(),
  });

  if (pushToken && typeof pushToken === "string" && pushToken.trim()) {
    const token = pushToken.trim();
    store.addPushToken(token);
    await savePushTokenToFirebase(token, devicePlatform);
    req.log.info({ platform: devicePlatform }, "Push token registered");
  }

  res.json({ ok: true, uid: deviceUid });
});

export default router;
