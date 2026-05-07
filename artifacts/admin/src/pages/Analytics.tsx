import { useEffect, useState } from "react";
import { adminApi, type Analytics } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TYPE_COLORS: Record<string, string> = {
  phone: "#6366f1",
  upi: "#f59e0b",
  message: "#10b981",
};

const CAT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#0ea5e9",
];

const RANK_BADGES: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Analytics({ token }: { token: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getAnalytics(token).then(({ data: d, error: e }) => {
      if (d) setData(d);
      else setError(e ?? "Failed to load");
      setLoading(false);
    });
    const iv = setInterval(() => {
      adminApi.getAnalytics(token).then(({ data: d }) => { if (d) setData(d); });
    }, 30000);
    return () => clearInterval(iv);
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-muted-foreground text-sm">Loading analytics…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-red-400 text-sm">Error: {error ?? "No data"}</div>
      </div>
    );
  }

  // Format dates for display — show last 14 days labels, rest minimal
  const dayLabels = data.reportsByDay.map((d, i) => ({
    ...d,
    label: i % 5 === 0 ? d.date.slice(5) : "",
  }));

  const totalReports = data.reportsByType.reduce((s, t) => s + t.count, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Report volume, category breakdown, and community leaderboard
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {data.reportsByType.map((t) => (
          <div key={t.type} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground capitalize mb-1">{t.type} Reports</p>
            <p className="text-2xl font-bold" style={{ color: TYPE_COLORS[t.type] ?? "#6366f1" }}>
              {t.count}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalReports > 0 ? Math.round((t.count / totalReports) * 100) : 0}% of total
            </p>
          </div>
        ))}
      </div>

      {/* Reports over time */}
      <Section title="Reports Submitted — Last 30 Days">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dayLabels} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#6366f1" }}
              formatter={(v: number) => [v, "Reports"]}
              labelFormatter={(l: string) => l || ""}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Category + Type side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Section title="Reports by Category">
          {data.reportsByCategory.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reports yet</p>
          ) : (
            <div className="space-y-2">
              {data.reportsByCategory.map((c, i) => (
                <div key={c.category} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground truncate">{c.category}</span>
                      <span className="text-muted-foreground ml-2 shrink-0">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalReports > 0 ? (c.count / totalReports) * 100 : 0}%`,
                          backgroundColor: CAT_COLORS[i % CAT_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Reports by Type">
          {totalReports === 0 ? (
            <p className="text-xs text-muted-foreground">No reports yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.reportsByType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                  paddingAngle={3}
                >
                  {data.reportsByType.map((t) => (
                    <Cell key={t.type} fill={TYPE_COLORS[t.type] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v: string) => (
                    <span style={{ color: "#9ca3af", fontSize: 11, textTransform: "capitalize" }}>{v}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "#9ca3af" }}
                  formatter={(v: number, name: string) => [v, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Leaderboard */}
      <Section title="Top Community Reporters">
        {data.leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground">No users have earned points yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 text-xs text-muted-foreground font-medium w-10">#</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium">User</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-right">Points</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-right">Submitted</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-right">Verified</th>
                  <th className="pb-3 text-xs text-muted-foreground font-medium text-right">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((u, i) => (
                  <tr key={u.uid} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 text-base">{RANK_BADGES[i] ?? `${i + 1}`}</td>
                    <td className="py-3">
                      <div>
                        <p className="text-foreground font-medium text-sm">{u.displayName}</p>
                        {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-indigo-400 font-bold">{u.points}</span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{u.reportsSubmitted}</td>
                    <td className="py-3 text-right text-green-400">{u.reportsVerified}</td>
                    <td className="py-3 text-right text-red-400">{u.reportsRejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
