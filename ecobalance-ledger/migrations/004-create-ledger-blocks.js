"use strict";
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable("LedgerBlocks", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      indice: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      entidade: { type: Sequelize.STRING(80), allowNull: false },
      entidadeId: { type: Sequelize.STRING(64), allowNull: false },
      payloadHash: { type: Sequelize.STRING(64), allowNull: false },
      previousHash: { type: Sequelize.STRING(64), allowNull: false },
      blockHash: { type: Sequelize.STRING(64), allowNull: false },
      timestamp: { type: Sequelize.STRING(32), allowNull: false },
      usuarioId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await qi.addIndex("LedgerBlocks", ["entidade", "entidadeId"], { name: "idx_ledger_entity" });
  },
  async down(qi) { await qi.dropTable("LedgerBlocks"); }
};
