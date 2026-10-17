// Login e cadastro
(function ($) {
  function enviar($form, fn) {
    var $err = $("#formError"), $btn = $("#submitBtn");
    EB.clearError($err);
    $btn.prop("disabled", true);
    Promise.resolve().then(function () { return fn(EB.formData($form)); })
      .catch(function (ex) { EB.showError($err, ex.message); $btn.prop("disabled", false); });
  }

  $("#loginForm").on("submit", function (e) {
    e.preventDefault();
    enviar($(this), async function (d) {
      await EB.api("POST", "/auth/login", { email: d.email, senha: d.senha });
      location.href = d.next || "/dashboard";
    });
  });

  $("#registerForm").on("submit", function (e) {
    e.preventDefault();
    enviar($(this), async function (d) {
      if (d.senha !== d.confirma) throw new Error("As senhas não conferem");
      await EB.api("POST", "/auth/register", { nome: d.nome, email: d.email, senha: d.senha });
      await EB.api("POST", "/auth/login", { email: d.email, senha: d.senha });
      location.href = "/dashboard";
    });
  });
})(jQuery);
