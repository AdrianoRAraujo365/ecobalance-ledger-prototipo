<script setup>
import { onMounted, ref } from "vue";
import { api, formatNumber } from "../api";
import DataTable from "../components/DataTable.vue";
import LoadFeedback from "../components/LoadFeedback.vue";
import EsgCharts from "../components/EsgCharts.vue";
import AssetMap from "../components/AssetMap.vue";
import { downloadEsgReport } from "../../shared/report";

defineProps({ user: { type: Object, required: true } });
const summary = ref(null);
const error = ref("");
const loading = ref(true);

onMounted(async () => {
  try { summary.value = (await api("/esg-indicators/summary")).data; }
  catch (reason) { error.value = reason.message; }
  finally { loading.value = false; }
});
</script>

<template>
  <section>
    <h1>Visão geral ESG</h1>
    <p>Olá, {{ user.nome }}. Acesso atual: {{ user.perfilRotulo }}.</p>
    <LoadFeedback :error="error" :loading="loading" />
    <template v-if="summary">
      <div class="cards" aria-live="polite">
        <article class="panel"><h2>Indicadores registrados</h2><p class="metric">{{ formatNumber(summary.totais.indicadores, 0) }}</p></article>
        <article class="panel"><h2>Score ESG mais recente</h2><p class="metric">{{ formatNumber(summary.totais.scoreUltimoAno) }}</p></article>
        <article class="panel"><h2>Variação de CO₂</h2><p class="metric">{{ summary.totais.variacaoCO2 == null ? "—" : `${formatNumber(summary.totais.variacaoCO2)}%` }}</p></article>
      </div>
      <button class="primary" type="button" @click="downloadEsgReport(summary)">Exportar relatório ESG em PDF</button>
      <p role="note">Triagem GLOBALG.A.P.: indicadores genéricos de conformidade abaixo do limite configurado geram alertas internos para gerentes e auditores. Não constitui certificação oficial.</p>
      <EsgCharts :years="summary.anos" />
      <DataTable caption="Médias anuais dos indicadores ESG" :headers="['Ano', 'Registros', 'Score', 'CO₂ (t)', 'Reciclagem (%)', 'Diversidade (%)', 'Conformidade (%)']"
        :rows="summary.anos.map((year) => [year.ano, year.qtd, formatNumber(year.scoreMedio), formatNumber(year.emissaoCO2), formatNumber(year.reciclagem), formatNumber(year.diversidade), formatNumber(year.conformidade)])" />
      <AssetMap />
    </template>
  </section>
</template>
