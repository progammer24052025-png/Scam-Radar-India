import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");
const USER_FILE = path.join(DATA_DIR, "users.json");

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  points: number;
  reportsSubmitted: number;
  reportsVerified: number;
  reportsRejected: number;
  joinedAt: number;
  lastActive: number;
}

interface UserStore {
  users: Record<string, UserProfile>;
}

let _data: UserStore = { users: {} };

function load(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(USER_FILE)) {
      const raw = fs.readFileSync(USER_FILE, "utf-8");
      _data = JSON.parse(raw) as UserStore;
    }
  } catch {
    // use defaults
  }
}

function save(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USER_FILE, JSON.stringify(_data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

load();

export const POINTS = {
  REPORT_SUBMITTED: 5,
  REPORT_VERIFIED: 20,
  REPORT_REJECTED: -10,
};

export const userStore = {
  upsert(uid: string, partial: Partial<UserProfile>): UserProfile {
    const existing = _data.users[uid];
    const now = Date.now();
    _data.users[uid] = {
      uid,
      email: partial.email ?? existing?.email ?? "",
      displayName: partial.displayName ?? existing?.displayName ?? "Anonymous",
      photoUrl: partial.photoUrl ?? existing?.photoUrl,
      points: partial.points ?? existing?.points ?? 0,
      reportsSubmitted: partial.reportsSubmitted ?? existing?.reportsSubmitted ?? 0,
      reportsVerified: partial.reportsVerified ?? existing?.reportsVerified ?? 0,
      reportsRejected: partial.reportsRejected ?? existing?.reportsRejected ?? 0,
      joinedAt: existing?.joinedAt ?? now,
      lastActive: now,
    };
    save();
    return _data.users[uid];
  },

  get(uid: string): UserProfile | null {
    return _data.users[uid] ?? null;
  },

  addPoints(uid: string, delta: number): UserProfile | null {
    const user = _data.users[uid];
    if (!user) return null;
    user.points = Math.max(0, user.points + delta);
    if (delta > 0) user.reportsVerified = (user.reportsVerified ?? 0) + 1;
    if (delta < 0) user.reportsRejected = (user.reportsRejected ?? 0) + 1;
    save();
    return user;
  },

  incrementSubmitted(uid: string): void {
    const user = _data.users[uid];
    if (!user) return;
    user.points = (user.points ?? 0) + POINTS.REPORT_SUBMITTED;
    user.reportsSubmitted = (user.reportsSubmitted ?? 0) + 1;
    save();
  },

  getLeaderboard(limit = 20): UserProfile[] {
    return Object.values(_data.users)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  },

  getAll(): UserProfile[] {
    return Object.values(_data.users);
  },
};
