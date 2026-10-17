const { can } = require("../config/permissions");

// RBAC por perfil: authorize("auditor", "gerente_sustentabilidade")
const authorize = (...perfis) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Não autenticado" });
  if (!perfis.includes(req.user.perfil)) {
    return res.status(403).json({ success: false, message: "Perfil sem permissão para esta operação" });
  }
  next();
};

// RBAC por permissão (fonte única em config/permissions.js): permit("esg:write")
const permit = (permissao) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Não autenticado" });
  if (!can(req.user.perfil, permissao)) {
    return res.status(403).json({ success: false, message: "Perfil sem permissão para esta operação" });
  }
  next();
};

module.exports = authorize;
module.exports.permit = permit;
