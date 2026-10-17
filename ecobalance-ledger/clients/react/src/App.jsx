import { useEffect, useState } from "react";
import { api } from "./api";
import { applyTheme, getPreferredTheme } from "../../shared/theme";
import LoginForm from "./components/LoginForm";
import AppShell from "./components/AppShell";
import { Dashboard, Indicators, Calculator, Ledger, Notifications, Users } from "./screens";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    api("/auth/me")
      .then((result) => setUser(result.data))
      .catch((reason) => {
        if (reason.status !== 401) setError(reason.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, senha) {
    const result = await api("/auth/login", { method: "POST", body: { email, senha } });
    setUser(result.user);
    setError("");
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setError("");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUser(null);
      setPage("dashboard");
    }
  }

  if (loading) return <main className="content" role="status">Carregando sessão…</main>;
  if (!user) return <><LoginForm onLogin={login} theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />{error && <p className="error" role="alert">{error}</p>}</>;

  const pages = {
    dashboard: <Dashboard user={user} />,
    indicators: <Indicators user={user} />,
    calculator: <Calculator user={user} />,
    ledger: <Ledger user={user} />,
    notifications: <Notifications user={user} />,
    users: <Users user={user} />
  };

  return (
    <AppShell user={user} page={page} setPage={setPage} onLogout={logout} theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {page === "integrations"
        ? <section className="panel"><h1>Integrações OAuth 2.0</h1><p>Gerencie clientes OAuth na interface completa.</p><a href="/integracoes">Abrir integrações</a></section>
        : pages[page] || pages.dashboard}
    </AppShell>
  );
}
