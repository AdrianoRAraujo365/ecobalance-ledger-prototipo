(function ($) {
  var $body = $("#clientsBody");

  function carregar() {
    EB.api("GET", "/oauth/clients").then(function (r) {
      $body.empty();
      if (!r.data.length) return $body.append(EB.emptyRow(5, "Nenhum cliente cadastrado."));
      r.data.forEach(function (c) {
        $body.append($("<tr>").append(
          $("<td>").text(c.nome),
          $("<td>").append($("<code>").text(c.clientId)),
          $("<td>").text(c.scopes.join(", ")),
          $("<td>").append($("<span class='badge'>").addClass(c.ativo ? "text-bg-success" : "text-bg-secondary").text(c.ativo ? "Ativo" : "Inativo")),
          $("<td>").append($("<button type='button' class='btn btn-sm'>").addClass(c.ativo ? "btn-outline-danger" : "btn-outline-success").text(c.ativo ? "Desativar" : "Reativar").on("click", function () {
            EB.api("PATCH", "/oauth/clients/" + c.id, { ativo: !c.ativo }).then(carregar).catch(function (ex) { EB.toast(ex.message, "error"); });
          }))));
      });
    }).catch(function (ex) { $body.empty().append(EB.emptyRow(5, "Erro: " + ex.message)); });
  }

  $("#clientForm").on("submit", function (e) {
    e.preventDefault();
    var $err = $("#formError");
    EB.clearError($err);
    var scopes = $("#clientForm input[type=checkbox]:checked").map(function () { return this.value; }).get();
    EB.api("POST", "/oauth/clients", { nome: $("#nome").val(), scopes: scopes }).then(function (r) {
      $("#outId").text(r.data.clientId);
      $("#outSecret").text(r.client_secret);
      $("#segredo").prop("hidden", false);
      $("#nome").val("");
      carregar();
    }).catch(function (ex) { EB.showError($err, ex.message); });
  });

  carregar();
})(jQuery);
