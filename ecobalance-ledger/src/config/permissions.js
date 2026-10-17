const PERFIS = {
  USUARIO: "usuario",
  ANALISTA: "analista_dados",
  AUDITOR: "auditor",
  GERENTE: "gerente_sustentabilidade"
};

const ROTULOS = {
  usuario: "Usuário",
  analista_dados: "Analista de Dados",
  auditor: "Auditor ESG",
  gerente_sustentabilidade: "Gerente de Sustentabilidade"
};

const TODOS = Object.values(PERFIS);

// Fonte única de permissões (usada pela API, pelas views e pelo front-end)
const PERMISSOES = {
  "esg:read": TODOS,
  "esg:write": ["analista_dados", "gerente_sustentabilidade"],
  "leontief:calculate": TODOS,
  "leontief:write": ["analista_dados", "gerente_sustentabilidade"],
  "ledger:read": TODOS,
  "ledger:verify": ["auditor", "gerente_sustentabilidade"],
  "notifications:read": TODOS,
  "notifications:send": ["gerente_sustentabilidade"],
  "users:read": ["auditor", "gerente_sustentabilidade"],
  "users:write": ["gerente_sustentabilidade"],
  "oauth:manage": ["gerente_sustentabilidade"]
};

const can = (perfil, permissao) => Boolean(perfil && PERMISSOES[permissao] && PERMISSOES[permissao].includes(perfil));
const permissoesDe = (perfil) => Object.keys(PERMISSOES).filter((p) => can(perfil, p));

module.exports = { PERFIS, ROTULOS, PERMISSOES, can, permissoesDe };
