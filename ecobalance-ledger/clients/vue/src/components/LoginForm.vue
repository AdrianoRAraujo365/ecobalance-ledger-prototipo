<script setup>
import { ref } from "vue";

const props = defineProps({
  onLogin: { type: Function, required: true },
  theme: { type: String, required: true },
  onThemeToggle: { type: Function, required: true }
});
const email = ref("");
const senha = ref("");
const erro = ref("");
const enviando = ref(false);

async function submit() {
  erro.value = "";
  enviando.value = true;
  try {
    await props.onLogin(email.value, senha.value);
  } catch (reason) {
    erro.value = reason.message;
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <main class="login-wrap">
    <section class="panel login-panel" aria-labelledby="login-heading">
      <button class="secondary" type="button" :aria-label="`Ativar tema ${theme === 'dark' ? 'claro' : 'escuro'}`"
        :aria-pressed="theme === 'dark'" @click="onThemeToggle">{{ theme === "dark" ? "Tema claro" : "Tema escuro" }}</button>
      <h1 id="login-heading">Entrar no EcoBalance Ledger</h1>
      <p>Acesse os indicadores e ferramentas de sustentabilidade.</p>
      <form @submit.prevent="submit">
        <label for="login-email">E-mail</label>
        <input id="login-email" v-model="email" type="email" autocomplete="username" required />
        <label for="login-password">Senha</label>
        <input id="login-password" v-model="senha" type="password" autocomplete="current-password" required />
        <p v-if="erro" class="error" role="alert">{{ erro }}</p>
        <button class="primary" type="submit" :disabled="enviando">{{ enviando ? "Entrando…" : "Entrar" }}</button>
      </form>
    </section>
  </main>
</template>
