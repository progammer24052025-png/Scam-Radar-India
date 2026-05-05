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

export default function Notify({ token }: { token: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setTitle("");
      setBody("");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Broadcast Notification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a push notification to all registered Scam Radar users. This works even when the app is closed.
        </p>
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

            <div className="bg-secondary border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="shrink-0">ℹ</span>
                This will send to all devices that have registered for notifications. Devices using Expo Go will receive the notification. Devices that uninstalled the app will be automatically removed from the list.
              </p>
            </div>

            {result && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-400 font-medium">
                  Sent successfully to {result.sent} device{result.sent !== 1 ? "s" : ""}
                  {result.errors > 0 ? ` (${result.errors} failed)` : ""}
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
