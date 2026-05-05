import { useLocation, Link } from "wouter";

const NAV = [
  { path: "/", label: "Dashboard", icon: "▦" },
  { path: "/reports", label: "Reports", icon: "⚑" },
  { path: "/alerts", label: "Alerts", icon: "⚠" },
  { path: "/notify", label: "Broadcast", icon: "⌘" },
];

export default function Sidebar({ onLogout }: { onLogout: () => void }) {
  const [location] = useLocation();

  return (
    <aside className="w-56 flex flex-col border-r border-border bg-card min-h-screen shrink-0">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm">
            ⛨
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-foreground">SCAM RADAR</p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-base w-4 text-center">{item.icon}</span>
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <span className="text-base w-4 text-center">↩</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
