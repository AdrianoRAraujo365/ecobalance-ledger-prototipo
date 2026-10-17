const router = require("express").Router();
const rateLimit = require("../middlewares/rateLimit");
const OAuthController = require("../controllers/OAuthController");

const limite = rateLimit({ max: 60 });
router.post("/token", limite, OAuthController.token);
router.post("/revoke", limite, OAuthController.revoke);

module.exports = router;
