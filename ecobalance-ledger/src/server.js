const env = require("./config/env");
const app = require("./app");
const { sequelize } = require("./models");

(async () => {
  try {
    await sequelize.authenticate();
    if (env.dbSync) await sequelize.sync();
    app.listen(env.port, () => console.log(`EcoBalance Ledger rodando em http://localhost:${env.port}`));
  } catch (err) {
    console.error("Falha ao conectar ao banco de dados:", err.message);
    process.exit(1);
  }
})();
