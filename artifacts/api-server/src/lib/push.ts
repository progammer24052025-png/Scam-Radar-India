import { logger } from "./logger.js";
import { store } from "./store.js";
import {
  getAllPushTokensFromFirebase,
  getAllFcmTokensFromFirebase,
  removePushTokenFromFirebase,
  sendFcmNotifications,
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

export async function sendExpoPushNotification(
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

  if (validTokens.length === 0) return { sent: 0, errors: 0 };

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
      logger.error({ status: response.status }, "Expo push API error");
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
        logger.warn({ ticket }, "Expo push ticket error");
      }
    }

    return { sent, errors };
  } catch (err) {
    logger.error({ err }, "Failed to send Expo push notifications");
    return { sent: 0, errors: validTokens.length };
  }
}

export async function broadcastPush(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; errors: number }> {
  // Get both FCM tokens (primary) and Expo push tokens (fallback)
  const [fcmTokens, firebaseExpoTokens, localTokens] = await Promise.all([
    getAllFcmTokensFromFirebase(),
    getAllPushTokensFromFirebase(),
    Promise.resolve(store.getPushTokens()),
  ]);

  const allExpoTokens = [...new Set([...firebaseExpoTokens, ...localTokens])];

  logger.info(
    {
      fcmCount: fcmTokens.length,
      expoCount: allExpoTokens.length,
    },
    "Broadcasting push notification"
  );

  // Send via both paths — FCM for native Android/iOS, Expo for dev builds
  const stringData = data
    ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      )
    : undefined;

  const [fcmResult, expoResult] = await Promise.all([
    sendFcmNotifications(fcmTokens, title, body, stringData),
    sendExpoPushNotification(allExpoTokens, title, body, data),
  ]);

  const totalSent = fcmResult.sent + expoResult.sent;
  const totalErrors = fcmResult.errors + expoResult.errors;

  logger.info(
    { fcm: fcmResult, expo: expoResult, totalSent, totalErrors },
    "Broadcast complete"
  );

  return { sent: totalSent, errors: totalErrors };
}
