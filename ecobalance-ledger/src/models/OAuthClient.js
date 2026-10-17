const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OAuthClient = sequelize.define("OAuthClient", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  clientId: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  secretHash: { type: DataTypes.STRING(64), allowNull: false },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  scopes: { type: DataTypes.JSON, allowNull: false },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  criadoPor: { type: DataTypes.UUID, allowNull: true }
}, { tableName: "OAuthClients" });

// O hash do segredo nunca sai em respostas JSON
OAuthClient.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.secretHash;
  return v;
};

module.exports = OAuthClient;
