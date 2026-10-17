(function ($) {
  var $app = $("#usuariosApp"), podeEscrever = Number($app.data("canWrite")) === 1, eu = String($app.data("me"));
  var $body = $("#usuariosBody");
  var ROTULO = { usuario: "Usuário", analista_dados: "Analista de Dados", auditor: "Auditor ESG", gerente_sustentabilidade: "Gerente de Sustentabilidade" };

  function seletorPerfil(u) {
    var $s = $("<select class='form-select form-select-sm'>").attr("aria-label", "Perfil de " + u.nome);
    Object.keys(ROTULO).forEach(function (k) { $s.append($("<option>").val(k).text(ROTULO[k]).prop("selected", k === u.perfil)); });
    return $s.on("change", function () {
      EB.api("PATCH", "/users/" + u.id, { perfil: $s.val() }).then(function () { EB.toast("Perfil atualizado"); })
        .catch(function (ex) { EB.toast(ex.message, "error"); carregar(); });
    });
  }

  function carregar() {
    EB.api("GET", "/users").then(function (r) {
      $body.empty();
      r.data.forEach(function (u) {
        var propria = u.email === eu;
        var $perfil = $("<td>"), $status = $("<td>");
        if (podeEscrever && !propria) {
          $perfil.append(seletorPerfil(u));
          $status.append($("<button type='button' class='btn btn-sm'>").addClass(u.ativo ? "btn-outline-danger" : "btn-outline-success").text(u.ativo ? "Desativar" : "Reativar").on("click", function () {
            EB.api("PATCH", "/users/" + u.id, { ativo: !u.ativo }).then(carregar).catch(function (ex) { EB.toast(ex.message, "error"); });
          }));
        } else {
          $perfil.text(ROTULO[u.perfil] || u.perfil);
          $status.append($("<span class='badge'>").addClass(u.ativo ? "text-bg-success" : "text-bg-secondary").text(u.ativo ? "Ativo" : "Inativo"));
        }
        $body.append($("<tr>").append($("<td>").text(u.nome + (propria ? " (você)" : "")), $("<td>").text(u.email), $perfil, $status, $("<td>").text(EB.date(u.createdAt))));
      });
    }).catch(function (ex) { $body.empty().append(EB.emptyRow(5, "Erro: " + ex.message)); });
  }

  $("#userForm").on("submit", function (e) {
    e.preventDefault();
    var $form = $(this), $err = $("#formError");
    EB.clearError($err);
    EB.api("POST", "/users", EB.formData($form)).then(function () {
      EB.toast("Usuário criado");
      $form[0].reset();
      carregar();
    }).catch(function (ex) { EB.showError($err, ex.message); });
  });

  carregar();
})(jQuery);
