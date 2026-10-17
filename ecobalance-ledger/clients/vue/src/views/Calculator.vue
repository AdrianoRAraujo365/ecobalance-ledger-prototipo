<script setup>
import { onMounted, ref } from "vue";
import { api, formatNumber } from "../api";
import DataTable from "../components/DataTable.vue";
import LoadFeedback from "../components/LoadFeedback.vue";

const props = defineProps({ user: { type: Object, required: true } });
const matrix = ref("[[0.1, 0.2], [0.3, 0.1]]");
const demand = ref("[100, 200]");
const result = ref(null);
const error = ref("");
const entries = ref([]);
const entryError = ref("");
const entryStatus = ref("");
const loadingEntries = ref(true);
const canWrite = (props.user.permissoes || []).includes("leontief:write");
const entry = ref({ setorOrigem: "", setorDestino: "", coeficiente: 0, demanda: 0 });

async function calculate() {
  error.value = "";
  result.value = null;
  try {
    result.value = (await api("/leontief/calculate", { method: "POST", body: { matrixA: JSON.parse(matrix.value), demand: JSON.parse(demand.value) } })).data;
  } catch (reason) { error.value = reason.message; }
}

async function refreshEntries() {
  loadingEntries.value = true;
  entryError.value = "";
  try { entries.value = (await api("/leontief-entries")).data; }
  catch (reason) { entryError.value = reason.message; }
  finally { loadingEntries.value = false; }
}

async function createEntry() {
  entryError.value = "";
  entryStatus.value = "";
  try {
    await api("/leontief-entries", { method: "POST", body: entry.value });
    entry.value = { setorOrigem: "", setorDestino: "", coeficiente: 0, demanda: 0 };
    entryStatus.value = "Coeficiente salvo.";
    await refreshEntries();
  } catch (reason) { entryError.value = reason.message; }
}

onMounted(refreshEntries);
</script>

<template>
  <section>
    <h1>Calculadora de Leontief</h1>
    <form class="panel form-grid" @submit.prevent="calculate">
      <label>Matriz de coeficientes A (JSON)<textarea v-model="matrix" rows="4" required /></label>
      <label>Demanda final D (JSON)<textarea v-model="demand" rows="3" required /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="primary" type="submit">Calcular X = (I − A)⁻¹ D</button>
    </form>
    <pre v-if="result" class="panel result" aria-label="Resultado do cálculo">{{ JSON.stringify(result, null, 2) }}</pre>
    <form v-if="canWrite" class="panel form-grid" @submit.prevent="createEntry">
      <h2>Novo coeficiente</h2>
      <label>Setor de origem<input v-model="entry.setorOrigem" required /></label>
      <label>Setor de destino<input v-model="entry.setorDestino" required /></label>
      <label>Coeficiente<input v-model.number="entry.coeficiente" type="number" min="0" max="1" step="0.0001" required /></label>
      <label>Demanda<input v-model.number="entry.demanda" type="number" min="0" step="0.01" required /></label>
      <button class="primary" type="submit">Salvar coeficiente</button>
      <p v-if="entryStatus" class="success" role="status">{{ entryStatus }}</p>
    </form>
    <LoadFeedback :error="entryError" :loading="loadingEntries" />
    <DataTable v-if="!loadingEntries && !entryError" caption="Coeficientes de Leontief" :headers="['Origem', 'Destino', 'Coeficiente', 'Demanda']"
      :rows="entries.map((item) => [item.setorOrigem, item.setorDestino, formatNumber(item.coeficiente), formatNumber(item.demanda)])" />
  </section>
</template>
