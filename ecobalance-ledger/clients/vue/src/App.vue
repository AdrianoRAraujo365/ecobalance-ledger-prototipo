<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "./api";
import LoginForm from "./components/LoginForm.vue";
import AppShell from "./components/AppShell.vue";
import Dashboard from "./views/Dashboard.vue";
import Indicators from "./views/Indicators.vue";
import Calculator from "./views/Calculator.vue";
import Ledger from "./views/Ledger.vue";
import Notifications from "./views/Notifications.vue";
import Users from "./views/Users.vue";

const user = ref(null);
const page = ref("dashboard");
const loading = ref(true);
const error = ref("");
const pages = {
  dashboard: Dashboard,
  indicators: Indicators,
  calculator: Calculator,
  ledger: Ledger,
  notifications: Notifications,
  users: Users
};
const currentPage = computed(() => pages[page.value] || Dashboard);

onMounted(async () => {
  try {
    user.value = (await api("/auth/me")).data;
  } catch (reason) {
    if (reason.status !== 401) error.value = reason.message;
  } finally {
    loading.value = false;
  }
});

async function login(email, senha) {
  const result = await api("/auth/login", { method: "POST", body: { email, senha } });
  user.value = result.user;
  error.value = "";
}

async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
    error.value = "";
  } catch (reason) {
    error.value = reason.message;
  } finally {
    user.value = null;
    page.value = "dashboard";
  }
}
</script>

<template>
  <main v-if="loading" class="content" role="status">Carregando sessão…</main>
  <template v-else-if="!user">
    <LoginForm :on-login="login" />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </template>
  <AppShell v-else :user="user" :page="page" @navigate="page = $event" @logout="logout">
    <section v-if="page === 'integrations'" class="panel">
      <h1>Integrações OAuth 2.0</h1>
      <p>Gerencie clientes OAuth na interface completa.</p>
      <a href="/integracoes">Abrir integrações</a>
    </section>
    <component :is="currentPage" v-else :user="user" />
  </AppShell>
</template>
