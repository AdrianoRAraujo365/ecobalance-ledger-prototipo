import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { calculateSimulation } from "../../shared/simulator";
import { downloadSimulationReport } from "../../shared/report";
import { formatNumber } from "../api";

const defaults = { hardware: 10, energia: 15, automacao: 20, investimento: 500000 };

export default function SensitivitySimulator() {
  const [simulation, setSimulation] = useState(defaults);
  const canvas = useRef(null);
  const chart = useRef(null);
  const result = useMemo(() => calculateSimulation(simulation), [simulation]);

  useEffect(() => {
    if (!canvas.current) return undefined;
    const colors = getComputedStyle(document.documentElement);
    chart.current?.destroy();
    chart.current = new Chart(canvas.current, {
      type: "bar",
      data: {
        labels: ["Hardware", "Energia", "Automação", "Mão de obra", "Outros"],
        datasets: [{
          label: "Impacto (%)",
          data: [simulation.hardware, simulation.energia, simulation.automacao, 25, 40],
          backgroundColor: ["#10b981cc", "#3b82f6cc", "#8b5cf6cc", "#f59e0bcc", "#ef4444cc"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: colors.getPropertyValue("--eb-muted").trim(),
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: colors.getPropertyValue("--eb-chart-grid").trim() } },
          x: { grid: { display: false } }
        }
      }
    });
    return () => chart.current?.destroy();
  }, [simulation]);

  const change = (key) => (event) => setSimulation((current) => ({ ...current, [key]: Number(event.target.value) }));

  return (
    <section className="panel" aria-labelledby="sensitivity-title">
      <h2 id="sensitivity-title">Simulador de sensibilidade e ROI</h2>
      <p>Estimativas simplificadas baseadas nos parâmetros selecionados; valide premissas antes de decisões financeiras.</p>
      <div className="form-grid">
        <Range label="Eficiência de hardware (%)" min={0} max={50} value={simulation.hardware} onChange={change("hardware")} />
        <Range label="Economia de energia (%)" min={0} max={40} value={simulation.energia} onChange={change("energia")} />
        <Range label="Automação de processos (%)" min={0} max={60} value={simulation.automacao} onChange={change("automacao")} />
        <Range label="Investimento inicial (R$)" min={100000} max={5000000} step={100000} value={simulation.investimento} onChange={change("investimento")} money />
      </div>
      <div className="cards" aria-live="polite">
        <article className="panel result-card"><span>ROI estimado (3 anos)</span><strong>{formatNumber(result.roi)}%</strong></article>
        <article className="panel result-card"><span>Payback (meses)</span><strong>{result.payback == null ? "—" : result.payback}</strong></article>
        <article className="panel result-card"><span>Economia anual</span><strong>R$ {formatNumber(result.economia, 0)}</strong></article>
        <article className="panel result-card"><span>Redução estimada de CO₂</span><strong>{formatNumber(result.co2)}%</strong></article>
      </div>
      <div className="chart-frame" role="img" aria-label="Gráfico de barras do impacto percentual estimado dos parâmetros.">
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <table>
        <caption>Valores usados no gráfico de sensibilidade</caption>
        <thead><tr><th scope="col">Parâmetro</th><th scope="col">Impacto (%)</th></tr></thead>
        <tbody>
          <tr><th scope="row">Hardware</th><td>{formatNumber(simulation.hardware)}</td></tr>
          <tr><th scope="row">Energia</th><td>{formatNumber(simulation.energia)}</td></tr>
          <tr><th scope="row">Automação</th><td>{formatNumber(simulation.automacao)}</td></tr>
          <tr><th scope="row">Mão de obra (premissa do protótipo)</th><td>25</td></tr>
          <tr><th scope="row">Outros (premissa do protótipo)</th><td>40</td></tr>
        </tbody>
      </table>
      <button className="primary" type="button" onClick={() => downloadSimulationReport(simulation, result)}>Exportar proposta em PDF</button>
    </section>
  );
}

function Range({ label, min, max, step = 1, value, onChange, money = false }) {
  const output = money ? `R$ ${Number(value).toLocaleString("pt-BR")}` : `${value}%`;
  return (
    <label>
      <span>{label}: <output className="range-output">{output}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={onChange} />
    </label>
  );
}
