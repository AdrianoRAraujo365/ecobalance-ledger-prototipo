const items = [
  ["dashboard", "Visão geral"],
  ["indicators", "Indicadores ESG"],
  ["calculator", "Calculadora"],
  ["ledger", "Ledger"],
  ["notifications", "Notificações"]
];

export default function AppShell({ user, page, setPage, onLogout, theme, onThemeToggle, children }) {
  const permissions = user.permissoes || [];
  const links = [...items];
  if (permissions.includes("users:read")) links.push(["users", "Usuários"]);
  if (permissions.includes("oauth:manage")) links.push(["integrations", "Integrações"]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="topbar">
        <a className="brand" href="#dashboard" onClick={() => setPage("dashboard")}>EcoBalance Ledger</a>
        <div className="identity">
          <span>{user.nome} · {user.perfilRotulo}</span>
          <button className="secondary" type="button" aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`}
            aria-pressed={theme === "dark"} onClick={onThemeToggle}>{theme === "dark" ? "Tema claro" : "Tema escuro"}</button>
          <a href="/dashboard">Interface completa</a>
          <a href="/api-docs">API</a>
          <button className="secondary" type="button" onClick={onLogout}>Sair</button>
        </div>
      </header>
      <div className="layout">
        <nav className="navigation" aria-label="Navegação principal">
          {links.map(([key, label]) => (
            <button key={key} className={page === key ? "nav-item active" : "nav-item"} type="button"
              aria-current={page === key ? "page" : undefined} onClick={() => setPage(key)}>
              {label}
            </button>
          ))}
        </nav>
        <main id="main-content" className="content" tabIndex="-1">{children}</main>
      </div>
    </div>
  );
}
