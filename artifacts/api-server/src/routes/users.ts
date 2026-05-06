import { Router } from "express";
import { registerUserInFirebase } from "../lib/firebase.js";
import { sanitizeShort } from "../lib/sanitize.js";
import crypto from "crypto";

const router = Router();

router.post("/users/register", async (req, res) => {
  const { uid, platform, appVersion } = req.body as {
    uid?: string;
    platform?: string;
    appVersion?: string;
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

  res.json({ ok: true, uid: deviceUid });
});

export default router;
