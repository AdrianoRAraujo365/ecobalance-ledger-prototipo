import { jsPDF } from "jspdf";

export function downloadEsgReport(summary) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("EcoBalance Ledger - Relatorio ESG", 20, 24);
  doc.setFontSize(11);
  doc.text(`Periodo: ${summary.anos[0]?.ano ?? "sem dados"} - ${summary.anos.at(-1)?.ano ?? "sem dados"}`, 20, 36);
  doc.text(`Indicadores registrados: ${summary.totais.indicadores}`, 20, 46);
  doc.text(`Score ESG mais recente: ${summary.totais.scoreUltimoAno ?? "sem dados"}`, 20, 56);
  doc.text(`Variacao de CO2: ${summary.totais.variacaoCO2 ?? "sem dados"}%`, 20, 66);
  let y = 82;
  summary.anos.forEach((year) => {
    if (y > 265) {
      doc.addPage();
      y = 24;
    }
    doc.text(`${year.ano} | ${year.qtd} registros | Score ${year.scoreMedio} | CO2 ${year.emissaoCO2} t | Conformidade ${year.conformidade}%`, 20, y);
    y += 9;
  });
  doc.save("relatorio-esg-ecobalance.pdf");
}

export function downloadSimulationReport(simulation, result) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Proposta de Investimento - TI Verde", 20, 24);
  doc.setFontSize(12);
  doc.text(`Investimento inicial: R$ ${Number(simulation.investimento).toLocaleString("pt-BR")}`, 20, 44);
  doc.text(`ROI estimado (3 anos): ${result.roi}%`, 20, 58);
  doc.text(`Payback: ${result.payback == null ? "nao calculavel" : `${result.payback} meses`}`, 20, 72);
  doc.text(`Economia anual estimada: R$ ${Number(result.economia).toLocaleString("pt-BR")}`, 20, 86);
  doc.text(`Variacao estimada da producao: ${result.deltaX}%`, 20, 100);
  doc.text(`Reducao estimada de CO2: ${result.co2}%`, 20, 114);
  doc.save("proposta-investimento-ti-verde.pdf");
}
