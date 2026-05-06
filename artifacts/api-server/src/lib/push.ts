import { logger } from "./logger.js";
import {
  getAllFcmTokensFromFirebase,
  sendFcmNotifications,
} from "./firebase.js";

export async function broadcastPush(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; errors: number }> {
  const fcmTokens = await getAllFcmTokensFromFirebase();

  if (fcmTokens.length === 0) {
    logger.info("broadcastPush: no FCM tokens registered");
    return { sent: 0, errors: 0 };
  }

  logger.info({ fcmCount: fcmTokens.length }, "Broadcasting push via FCM");

  const stringData = data
    ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      )
    : undefined;

  const result = await sendFcmNotifications(fcmTokens, title, body, stringData);

  logger.info({ ...result }, "Broadcast complete");
  return result;
}
