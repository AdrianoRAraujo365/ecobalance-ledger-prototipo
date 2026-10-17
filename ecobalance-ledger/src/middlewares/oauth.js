const jwt = require("jsonwebtoken");
const OAuthService = require("../services/OAuthService");
const { auth } = require("./auth");
const { can } = require("../config/permissions");

const bearer = (req) => {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
};

// Exige token OAuth 2.0 com o scope informado (acesso máquina a máquina)
const requireScope = (scope) => async (req, res, next) => {
  try {
    const token = bearer(req);
    const info = token ? await OAuthService.validarToken(token) : null;
    if (!info) {
      res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
      return res.status(401).json({ error: "invalid_token" });
    }
    if (!info.scopes.includes(scope)) {
      res.set("WWW-Authenticate", `Bearer error="insufficient_scope", scope="${scope}"`);
      return res.status(403).json({ error: "insufficient_scope" });
    }
    req.oauth = info;
    next();
  } catch (err) { next(err); }
};

// Aceita token OAuth (com scope) OU usuário logado (com permissão)
const userOrScope = (permissao, scope) => (req, res, next) => {
  const token = bearer(req);
  const dec = token ? jwt.decode(token) : null;
  if (dec && dec.typ === "oauth") return requireScope(scope)(req, res, next);
  auth(req, res, (err) => {
    if (err) return next(err);
    if (!can(req.user.perfil, permissao)) return res.status(403).json({ success: false, message: "Perfil sem permissão para esta operação" });
    next();
  });
};

module.exports = { requireScope, userOrScope };
