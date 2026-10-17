const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LedgerBlock = sequelize.define("LedgerBlock", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  indice: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  entidade: { type: DataTypes.STRING(80), allowNull: false },
  entidadeId: { type: DataTypes.STRING(64), allowNull: false },
  payloadHash: { type: DataTypes.STRING(64), allowNull: false },
  previousHash: { type: DataTypes.STRING(64), allowNull: false },
  blockHash: { type: DataTypes.STRING(64), allowNull: false },
  timestamp: { type: DataTypes.STRING(32), allowNull: false },
  usuarioId: { type: DataTypes.UUID, allowNull: true }
}, { tableName: "LedgerBlocks" });

module.exports = LedgerBlock;
