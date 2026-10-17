const { Notification, User } = require("../models");

// Falhar ao notificar nunca deve derrubar a operação principal
const seguro = (fn) => async (...args) => {
  try { return await fn(...args); } catch (err) { console.error("Falha ao notificar:", err.message); return 0; }
};

class NotificationService {
  constructor() {
    this.notificar = seguro(this._notificar.bind(this));
    this.notificarPerfis = seguro(this._notificarPerfis.bind(this));
  }

  async _notificar({ userId, titulo, mensagem, tipo = "info", origem = "sistema" }) {
    await Notification.create({ userId, titulo, mensagem, tipo, origem });
    return 1;
  }

  // perfis: array de perfis ou "todos"
  async _notificarPerfis(perfis, { titulo, mensagem, tipo = "info", origem = "sistema" }, { excluirUserId } = {}) {
    const where = { ativo: true };
    if (perfis !== "todos") where.perfil = perfis;
    const usuarios = await User.findAll({ where, attributes: ["id"] });
    const linhas = usuarios
      .filter((u) => u.id !== excluirUserId)
      .map((u) => ({ userId: u.id, titulo, mensagem, tipo, origem }));
    if (linhas.length) await Notification.bulkCreate(linhas);
    return linhas.length;
  }
}

module.exports = new NotificationService();
