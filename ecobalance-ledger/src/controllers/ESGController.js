const { sequelize, ESGIndicator } = require("../models");
const ESGService = require("../services/ESGService");
const LedgerService = require("../services/LedgerService");
const NotificationService = require("../services/NotificationService");

class ESGController {
  async list(req, res, next) {
    try {
      const data = await ESGIndicator.findAll({ order: [["ano", "DESC"], ["createdAt", "DESC"]] });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  // Cria o indicador, calcula o score e ancora no ledger (tudo na mesma transação)
  async create(req, res, next) {
    try {
      const b = req.body;
      // Valores arredondados em 2 casas, igual ao DECIMAL(…,2) do banco:
      // assim o hash registrado no ledger bate com o que será lido depois.
      const r2 = (v) => Math.round(Number(v) * 100) / 100;
      const dados = {
        ano: b.ano, setor: b.setor,
        consumoEnergia: r2(b.consumoEnergia), consumoAgua: r2(b.consumoAgua),
        emissaoCO2: r2(b.emissaoCO2), residuosEletronicosKg: r2(b.residuosEletronicosKg),
        reciclagem: r2(b.reciclagem), diversidade: r2(b.diversidade), conformidade: r2(b.conformidade)
      };
      dados.scoreESG = ESGService.score(dados);

      const resultado = await sequelize.transaction(async (t) => {
        const indicador = await ESGIndicator.create({ ...dados, criadoPor: req.user.id }, { transaction: t });
        await indicador.reload({ transaction: t }); // estado exato gravado no banco
        const bloco = await LedgerService.register({
          entidade: "ESGIndicator",
          entidadeId: indicador.id,
          payload: ESGService.payload(indicador),
          usuarioId: req.user.id,
          transaction: t
        });
        return { indicador, bloco };
      });

      await NotificationService.notificarPerfis(
        ["gerente_sustentabilidade", "auditor"],
        {
          titulo: "Novo indicador ESG",
          mensagem: `${req.user.nome} registrou ${resultado.indicador.setor}/${resultado.indicador.ano} (score ${resultado.indicador.scoreESG}). Bloco #${resultado.bloco.indice}.`,
          tipo: "info"
        },
        { excluirUserId: req.user.id }
      );

      res.status(201).json({
        success: true,
        message: "Indicador registrado e ancorado no ledger",
        data: resultado.indicador,
        ledger: { indice: resultado.bloco.indice, blockHash: resultado.bloco.blockHash }
      });
    } catch (err) { next(err); }
  }

  // GET /esg-indicators/summary — médias por ano para o dashboard
  async summary(req, res, next) {
    try {
      const indicadores = await ESGIndicator.findAll();
      const anos = ESGService.resumoPorAno(indicadores);
      const primeiro = anos[0];
      const ultimo = anos[anos.length - 1];
      res.json({
        success: true,
        data: {
          anos,
          totais: {
            indicadores: indicadores.length,
            ultimoAno: ultimo ? ultimo.ano : null,
            scoreUltimoAno: ultimo ? ultimo.scoreMedio : null,
            variacaoCO2: primeiro && ultimo && primeiro.emissaoCO2 > 0 && primeiro !== ultimo
              ? Math.round(((ultimo.emissaoCO2 - primeiro.emissaoCO2) / primeiro.emissaoCO2) * 1000) / 10
              : null
          }
        }
      });
    } catch (err) { next(err); }
  }
}

module.exports = new ESGController();
