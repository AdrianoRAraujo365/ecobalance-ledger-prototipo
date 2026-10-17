(function ($) {
  var $body = $("#resumoBody");
  EB.api("GET", "/esg-indicators/summary").then(function (r) {
    var anos = r.data.anos, t = r.data.totais;
    $("#kpiQtd").text(EB.fmt(t.indicadores));
    $("#kpiAno").text(t.ultimoAno || "–");
    $("#kpiScore").text(t.scoreUltimoAno == null ? "–" : EB.fmt(t.scoreUltimoAno, 1));
    $("#kpiCO2").text(t.variacaoCO2 == null ? "–" : (t.variacaoCO2 > 0 ? "+" : "") + EB.fmt(t.variacaoCO2, 1) + "%");

    var labels = anos.map(function (a) { return a.ano; });
    EB.lineChart($("#chartScore")[0], labels, [
      { name: "Score ESG", color: "#10b981", values: anos.map(function (a) { return a.scoreMedio; }) },
      { name: "Conformidade %", color: "#38bdf8", values: anos.map(function (a) { return a.conformidade; }) }
    ]);
    EB.lineChart($("#chartCO2")[0], labels, [
      { name: "CO₂ (t)", color: "#f59e0b", values: anos.map(function (a) { return a.emissaoCO2; }) }
    ]);

    $body.empty();
    if (!anos.length) return $body.append(EB.emptyRow(7, "Nenhum indicador cadastrado ainda."));
    anos.slice().reverse().forEach(function (a) {
      var td = function (v, d) { return $("<td>").addClass("text-end").text(EB.fmt(v, d)); };
      $body.append($("<tr>").append($("<th scope='row'>").text(a.ano), td(a.qtd), td(a.scoreMedio, 1), td(a.emissaoCO2, 1), td(a.reciclagem, 1), td(a.diversidade, 1), td(a.conformidade, 1)));
    });
  }).catch(function (ex) { $body.empty().append(EB.emptyRow(7, "Erro: " + ex.message)); });
})(jQuery);
