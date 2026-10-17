"use strict";
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable("Users", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      nome: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      senha: { type: Sequelize.STRING(100), allowNull: false },
      perfil: {
        type: Sequelize.ENUM("usuario", "analista_dados", "auditor", "gerente_sustentabilidade"),
        allowNull: false,
        defaultValue: "usuario"
      },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await qi.addIndex("Users", ["perfil"], { name: "idx_users_perfil" });
  },
  async down(qi) { await qi.dropTable("Users"); }
};
