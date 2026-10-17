const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");

// Extrai o JWT do header Authorization (Bearer) ou do cookie httpOnly "token"
function extrairToken(req) {
  const header = req.headers.authorization;
  if (header) {
    const [tipo, token] = header.split(" ");
    if (tipo === "Bearer" && token) return token;
  }
  return req.cookies && req.cookies.token ? req.cookies.token : null;
}

// Resolve o usuário a partir do token. O perfil e o status "ativo" são relidos
// do banco a cada requisição: rebaixar/desativar vale imediatamente.
async function resolverUsuario(req) {
  const token = extrairToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.typ !== "user") return null; // rejeita tokens OAuth
    const user = await User.findByPk(decoded.sub);
    return user && user.ativo ? user : null;
  } catch (_) {
    return null;
  }
}

// API: exige autenticação (401 em JSON)
const auth = async (req, res, next) => {
  try {
    const user = await resolverUsuario(req);
    if (!user) return res.status(401).json({ success: false, message: "Não autenticado ou token expirado" });
    req.user = user;
    next();
  } catch (err) { next(err); }
};

// Web: carrega o usuário (se houver) sem bloquear
const webOpcional = async (req, res, next) => {
  try {
    req.user = await resolverUsuario(req);
    next();
  } catch (err) { next(err); }
};

// Web: exige login (redireciona para /login)
const webObrigatorio = async (req, res, next) => {
  try {
    const user = await resolverUsuario(req);
    if (!user) return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
    req.user = user;
    next();
  } catch (err) { next(err); }
};

module.exports = { auth, webOpcional, webObrigatorio };
