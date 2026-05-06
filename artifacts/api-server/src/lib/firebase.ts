import admin from "firebase-admin";

let db: admin.database.Database | null = null;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  const databaseUrl =
    process.env["FIREBASE_DATABASE_URL"] ??
    "https://scam-radar-india-default-rtdb.asia-southeast1.firebasedatabase.app";

  if (!serviceAccountJson) {
    console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT not set");
    return;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseUrl,
      });
    }
    db = admin.database();
    console.info("[firebase] Firebase Admin initialized");
  } catch (err) {
    console.error("[firebase] Failed to initialize Firebase Admin:", err);
  }
}

export function getFirebaseDb(): admin.database.Database | null {
  init();
  return db;
}

// ─── User Registration ────────────────────────────────────────────────────────

export async function registerUserInFirebase(
  uid: string,
  deviceInfo: { platform: string; appVersion?: string; registeredAt: number }
): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    const payload: Record<string, string | number> = {
      platform: deviceInfo.platform,
      registeredAt: deviceInfo.registeredAt,
      lastSeen: Date.now(),
    };
    if (deviceInfo.appVersion) payload["appVersion"] = deviceInfo.appVersion;
    await database.ref(`users/${uid}`).set(payload);
  } catch (err) {
    console.error("[firebase] Failed to register user:", err);
  }
}

export async function getFirebaseUserCount(): Promise<number | null> {
  const database = getFirebaseDb();
  if (!database) return null;
  try {
    const snapshot = await database.ref("users").once("value");
    if (!snapshot.exists()) return 0;
    const users = snapshot.val() as Record<string, { platform?: string }>;
    return Object.values(users).filter(
      (u) => u.platform === "android" || u.platform === "ios"
    ).length;
  } catch (err) {
    console.error("[firebase] Failed to get user count:", err);
    return null;
  }
}

// ─── FCM Tokens ───────────────────────────────────────────────────────────────

export async function saveFcmTokenToFirebase(
  uid: string,
  token: string,
  platform: string
): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    await database.ref(`fcmTokens/${uid}`).set({
      token,
      platform,
      savedAt: Date.now(),
    });
  } catch (err) {
    console.error("[firebase] Failed to save FCM token:", err);
  }
}

export async function removeFcmTokenFromFirebase(uid: string): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    await database.ref(`fcmTokens/${uid}`).remove();
  } catch (err) {
    console.error("[firebase] Failed to remove FCM token:", err);
  }
}

export async function getAllFcmTokensFromFirebase(): Promise<string[]> {
  const database = getFirebaseDb();
  if (!database) return [];
  try {
    const snapshot = await database.ref("fcmTokens").once("value");
    if (!snapshot.exists()) return [];
    const data = snapshot.val() as Record<string, { token: string }>;
    return Object.values(data).map((v) => v.token);
  } catch (err) {
    console.error("[firebase] Failed to get FCM tokens:", err);
    return [];
  }
}

export async function getFcmTokenCount(): Promise<number> {
  const database = getFirebaseDb();
  if (!database) return 0;
  try {
    const snapshot = await database.ref("fcmTokens").once("value");
    if (!snapshot.exists()) return 0;
    return Object.keys(snapshot.val() as object).length;
  } catch {
    return 0;
  }
}

export function isFirebaseConnected(): boolean {
  init();
  return db !== null;
}

// ─── FCM Send via Firebase Admin Messaging ────────────────────────────────────

const PERMANENT_FCM_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/sender-id-mismatch",
  "messaging/invalid-argument",
]);

export async function sendFcmNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; errors: number }> {
  if (tokens.length === 0) return { sent: 0, errors: 0 };
  init();
  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
          notificationCount: 1,
        },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      data: data ?? {},
    });

    let sent = 0;
    let errors = 0;
    const database = getFirebaseDb();

    for (let i = 0; i < response.responses.length; i++) {
      const result = response.responses[i];
      if (result.success) {
        sent++;
      } else {
        errors++;
        const code = result.error?.code ?? "";
        console.warn(`[firebase] FCM send error (${code}):`, result.error?.message);

        // Auto-remove permanently invalid tokens so they don't accumulate
        if (PERMANENT_FCM_ERRORS.has(code) && database) {
          try {
            const snapshot = await database.ref("fcmTokens").once("value");
            if (snapshot.exists()) {
              const allTokens = snapshot.val() as Record<string, { token: string }>;
              for (const [uid, entry] of Object.entries(allTokens)) {
                if (entry.token === tokens[i]) {
                  await database.ref(`fcmTokens/${uid}`).remove();
                  console.info(`[firebase] Auto-removed stale FCM token for uid=${uid} (${code})`);
                }
              }
            }
          } catch (cleanupErr) {
            console.warn("[firebase] Failed to remove stale token:", cleanupErr);
          }
        }
      }
    }

    console.info(`[firebase] FCM sent=${sent} errors=${errors} total=${tokens.length}`);
    return { sent, errors };
  } catch (err) {
    console.error("[firebase] FCM sendEachForMulticast failed:", err);
    return { sent: 0, errors: tokens.length };
  }
}

export async function clearAllFcmTokens(): Promise<number> {
  const database = getFirebaseDb();
  if (!database) return 0;
  try {
    const snapshot = await database.ref("fcmTokens").once("value");
    if (!snapshot.exists()) return 0;
    const count = Object.keys(snapshot.val() as object).length;
    await database.ref("fcmTokens").remove();
    console.info(`[firebase] Cleared ${count} FCM tokens`);
    return count;
  } catch (err) {
    console.error("[firebase] Failed to clear FCM tokens:", err);
    return 0;
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function cleanupGhostDevices(): Promise<number> {
  const database = getFirebaseDb();
  if (!database) return 0;
  try {
    const snapshot = await database.ref("users").once("value");
    if (!snapshot.exists()) return 0;
    const users = snapshot.val() as Record<string, { platform?: string }>;
    let removed = 0;
    for (const [uid, data] of Object.entries(users)) {
      const platform = data.platform ?? "unknown";
      if (platform !== "android" && platform !== "ios") {
        await database.ref(`users/${uid}`).remove();
        removed++;
      }
    }
    return removed;
  } catch (err) {
    console.error("[firebase] Failed to cleanup ghost devices:", err);
    return 0;
  }
}
