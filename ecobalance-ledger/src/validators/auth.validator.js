const { body } = require("express-validator");

const PERFIS = ["usuario", "analista_dados", "auditor", "gerente_sustentabilidade"];

const senhaForte = body("senha")
  .isString().withMessage("Senha é obrigatória")
  .isLength({ min: 8, max: 72 }).withMessage("Senha deve ter entre 8 e 72 caracteres")
  .matches(/[A-Za-z]/).withMessage("Senha deve conter letras")
  .matches(/\d/).withMessage("Senha deve conter números");

const base = [
  body("nome").trim().notEmpty().withMessage("Nome é obrigatório")
    .isLength({ min: 3, max: 120 }).withMessage("Nome deve ter entre 3 e 120 caracteres"),
  body("email").trim().notEmpty().withMessage("E-mail é obrigatório")
    .isEmail().withMessage("E-mail inválido").isLength({ max: 160 }).normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  senhaForte
];

// Cadastro público: o perfil NUNCA é aceito do cliente (sempre "usuario")
exports.registerValidator = base;

// Criação de usuário pelo Gerente (pode definir o perfil)
exports.createUserValidator = [
  ...base,
  body("perfil").isIn(PERFIS).withMessage("Perfil inválido")
];

exports.changePasswordValidator = [
  body("senhaAtual").isString().notEmpty().withMessage("Senha atual é obrigatória"),
  body("novaSenha")
    .isString().withMessage("Nova senha é obrigatória")
    .isLength({ min: 8, max: 72 }).withMessage("Nova senha deve ter entre 8 e 72 caracteres")
    .matches(/[A-Za-z]/).withMessage("Nova senha deve conter letras")
    .matches(/\d/).withMessage("Nova senha deve conter números")
    .custom((v, { req }) => v !== req.body.senhaAtual).withMessage("A nova senha deve ser diferente da atual")
];

exports.loginValidator = [
  body("email").trim().notEmpty().withMessage("E-mail é obrigatório")
    .isEmail().withMessage("E-mail inválido").normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body("senha").isString().notEmpty().withMessage("Senha é obrigatória")
];
