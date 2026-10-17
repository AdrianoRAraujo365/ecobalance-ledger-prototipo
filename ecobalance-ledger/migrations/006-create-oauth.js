"use strict";
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable("OAuthClients", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      clientId: { type: Sequelize.STRING(40), allowNull: false, unique: true },
      secretHash: { type: Sequelize.STRING(64), allowNull: false },
      nome: { type: Sequelize.STRING(120), allowNull: false },
      scopes: { type: Sequelize.JSON, allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      criadoPor: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: "Users", key: "id" }, onUpdate: "CASCADE", onDelete: "SET NULL"
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await qi.createTable("OAuthTokens", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false }, // = jti do JWT
      clientId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "OAuthClients", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE"
      },
      scopes: { type: Sequelize.STRING(255), allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      revokedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(qi) {
    await qi.dropTable("OAuthTokens");
    await qi.dropTable("OAuthClients");
  }
};
