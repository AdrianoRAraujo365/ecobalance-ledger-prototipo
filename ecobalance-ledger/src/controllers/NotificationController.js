const { Notification, User } = require("../models");
const NotificationService = require("../services/NotificationService");

class NotificationController {
  // GET /notifications?lida=true|false
  async list(req, res, next) {
    try {
      const where = { userId: req.user.id };
      if (req.query.lida === "true") where.lida = true;
      if (req.query.lida === "false") where.lida = false;
      const [data, naoLidas] = await Promise.all([
        Notification.findAll({ where, order: [["createdAt", "DESC"]], limit: 100 }),
        Notification.count({ where: { userId: req.user.id, lida: false } })
      ]);
      res.json({ success: true, data, naoLidas });
    } catch (err) { next(err); }
  }

  async unreadCount(req, res, next) {
    try {
      res.json({ success: true, naoLidas: await Notification.count({ where: { userId: req.user.id, lida: false } }) });
    } catch (err) { next(err); }
  }

  // PATCH /notifications/:id — só marca as do próprio usuário
  async markRead(req, res, next) {
    try {
      const [n] = await Notification.update({ lida: true }, { where: { id: req.params.id, userId: req.user.id } });
      if (!n) return res.status(404).json({ success: false, message: "Notificação não encontrada" });
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  // PATCH /notifications — marca todas como lidas
  async markAllRead(req, res, next) {
    try {
      const [n] = await Notification.update({ lida: true }, { where: { userId: req.user.id, lida: false } });
      res.json({ success: true, atualizadas: n });
    } catch (err) { next(err); }
  }

  // POST /notifications — OAuth 2.0 (scope notifications:write) ou Gerente logado
  async send(req, res, next) {
    try {
      const { userId, perfil, titulo, mensagem, tipo = "info" } = req.body;
      const origem = req.oauth ? "oauth:" + req.oauth.cliente.nome : "usuario:" + req.user.nome;
      let enviadas;
      if (userId) {
        const alvo = await User.findOne({ where: { id: userId, ativo: true } });
        if (!alvo) return res.status(404).json({ success: false, message: "Usuário destinatário não encontrado" });
        enviadas = await NotificationService.notificar({ userId, titulo, mensagem, tipo, origem });
      } else {
        enviadas = await NotificationService.notificarPerfis(perfil === "todos" ? "todos" : [perfil], { titulo, mensagem, tipo, origem });
      }
      res.status(201).json({ success: true, enviadas });
    } catch (err) { next(err); }
  }
}

module.exports = new NotificationController();
