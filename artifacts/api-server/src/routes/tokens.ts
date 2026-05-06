import { Router } from "express";
import { store } from "../lib/store.js";
import { sanitizeToken } from "../lib/sanitize.js";

const router = Router();

router.post("/push-tokens", (req, res) => {
  const { token } = req.body as { token?: string };

  const cleaned = sanitizeToken(token);

  if (!cleaned) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  if (
    !cleaned.startsWith("ExponentPushToken[") &&
    !cleaned.startsWith("ExpoPushToken[")
  ) {
    res.status(400).json({ error: "Invalid push token format" });
    return;
  }

  store.addPushToken(cleaned);
  res.json({ ok: true });
});

export default router;
