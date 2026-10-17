"use strict";
module.exports = {
  async up(qi, Sequelize) {
    const dec = (p, s, extra = {}) => ({ type: Sequelize.DECIMAL(p, s), allowNull: false, defaultValue: 0, ...extra });
    await qi.createTable("ESGIndicators", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      ano: { type: Sequelize.INTEGER, allowNull: false },
      setor: { type: Sequelize.STRING(120), allowNull: false },
      consumoEnergia: dec(15, 2),
      consumoAgua: dec(15, 2),
      emissaoCO2: dec(15, 2),
      residuosEletronicosKg: dec(15, 2),
      reciclagem: dec(5, 2),
      diversidade: dec(5, 2),
      conformidade: dec(5, 2),
      scoreESG: dec(5, 2),
      criadoPor: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await qi.addIndex("ESGIndicators", ["ano"], { name: "idx_esg_year" });
    await qi.addIndex("ESGIndicators", ["ano", "setor"], { name: "idx_esg_year_sector" });
  },
  async down(qi) { await qi.dropTable("ESGIndicators"); }
};
