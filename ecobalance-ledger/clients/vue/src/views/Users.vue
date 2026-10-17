<script setup>
import { onMounted, ref } from "vue";
import { api } from "../api";
import LoadFeedback from "../components/LoadFeedback.vue";

const rows = ref([]);
const error = ref("");
const loading = ref(true);
const props = defineProps({ user: { type: Object, required: true } });
const canWrite = (props.user.permissoes || []).includes("users:write");
const notice = ref("");
const form = ref({ nome: "", email: "", senha: "", perfil: "usuario" });

async function refresh() {
  loading.value = true;
  error.value = "";
  try { rows.value = (await api("/users")).data; }
  catch (reason) { error.value = reason.message; }
  finally { loading.value = false; }
}

async function createUser() {
  error.value = "";
  notice.value = "";
  try {
    await api("/users", { method: "POST", body: form.value });
    form.value = { nome: "", email: "", senha: "", perfil: "usuario" };
    notice.value = "Usuário criado.";
    await refresh();
  } catch (reason) { error.value = reason.message; }
}

async function toggleUser(row) {
  error.value = "";
  notice.value = "";
  try {
    await api(`/users/${row.id}`, { method: "PATCH", body: { ativo: !row.ativo } });
    notice.value = "Status do usuário atualizado.";
    await refresh();
  } catch (reason) { error.value = reason.message; }
}

async function changeProfile(row, perfil) {
  error.value = "";
  notice.value = "";
  try {
    await api(`/users/${row.id}`, { method: "PATCH", body: { perfil } });
    notice.value = "Perfil do usuário atualizado.";
    await refresh();
  } catch (reason) { error.value = reason.message; }
}

onMounted(refresh);
</script>

<template>
  <section>
    <h1>Usuários</h1>
    <LoadFeedback :error="error" :loading="loading" />
    <p v-if="notice" class="success" role="status">{{ notice }}</p>
    <form v-if="canWrite" class="panel form-grid" @submit.prevent="createUser">
      <h2>Criar usuário</h2>
      <label>Nome<input v-model="form.nome" minlength="3" maxlength="120" required /></label>
      <label>E-mail<input v-model="form.email" type="email" maxlength="160" required /></label>
      <label>Senha inicial<input v-model="form.senha" type="password" minlength="8" autocomplete="new-password" required /></label>
      <label>Perfil<select v-model="form.perfil"><option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option></select></label>
      <button class="primary" type="submit">Criar usuário</button>
    </form>
    <div v-if="!loading && !error" class="table-wrap"><table>
      <caption>Usuários da plataforma</caption>
      <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Status</th><th v-if="canWrite" scope="col">Ação</th></tr></thead>
      <tbody><tr v-for="row in rows" :key="row.id">
        <td>{{ row.nome }}</td><td>{{ row.email }}</td>
        <td><select v-if="canWrite" :aria-label="`Perfil de ${row.nome}`" :value="row.perfil" :disabled="row.id === user.id" @change="changeProfile(row, $event.target.value)">
          <option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option>
        </select><template v-else>{{ row.perfil }}</template></td>
        <td>{{ row.ativo ? "Ativo" : "Inativo" }}</td>
        <td v-if="canWrite"><button class="secondary" type="button" :disabled="row.id === user.id" @click="toggleUser(row)">{{ row.ativo ? "Desativar" : "Ativar" }}</button></td>
      </tr></tbody>
    </table></div>
  </section>
</template>
