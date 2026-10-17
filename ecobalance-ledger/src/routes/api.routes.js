const router = require("express").Router();

const { auth } = require("../middlewares/auth");
const { permit } = require("../middlewares/authorize");
const { requireScope, userOrScope } = require("../middlewares/oauth");
const validate = require("../middlewares/validate");
const rateLimit = require("../middlewares/rateLimit");

const { registerValidator, loginValidator, createUserValidator, changePasswordValidator } = require("../validators/auth.validator");
const { updateUserValidator } = require("../validators/user.validator");
const { esgValidator } = require("../validators/esg.validator");
const { calculateValidator, entryValidator } = require("../validators/leontief.validator");
const { markReadValidator, sendValidator } = require("../validators/notification.validator");
const { createClientValidator, updateClientValidator } = require("../validators/oauth.validator");

const AuthController = require("../controllers/AuthController");
const UserController = require("../controllers/UserController");
const ESGController = require("../controllers/ESGController");
const LeontiefController = require("../controllers/LeontiefController");
const LedgerController = require("../controllers/LedgerController");
const NotificationController = require("../controllers/NotificationController");
const OAuthController = require("../controllers/OAuthController");

const limiteAuth = rateLimit({ max: 30 });

router.get("/health", (req, res) => res.json({ success: true, status: "online", service: "EcoBalance Ledger" }));

// Autenticação (JWT)
router.post("/auth/register", limiteAuth, registerValidator, validate, AuthController.register);
router.post("/auth/login", limiteAuth, loginValidator, validate, AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.get("/auth/me", auth, AuthController.me);
router.patch("/auth/password", limiteAuth, auth, changePasswordValidator, validate, AuthController.changePassword);

// Usuários
router.get("/users", auth, permit("users:read"), UserController.list);
router.post("/users", auth, permit("users:write"), createUserValidator, validate, UserController.create);
router.patch("/users/:id", auth, permit("users:write"), updateUserValidator, validate, UserController.update);

// ESG
router.get("/esg-indicators/summary", auth, permit("esg:read"), ESGController.summary);
router.get("/esg-indicators", auth, permit("esg:read"), ESGController.list);
router.post("/esg-indicators", auth, permit("esg:write"), esgValidator, validate, ESGController.create);

// Integração externa (OAuth 2.0, scope esg:read): médias por ano
router.get("/external/esg-summary", requireScope("esg:read"), ESGController.summary);

// Leontief
router.get("/leontief-entries", auth, permit("leontief:calculate"), LeontiefController.listEntries);
router.post("/leontief-entries", auth, permit("leontief:write"), entryValidator, validate, LeontiefController.createEntry);
router.post("/leontief/calculate", auth, permit("leontief:calculate"), calculateValidator, validate, LeontiefController.calculate);

// Ledger SHA-256
router.get("/ledger-blocks/verification", auth, permit("ledger:verify"), LedgerController.verification);
router.get("/ledger-blocks", auth, permit("ledger:read"), LedgerController.list);

// Notificações
router.get("/notifications/unread-count", auth, NotificationController.unreadCount);
router.get("/notifications", auth, NotificationController.list);
router.patch("/notifications", auth, NotificationController.markAllRead);
router.patch("/notifications/:id", auth, markReadValidator, validate, NotificationController.markRead);
router.post("/notifications", userOrScope("notifications:send", "notifications:write"), sendValidator, validate, NotificationController.send);

// Clientes OAuth 2.0 (Gerente)
router.get("/oauth/clients", auth, permit("oauth:manage"), OAuthController.listClients);
router.post("/oauth/clients", auth, permit("oauth:manage"), createClientValidator, validate, OAuthController.createClient);
router.patch("/oauth/clients/:id", auth, permit("oauth:manage"), updateClientValidator, validate, OAuthController.updateClient);

module.exports = router;
