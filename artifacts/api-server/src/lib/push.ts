import { logger } from "./logger.js";
import { store } from "./store.js";
import {
  getAllPushTokensFromFirebase,
  removePushTokenFromFirebase,
} from "./firebase.js";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; errors: number }> {
  const validTokens = tokens.filter(
    (t) =>
      typeof t === "string" &&
      (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    logger.warn({ total: tokens.length }, "No valid Expo push tokens to send to");
    return { sent: 0, errors: 0 };
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title,
    body,
    data: data ?? {},
    sound: "default",
    priority: "high",
    channelId: "default",
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text }, "Expo push API error");
      return { sent: 0, errors: validTokens.length };
    }

    const result = (await response.json()) as { data: ExpoPushTicket[] };
    const tickets = Array.isArray(result.data) ? result.data : [result.data];
    let sent = 0;
    let errors = 0;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket?.status === "ok") {
        sent++;
      } else {
        errors++;
        if (ticket?.details?.error === "DeviceNotRegistered") {
          const token = validTokens[i];
          if (token) {
            store.removePushToken(token);
            await removePushTokenFromFirebase(token);
          }
        }
        logger.warn({ ticket }, "Push ticket error");
      }
    }

    logger.info({ sent, errors, total: validTokens.length }, "Push notifications sent");
    return { sent, errors };
  } catch (err) {
    logger.error({ err }, "Failed to send push notifications");
    return { sent: 0, errors: validTokens.length };
  }
}

export async function broadcastPush(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; errors: number }> {
  // Get tokens from Firebase first (persists across restarts), fall back to local store
  const firebaseTokens = await getAllPushTokensFromFirebase();
  const localTokens = store.getPushTokens();

  // Merge and deduplicate
  const allTokens = [...new Set([...firebaseTokens, ...localTokens])];

  logger.info(
    { firebaseCount: firebaseTokens.length, localCount: localTokens.length, total: allTokens.length },
    "Broadcasting push notification"
  );

  return sendPushNotification(allTokens, title, body, data);
}
