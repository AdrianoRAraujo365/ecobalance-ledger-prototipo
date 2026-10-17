const { body } = require("express-validator");

exports.calculateValidator = [
  body("matrixA").isArray({ min: 1, max: 12 }).withMessage("matrixA deve ser uma matriz de 1 a 12 setores"),
  body("demand").isArray({ min: 1, max: 12 }).withMessage("demand deve ser um vetor de 1 a 12 posições")
];

exports.entryValidator = [
  body("setorOrigem").trim().notEmpty().withMessage("Setor de origem é obrigatório").isLength({ max: 120 }),
  body("setorDestino").trim().notEmpty().withMessage("Setor de destino é obrigatório").isLength({ max: 120 }),
  body("coeficiente").isFloat({ min: 0, max: 1 }).withMessage("Coeficiente deve estar entre 0 e 1").toFloat(),
  body("demanda").optional().isFloat({ min: 0 }).withMessage("Demanda deve ser maior ou igual a 0").toFloat()
];
