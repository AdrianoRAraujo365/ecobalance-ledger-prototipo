const { LeontiefEntry } = require("../models");
const LeontiefService = require("../services/LeontiefService");

class LeontiefController {
  async listEntries(req, res, next) {
    try {
      const data = await LeontiefEntry.findAll({ order: [["createdAt", "DESC"]], limit: 200 });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createEntry(req, res, next) {
    try {
      const { setorOrigem, setorDestino, coeficiente, demanda } = req.body;
      const entry = await LeontiefEntry.create({
        setorOrigem, setorDestino, coeficiente, demanda: demanda || 0, criadoPor: req.user.id
      });
      res.status(201).json({ success: true, data: entry });
    } catch (err) { next(err); }
  }

  async calculate(req, res, next) {
    try {
      const data = await LeontiefService.calculate(req.body.matrixA, req.body.demand);
      res.json({
        success: true,
        model: "Modelo Insumo-Produto de Leontief",
        formula: "X = (I - A)^(-1) D",
        data
      });
    } catch (err) { next(err); }
  }
}

module.exports = new LeontiefController();
