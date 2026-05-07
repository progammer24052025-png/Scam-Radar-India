import { useState, useEffect } from "react";
import { Router as WouterRouter, Switch, Route } from "wouter";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import AlertsPage from "@/pages/Alerts";
import Notify from "@/pages/Notify";
import Sidebar from "@/components/Sidebar";

const TOKEN_KEY = "sr_admin_token";

export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );

  const handleLogin = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <div className="flex min-h-screen bg-background">
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={() => <Dashboard token={token} />} />
            <Route path="/analytics" component={() => <Analytics token={token} />} />
            <Route path="/reports" component={() => <Reports token={token} />} />
            <Route path="/alerts" component={() => <AlertsPage token={token} />} />
            <Route path="/notify" component={() => <Notify token={token} />} />
          </Switch>
        </main>
      </div>
    </WouterRouter>
  );
}
