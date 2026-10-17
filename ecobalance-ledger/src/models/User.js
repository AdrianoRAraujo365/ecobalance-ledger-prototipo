const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nome: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  senha: { type: DataTypes.STRING(100), allowNull: false },
  perfil: {
    type: DataTypes.ENUM("usuario", "analista_dados", "auditor", "gerente_sustentabilidade"),
    allowNull: false,
    defaultValue: "usuario"
  },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
});

// Nunca expõe o hash da senha em respostas JSON
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.senha;
  return values;
};

module.exports = User;
