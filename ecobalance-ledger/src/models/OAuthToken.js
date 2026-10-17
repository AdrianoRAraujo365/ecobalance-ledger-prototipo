const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

module.exports = sequelize.define("OAuthToken", {
  id: { type: DataTypes.UUID, primaryKey: true }, // jti
  clientId: { type: DataTypes.UUID, allowNull: false },
  scopes: { type: DataTypes.STRING(255), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: "OAuthTokens" });
