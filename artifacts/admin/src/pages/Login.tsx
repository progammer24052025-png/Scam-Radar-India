import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    adminApi.getPasswordHint().then(setCurrentPassword);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await adminApi.login(password);
    setLoading(false);
    if (err || !data) {
      setError(err ?? "Login failed. Please try again.");
      return;
    }
    onLogin(data.token);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-lg">
            ⛨
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest text-foreground">SCAM RADAR</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7">
          <h1 className="text-xl font-bold text-foreground mb-1">Sign In</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter your admin password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {currentPassword && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Current password</p>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {showPassword ? "Hide" : "Reveal"}
                </button>
              </div>
              {showPassword && (
                <div className="mt-1.5 px-3 py-2 rounded-lg bg-secondary border border-border font-mono text-sm text-foreground select-all">
                  {currentPassword}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Change it by setting the <code className="text-primary">ADMIN_PASSWORD</code> env var.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
