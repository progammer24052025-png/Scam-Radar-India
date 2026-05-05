import { logger } from "./logger.js";
import { store } from "./store.js";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
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
  if (tokens.length === 0) {
    return { sent: 0, errors: 0 };
  }

  const validTokens = tokens.filter(
    (t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")
  );

  if (validTokens.length === 0) {
    logger.warn("No valid Expo push tokens to send to");
    return { sent: 0, errors: tokens.length };
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    title,
    body,
    data: data ?? {},
    sound: "default",
    priority: "high",
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
    let sent = 0;
    let errors = 0;

    for (const ticket of result.data) {
      if (ticket.status === "ok") {
        sent++;
      } else {
        errors++;
        if (ticket.details?.error === "DeviceNotRegistered") {
          const token = validTokens[result.data.indexOf(ticket)];
          if (token) store.removePushToken(token);
        }
        logger.warn({ ticket }, "Push ticket error");
      }
    }

    logger.info({ sent, errors }, "Push notifications sent");
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
  const tokens = store.getPushTokens();
  return sendPushNotification(tokens, title, body, data);
}
