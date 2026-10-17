"use strict";
// Dados de demonstração — só roda com SEED_DEMO=true.
// Série 2015–2026: usa apenas os extremos do artigo (Escopo 2: 1.200 → 820 tCO₂e) e interpola
// linearmente. As demais colunas são ILUSTRATIVAS (não são dados do artigo).
// Cada indicador entra no ledger, então a cadeia SHA-256 permanece válida.
const bcrypt = require("bcryptjs");

const SETOR = "Data Center (demo)";
const lerp = (a, b, i, n) => Math.round((a + ((b - a) * i) / (n - 1)) * 100) / 100;

module.exports = {
  async up() {
    if (process.env.SEED_DEMO !== "true") { console.log("002-demo-data: ignorado (defina SEED_DEMO=true)"); return; }
    const senhaDemo = process.env.SEED_DEMO_PASSWORD;
    if (!senhaDemo || senhaDemo.length < 8 || !/[A-Za-z]/.test(senhaDemo) || !/\d/.test(senhaDemo)) {
      throw new Error("Defina SEED_DEMO_PASSWORD (mínimo 8 caracteres, com letras e números) para criar os usuários demo.");
    }

    const { sequelize, User, ESGIndicator } = require("../src/models");
    const ESGService = require("../src/services/ESGService");
    const LedgerService = require("../src/services/LedgerService");
    try {
      const demo = [
        ["Analista Demo", "analista@ecobalance.demo", "analista_dados"],
        ["Auditor Demo", "auditor@ecobalance.demo", "auditor"],
        ["Usuário Demo", "usuario@ecobalance.demo", "usuario"]
      ];
      const hash = await bcrypt.hash(senhaDemo, 12);
      for (const [nome, email, perfil] of demo) {
        if (!(await User.findOne({ where: { email } }))) await User.create({ nome, email, perfil, senha: hash });
      }

      if (await ESGIndicator.findOne({ where: { setor: SETOR } })) return; // idempotente
      const admin = await User.findOne({ where: { perfil: "gerente_sustentabilidade" }, order: [["createdAt", "ASC"]] });
      const anos = Array.from({ length: 12 }, (_, i) => 2015 + i);

      for (const [i, ano] of anos.entries()) {
        const dados = {
          ano, setor: SETOR,
          consumoEnergia: lerp(1400000, 950000, i, 12),
          consumoAgua: lerp(6800, 4200, i, 12),
          emissaoCO2: lerp(1200, 820, i, 12),
          residuosEletronicosKg: lerp(620, 320, i, 12),
          reciclagem: lerp(45, 80, i, 12),
          diversidade: lerp(25, 60, i, 12),
          conformidade: lerp(70, 94, i, 12)
        };
        dados.scoreESG = ESGService.score(dados);
        await sequelize.transaction(async (t) => {
          const ind = await ESGIndicator.create({ ...dados, criadoPor: admin ? admin.id : null }, { transaction: t });
          await ind.reload({ transaction: t });
          await LedgerService.register({ entidade: "ESGIndicator", entidadeId: ind.id, payload: ESGService.payload(ind), usuarioId: admin ? admin.id : null, transaction: t });
        });
      }
    } finally {
      await sequelize.close();
    }
  },
  async down() { /* dados demo saem com db:migrate:undo */ }
};
