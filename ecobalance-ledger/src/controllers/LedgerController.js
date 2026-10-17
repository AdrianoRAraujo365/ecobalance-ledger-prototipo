const { LedgerBlock, User } = require("../models");
const LedgerService = require("../services/LedgerService");
const NotificationService = require("../services/NotificationService");

class LedgerController {
  async list(req, res, next) {
    try {
      const data = await LedgerBlock.findAll({
        order: [["indice", "DESC"]],
        limit: 200,
        include: [{ model: User, as: "usuario", attributes: ["nome", "perfil"] }]
      });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async verification(req, res, next) {
    try {
      const resultado = await LedgerService.verify();
      if (!resultado.valid) {
        await NotificationService.notificarPerfis(["gerente_sustentabilidade"], {
          titulo: "Integridade do ledger comprometida",
          mensagem: `${req.user.nome} verificou o ledger e encontrou ${resultado.problemas.length} inconsistência(s).`,
          tipo: "erro"
        });
      }
      res.json({ success: true, data: resultado });
    } catch (err) { next(err); }
  }
}

module.exports = new LedgerController();
