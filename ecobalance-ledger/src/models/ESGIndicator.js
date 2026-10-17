const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// DECIMAL volta como string no mysql2; o getter devolve número
const dec = (name, p, s) => ({
  type: DataTypes.DECIMAL(p, s),
  allowNull: false,
  defaultValue: 0,
  get() {
    const v = this.getDataValue(name);
    return v === null || v === undefined ? v : Number(v);
  }
});

const ESGIndicator = sequelize.define("ESGIndicator", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ano: { type: DataTypes.INTEGER, allowNull: false },
  setor: { type: DataTypes.STRING(120), allowNull: false },
  consumoEnergia: dec("consumoEnergia", 15, 2),
  consumoAgua: dec("consumoAgua", 15, 2),
  emissaoCO2: dec("emissaoCO2", 15, 2),
  residuosEletronicosKg: dec("residuosEletronicosKg", 15, 2),
  reciclagem: dec("reciclagem", 5, 2),
  diversidade: dec("diversidade", 5, 2),
  conformidade: dec("conformidade", 5, 2),
  scoreESG: dec("scoreESG", 5, 2),
  criadoPor: { type: DataTypes.UUID, allowNull: true }
}, { tableName: "ESGIndicators" });

module.exports = ESGIndicator;
