require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.APP_PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  dbSync: process.env.DB_SYNC === "true",
  oauthSecret: process.env.OAUTH_SECRET,
  oauthTtl: Number(process.env.OAUTH_ACCESS_TTL) || 3600,
  globalGapComplianceThreshold: Number(process.env.GLOBALGAP_COMPLIANCE_THRESHOLD ?? 80),
  pythonUrl: (process.env.PYTHON_API_URL || "").replace(/\/$/, ""),
  pyKey: process.env.PY_API_KEY || ""
};

if (!Number.isFinite(env.globalGapComplianceThreshold) || env.globalGapComplianceThreshold < 0 || env.globalGapComplianceThreshold > 100) {
  console.error("GLOBALGAP_COMPLIANCE_THRESHOLD deve ser um número entre 0 e 100.");
  process.exit(1);
}

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  console.error("JWT_SECRET ausente ou curto demais (mínimo 16 caracteres). Configure o arquivo .env.");
  process.exit(1);
}

if (!env.oauthSecret || env.oauthSecret.length < 16 || env.oauthSecret === env.jwtSecret) {
  console.error("OAUTH_SECRET ausente, curto demais (mínimo 16) ou igual ao JWT_SECRET. Use um segredo diferente.");
  process.exit(1);
}
if (env.pythonUrl && !env.pyKey) {
  console.warn("PYTHON_API_URL definido sem PY_API_KEY: o motor NumPy será ignorado (fallback em JavaScript).");
  env.pythonUrl = "";
}

module.exports = env;
