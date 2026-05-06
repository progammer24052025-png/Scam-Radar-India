import { Platform } from "react-native";

function getBaseUrl(): string {
  if (Platform.OS === "web") {
    return "/api";
  }
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) {
    return `https://${domain}/api`;
  }
  return "http://localhost:80/api";
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "Request failed");
      return { data: null, error: text };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}

export interface ApiReport {
  id: string;
  type: "phone" | "upi" | "message";
  value: string;
  category: string;
  description: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: number;
  scamInfo?: {
    title: string;
    description: string;
    modus: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  };
}

export interface ApiAlert {
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

export const api = {
  submitReport: (report: {
    type: "phone" | "upi" | "message";
    value: string;
    category: string;
    description: string;
  }) =>
    request<ApiReport>("/reports", {
      method: "POST",
      body: JSON.stringify(report),
    }),

  getAlerts: () => request<ApiAlert[]>("/alerts"),

  registerUser: (uid: string, platform: string, fcmToken?: string) =>
    request<{ ok: boolean; uid: string }>("/users/register", {
      method: "POST",
      body: JSON.stringify({ uid, platform, fcmToken }),
    }),
};
