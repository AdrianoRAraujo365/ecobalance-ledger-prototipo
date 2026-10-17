const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const num = (name) => function () {
  const v = this.getDataValue(name);
  return v === null || v === undefined ? v : Number(v);
};

const LeontiefEntry = sequelize.define("LeontiefEntry", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  setorOrigem: { type: DataTypes.STRING(120), allowNull: false },
  setorDestino: { type: DataTypes.STRING(120), allowNull: false },
  coeficiente: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    validate: { min: 0, max: 1 },
    get: num("coeficiente")
  },
  demanda: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, get: num("demanda") },
  criadoPor: { type: DataTypes.UUID, allowNull: true }
}, { tableName: "LeontiefEntries" });

module.exports = LeontiefEntry;
