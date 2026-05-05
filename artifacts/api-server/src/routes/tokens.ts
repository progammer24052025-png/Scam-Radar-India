import { Router } from "express";
import { store } from "../lib/store.js";

const router = Router();

router.post("/push-tokens", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }
  store.addPushToken(token.trim());
  res.json({ ok: true });
});

export default router;
