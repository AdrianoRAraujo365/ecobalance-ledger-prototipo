const OAuthService = require("../services/OAuthService");
const { OAuthClient } = require("../models");

// Credenciais do cliente: HTTP Basic (preferencial) ou client_id/client_secret no corpo
function credenciais(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Basic ")) {
    const raw = Buffer.from(h.slice(6), "base64").toString("utf8");
    const i = raw.indexOf(":");
    if (i > 0) return { id: raw.slice(0, i), secret: raw.slice(i + 1) };
  }
  const b = req.body || {};
  return { id: b.client_id, secret: b.client_secret };
}

const semCache = (res) => { res.set("Cache-Control", "no-store"); res.set("Pragma", "no-cache"); };
const invalidClient = (res) => res.status(401).set("WWW-Authenticate", 'Basic realm="oauth"').json({ error: "invalid_client" });

class OAuthController {
  // POST /oauth/token
  async token(req, res, next) {
    try {
      semCache(res);
      const { id, secret } = credenciais(req);
      if (!id || !secret) return invalidClient(res);
      const cliente = await OAuthService.autenticarCliente(id, secret);
      if (!cliente) return invalidClient(res);

      const { grant_type: grant, scope } = req.body || {};
      if (!grant) return res.status(400).json({ error: "invalid_request", error_description: "grant_type é obrigatório" });
      if (grant !== "client_credentials") return res.status(400).json({ error: "unsupported_grant_type" });

      try {
        res.json(await OAuthService.emitirToken(cliente, scope));
      } catch (e) {
        if (e.code === "invalid_scope") return res.status(400).json({ error: "invalid_scope", error_description: e.message });
        throw e;
      }
    } catch (err) { next(err); }
  }

  // POST /oauth/revoke (RFC 7009)
  async revoke(req, res, next) {
    try {
      semCache(res);
      const { id, secret } = credenciais(req);
      const cliente = id && secret ? await OAuthService.autenticarCliente(id, secret) : null;
      if (!cliente) return invalidClient(res);
      if (req.body && req.body.token) await OAuthService.revogar(String(req.body.token), cliente);
      res.status(200).json({});
    } catch (err) { next(err); }
  }

  // ---- Gestão de clientes (somente Gerente) ----
  async listClients(req, res, next) {
    try {
      res.json({ success: true, data: await OAuthClient.findAll({ order: [["createdAt", "DESC"]] }) });
    } catch (err) { next(err); }
  }

  async createClient(req, res, next) {
    try {
      const { cliente, clientSecret } = await OAuthService.criarCliente({ nome: req.body.nome, scopes: req.body.scopes, criadoPor: req.user.id });
      res.status(201).json({
        success: true,
        message: "Cliente criado. Guarde o client_secret: ele não será exibido novamente.",
        data: cliente,
        client_secret: clientSecret
      });
    } catch (err) { next(err); }
  }

  async updateClient(req, res, next) {
    try {
      const cliente = await OAuthClient.findByPk(req.params.id);
      if (!cliente) return res.status(404).json({ success: false, message: "Cliente não encontrado" });
      await cliente.update({ ativo: req.body.ativo });
      res.json({ success: true, data: cliente });
    } catch (err) { next(err); }
  }
}

module.exports = new OAuthController();
