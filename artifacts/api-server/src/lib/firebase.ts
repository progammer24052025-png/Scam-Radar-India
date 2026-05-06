import admin from "firebase-admin";

let db: admin.database.Database | null = null;
let initialized = false;

export function getFirebaseDb(): admin.database.Database | null {
  if (initialized) return db;
  initialized = true;

  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  const databaseUrl =
    process.env["FIREBASE_DATABASE_URL"] ??
    "https://scam-radar-india-default-rtdb.asia-southeast1.firebasedatabase.app";

  if (!serviceAccountJson) {
    console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT not set");
    return null;
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
    return db;
  } catch (err) {
    console.error("[firebase] Failed to initialize Firebase Admin:", err);
    return null;
  }
}

function tokenKey(token: string): string {
  return token.replace(/[.#$[\]]/g, "_");
}

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
    // only count real native devices
    return Object.values(users).filter(
      (u) => u.platform === "android" || u.platform === "ios"
    ).length;
  } catch (err) {
    console.error("[firebase] Failed to get user count:", err);
    return null;
  }
}

export async function savePushTokenToFirebase(
  token: string,
  platform: string
): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    await database.ref(`pushTokens/${tokenKey(token)}`).set({
      token,
      platform,
      savedAt: Date.now(),
    });
  } catch (err) {
    console.error("[firebase] Failed to save push token:", err);
  }
}

export async function removePushTokenFromFirebase(token: string): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    await database.ref(`pushTokens/${tokenKey(token)}`).remove();
  } catch (err) {
    console.error("[firebase] Failed to remove push token:", err);
  }
}

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

export async function getAllPushTokensFromFirebase(): Promise<string[]> {
  const database = getFirebaseDb();
  if (!database) return [];
  try {
    const snapshot = await database.ref("pushTokens").once("value");
    if (!snapshot.exists()) return [];
    const data = snapshot.val() as Record<string, { token: string }>;
    return Object.values(data).map((v) => v.token);
  } catch (err) {
    console.error("[firebase] Failed to get push tokens:", err);
    return [];
  }
}
