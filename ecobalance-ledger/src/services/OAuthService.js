// OAuth 2.0 — fluxo client_credentials (RFC 6749 §4.4) e revogação (RFC 7009)
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { OAuthClient, OAuthToken } = require("../models");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const iguais = (a, b) => crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); // hex sha256: mesmo tamanho
const HASH_FALSO = sha256("segredo-falso");

class OAuthService {
  async criarCliente({ nome, scopes, criadoPor }) {
    const clientSecret = crypto.randomBytes(32).toString("hex"); // exibido uma única vez
    const cliente = await OAuthClient.create({
      clientId: "eco_" + crypto.randomBytes(8).toString("hex"),
      secretHash: sha256(clientSecret),
      nome, scopes, criadoPor
    });
    return { cliente, clientSecret };
  }

  async autenticarCliente(clientId, clientSecret) {
    const cliente = await OAuthClient.findOne({ where: { clientId: String(clientId) } });
    const confere = iguais(sha256(String(clientSecret)), cliente ? cliente.secretHash : HASH_FALSO);
    return cliente && confere && cliente.ativo ? cliente : null;
  }

  async emitirToken(cliente, scopeSolicitado) {
    const permitidos = cliente.scopes;
    const pedidos = scopeSolicitado ? String(scopeSolicitado).split(/\s+/).filter(Boolean) : permitidos;
    const invalidos = pedidos.filter((s) => !permitidos.includes(s));
    if (!pedidos.length || invalidos.length) {
      const e = new Error("Scope não autorizado para este cliente");
      e.code = "invalid_scope";
      throw e;
    }
    const jti = crypto.randomUUID();
    const scope = pedidos.join(" ");
    const accessToken = jwt.sign({ typ: "oauth", scope, jti }, env.oauthSecret, { subject: cliente.clientId, expiresIn: env.oauthTtl });
    await OAuthToken.create({ id: jti, clientId: cliente.id, scopes: scope, expiresAt: new Date(Date.now() + env.oauthTtl * 1000) });
    return { access_token: accessToken, token_type: "Bearer", expires_in: env.oauthTtl, scope };
  }

  // Valida assinatura, tipo, revogação e se o cliente segue ativo
  async validarToken(token) {
    try {
      const p = jwt.verify(token, env.oauthSecret);
      if (p.typ !== "oauth") return null;
      const registro = await OAuthToken.findByPk(p.jti, { include: [{ model: OAuthClient, as: "cliente" }] });
      if (!registro || registro.revokedAt || !registro.cliente || !registro.cliente.ativo) return null;
      return { cliente: registro.cliente, scopes: p.scope.split(" ") };
    } catch (_) { return null; }
  }

  async revogar(token, cliente) {
    try {
      const p = jwt.verify(token, env.oauthSecret, { ignoreExpiration: true });
      const registro = await OAuthToken.findByPk(p.jti);
      if (registro && registro.clientId === cliente.id && !registro.revokedAt) await registro.update({ revokedAt: new Date() });
    } catch (_) { /* RFC 7009: resposta é sempre 200 */ }
  }
}

module.exports = new OAuthService();
