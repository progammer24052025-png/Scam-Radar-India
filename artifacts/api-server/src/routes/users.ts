import { Router } from "express";
import { store } from "../lib/store.js";
import { registerUserInFirebase } from "../lib/firebase.js";
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

  await registerUserInFirebase(deviceUid, {
    platform: platform ?? "unknown",
    appVersion,
    registeredAt: Date.now(),
  });

  if (pushToken && typeof pushToken === "string") {
    store.addPushToken(pushToken.trim());
  }

  res.json({ ok: true, uid: deviceUid });
});

export default router;
