const { body, param } = require("express-validator");
const { OAUTH_SCOPES } = require("../config/constants");

exports.createClientValidator = [
  body("nome").trim().notEmpty().withMessage("Nome é obrigatório").isLength({ max: 120 }).withMessage("Nome deve ter até 120 caracteres"),
  body("scopes").isArray({ min: 1 }).withMessage("Informe ao menos um scope"),
  body("scopes.*").isIn(OAUTH_SCOPES).withMessage("Scope inválido (permitidos: " + OAUTH_SCOPES.join(", ") + ")")
];

exports.updateClientValidator = [
  param("id").isUUID().withMessage("ID inválido"),
  body("ativo").isBoolean().withMessage("ativo deve ser true ou false").toBoolean()
];
