const { body, param } = require("express-validator");
const { TIPOS_NOTIFICACAO } = require("../config/constants");
const PERFIS = ["usuario", "analista_dados", "auditor", "gerente_sustentabilidade"];

exports.markReadValidator = [param("id").isUUID().withMessage("ID inválido")];

exports.sendValidator = [
  body("titulo").trim().notEmpty().withMessage("Título é obrigatório").isLength({ max: 120 }).withMessage("Título deve ter até 120 caracteres"),
  body("mensagem").trim().notEmpty().withMessage("Mensagem é obrigatória").isLength({ max: 500 }).withMessage("Mensagem deve ter até 500 caracteres"),
  body("tipo").optional().isIn(TIPOS_NOTIFICACAO).withMessage("Tipo inválido"),
  body("userId").optional().isUUID().withMessage("userId inválido"),
  body("perfil").optional().isIn([...PERFIS, "todos"]).withMessage("Perfil inválido"),
  body().custom((v) => Boolean(v.userId) !== Boolean(v.perfil)).withMessage("Informe userId OU perfil (um dos dois)")
];
