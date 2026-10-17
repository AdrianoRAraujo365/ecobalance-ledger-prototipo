(function ($) {
  "use strict";

  // ================= LEONTIEF (motor NumPy no servidor) =================
  var $tabela = $("#matrizTabela"), $tamanho = $("#tamanho"), $entries = $("#entriesBody");

  function carregarEntradas() {
    EB.api("GET", "/leontief-entries").then(function (r) {
      $entries.empty();
      if (!r.data.length) return $entries.append(EB.emptyRow(4, "Nenhum coeficiente cadastrado."));
      r.data.forEach(function (c) {
        $entries.append($("<tr>").append($("<td>").text(c.setorOrigem), $("<td>").text(c.setorDestino),
          $("<td>").addClass("text-end").text(EB.fmt(c.coeficiente, 4)), $("<td>").addClass("text-end").text(EB.fmt(c.demanda, 2))));
      });
    }).catch(function (ex) { $entries.empty().append(EB.emptyRow(4, "Erro: " + ex.message)); });
  }

  $("#entryForm").on("submit", function (e) {
    e.preventDefault();
    var $form = $(this), $err = $("#entryError");
    EB.clearError($err);
    var d = {};
    $.each(EB.formData($form), function (k, v) { d[k] = /^setor/.test(k) ? v : Number(v); });
    EB.api("POST", "/leontief-entries", d).then(function () {
      EB.toast("Coeficiente salvo");
      $form[0].reset();
      carregarEntradas();
    }).catch(function (ex) { EB.showError($err, ex.message); });
  });

  function celula(name, value, label, max) {
    return $("<input>", { type: "number", name: name, min: 0, step: "any", value: value, required: true, "aria-label": label, class: "form-control form-control-sm" }).attr("max", max || null);
  }
  function montar(n, A, D) {
    $tabela.empty();
    var $head = $("<tr>").append($("<th scope='col'>").text("A"));
    for (var j = 0; j < n; j++) $head.append($("<th scope='col'>").text("Setor " + (j + 1)));
    $head.append($("<th scope='col'>").text("Demanda D"));
    $tabela.append($("<thead>").append($head));
    var $tb = $("<tbody>");
    for (var i = 0; i < n; i++) {
      var $tr = $("<tr>").append($("<th scope='row'>").text("Setor " + (i + 1)));
      for (var k = 0; k < n; k++) $tr.append($("<td>").append(celula("a_" + i + "_" + k, A ? A[i][k] : 0, "Coeficiente linha " + (i + 1) + " coluna " + (k + 1), 1)));
      $tr.append($("<td>").append(celula("d_" + i, D ? D[i] : 0, "Demanda do setor " + (i + 1))));
      $tb.append($tr);
    }
    $tabela.append($tb);
  }
  montar(3);
  $tamanho.on("change", function () { montar(Number($tamanho.val())); });
  $("#exemploBtn").on("click", function () {
    $tamanho.val("3");
    montar(3, [[0.2, 0.1, 0.0], [0.3, 0.2, 0.1], [0.0, 0.2, 0.1]], [100, 80, 60]);
  });

  var lista = function (arr) { return arr.map(function (v) { return EB.fmt(v, 4); }).join(" · "); };

  $("#leontiefForm").on("submit", function (e) {
    e.preventDefault();
    var $err = $("#leontiefError"), $out = $("#resultado"), $btn = $("#calcBtn");
    EB.clearError($err); $out.prop("hidden", true);
    var n = Number($tamanho.val()), A = [], D = [], f = this;
    for (var i = 0; i < n; i++) {
      A.push([]);
      for (var j = 0; j < n; j++) A[i].push(Number(f.elements["a_" + i + "_" + j].value));
      D.push(Number(f.elements["d_" + i].value));
    }
    $btn.prop("disabled", true);
    EB.api("POST", "/leontief/calculate", { matrixA: A, demand: D }).then(function (resp) {
      var r = resp.data, numpy = r.engine === "numpy";
      $out.empty().append(
        $("<p>").append($("<span class='badge text-bg-success me-2'>").text("Hawkins-Simons: válido"),
          $("<span class='badge'>").addClass(numpy ? "text-bg-primary" : "text-bg-secondary").text("Motor: " + (numpy ? "NumPy" : "JavaScript (fallback)"))),
        $("<p>").append($("<strong>").text("Menores principais: "), document.createTextNode(lista(r.principal_minors))));
      var $h = $("<tr>"), $r = $("<tr>");
      r.production_required.forEach(function (v, idx) {
        $h.append($("<th scope='col'>").addClass("text-end").text("Setor " + (idx + 1)));
        $r.append($("<td>").addClass("text-end").append($("<strong>").text(EB.fmt(v, 2))));
      });
      $out.append($("<h3 class='h6'>").text("Produção total necessária X"),
        $("<div class='table-responsive'>").append($("<table class='table table-sm'>").append($("<thead>").append($h), $("<tbody>").append($r))));
      var $ti = $("<tbody>");
      r.inverse_matrix.forEach(function (l) { $ti.append($("<tr>").append(l.map(function (v) { return $("<td>").addClass("text-end").text(EB.fmt(v, 4)); }))); });
      $out.append($("<h3 class='h6'>").text("Matriz inversa (I − A)⁻¹"),
        $("<div class='table-responsive'>").append($("<table class='table table-sm'>").append($ti)));
      $out.prop("hidden", false);
    }).catch(function (ex) {
      var msg = ex.message;
      if (ex.data && ex.data.details && ex.data.details.principal_minors) msg += " Menores principais: " + lista(ex.data.details.principal_minors);
      EB.showError($err, msg);
    }).then(function () { $btn.prop("disabled", false); });
  });

  carregarEntradas();

  // ================= SCORE ESG (cálculo local, mesma regra do servidor) =================
  function barra(rotulo, pct, texto, cor) {
    var v = Math.max(0, Math.min(100, pct));
    return $("<div class='mb-2'>").append(
      $("<div class='d-flex justify-content-between small'>").append($("<span>").text(rotulo), $("<span class='eb-mono'>").text(texto)),
      $("<div class='progress' role='progressbar'>").attr({ "aria-label": rotulo, "aria-valuenow": Math.round(v), "aria-valuemin": 0, "aria-valuemax": 100 })
        .append($("<div class='progress-bar'>").addClass(cor || "bg-success").css("width", v + "%")));
  }

  function atualizarScore() {
    var p = { emissaoCO2: $("#sCO2").val(), reciclagem: $("#sRec").val(), diversidade: $("#sDiv").val(), conformidade: $("#sConf").val() };
    $("#sCO2v").text(EB.fmt(p.emissaoCO2)); $("#sRecv").text(p.reciclagem); $("#sDivv").text(p.diversidade); $("#sConfv").text(p.conformidade);
    var s = EBCalc.score(p);
    $("#scoreTotal").text(EB.fmt(s.total, 1));
    $("#scoreBars").empty().append(
      barra("Ambiental (peso 0,35)", s.ambiental, EB.fmt(s.ambiental, 1)),
      barra("Circularidade (peso 0,15)", s.circularidade, EB.fmt(s.circularidade, 1), "bg-info"),
      barra("Social (peso 0,20)", s.social, EB.fmt(s.social, 1), "bg-warning"),
      barra("Governança (peso 0,30)", s.governanca, EB.fmt(s.governanca, 1), "bg-primary"));
  }
  $("#sCO2, #sRec, #sDiv, #sConf").on("input", atualizarScore);
  atualizarScore();

  // ================= SIMULADOR DE ROI =================
  function atualizarROI() {
    var p = { hardware: $("#rHw").val(), energia: $("#rEn").val(), automacao: $("#rAu").val(), investimento: $("#rInv").val(), anos: $("#rAnos").val() };
    $("#rHwv").text(p.hardware); $("#rEnv").text(p.energia); $("#rAuv").text(p.automacao); $("#rInvv").text(EB.brl(p.investimento));
    $("#rAnosv").text(p.anos); $("#rAnosLbl").text(p.anos);
    var r = EBCalc.roi(p);
    $("#rRoi").text((r.roi > 0 ? "+" : "") + EB.fmt(r.roi, 1) + "%").toggleClass("text-success", r.roi >= 0).toggleClass("text-danger", r.roi < 0);
    $("#rPay").text(r.payback == null ? "–" : r.payback);
    $("#rDx").text("+" + EB.fmt(r.deltaX, 1) + "%");
    $("#rEco").text(EB.brl(r.economia));
    $("#rCo2").text("−" + EB.fmt(r.co2, 1) + "%");
    var soma = r.contribuicao.reduce(function (a, c) { return a + c.pontos; }, 0), cores = ["bg-success", "bg-info", "bg-warning"];
    $("#rBars").empty();
    r.contribuicao.forEach(function (c, i) {
      var pct = soma > 0 ? (c.pontos / soma) * 100 : 0;
      $("#rBars").append(barra(c.nome, pct, EB.fmt(pct, 0) + "%", cores[i]));
    });
  }
  $("#rHw, #rEn, #rAu, #rInv, #rAnos").on("input", atualizarROI);
  atualizarROI();
})(jQuery);
