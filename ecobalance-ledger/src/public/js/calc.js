// Funções puras da calculadora (Score ESG e ROI). Rodam no navegador (window.EBCalc) e no Node (testes).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.EBCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var round = function (v, d) { var f = Math.pow(10, d); return Math.round(v * f) / f; };

  // Mesma regra do backend (ESGService.score):
  // Score = Ambiental×0,35 + Circularidade×0,15 + Social×0,20 + Governança×0,30
  function score(p) {
    var ambiental = Math.max(0, 100 - Number(p.emissaoCO2) / 20);
    var circ = clamp(Number(p.reciclagem), 0, 100);
    var social = clamp(Number(p.diversidade), 0, 100);
    var gov = clamp(Number(p.conformidade), 0, 100);
    var total = ambiental * 0.35 + circ * 0.15 + social * 0.2 + gov * 0.3;
    return {
      ambiental: round(clamp(ambiental, 0, 100), 2), circularidade: circ, social: social, governanca: gov,
      total: round(clamp(total, 0, 100), 2)
    };
  }

  // Fórmula simplificada do simulador do index.html (eficiência ponderada; economia anual = 50% do investimento × eficiência),
  // com horizonte de análise em anos. O original fixava 3 anos e travava o ROI em 0%: com eficiência total ≤ 49%,
  // economia×3 nunca supera o investimento. Aqui o ROI pode ser negativo (informativo) e o horizonte é ajustável.
  function roi(p) {
    var hw = Number(p.hardware), en = Number(p.energia), au = Number(p.automacao), inv = Number(p.investimento);
    var anos = Number(p.anos) > 0 ? Number(p.anos) : 3;
    var efic = hw * 0.3 + en * 0.4 + au * 0.3;
    var economia = inv * (efic / 100) * 0.5;
    var roiBruto = inv > 0 ? ((economia * anos - inv) / inv) * 100 : 0;
    return {
      anos: anos,
      eficienciaTotal: round(efic, 2),
      roi: round(roiBruto, 1),
      payback: economia > 0 ? Math.ceil((inv / economia) * 12) : null,
      deltaX: round(efic * 0.8, 1),
      economia: Math.floor(economia),
      co2: round(efic * 0.6, 1),
      contribuicao: [
        { nome: "Hardware", pontos: round(hw * 0.3, 2) },
        { nome: "Energia", pontos: round(en * 0.4, 2) },
        { nome: "Automação", pontos: round(au * 0.3, 2) }
      ]
    };
  }

  return { score: score, roi: roi };
});
