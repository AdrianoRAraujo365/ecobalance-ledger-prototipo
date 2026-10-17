<script setup>
import { onMounted, ref } from "vue";
import { api, formatNumber } from "../api";
import DataTable from "../components/DataTable.vue";
import LoadFeedback from "../components/LoadFeedback.vue";

const props = defineProps({ user: { type: Object, required: true } });
const canWrite = (props.user.permissoes || []).includes("esg:write");
const rows = ref([]);
const error = ref("");
const notice = ref("");
const loading = ref(true);
const form = ref({ ano: new Date().getFullYear(), setor: "", consumoEnergia: 0, consumoAgua: 0, emissaoCO2: 0, residuosEletronicosKg: 0, reciclagem: 0, diversidade: 0, conformidade: 0 });

async function refresh() {
  loading.value = true;
  error.value = "";
  try { rows.value = (await api("/esg-indicators")).data; }
  catch (reason) { error.value = reason.message; }
  finally { loading.value = false; }
}

async function create() {
  error.value = "";
  notice.value = "";
  try {
    await api("/esg-indicators", { method: "POST", body: { ...form.value, ano: Number(form.value.ano) } });
    notice.value = "Indicador salvo e registrado no ledger.";
    await refresh();
  } catch (reason) { error.value = reason.message; }
}

onMounted(refresh);
</script>

<template>
  <section>
    <h1>Indicadores ESG</h1>
    <LoadFeedback :error="error" :loading="loading" />
    <p v-if="notice" class="success" role="status">{{ notice }}</p>
    <form v-if="canWrite" class="panel form-grid" @submit.prevent="create">
      <h2>Novo indicador</h2>
      <label>Ano<input v-model.number="form.ano" type="number" min="2000" max="2100" required /></label>
      <label>Setor<input v-model="form.setor" maxlength="120" required /></label>
      <label>Consumo de energia<input v-model.number="form.consumoEnergia" type="number" min="0" step="0.01" required /></label>
      <label>Consumo de água<input v-model.number="form.consumoAgua" type="number" min="0" step="0.01" required /></label>
      <label>Emissão de CO₂<input v-model.number="form.emissaoCO2" type="number" min="0" step="0.01" required /></label>
      <label>Resíduos eletrônicos (kg)<input v-model.number="form.residuosEletronicosKg" type="number" min="0" step="0.01" required /></label>
      <label>Reciclagem (%)<input v-model.number="form.reciclagem" type="number" min="0" max="100" step="0.01" required /></label>
      <label>Diversidade (%)<input v-model.number="form.diversidade" type="number" min="0" max="100" step="0.01" required /></label>
      <label>Conformidade (%)<input v-model.number="form.conformidade" type="number" min="0" max="100" step="0.01" required /></label>
      <button class="primary" type="submit">Salvar indicador</button>
    </form>
    <DataTable v-if="!loading && !error" caption="Registros de indicadores ESG" :headers="['Ano', 'Setor', 'Score ESG', 'Emissão CO₂ (t)']"
      :rows="rows.map((row) => [row.ano, row.setor, formatNumber(row.scoreESG), formatNumber(row.emissaoCO2)])" />
  </section>
</template>
