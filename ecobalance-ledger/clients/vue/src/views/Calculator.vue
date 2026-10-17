<script setup>
import { onMounted, ref } from "vue";
import { api, formatNumber } from "../api";
import DataTable from "../components/DataTable.vue";
import LoadFeedback from "../components/LoadFeedback.vue";
import SensitivitySimulator from "../components/SensitivitySimulator.vue";

const props = defineProps({ user: { type: Object, required: true } });
const defaultMatrix = [
  { nome: "Hardware", demanda: 2, valores: [0.15, 0.1, 0.2, 0.05, 0.1] },
  { nome: "Cloud/Data", demanda: 1.5, valores: [0.1, 0.4, 0.15, 0.08, 0.12] },
  { nome: "Automação", demanda: 0.8, valores: [0.05, 0.15, 0.2, 0.03, 0.15] },
  { nome: "Papel/Celulose", demanda: 1.2, valores: [0.02, 0.05, 0.03, 0.3, 0.08] },
  { nome: "TI Verde", demanda: 0.5, valores: [0.08, 0.12, 0.1, 0.04, 0.05] }
];
const cloneMatrix = () => defaultMatrix.map((row) => ({ ...row, valores: [...row.valores] }));
const matrix = ref(cloneMatrix());
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
    const matrixA = matrix.value.map((row) => row.valores.map(Number));
    const demand = matrix.value.map((row) => Number(row.demanda));
    result.value = (await api("/leontief/calculate", { method: "POST", body: { matrixA, demand } })).data;
  } catch (reason) { error.value = reason.message; }
}

function updateCell(rowIndex, columnIndex, value) {
  matrix.value[rowIndex].valores[columnIndex] = Number(value);
}

function updateDemand(index, value) {
  matrix.value[index].demanda = Number(value);
}

function resetMatrix() {
  matrix.value = cloneMatrix();
  result.value = null;
}

function optimizeMatrix() {
  matrix.value = matrix.value.map((row) => ({
    ...row,
    valores: row.valores.map((value) => Number(Math.max(0, value * 0.9).toFixed(4)))
  }));
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
    <form class="panel" @submit.prevent="calculate">
      <h2>Matriz de coeficientes técnicos</h2>
      <p>Modelo X = (I − A)⁻¹ D; cálculo validado pelo critério de Hawkins-Simons no backend e motor NumPy configurável.</p>
      <div class="table-wrap"><table>
        <caption>Coeficientes de insumo por setor de destino</caption>
        <thead><tr><th scope="col">Setor de origem</th><th v-for="row in defaultMatrix" :key="row.nome" scope="col">{{ row.nome }}</th><th scope="col">Demanda</th></tr></thead>
        <tbody><tr v-for="(row, rowIndex) in matrix" :key="row.nome">
          <th scope="row">{{ row.nome }}</th>
          <td v-for="(value, columnIndex) in row.valores" :key="columnIndex">
            <label class="visually-hidden" :for="`coefficient-${rowIndex}-${columnIndex}`">Coeficiente {{ row.nome }} para {{ defaultMatrix[columnIndex].nome }}</label>
            <input :id="`coefficient-${rowIndex}-${columnIndex}`" type="number" min="0" max="1" step="0.01" :value="value" @input="updateCell(rowIndex, columnIndex, $event.target.value)" />
          </td>
          <td><label class="visually-hidden" :for="`demand-${rowIndex}`">Demanda de {{ row.nome }}</label><input :id="`demand-${rowIndex}`" type="number" min="0" step="0.1" :value="row.demanda" @input="updateDemand(rowIndex, $event.target.value)" /></td>
        </tr></tbody>
      </table></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="chart-controls">
        <button class="secondary" type="button" @click="resetMatrix">Redefinir matriz</button>
        <button class="secondary" type="button" @click="optimizeMatrix">Otimizar coeficientes em 10%</button>
        <button class="primary" type="submit">Calcular produção</button>
      </div>
    </form>
    <section v-if="result" class="panel" aria-live="polite">
      <h2>Produção calculada</h2>
      <p>Setores: {{ result.setores }}. Critério Hawkins-Simons: {{ result.hawkins_simons_valid ? "válido" : "inválido" }}. Motor: {{ result.engine === "numpy" ? "NumPy" : "JavaScript de reserva" }}.</p>
      <ol><li v-for="(value, index) in result.production_required" :key="index">{{ defaultMatrix[index].nome }}: {{ formatNumber(value, 6) }}</li></ol>
      <details><summary>Detalhes e inversa da matriz</summary><pre class="panel result">{{ JSON.stringify(result, null, 2) }}</pre></details>
    </section>
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
    <SensitivitySimulator />
  </section>
</template>
