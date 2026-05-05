import { useEffect, useState } from "react";
import { adminApi, type Report } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  verified: "text-green-400 bg-green-400/10 border-green-400/30",
  rejected: "text-red-400 bg-red-400/10 border-red-400/30",
};

const TYPE_ICON: Record<string, string> = {
  phone: "📞",
  upi: "💳",
  message: "💬",
};

function VerifyModal({
  report,
  onClose,
  onVerify,
}: {
  report: Report;
  onClose: () => void;
  onVerify: (scamInfo: NonNullable<Report["scamInfo"]>) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modus, setModus] = useState("");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    await onVerify({ title, description, modus, severity });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Verify Report</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Fill in the scam details. This info will be shown to all users when this scam is looked up, and a push notification will be sent.
        </p>

        <div className="bg-secondary rounded-lg p-3 mb-5 text-sm">
          <span className="text-muted-foreground">{TYPE_ICON[report.type]} {report.type.toUpperCase()}: </span>
          <span className="text-foreground font-medium">{report.value}</span>
          {report.description && (
            <p className="text-muted-foreground mt-1 text-xs">{report.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Scam Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SBI KYC Update Scam"
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
              placeholder="Explain how this scam works..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Modus Operandi
            </label>
            <input
              value={modus}
              onChange={(e) => setModus(e.target.value)}
              placeholder="How did they operate?"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Severity
            </label>
            <div className="flex gap-2">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    severity === s
                      ? s === "CRITICAL"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : s === "HIGH"
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : s === "MEDIUM"
                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                        : "bg-green-500/20 border-green-500 text-green-400"
                      : "bg-secondary border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

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
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-green-500 transition"
            >
              {loading ? "Verifying…" : "Verify & Notify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FilterStatus = "all" | "pending" | "verified" | "rejected";

export default function Reports({ token }: { token: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [verifying, setVerifying] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = async () => {
    const { data } = await adminApi.getReports(token);
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const handleVerify = async (scamInfo: NonNullable<Report["scamInfo"]>) => {
    if (!verifying) return;
    const { error } = await adminApi.verifyReport(token, verifying.id, scamInfo);
    if (error) {
      showToast("Error: " + error);
    } else {
      showToast("Report verified and push notification sent!");
      setVerifying(null);
      fetchReports();
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "_reject");
    await adminApi.rejectReport(token, id);
    showToast("Report rejected.");
    fetchReports();
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id + "_delete");
    await adminApi.deleteReport(token, id);
    showToast("Report deleted.");
    fetchReports();
    setActionLoading(null);
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground shadow-lg">
          {toast}
        </div>
      )}
      {verifying && (
        <VerifyModal
          report={verifying}
          onClose={() => setVerifying(null)}
          onVerify={handleVerify}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">{reports.length} total reports</p>
        </div>
        <button
          onClick={fetchReports}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "pending", "verified", "rejected"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              filter === s
                ? "bg-primary/15 border-primary/40 text-primary font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({reports.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading reports…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">⚑</p>
          <p className="text-sm">No {filter === "all" ? "" : filter} reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{TYPE_ICON[report.type]}</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {report.type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[report.status]}`}
                    >
                      {report.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{report.category}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground break-all">
                    {report.value}
                  </p>
                  {report.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  {report.scamInfo && (
                    <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-green-400">{report.scamInfo.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{report.scamInfo.description}</p>
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Submitted: {new Date(report.submittedAt).toLocaleString("en-IN")} · ID: {report.id}
                  </p>
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setVerifying(report)}
                      className="px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-semibold hover:bg-green-600/30 transition"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      disabled={actionLoading === report.id + "_reject"}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {report.status !== "pending" && (
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={actionLoading === report.id + "_delete"}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs hover:text-red-400 hover:border-red-400/40 transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
