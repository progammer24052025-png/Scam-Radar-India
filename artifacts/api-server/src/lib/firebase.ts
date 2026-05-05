import admin from "firebase-admin";

let db: admin.database.Database | null = null;
let initialized = false;

export function getFirebaseDb(): admin.database.Database | null {
  if (initialized) return db;
  initialized = true;

  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  const databaseUrl = process.env["FIREBASE_DATABASE_URL"] ?? "https://scam-radar-india-default-rtdb.asia-southeast1.firebasedatabase.app";

  if (!serviceAccountJson) {
    console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT not set — user count from Firebase unavailable");
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

export async function registerUserInFirebase(uid: string, deviceInfo: {
  platform: string;
  appVersion?: string;
  registeredAt: number;
}): Promise<void> {
  const database = getFirebaseDb();
  if (!database) return;
  try {
    const payload: Record<string, string | number> = {
      platform: deviceInfo.platform,
      registeredAt: deviceInfo.registeredAt,
      lastSeen: Date.now(),
    };
    if (deviceInfo.appVersion) {
      payload["appVersion"] = deviceInfo.appVersion;
    }
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
    return Object.keys(snapshot.val() as Record<string, unknown>).length;
  } catch (err) {
    console.error("[firebase] Failed to get user count:", err);
    return null;
  }
}
