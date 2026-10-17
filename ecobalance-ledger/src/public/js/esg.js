(function ($) {
  var $body = $("#esgBody");

  function carregar() {
    EB.api("GET", "/esg-indicators").then(function (r) {
      $body.empty();
      if (!r.data.length) return $body.append(EB.emptyRow(10, "Nenhum indicador cadastrado."));
      r.data.forEach(function (i) {
        var n = function (v, d) { return $("<td>").addClass("text-end").text(EB.fmt(v, d)); };
        $body.append($("<tr>").append($("<th scope='row'>").text(i.ano), $("<td>").text(i.setor),
          n(i.consumoEnergia), n(i.consumoAgua), n(i.emissaoCO2), n(i.residuosEletronicosKg),
          n(i.reciclagem, 1), n(i.diversidade, 1), n(i.conformidade, 1),
          $("<td>").addClass("text-end").append($("<strong>").text(EB.fmt(i.scoreESG, 1)))));
      });
    }).catch(function (ex) { $body.empty().append(EB.emptyRow(10, "Erro: " + ex.message)); });
  }

  $("#esgForm").on("submit", function (e) {
    e.preventDefault();
    var $form = $(this), $err = $("#formError"), $btn = $("#submitBtn");
    EB.clearError($err);
    var d = {};
    $.each(EB.formData($form), function (k, v) { d[k] = k === "setor" ? v : Number(v); });
    $btn.prop("disabled", true);
    EB.api("POST", "/esg-indicators", d).then(function (r) {
      EB.toast("Indicador registrado. Score ESG: " + EB.fmt(r.data.scoreESG, 1) + " · bloco #" + r.ledger.indice);
      $form[0].reset();
      $("#ano").val(2026);
      carregar();
    }).catch(function (ex) { EB.showError($err, ex.message); }).then(function () { $btn.prop("disabled", false); });
  });

  carregar();
})(jQuery);
