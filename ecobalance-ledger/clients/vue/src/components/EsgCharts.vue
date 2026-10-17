<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Chart from "chart.js/auto";
import { formatNumber } from "../api";

const props = defineProps({ years: { type: Array, required: true } });
const metrics = {
  emissaoCO2: { label: "Emissões de CO₂ (t)", color: "#10b981" },
  scoreMedio: { label: "Score ESG", color: "#3b82f6" },
  reciclagem: { label: "Reciclagem (%)", color: "#f59e0b" },
  diversidade: { label: "Diversidade (%)", color: "#8b5cf6" }
};
const metric = ref("emissaoCO2");
const trendCanvas = ref(null);
const radarCanvas = ref(null);
let trendChart;
let radarChart;

function colors() {
  const styles = getComputedStyle(document.documentElement);
  return { text: styles.getPropertyValue("--eb-muted").trim(), grid: styles.getPropertyValue("--eb-chart-grid").trim() };
}

function renderCharts() {
  if (!props.years.length || !trendCanvas.value || !radarCanvas.value) return;
  const palette = colors();
  trendChart?.destroy();
  trendChart = new Chart(trendCanvas.value, {
    type: "line",
    data: {
      labels: props.years.map((year) => year.ano),
      datasets: [{ label: metrics[metric.value].label, data: props.years.map((year) => Number(year[metric.value])), borderColor: metrics[metric.value].color, backgroundColor: `${metrics[metric.value].color}22`, fill: true, tension: 0.3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, color: palette.text,
      plugins: { legend: { labels: { color: palette.text } } },
      scales: { x: { ticks: { color: palette.text }, grid: { color: palette.grid } }, y: { beginAtZero: metric.value !== "scoreMedio", ticks: { color: palette.text }, grid: { color: palette.grid } } }
    }
  });
  radarChart?.destroy();
  const first = props.years[0];
  const latest = props.years[props.years.length - 1];
  radarChart = new Chart(radarCanvas.value, {
    type: "radar",
    data: {
      labels: ["Score ESG", "Reciclagem", "Diversidade", "Conformidade"],
      datasets: [
        { label: String(first.ano), data: [first.scoreMedio, first.reciclagem, first.diversidade, first.conformidade], borderColor: "#64748b", backgroundColor: "#64748b33" },
        { label: String(latest.ano), data: [latest.scoreMedio, latest.reciclagem, latest.diversidade, latest.conformidade], borderColor: "#10b981", backgroundColor: "#10b98133" }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, color: palette.text,
      plugins: { legend: { labels: { color: palette.text } } },
      scales: { r: { min: 0, max: 100, grid: { color: palette.grid }, angleLines: { color: palette.grid }, pointLabels: { color: palette.text }, ticks: { display: false } } }
    }
  });
}

function updateTheme() {
  const palette = colors();
  [trendChart, radarChart].forEach((chart) => {
    if (!chart) return;
    chart.options.color = palette.text;
    chart.options.plugins.legend.labels.color = palette.text;
    if (chart.options.scales.x) {
      chart.options.scales.x.ticks.color = palette.text;
      chart.options.scales.x.grid.color = palette.grid;
    }
    if (chart.options.scales.y) {
      chart.options.scales.y.ticks.color = palette.text;
      chart.options.scales.y.grid.color = palette.grid;
    }
    if (chart.options.scales.r) {
      chart.options.scales.r.pointLabels.color = palette.text;
      chart.options.scales.r.grid.color = palette.grid;
      chart.options.scales.r.angleLines.color = palette.grid;
    }
    chart.update();
  });
}

watch([() => props.years, metric], renderCharts, { deep: true, flush: "post" });
onMounted(() => {
  renderCharts();
  document.addEventListener("eb:theme", updateTheme);
});
onBeforeUnmount(() => {
  document.removeEventListener("eb:theme", updateTheme);
  trendChart?.destroy();
  radarChart?.destroy();
});
</script>

<template>
  <div>
    <section class="panel tw-rounded-xl" aria-labelledby="trend-title">
      <h2 id="trend-title">Evolução de indicadores</h2>
      <div class="chart-controls" aria-label="Indicador do gráfico">
        <button v-for="(item, key) in metrics" :key="key" class="secondary" type="button" :aria-pressed="metric === key" @click="metric = key">{{ item.label }}</button>
      </div>
      <div class="chart-frame" role="img" :aria-label="`${metrics[metric].label} por ano. Os mesmos dados estão na tabela anual.`"><canvas ref="trendCanvas" aria-hidden="true" /></div>
    </section>
    <section class="panel tw-rounded-xl" aria-labelledby="radar-title">
      <h2 id="radar-title">Comparativo do primeiro e último ano</h2>
      <div class="chart-frame" role="img" aria-label="Comparação de score ESG, reciclagem, diversidade e conformidade."><canvas ref="radarCanvas" aria-hidden="true" /></div>
      <div v-if="years.length" class="table-wrap">
        <table>
          <caption>Dados equivalentes ao gráfico de radar</caption>
          <thead><tr><th scope="col">Indicador</th><th scope="col">{{ years[0].ano }}</th><th scope="col">{{ years[years.length - 1].ano }}</th></tr></thead>
          <tbody>
            <tr v-for="[label, key] in [['Score ESG', 'scoreMedio'], ['Reciclagem (%)', 'reciclagem'], ['Diversidade (%)', 'diversidade'], ['Conformidade (%)', 'conformidade']]" :key="key">
              <th scope="row">{{ label }}</th><td>{{ formatNumber(years[0][key]) }}</td><td>{{ formatNumber(years[years.length - 1][key]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
