const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

module.exports = sequelize.define("Notification", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  titulo: { type: DataTypes.STRING(120), allowNull: false },
  mensagem: { type: DataTypes.STRING(500), allowNull: false },
  tipo: { type: DataTypes.ENUM("info", "sucesso", "alerta", "erro"), allowNull: false, defaultValue: "info" },
  lida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  origem: { type: DataTypes.STRING(160), allowNull: false, defaultValue: "sistema" }
}, { tableName: "Notifications" });
