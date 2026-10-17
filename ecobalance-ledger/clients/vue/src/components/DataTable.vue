<script setup>
defineProps({
  caption: { type: String, required: true },
  headers: { type: Array, required: true },
  rows: { type: Array, required: true }
});
</script>

<template>
  <div class="table-wrap">
    <table>
      <caption>{{ caption }}</caption>
      <thead><tr><th v-for="header in headers" :key="header" scope="col">{{ header }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index"><td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td></tr>
        <tr v-if="!rows.length"><td :colspan="headers.length">Nenhum registro disponível.</td></tr>
      </tbody>
    </table>
  </div>
</template>
