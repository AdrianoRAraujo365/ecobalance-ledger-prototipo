const path = require("path");
const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const helpers = require("./helpers/handlebars");
const apiRoutes = require("./routes/api.routes");
const webRoutes = require("./routes/web.routes");
const oauthRoutes = require("./routes/oauth.routes");
const openapi = require("./config/openapi");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const publicDir = path.join(__dirname, "public");
app.disable("x-powered-by");
app.set("trust proxy", 1);

// View engine (Handlebars)
app.engine("hbs", engine({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views/layouts"),
  partialsDir: path.join(__dirname, "views/partials"),
  helpers
}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Segurança e parsers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      // Bootstrap, jQuery (jsDelivr) e Tailwind Play CDN (protótipo)
      "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com"],
      "style-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org"],
      "connect-src": ["'self'"],
      "upgrade-insecure-requests": env.cookieSecure ? [] : null
    }
  }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : false, credentials: true }));
app.use(bodyParser.json({ limit: "100kb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Arquivos estáticos
app.use(express.static(publicDir, { maxAge: env.nodeEnv === "production" ? "1d" : 0 }));

// Rotas: API RESTful versionada + páginas MVC
app.use("/oauth", oauthRoutes); // RFC 6749: /oauth/token · RFC 7009: /oauth/revoke
app.use("/api/v1", apiRoutes);
app.get("/api-docs/openapi.json", (req, res) => res.json(openapi));
app.use("/api-docs", (req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;");
  next();
}, swaggerUi.serve, swaggerUi.setup(openapi));
app.get(["/react", "/react/*"], (req, res) => res.sendFile(path.join(publicDir, "apps/react/index.html")));
app.get(["/vue", "/vue/*"], (req, res) => res.sendFile(path.join(publicDir, "apps/vue/index.html")));
app.use("/", webRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
