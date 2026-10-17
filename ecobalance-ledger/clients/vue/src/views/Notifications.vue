<script setup>
import { onMounted, ref } from "vue";
import { api } from "../api";
import LoadFeedback from "../components/LoadFeedback.vue";

const props = defineProps({ user: { type: Object, required: true } });
const rows = ref([]);
const error = ref("");
const loading = ref(true);
const notice = ref("");
const canSend = (props.user.permissoes || []).includes("notifications:send");
const form = ref({ perfil: "todos", titulo: "", mensagem: "", tipo: "info" });

async function refresh() {
  loading.value = true;
  error.value = "";
  try { rows.value = (await api("/notifications")).data; }
  catch (reason) { error.value = reason.message; }
  finally { loading.value = false; }
}

async function markAllRead() {
  error.value = "";
  try { await api("/notifications", { method: "PATCH" }); await refresh(); }
  catch (reason) { error.value = reason.message; }
}

async function sendNotification() {
  error.value = "";
  notice.value = "";
  try {
    await api("/notifications", { method: "POST", body: form.value });
    form.value = { perfil: "todos", titulo: "", mensagem: "", tipo: "info" };
    notice.value = "Notificação enviada.";
  } catch (reason) { error.value = reason.message; }
}

onMounted(refresh);
</script>

<template>
  <section>
    <h1>Notificações</h1>
    <button class="secondary" type="button" @click="markAllRead">Marcar todas como lidas</button>
    <p v-if="notice" class="success" role="status">{{ notice }}</p>
    <form v-if="canSend" class="panel form-grid" @submit.prevent="sendNotification">
      <h2>Enviar notificação</h2>
      <label>Destinatário por perfil<select v-model="form.perfil"><option value="todos">Todos os perfis</option><option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option></select></label>
      <label>Título<input v-model="form.titulo" maxlength="120" required /></label>
      <label>Mensagem<textarea v-model="form.mensagem" maxlength="500" required /></label>
      <label>Tipo<select v-model="form.tipo"><option value="info">Informação</option><option value="sucesso">Sucesso</option><option value="alerta">Alerta</option><option value="erro">Erro</option></select></label>
      <button class="primary" type="submit">Enviar</button>
    </form>
    <LoadFeedback :error="error" :loading="loading" />
    <ul v-if="!loading && !error" class="notification-list">
      <li v-for="item in rows" :key="item.id" class="panel">
        <h2>{{ item.titulo }}</h2><p>{{ item.mensagem }}</p>
        <p>{{ item.lida ? "Lida" : "Não lida" }} · {{ new Date(item.createdAt).toLocaleString("pt-BR") }}</p>
      </li>
      <li v-if="!rows.length">Nenhuma notificação.</li>
    </ul>
  </section>
</template>
