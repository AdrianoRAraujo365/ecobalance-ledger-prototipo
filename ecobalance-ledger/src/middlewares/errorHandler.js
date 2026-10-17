const wantsHtml = (req) => !req.path.startsWith("/api/") && (req.headers.accept || "").includes("text/html");

exports.notFound = (req, res) => {
  if (wantsHtml(req)) {
    return res.status(404).render("error", { title: "Página não encontrada", codigo: 404, mensagem: "A página que você procura não existe." });
  }
  res.status(404).json({ success: false, message: "Rota não encontrada" });
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Erro interno do servidor";

  if (err.name === "SequelizeUniqueConstraintError") { status = 409; message = "Registro já existe (valor duplicado)"; }
  else if (err.name === "SequelizeValidationError") { status = 422; message = err.errors.map((e) => e.message).join("; "); }
  else if (err.type === "entity.parse.failed") { status = 400; message = "JSON inválido"; }

  if (status >= 500) { console.error(err); message = "Erro interno do servidor"; }

  if (wantsHtml(req)) {
    return res.status(status).render("error", { title: "Erro", codigo: status, mensagem: message });
  }
  res.status(status).json({ success: false, message, ...(err.details ? { details: err.details } : {}) });
};
