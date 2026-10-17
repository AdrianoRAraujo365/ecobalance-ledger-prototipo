<script setup>
import { onMounted, ref } from "vue";
import { api } from "../api";
import DataTable from "../components/DataTable.vue";
import LoadFeedback from "../components/LoadFeedback.vue";

const props = defineProps({ user: { type: Object, required: true } });
const canVerify = (props.user.permissoes || []).includes("ledger:verify");
const rows = ref([]);
const verification = ref(null);
const error = ref("");
const loading = ref(true);

onMounted(async () => {
  try { rows.value = (await api("/ledger-blocks")).data; }
  catch (reason) { error.value = reason.message; }
  finally { loading.value = false; }
});

async function verify() {
  error.value = "";
  verification.value = null;
  try { verification.value = (await api("/ledger-blocks/verification")).data; }
  catch (reason) { error.value = reason.message; }
}
</script>

<template>
  <section>
    <h1>Ledger SHA-256</h1>
    <button v-if="canVerify" class="primary" type="button" @click="verify">Verificar integridade</button>
    <p v-if="verification" :class="verification.valid ? 'success' : 'error'" role="status">
      {{ verification.valid ? "Integridade válida." : `Foram encontradas ${verification.problemas.length} inconsistências.` }}
    </p>
    <LoadFeedback :error="error" :loading="loading" />
    <DataTable v-if="!loading && !error" caption="Blocos recentes do ledger" :headers="['Índice', 'Entidade', 'Data', 'Hash do bloco']"
      :rows="rows.map((row) => [row.indice, row.entidade, row.timestamp, row.blockHash])" />
  </section>
</template>
