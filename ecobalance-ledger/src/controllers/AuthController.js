const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { User } = require("../models");
const { permissoesDe, ROTULOS } = require("../config/permissions");
const NotificationService = require("../services/NotificationService");

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.cookieSecure,
  maxAge: 8 * 60 * 60 * 1000
});

const assinar = (user) => jwt.sign({ sub: user.id, typ: "user" }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

// Hash de uma senha qualquer: usado para igualar o tempo de resposta quando o e-mail não existe
const HASH_FALSO = bcrypt.hashSync("senha-falsa-para-timing", 12);

const dadosUsuario = (user) => ({ ...user.toJSON(), perfilRotulo: ROTULOS[user.perfil], permissoes: permissoesDe(user.perfil) });

class AuthController {
  // POST /api/v1/auth/register  (cadastro público: sempre perfil "usuario")
  async register(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      if (await User.findOne({ where: { email } })) {
        return res.status(409).json({ success: false, message: "E-mail já cadastrado" });
      }
      const user = await User.create({ nome, email, senha: await bcrypt.hash(senha, 12), perfil: "usuario" });
      await NotificationService.notificar({ userId: user.id, titulo: "Bem-vindo ao EcoBalance Ledger", mensagem: "Seu cadastro foi concluído. Explore a calculadora e os indicadores ESG.", tipo: "sucesso" });
      res.status(201).json({ success: true, message: "Usuário cadastrado com sucesso", data: user });
    } catch (err) { next(err); }
  }

  // POST /api/v1/auth/login
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const user = await User.findOne({ where: { email } });
      const confere = await bcrypt.compare(senha, user ? user.senha : HASH_FALSO);
      if (!user || !confere || !user.ativo) {
        return res.status(401).json({ success: false, message: "E-mail ou senha inválidos" });
      }
      const token = assinar(user);
      res.cookie("token", token, cookieOpts());
      res.json({ success: true, token, user: dadosUsuario(user) });
    } catch (err) { next(err); }
  }

  // POST /api/v1/auth/logout
  logout(req, res) {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: env.cookieSecure });
    res.status(200).json({ success: true, message: "Sessão encerrada" });
  }

  // PATCH /api/v1/auth/password — troca a própria senha (422, não 401, para a UI não redirecionar ao login)
  async changePassword(req, res, next) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      if (!(await bcrypt.compare(senhaAtual, req.user.senha))) {
        return res.status(422).json({ success: false, message: "Senha atual incorreta" });
      }
      await req.user.update({ senha: await bcrypt.hash(novaSenha, 12) });
      await NotificationService.notificar({ userId: req.user.id, titulo: "Senha alterada", mensagem: "Sua senha foi alterada. Se não foi você, contate um gerente.", tipo: "alerta" });
      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (err) { next(err); }
  }

  // GET /api/v1/auth/me
  me(req, res) {
    res.json({ success: true, data: dadosUsuario(req.user) });
  }
}

module.exports = new AuthController();
module.exports.dadosUsuario = dadosUsuario;
