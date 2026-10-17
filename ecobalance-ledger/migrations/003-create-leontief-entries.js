"use strict";
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable("LeontiefEntries", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      setorOrigem: { type: Sequelize.STRING(120), allowNull: false },
      setorDestino: { type: Sequelize.STRING(120), allowNull: false },
      coeficiente: { type: Sequelize.DECIMAL(10, 4), allowNull: false },
      demanda: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
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
    await qi.addIndex("LeontiefEntries", ["setorOrigem", "setorDestino"], { name: "idx_leontief_sector" });
  },
  async down(qi) { await qi.dropTable("LeontiefEntries"); }
};
