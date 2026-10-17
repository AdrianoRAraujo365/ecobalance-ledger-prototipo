const { body, param } = require("express-validator");
const PERFIS = ["usuario", "analista_dados", "auditor", "gerente_sustentabilidade"];

exports.updateUserValidator = [
  param("id").isUUID().withMessage("ID inválido"),
  body("perfil").optional().isIn(PERFIS).withMessage("Perfil inválido"),
  body("ativo").optional().isBoolean().withMessage("ativo deve ser true ou false").toBoolean(),
  body().custom((v) => v.perfil !== undefined || v.ativo !== undefined).withMessage("Informe perfil e/ou ativo")
];
