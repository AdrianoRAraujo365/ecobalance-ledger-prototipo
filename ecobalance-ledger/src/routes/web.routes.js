const router = require("express").Router();
const { webOpcional, webObrigatorio } = require("../middlewares/auth");
const Web = require("../controllers/WebController");

const jaLogado = (req, res, next) => (req.user ? res.redirect("/dashboard") : next());

// Públicas
router.get("/", webOpcional, Web.locals, Web.home);
router.get("/login", webOpcional, jaLogado, Web.locals, Web.login);
router.get("/register", webOpcional, jaLogado, Web.locals, Web.register);

// Protegidas (JWT no cookie httpOnly)
router.get("/dashboard", webObrigatorio, Web.locals, Web.dashboard);
router.get("/calculadora", webObrigatorio, Web.locals, Web.calculadora);
router.get("/esg", webObrigatorio, Web.locals, Web.esg);
router.get("/ledger", webObrigatorio, Web.locals, Web.ledger);
router.get("/notificacoes", webObrigatorio, Web.locals, Web.notificacoes);
router.get("/usuarios", webObrigatorio, Web.locals, Web.exigir("users:read"), Web.usuarios);
router.get("/integracoes", webObrigatorio, Web.locals, Web.exigir("oauth:manage"), Web.integracoes);

module.exports = router;
