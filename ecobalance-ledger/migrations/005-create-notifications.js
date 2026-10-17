"use strict";
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable("Notifications", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      userId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "Users", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE"
      },
      titulo: { type: Sequelize.STRING(120), allowNull: false },
      mensagem: { type: Sequelize.STRING(500), allowNull: false },
      tipo: { type: Sequelize.ENUM("info", "sucesso", "alerta", "erro"), allowNull: false, defaultValue: "info" },
      lida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      origem: { type: Sequelize.STRING(160), allowNull: false, defaultValue: "sistema" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await qi.addIndex("Notifications", ["userId", "lida", "createdAt"], { name: "idx_notif_user" });
  },
  async down(qi) { await qi.dropTable("Notifications"); }
};
