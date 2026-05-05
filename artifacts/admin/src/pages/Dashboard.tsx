import { useEffect, useState } from "react";
import { adminApi, type Stats } from "@/lib/api";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number | string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`bg-card border border-border rounded-xl p-5 hover:border-${color}-500/40 transition-colors`}
    >
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-bold text-${color}-400`}>{value}</p>
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of Scam Radar India — updates every 15 seconds
        </p>
      </div>

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
          />
          <StatCard
            label="Total Reports"
            value={stats.totalReports}
            color="slate"
            href="/reports"
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Could not load stats.</p>
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
            desc: "Send a push notification to all registered users.",
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
