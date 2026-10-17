const { body } = require("express-validator");

const positivo = (campo, rotulo) =>
  body(campo).exists({ values: "null" }).withMessage(`${rotulo} é obrigatório`).bail()
    .isFloat({ min: 0, max: 1e12 }).withMessage(`${rotulo} deve ser um número maior ou igual a 0`).toFloat();

const percentual = (campo, rotulo) =>
  body(campo).exists({ values: "null" }).withMessage(`${rotulo} é obrigatório`).bail()
    .isFloat({ min: 0, max: 100 }).withMessage(`${rotulo} deve estar entre 0 e 100`).toFloat();

exports.esgValidator = [
  body("ano").isInt({ min: 2000, max: 2100 }).withMessage("Ano deve estar entre 2000 e 2100").toInt(),
  body("setor").trim().notEmpty().withMessage("Setor é obrigatório")
    .isLength({ max: 120 }).withMessage("Setor deve ter até 120 caracteres"),
  positivo("consumoEnergia", "Consumo de energia"),
  positivo("consumoAgua", "Consumo de água"),
  positivo("emissaoCO2", "Emissão de CO₂"),
  positivo("residuosEletronicosKg", "Resíduos eletrônicos"),
  percentual("reciclagem", "Reciclagem"),
  percentual("diversidade", "Diversidade"),
  percentual("conformidade", "Conformidade")
];
