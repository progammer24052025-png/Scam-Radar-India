import { useState } from "react";
import { adminApi } from "@/lib/api";

const TEMPLATES = [
  {
    label: "New Scam Alert",
    title: "🚨 New Scam Alert",
    body: "A new high-severity scam has been detected. Open Scam Radar for details.",
  },
  {
    label: "Safety Reminder",
    title: "🛡️ Safety Reminder",
    body: "Never share your OTP, UPI PIN, or bank password with anyone — even someone who claims to be from your bank.",
  },
  {
    label: "Verified Scam Pattern",
    title: "⚠️ Verified Scam Pattern",
    body: "A new scam pattern has been verified by our team. Check the Alerts tab for details.",
  },
  {
    label: "1930 Reminder",
    title: "📞 Cybercrime Helpline",
    body: "If you've been scammed, call 1930 immediately or visit cybercrime.gov.in to file a report.",
  },
];

async function clearFcmTokens(token: string) {
  const res = await fetch("/api/admin/clear-fcm-tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return { ok: false, cleared: 0 };
  return res.json() as Promise<{ ok: boolean; cleared: number }>;
}

export default function Notify({ token }: { token: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    setResult(null);
    setError(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const { data, error: err } = await adminApi.broadcast(token, title, body);
    setLoading(false);

    if (err || !data) {
      setError(err ?? "Failed to send");
    } else {
      setResult({ sent: data.sent, errors: data.errors });
      if (data.sent > 0) {
        setTitle("");
        setBody("");
      }
    }
  };

  const handleClearTokens = async () => {
    setClearing(true);
    setClearResult(null);
    const data = await clearFcmTokens(token);
    setClearing(false);
    setClearResult(
      data.cleared > 0
        ? `Cleared ${data.cleared} stale token${data.cleared !== 1 ? "s" : ""} from Firebase.`
        : "No tokens to clear."
    );
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Broadcast Notification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a push notification to all registered Scam Radar users via Firebase FCM.
        </p>
      </div>

      <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-sm text-yellow-400 font-semibold mb-1">⚠ FCM requires a development build</p>
        <p className="text-xs text-yellow-400/80 leading-5">
          <strong>Expo Go SDK 53+ removed FCM support.</strong> Tokens registered through Expo Go use Expo's own Firebase sender ID and will fail with a "SenderId mismatch" error. To receive real FCM notifications, the Android app must be built as a <strong>standalone APK or development build</strong> with your own <code className="bg-yellow-500/20 px-1 rounded">google-services.json</code> included.
          <br /><br />
          Until then, use the button below to clear stale Expo Go tokens that are causing send failures.
        </p>
        <button
          onClick={handleClearTokens}
          disabled={clearing}
          className="mt-3 px-4 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition disabled:opacity-50"
        >
          {clearing ? "Clearing…" : "Clear stale FCM tokens"}
        </button>
        {clearResult && (
          <p className="mt-2 text-xs text-yellow-400/80">{clearResult}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Templates
          </h2>
          <div className="space-y-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => applyTemplate(tpl)}
                className="w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition"
              >
                <p className="text-sm font-medium text-foreground">{tpl.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.body}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Compose
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message body..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setTitle("🔔 Test Notification");
                setBody("Firebase FCM is working correctly on your device.");
                setResult(null);
                setError(null);
              }}
              className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition"
            >
              Fill with test message
            </button>

            {result && (
              <div className={`rounded-lg p-3 border ${
                result.sent > 0
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                <p className={`text-sm font-medium ${result.sent > 0 ? "text-green-400" : "text-red-400"}`}>
                  {result.sent > 0
                    ? `Sent successfully to ${result.sent} device${result.sent !== 1 ? "s" : ""}${result.errors > 0 ? ` (${result.errors} failed — stale tokens auto-removed)` : ""}`
                    : `Sent to 0 devices${result.errors > 0 ? ` (${result.errors} failed — stale tokens auto-removed from Firebase)` : ""}. Use "Clear stale FCM tokens" above.`}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? "Sending…" : "Send to All Users"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
