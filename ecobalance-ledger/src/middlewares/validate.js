const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array().map((e) => e.msg).join("; "),
      errors: errors.array().map((e) => ({ campo: e.path, msg: e.msg }))
    });
  }
  next();
};
