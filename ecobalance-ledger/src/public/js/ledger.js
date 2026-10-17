(function ($) {
  var $body = $("#blocksBody");
  var abrev = function (h) { return h ? h.slice(0, 10) + "…" + h.slice(-6) : "–"; };

  EB.api("GET", "/ledger-blocks").then(function (r) {
    $body.empty();
    if (!r.data.length) return $body.append(EB.emptyRow(6, "Nenhum bloco registrado ainda."));
    r.data.forEach(function (b) {
      $body.append($("<tr>").append(
        $("<th scope='row'>").text(b.indice),
        $("<td>").text(b.entidade),
        $("<td>").addClass("eb-hash").attr("title", b.blockHash).text(abrev(b.blockHash)),
        $("<td>").addClass("eb-hash").attr("title", b.previousHash).text(abrev(b.previousHash)),
        $("<td>").text(b.usuario ? b.usuario.nome : "–"),
        $("<td>").text(EB.date(b.timestamp))));
    });
  }).catch(function (ex) { $body.empty().append(EB.emptyRow(6, "Erro: " + ex.message)); });

  $("#verifyBtn").on("click", function () {
    var $box = $("#verifyResult");
    EB.api("GET", "/ledger-blocks/verification").then(function (r) {
      var v = r.data;
      $box.removeClass("d-none alert-success alert-danger").addClass(v.valid ? "alert-success" : "alert-danger").empty();
      $box.append($("<strong>").text(v.valid ? "Cadeia íntegra. " : "Inconsistências encontradas. "), document.createTextNode(v.total + " bloco(s) verificado(s)."));
      if (!v.valid) {
        var $ul = $("<ul class='mb-0 mt-2'>");
        v.problemas.forEach(function (p) { $ul.append($("<li>").text("Bloco #" + p.indice + ": " + p.problema)); });
        $box.append($ul);
      }
    }).catch(function (ex) { EB.toast(ex.message, "error"); });
  });
})(jQuery);
