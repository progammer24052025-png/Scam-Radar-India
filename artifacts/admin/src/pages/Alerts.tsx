import { useEffect, useState } from "react";
import { adminApi, type Alert } from "@/lib/api";

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/30",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
};

const TREND_ICON: Record<string, string> = {
  rising: "↑",
  stable: "→",
  declining: "↓",
};

function AlertForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Alert>;
  onSave: (data: Partial<Alert> & { notify?: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM">(
    initial?.severity ?? "HIGH"
  );
  const [location, setLocation] = useState(initial?.location ?? "India");
  const [trend, setTrend] = useState<"rising" | "stable" | "declining">(
    initial?.trend ?? "rising"
  );
  const [reportCount, setReportCount] = useState(initial?.reportCount ?? 0);
  const [indicators, setIndicators] = useState(
    (initial?.indicators ?? []).join(", ")
  );
  const [notify, setNotify] = useState(!initial?.id);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    await onSave({
      title,
      description,
      category,
      severity,
      location,
      trend,
      reportCount,
      indicators: indicators
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notify,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg my-4 p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {initial?.id ? "Edit Alert" : "New Alert"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SBI KYC Update Scam — Nationwide"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the threat in detail..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bank Scam"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pan India"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["CRITICAL", "HIGH", "MEDIUM"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      severity === s
                        ? SEVERITY_COLOR[s]
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Trend
              </label>
              <div className="flex gap-1.5">
                {(["rising", "stable", "declining"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrend(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      trend === t
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {TREND_ICON[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Report Count
              </label>
              <input
                type="number"
                value={reportCount}
                onChange={(e) => setReportCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Indicators (comma-sep)
              </label>
              <input
                value={indicators}
                onChange={(e) => setIndicators(e.target.value)}
                placeholder="Fake link, Urgency..."
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {!initial?.id && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground">
                Send push notification to all users
              </span>
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? "Saving…" : initial?.id ? "Update Alert" : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AlertsPage({ token }: { token: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Alert> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlerts = async () => {
    const { data } = await adminApi.getAlerts(token);
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  const handleCreate = async (data: Partial<Alert> & { notify?: boolean }) => {
    const { error } = await adminApi.createAlert(token, data);
    if (error) {
      showToast("Error: " + error);
    } else {
      showToast(data.notify ? "Alert created and push sent!" : "Alert created.");
      setCreating(false);
      fetchAlerts();
    }
  };

  const handleUpdate = async (data: Partial<Alert>) => {
    if (!editing?.id) return;
    const { error } = await adminApi.updateAlert(token, editing.id, data);
    if (error) {
      showToast("Error: " + error);
    } else {
      showToast("Alert updated.");
      setEditing(null);
      fetchAlerts();
    }
  };

  const handleDelete = async (id: string) => {
    await adminApi.deleteAlert(token, id);
    showToast("Alert deleted.");
    fetchAlerts();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}
      {creating && (
        <AlertForm onSave={handleCreate} onClose={() => setCreating(false)} />
      )}
      {editing && (
        <AlertForm
          initial={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Threat Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {alerts.length} alerts in the feed
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
        >
          + New Alert
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading alerts…</p>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">⚠</p>
          <p className="text-sm">No alerts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[alert.severity]}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{alert.category}</span>
                    <span className="text-xs text-muted-foreground">{TREND_ICON[alert.trend]} {alert.trend}</span>
                    <span className="text-xs text-muted-foreground">{alert.reportCount.toLocaleString()} reports</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  {alert.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.indicators.map((ind, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {alert.location} · Updated {new Date(alert.updatedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditing(alert)}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs hover:text-foreground hover:border-primary/40 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs hover:text-red-400 hover:border-red-400/40 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
