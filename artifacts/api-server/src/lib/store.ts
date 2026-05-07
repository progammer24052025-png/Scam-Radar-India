import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

export interface Report {
  id: string;
  type: "phone" | "upi" | "message";
  value: string;
  category: string;
  description: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: number;
  verifiedAt?: number;
  submitterUid?: string;
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

interface StoreData {
  reports: Report[];
  pushTokens: string[];
  alerts: Alert[];
}

const DEFAULT_ALERTS: Alert[] = [
  {
    id: "1",
    title: "SBI KYC Update Scam — Nationwide",
    description: "Fraudsters posing as SBI officials on WhatsApp, sending fake KYC update links that redirect to credential-harvesting pages. Victims report unauthorized transactions after visiting link.",
    category: "Bank Scam",
    severity: "CRITICAL",
    reportCount: 2847,
    location: "Pan India",
    timeAgo: "1h ago",
    trend: "rising",
    indicators: ["Fake SBI WhatsApp", "Phishing URL", "KYC urgency"],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: "2",
    title: "Work-From-Home Job Offer Surge",
    description: "Fake job offers promising ₹30,000–₹80,000/month for data entry work from home. Targets recent graduates and homemakers. Requires advance registration fee of ₹500–₹2,000.",
    category: "Job Scam",
    severity: "HIGH",
    reportCount: 1193,
    location: "Delhi, Mumbai, Bengaluru",
    timeAgo: "3h ago",
    trend: "rising",
    indicators: ["Advance fee required", "Unverified company", "WFH promise"],
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
  },
  {
    id: "3",
    title: "UPI Collect Request Fraud",
    description: "Scammers sending UPI collect requests disguised as cashback or refunds. Victims who accept requests unknowingly authorize debit from their account instead of receiving credit.",
    category: "UPI Fraud",
    severity: "HIGH",
    reportCount: 4102,
    location: "All states",
    timeAgo: "5h ago",
    trend: "stable",
    indicators: ["Fake collect request", "Cashback pretext", "Unknown UPI ID"],
    createdAt: Date.now() - 18000000,
    updatedAt: Date.now() - 18000000,
  },
  {
    id: "4",
    title: "I4C Impersonation — Digital Arrest Scam",
    description: "Callers claiming to be I4C or CBI officers threaten 'digital arrest' for alleged illegal online activity. Demand payments of ₹50,000–₹5,00,000 to avoid arrest.",
    category: "Authority Impersonation",
    severity: "HIGH",
    reportCount: 867,
    location: "Metro cities",
    timeAgo: "8h ago",
    trend: "rising",
    indicators: ["Arrest threat", "Authority impersonation", "Large payment demand"],
    createdAt: Date.now() - 28800000,
    updatedAt: Date.now() - 28800000,
  },
  {
    id: "5",
    title: "TRAI SIM Card Disconnection Threat",
    description: "Automated calls claiming TRAI will disconnect SIM cards for illegal activity. Victims are transferred to fake police who demand immediate payment to retain service.",
    category: "Authority Impersonation",
    severity: "MEDIUM",
    reportCount: 645,
    location: "Tier-2 cities",
    timeAgo: "12h ago",
    trend: "stable",
    indicators: ["SIM disconnect threat", "TRAI impersonation", "Automated call"],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: "6",
    title: "KBC Lottery SMS Wave",
    description: "Bulk SMS claiming lottery win of ₹25 lakh from KBC. Directs victims to call a number and pay processing fee of ₹2,000–₹10,000 via UPI to claim prize.",
    category: "Lottery Scam",
    severity: "MEDIUM",
    reportCount: 512,
    location: "Rural areas, Tier-3 cities",
    timeAgo: "1d ago",
    trend: "declining",
    indicators: ["KBC branding", "Processing fee", "Bulk SMS"],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "7",
    title: "AnyDesk RAT Installation Scam",
    description: "Scammers posing as bank customer support ask victims to install AnyDesk for 'technical assistance'. Once installed, they access the victim's banking app and transfer funds.",
    category: "Bank Scam",
    severity: "HIGH",
    reportCount: 378,
    location: "Urban areas",
    timeAgo: "2d ago",
    trend: "declining",
    indicators: ["Remote access tool", "Bank impersonation", "App installation request"],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: "8",
    title: "Fake Investment Platform Scam",
    description: "WhatsApp groups promoting fake stock trading and crypto platforms offering guaranteed 3x returns. Initial small returns paid to build trust, then victims lose large deposits.",
    category: "Investment Scam",
    severity: "MEDIUM",
    reportCount: 289,
    location: "Urban, semi-urban",
    timeAgo: "3d ago",
    trend: "rising",
    indicators: ["Guaranteed returns", "WhatsApp groups", "Fake platform"],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
];

let _store: StoreData = {
  reports: [],
  pushTokens: [],
  alerts: DEFAULT_ALERTS,
};

function loadFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      _store = {
        reports: parsed.reports ?? [],
        pushTokens: parsed.pushTokens ?? [],
        alerts: parsed.alerts && parsed.alerts.length > 0 ? parsed.alerts : DEFAULT_ALERTS,
      };
    }
  } catch {
    // use defaults
  }
}

function saveToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(_store, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

loadFromDisk();

export const store = {
  getReports: (): Report[] => [..._store.reports],
  addReport: (report: Report): void => {
    _store.reports.unshift(report);
    saveToDisk();
  },
  updateReport: (id: string, updates: Partial<Report>): Report | null => {
    const idx = _store.reports.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    _store.reports[idx] = { ..._store.reports[idx], ...updates };
    saveToDisk();
    return _store.reports[idx];
  },
  deleteReport: (id: string): boolean => {
    const before = _store.reports.length;
    _store.reports = _store.reports.filter((r) => r.id !== id);
    if (_store.reports.length !== before) {
      saveToDisk();
      return true;
    }
    return false;
  },
  getAlerts: (): Alert[] => [..._store.alerts].sort((a, b) => b.updatedAt - a.updatedAt),
  addAlert: (alert: Alert): void => {
    _store.alerts.unshift(alert);
    saveToDisk();
  },
  updateAlert: (id: string, updates: Partial<Alert>): Alert | null => {
    const idx = _store.alerts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    _store.alerts[idx] = { ..._store.alerts[idx], ...updates, updatedAt: Date.now() };
    saveToDisk();
    return _store.alerts[idx];
  },
  deleteAlert: (id: string): boolean => {
    const before = _store.alerts.length;
    _store.alerts = _store.alerts.filter((a) => a.id !== id);
    if (_store.alerts.length !== before) {
      saveToDisk();
      return true;
    }
    return false;
  },
  getPushTokens: (): string[] => [..._store.pushTokens],
  addPushToken: (token: string): void => {
    if (!_store.pushTokens.includes(token)) {
      _store.pushTokens.push(token);
      saveToDisk();
    }
  },
  removePushToken: (token: string): void => {
    _store.pushTokens = _store.pushTokens.filter((t) => t !== token);
    saveToDisk();
  },
};
