const BASE = "/api";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function req<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...authHeader(token), ...(options?.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Request failed");
      return { data: null, error: text };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Network error" };
  }
}

export interface Report {
  id: string;
  type: "phone" | "upi" | "message";
  value: string;
  category: string;
  description: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: number;
  verifiedAt?: number;
  scamInfo?: {
    title: string;
    description: string;
    modus: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  };
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  reportCount: number;
  location: string;
  timeAgo: string;
  trend: "rising" | "stable" | "declining";
  indicators: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Stats {
  totalReports: number;
  pendingReports: number;
  verifiedReports: number;
  rejectedReports: number;
  totalAlerts: number;
  registeredDevices: number;
  fcmTokens: number;
  firebaseConnected: boolean;
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  email: string;
  points: number;
  reportsSubmitted: number;
  reportsVerified: number;
  reportsRejected: number;
  joinedAt: number;
}

export interface Analytics {
  reportsByDay: { date: string; count: number }[];
  reportsByCategory: { category: string; count: number }[];
  reportsByType: { type: string; count: number }[];
  leaderboard: LeaderboardUser[];
}

export const adminApi = {
  login: async (password: string) => {
    try {
      const res = await fetch(`${BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        return { data: null, error: body.error ?? `HTTP ${res.status}: Invalid password` };
      }
      const data = (await res.json()) as { token: string };
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? `Network error: ${e.message}` : "Connection failed" };
    }
  },

  getStats: (token: string) => req<Stats>("/admin/stats", token),

  getReports: (token: string) => req<Report[]>("/reports", token),

  verifyReport: (
    token: string,
    id: string,
    scamInfo: Report["scamInfo"]
  ) =>
    req<Report>(`/reports/${id}/verify`, token, {
      method: "PUT",
      body: JSON.stringify({ scamInfo }),
    }),

  rejectReport: (token: string, id: string) =>
    req<Report>(`/reports/${id}/reject`, token, { method: "PUT" }),

  deleteReport: (token: string, id: string) =>
    req<{ ok: boolean }>(`/reports/${id}`, token, { method: "DELETE" }),

  getAlerts: (token: string) => req<Alert[]>("/alerts", token),

  createAlert: (token: string, alert: Partial<Alert> & { notify?: boolean }) =>
    req<Alert>("/alerts", token, {
      method: "POST",
      body: JSON.stringify(alert),
    }),

  updateAlert: (token: string, id: string, updates: Partial<Alert>) =>
    req<Alert>(`/alerts/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteAlert: (token: string, id: string) =>
    req<{ ok: boolean }>(`/alerts/${id}`, token, { method: "DELETE" }),

  broadcast: (token: string, title: string, body: string) =>
    req<{ ok: boolean; sent: number; errors: number }>("/admin/notify", token, {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }),

  getAnalytics: (token: string) => req<Analytics>("/admin/analytics", token),
};
