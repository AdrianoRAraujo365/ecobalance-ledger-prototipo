(function ($) {
  var $lista = $("#lista"), filtro = "";
  var COR = { info: "primary", sucesso: "success", alerta: "warning", erro: "danger" };

  function carregar() {
    EB.api("GET", "/notifications" + (filtro ? "?lida=" + filtro : "")).then(function (r) {
      $lista.empty();
      if (!r.data.length) return $lista.append($("<div class='list-group-item text-body-secondary'>").text("Nenhuma notificação."));
      r.data.forEach(function (n) {
        var $item = $("<div class='list-group-item d-flex justify-content-between align-items-start gap-3'>");
        var $corpo = $("<div>").append(
          $("<div class='d-flex flex-wrap align-items-center gap-2'>").append(
            $("<span class='badge'>").addClass("text-bg-" + (COR[n.tipo] || "secondary")).text(n.tipo),
            $("<strong>").text(n.titulo),
            n.lida ? null : $("<span class='badge text-bg-danger'>").text("Nova")),
          $("<div>").text(n.mensagem),
          $("<small class='text-body-secondary'>").text(EB.date(n.createdAt) + " · " + n.origem));
        $item.append($corpo);
        if (!n.lida) {
          $item.append($("<button type='button' class='btn btn-sm btn-outline-secondary text-nowrap'>").text("Marcar como lida").on("click", function () {
            EB.api("PATCH", "/notifications/" + n.id).then(function () { carregar(); EB.refreshBadge(); }).catch(function (ex) { EB.toast(ex.message, "error"); });
          }));
        }
        $lista.append($item);
      });
    }).catch(function (ex) { $lista.empty().append($("<div class='list-group-item text-danger'>").text("Erro: " + ex.message)); });
  }

  $("[data-filtro]").on("click", function () {
    filtro = String($(this).data("filtro"));
    $("[data-filtro]").removeClass("active");
    $(this).addClass("active");
    carregar();
  });

  $("#markAll").on("click", function () {
    EB.api("PATCH", "/notifications").then(function () { carregar(); EB.refreshBadge(); }).catch(function (ex) { EB.toast(ex.message, "error"); });
  });

  $("#sendForm").on("submit", function (e) {
    e.preventDefault();
    var $form = $(this), $err = $("#sendError");
    EB.clearError($err);
    EB.api("POST", "/notifications", EB.formData($form)).then(function (r) {
      EB.toast("Notificação enviada para " + r.enviadas + " usuário(s)");
      $form[0].reset();
      carregar(); EB.refreshBadge();
    }).catch(function (ex) { EB.showError($err, ex.message); });
  });

  carregar();
})(jQuery);
