<script setup>
import { computed } from "vue";

const props = defineProps({ user: { type: Object, required: true }, page: { type: String, required: true } });
const emit = defineEmits(["navigate", "logout"]);
const menu = [
  ["dashboard", "Visão geral"],
  ["indicators", "Indicadores ESG"],
  ["calculator", "Calculadora"],
  ["ledger", "Ledger"],
  ["notifications", "Notificações"]
];
const links = computed(() => {
  const items = [...menu];
  const permissions = props.user.permissoes || [];
  if (permissions.includes("users:read")) items.push(["users", "Usuários"]);
  if (permissions.includes("oauth:manage")) items.push(["integrations", "Integrações"]);
  return items;
});
</script>

<template>
  <div class="app">
    <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header class="topbar">
      <a class="brand" href="#dashboard" @click.prevent="emit('navigate', 'dashboard')">EcoBalance Ledger</a>
      <div class="identity">
        <span>{{ user.nome }} · {{ user.perfilRotulo }}</span>
        <a href="/dashboard">Interface completa</a>
        <button class="secondary" type="button" @click="emit('logout')">Sair</button>
      </div>
    </header>
    <div class="layout">
      <nav class="navigation" aria-label="Navegação principal">
        <button v-for="[key, label] in links" :key="key" class="nav-item" :class="{ active: page === key }"
          type="button" :aria-current="page === key ? 'page' : undefined" @click="emit('navigate', key)">
          {{ label }}
        </button>
      </nav>
      <main id="main-content" class="content" tabindex="-1"><slot /></main>
    </div>
  </div>
</template>
