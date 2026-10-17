<script setup>
defineProps({
  error: { type: String, default: "" },
  loading: { type: Boolean, default: false }
});
</script>

<template>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-else-if="loading" role="status">Carregando dados…</p>
</template>
