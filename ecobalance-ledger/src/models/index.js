const sequelize = require("../config/database");
const User = require("./User");
const ESGIndicator = require("./ESGIndicator");
const LeontiefEntry = require("./LeontiefEntry");
const LedgerBlock = require("./LedgerBlock");
const Notification = require("./Notification");
const OAuthClient = require("./OAuthClient");
const OAuthToken = require("./OAuthToken");

User.hasMany(ESGIndicator, { foreignKey: "criadoPor", as: "indicadores" });
ESGIndicator.belongsTo(User, { foreignKey: "criadoPor", as: "autor" });

User.hasMany(LeontiefEntry, { foreignKey: "criadoPor", as: "coeficientes" });
LeontiefEntry.belongsTo(User, { foreignKey: "criadoPor", as: "autor" });

User.hasMany(LedgerBlock, { foreignKey: "usuarioId", as: "blocos" });
LedgerBlock.belongsTo(User, { foreignKey: "usuarioId", as: "usuario" });

User.hasMany(Notification, { foreignKey: "userId", as: "notificacoes" });
Notification.belongsTo(User, { foreignKey: "userId", as: "destinatario" });

User.hasMany(OAuthClient, { foreignKey: "criadoPor", as: "clientesOAuth" });
OAuthClient.hasMany(OAuthToken, { foreignKey: "clientId", as: "tokens" });
OAuthToken.belongsTo(OAuthClient, { foreignKey: "clientId", as: "cliente" });

module.exports = { sequelize, User, ESGIndicator, LeontiefEntry, LedgerBlock, Notification, OAuthClient, OAuthToken };
