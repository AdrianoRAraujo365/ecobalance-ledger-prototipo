"use strict";
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

module.exports = {
  async up(qi) {
    const email = (process.env.ADMIN_EMAIL || "adm-ecobalance@gmail.com").toLowerCase();
    const [rows] = await qi.sequelize.query("SELECT id FROM Users WHERE email = ? LIMIT 1", { replacements: [email] });
    if (rows.length) return; // idempotente
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error("Defina ADMIN_PASSWORD (mínimo de 8 caracteres) no arquivo .env antes de executar o seeder.");
    }
    const now = new Date();
    await qi.bulkInsert("Users", [{
      id: randomUUID(),
      nome: process.env.ADMIN_NOME || "Administrador EcoBalance",
      email,
      senha: await bcrypt.hash(password, 12),
      perfil: "gerente_sustentabilidade",
      ativo: true,
      createdAt: now,
      updatedAt: now
    }]);
  },
  async down(qi) {
    await qi.bulkDelete("Users", { email: (process.env.ADMIN_EMAIL || "adm-ecobalance@gmail.com").toLowerCase() });
  }
};
