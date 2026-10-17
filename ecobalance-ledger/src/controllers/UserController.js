const bcrypt = require("bcryptjs");
const { User } = require("../models");
const NotificationService = require("../services/NotificationService");

class UserController {
  async list(req, res, next) {
    try {
      const users = await User.findAll({ order: [["createdAt", "DESC"]] });
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  }

  // Somente o Gerente cria usuários com perfis diferentes de "usuario"
  async create(req, res, next) {
    try {
      const { nome, email, senha, perfil } = req.body;
      if (await User.findOne({ where: { email } })) {
        return res.status(409).json({ success: false, message: "E-mail já cadastrado" });
      }
      const user = await User.create({ nome, email, perfil, senha: await bcrypt.hash(senha, 12) });
      await NotificationService.notificar({ userId: user.id, titulo: "Conta criada", mensagem: "Sua conta foi criada por um gerente com o perfil " + perfil + ".", tipo: "sucesso" });
      res.status(201).json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  // PATCH /users/:id — altera perfil e/ou status (Gerente não altera a própria conta)
  async update(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      if (user.id === req.user.id) {
        return res.status(409).json({ success: false, message: "Você não pode alterar o próprio perfil ou desativar a própria conta" });
      }
      const mudancas = {};
      if (req.body.perfil !== undefined) mudancas.perfil = req.body.perfil;
      if (req.body.ativo !== undefined) mudancas.ativo = req.body.ativo;
      await user.update(mudancas);
      if (mudancas.perfil) {
        await NotificationService.notificar({ userId: user.id, titulo: "Perfil alterado", mensagem: "Seu perfil agora é " + mudancas.perfil + ".", tipo: "alerta" });
      }
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();
