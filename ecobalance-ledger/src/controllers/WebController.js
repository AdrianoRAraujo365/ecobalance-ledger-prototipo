const { can, ROTULOS } = require("../config/permissions");

const render = (view, title, active, script) => (req, res) =>
  res.render(view, { title, active, script: script || view });

// Evita open-redirect: só aceita caminhos internos
function safeNext(n) {
  return typeof n === "string" && /^\/[A-Za-z0-9\-_/]*$/.test(n) ? n : "/dashboard";
}

module.exports = {
  home: (req, res) => res.render("home", { title: "EcoBalance Ledger | TI Verde & Governança ESG", active: "home" }),
  login: (req, res) => res.render("login", { title: "Entrar", active: "login", script: "auth", next: safeNext(req.query.next) }),
  register: render("register", "Criar conta", "register", "auth"),
  dashboard: render("dashboard", "Dashboard ESG", "dashboard"),
  calculadora: render("calculadora", "Calculadora", "calculadora"),
  esg: render("esg", "Indicadores ESG", "esg"),
  ledger: render("ledger", "Ledger SHA-256", "ledger"),
  notificacoes: render("notificacoes", "Notificações", "notificacoes"),
  usuarios: render("usuarios", "Usuários", "usuarios"),
  integracoes: (req, res) => res.render("integracoes", {
    title: "Integrações OAuth 2.0", active: "integracoes", script: "integracoes",
    origem: `${req.protocol}://${req.get("host")}`
  }),

  // Usuário e permissões disponíveis em todas as views
  locals(req, res, next) {
    const u = req.user;
    res.locals.user = u ? { nome: u.nome, email: u.email, perfil: u.perfil, perfilRotulo: ROTULOS[u.perfil] } : null;
    res.locals.can = u ? {
      writeESG: can(u.perfil, "esg:write"),
      writeLeontief: can(u.perfil, "leontief:write"),
      verifyLedger: can(u.perfil, "ledger:verify"),
      readUsers: can(u.perfil, "users:read"),
      writeUsers: can(u.perfil, "users:write"),
      sendNotif: can(u.perfil, "notifications:send"),
      oauth: can(u.perfil, "oauth:manage")
    } : {};
    next();
  },

  // Bloqueia a página (403) quando o perfil não tem a permissão
  exigir: (permissao) => (req, res, next) => {
    if (!can(req.user.perfil, permissao)) {
      return res.status(403).render("error", { title: "Acesso negado", codigo: 403, mensagem: "Seu perfil não tem permissão para acessar esta página." });
    }
    next();
  }
};
