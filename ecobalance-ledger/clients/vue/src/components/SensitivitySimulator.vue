<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Chart from "chart.js/auto";
import { calculateSimulation } from "../../shared/simulator";
import { downloadSimulationReport } from "../../shared/report";
import { formatNumber } from "../api";

const simulation = ref({ hardware: 10, energia: 15, automacao: 20, investimento: 500000 });
const result = computed(() => calculateSimulation(simulation.value));
const canvas = ref(null);
let chart;

function drawChart() {
  if (!canvas.value) return;
  const styles = getComputedStyle(document.documentElement);
  chart?.destroy();
  chart = new Chart(canvas.value, {
    type: "bar",
    data: {
      labels: ["Hardware", "Energia", "Automação", "Mão de obra", "Outros"],
      datasets: [{ label: "Impacto (%)", data: [simulation.value.hardware, simulation.value.energia, simulation.value.automacao, 25, 40], backgroundColor: ["#10b981cc", "#3b82f6cc", "#8b5cf6cc", "#f59e0bcc", "#ef4444cc"], borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, color: styles.getPropertyValue("--eb-muted").trim(),
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: styles.getPropertyValue("--eb-chart-grid").trim() } }, x: { grid: { display: false } } }
    }
  });
}

function updateTheme() {
  if (!chart) return;
  const styles = getComputedStyle(document.documentElement);
  chart.options.color = styles.getPropertyValue("--eb-muted").trim();
  chart.options.scales.y.grid.color = styles.getPropertyValue("--eb-chart-grid").trim();
  chart.update();
}

watch(simulation, drawChart, { deep: true });
onMounted(() => {
  drawChart();
  document.addEventListener("eb:theme", updateTheme);
});
onBeforeUnmount(() => {
  document.removeEventListener("eb:theme", updateTheme);
  chart?.destroy();
});
</script>

<template>
  <section class="panel" aria-labelledby="sensitivity-title">
    <h2 id="sensitivity-title">Simulador de sensibilidade e ROI</h2>
    <p>Estimativas simplificadas; valide premissas antes de decisões financeiras.</p>
    <div class="form-grid">
      <label>Eficiência de hardware: {{ simulation.hardware }}%<input v-model.number="simulation.hardware" type="range" min="0" max="50" aria-label="Eficiência de hardware (%)" /></label>
      <label>Economia de energia: {{ simulation.energia }}%<input v-model.number="simulation.energia" type="range" min="0" max="40" aria-label="Economia de energia (%)" /></label>
      <label>Automação de processos: {{ simulation.automacao }}%<input v-model.number="simulation.automacao" type="range" min="0" max="60" aria-label="Automação de processos (%)" /></label>
      <label>Investimento inicial: R$ {{ Number(simulation.investimento).toLocaleString("pt-BR") }}<input v-model.number="simulation.investimento" type="range" min="100000" max="5000000" step="100000" aria-label="Investimento inicial em reais" /></label>
    </div>
    <div class="cards" aria-live="polite">
      <article class="panel result-card"><span>ROI estimado (3 anos)</span><strong>{{ formatNumber(result.roi) }}%</strong></article>
      <article class="panel result-card"><span>Payback (meses)</span><strong>{{ result.payback ?? "—" }}</strong></article>
      <article class="panel result-card"><span>Economia anual</span><strong>R$ {{ formatNumber(result.economia, 0) }}</strong></article>
      <article class="panel result-card"><span>Redução estimada de CO₂</span><strong>{{ formatNumber(result.co2) }}%</strong></article>
    </div>
    <div class="chart-frame" role="img" aria-label="Gráfico de barras do impacto percentual estimado dos parâmetros."><canvas ref="canvas" aria-hidden="true" /></div>
    <table>
      <caption>Valores usados no gráfico de sensibilidade</caption>
      <thead><tr><th scope="col">Parâmetro</th><th scope="col">Impacto (%)</th></tr></thead>
      <tbody>
        <tr><th scope="row">Hardware</th><td>{{ formatNumber(simulation.hardware) }}</td></tr>
        <tr><th scope="row">Energia</th><td>{{ formatNumber(simulation.energia) }}</td></tr>
        <tr><th scope="row">Automação</th><td>{{ formatNumber(simulation.automacao) }}</td></tr>
        <tr><th scope="row">Mão de obra (premissa do protótipo)</th><td>25</td></tr>
        <tr><th scope="row">Outros (premissa do protótipo)</th><td>40</td></tr>
      </tbody>
    </table>
    <button class="primary" type="button" @click="downloadSimulationReport(simulation, result)">Exportar proposta em PDF</button>
  </section>
</template>
