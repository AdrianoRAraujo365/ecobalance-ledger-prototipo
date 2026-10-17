import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { formatNumber } from "../api";

const metrics = {
  emissaoCO2: { label: "Emissões de CO₂ (t)", color: "#10b981" },
  scoreMedio: { label: "Score ESG", color: "#3b82f6" },
  reciclagem: { label: "Reciclagem (%)", color: "#f59e0b" },
  diversidade: { label: "Diversidade (%)", color: "#8b5cf6" }
};

function chartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--eb-muted").trim(),
    grid: styles.getPropertyValue("--eb-chart-grid").trim()
  };
}

export function EsgCharts({ years }) {
  const [metric, setMetric] = useState("emissaoCO2");
  const trendCanvas = useRef(null);
  const radarCanvas = useRef(null);
  const trend = useRef(null);
  const radar = useRef(null);

  useEffect(() => {
    if (!trendCanvas.current || !years.length) return undefined;
    const colors = chartColors();
    trend.current?.destroy();
    trend.current = new Chart(trendCanvas.current, {
      type: "line",
      data: {
        labels: years.map((year) => year.ano),
        datasets: [{
          label: metrics[metric].label,
          data: years.map((year) => Number(year[metric])),
          borderColor: metrics[metric].color,
          backgroundColor: `${metrics[metric].color}22`,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: colors.text,
        plugins: { legend: { labels: { color: colors.text } } },
        scales: {
          x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
          y: { beginAtZero: metric !== "scoreMedio", ticks: { color: colors.text }, grid: { color: colors.grid } }
        }
      }
    });
    return () => trend.current?.destroy();
  }, [years, metric]);

  useEffect(() => {
    if (!radarCanvas.current || !years.length) return undefined;
    const colors = chartColors();
    radar.current?.destroy();
    radar.current = new Chart(radarCanvas.current, {
      type: "radar",
      data: {
        labels: ["Score ESG", "Reciclagem", "Diversidade", "Conformidade"],
        datasets: [
          { label: String(years[0].ano), data: [years[0].scoreMedio, years[0].reciclagem, years[0].diversidade, years[0].conformidade], borderColor: "#64748b", backgroundColor: "#64748b33" },
          { label: String(years[years.length - 1].ano), data: [years.at(-1).scoreMedio, years.at(-1).reciclagem, years.at(-1).diversidade, years.at(-1).conformidade], borderColor: "#10b981", backgroundColor: "#10b98133" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: colors.text,
        plugins: { legend: { labels: { color: colors.text } } },
        scales: { r: { min: 0, max: 100, grid: { color: colors.grid }, angleLines: { color: colors.grid }, pointLabels: { color: colors.text }, ticks: { display: false } } }
      }
    });
    return () => radar.current?.destroy();
  }, [years]);

  useEffect(() => {
    const update = () => {
      const colors = chartColors();
      [trend.current, radar.current].forEach((chart) => {
        if (!chart) return;
        chart.options.color = colors.text;
        chart.options.plugins.legend.labels.color = colors.text;
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks.color = colors.text;
          chart.options.scales.x.grid.color = colors.grid;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = colors.text;
          chart.options.scales.y.grid.color = colors.grid;
        }
        if (chart.options.scales.r) {
          chart.options.scales.r.pointLabels.color = colors.text;
          chart.options.scales.r.grid.color = colors.grid;
          chart.options.scales.r.angleLines.color = colors.grid;
        }
        chart.update();
      });
    };
    document.addEventListener("eb:theme", update);
    return () => document.removeEventListener("eb:theme", update);
  }, []);

  return (
    <div>
      <section className="panel tw-rounded-xl" aria-labelledby="trend-title">
        <h2 id="trend-title">Evolução de indicadores</h2>
        <div className="chart-controls" aria-label="Indicador do gráfico">
          {Object.entries(metrics).map(([key, value]) => (
            <button key={key} className="secondary" type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>{value.label}</button>
          ))}
        </div>
        <div className="chart-frame" role="img" aria-label={`${metrics[metric].label} por ano. Os mesmos dados estão na tabela anual.`}>
          <canvas ref={trendCanvas} aria-hidden="true" />
        </div>
      </section>
      <section className="panel tw-rounded-xl" aria-labelledby="radar-title">
        <h2 id="radar-title">Comparativo do primeiro e último ano</h2>
        <div className="chart-frame" role="img" aria-label="Comparação de score ESG, reciclagem, diversidade e conformidade para o primeiro e último ano com dados.">
          <canvas ref={radarCanvas} aria-hidden="true" />
        </div>
        <DataAlternative years={years} />
      </section>
    </div>
  );
}

function DataAlternative({ years }) {
  const first = years[0];
  const latest = years.at(-1);
  if (!first || !latest) return null;
  return (
    <div className="table-wrap">
      <table>
        <caption>Dados equivalentes ao gráfico de radar</caption>
        <thead><tr><th scope="col">Indicador</th><th scope="col">{first.ano}</th><th scope="col">{latest.ano}</th></tr></thead>
        <tbody>
          {[
            ["Score ESG", "scoreMedio"],
            ["Reciclagem (%)", "reciclagem"],
            ["Diversidade (%)", "diversidade"],
            ["Conformidade (%)", "conformidade"]
          ].map(([label, key]) => <tr key={key}><th scope="row">{label}</th><td>{formatNumber(first[key])}</td><td>{formatNumber(latest[key])}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
