import { useEffect, useState } from "react";
import { adminApi, type Stats } from "@/lib/api";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  color,
  href,
  sub,
}: {
  label: string;
  value: number | string;
  color: string;
  href?: string;
  sub?: string;
}) {
  const inner = (
    <div
      className={`bg-card border border-border rounded-xl p-5 hover:border-${color}-500/40 transition-colors`}
    >
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-bold text-${color}-400`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <a>{inner}</a>
      </Link>
    );
  }
  return inner;
}

export default function Dashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats(token).then(({ data }) => {
      if (data) setStats(data);
      setLoading(false);
    });
    const interval = setInterval(() => {
      adminApi.getStats(token).then(({ data }) => {
        if (data) setStats(data);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of Scam Radar India — updates every 15 seconds
          </p>
        </div>
        {stats && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              stats.firebaseConnected
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                stats.firebaseConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            {stats.firebaseConnected ? "Firebase connected" : "Firebase not connected — set FIREBASE_SERVICE_ACCOUNT secret"}
          </div>
        )}
      </div>

      {!stats?.firebaseConnected && !loading && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-400 font-medium mb-1">Firebase not configured</p>
          <p className="text-xs text-yellow-400/80">
            Add <code className="bg-yellow-500/20 px-1 rounded">FIREBASE_SERVICE_ACCOUNT</code> in Replit Secrets, then restart the API workflow. Without it, push notifications and device counts won't work.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading stats…</div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Pending Reports"
            value={stats.pendingReports}
            color="yellow"
            href="/reports"
          />
          <StatCard
            label="Verified Reports"
            value={stats.verifiedReports}
            color="green"
            href="/reports"
          />
          <StatCard
            label="Rejected Reports"
            value={stats.rejectedReports}
            color="red"
            href="/reports"
          />
          <StatCard
            label="Total Alerts"
            value={stats.totalAlerts}
            color="blue"
            href="/alerts"
          />
          <StatCard
            label="Registered Devices"
            value={stats.registeredDevices}
            color="purple"
            sub="Android + iOS users in Firebase"
          />
          <StatCard
            label="FCM Tokens"
            value={stats.fcmTokens}
            color="indigo"
            sub="Devices that can receive notifications"
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Could not load stats.</p>
      )}

      {stats && stats.registeredDevices > 0 && stats.fcmTokens === 0 && (
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-400 font-medium mb-1">Devices registered but no FCM tokens yet</p>
          <p className="text-xs text-blue-400/80">
            Ask users to reopen the app — it will re-register its FCM token now that Firebase is connected.
          </p>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "⚑",
            title: "Review Reports",
            desc: "Verify or reject pending user-submitted scam reports.",
            href: "/reports",
          },
          {
            icon: "⚠",
            title: "Manage Alerts",
            desc: "Create, edit, or remove threat intelligence alerts.",
            href: "/alerts",
          },
          {
            icon: "⌘",
            title: "Broadcast",
            desc: "Send a push notification to all registered users via FCM.",
            href: "/notify",
          },
        ].map((card) => (
          <Link key={card.href} href={card.href}>
            <a className="block bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors">
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-foreground text-sm">{card.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-5">{card.desc}</p>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
