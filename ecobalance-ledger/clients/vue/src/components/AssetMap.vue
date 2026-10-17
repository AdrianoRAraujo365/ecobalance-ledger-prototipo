<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import L from "leaflet";

const container = ref(null);
let map;
const assets = [
  { lat: -23.5505, lng: -46.6333, title: "São Paulo - Data Center Principal", type: "Data center" },
  { lat: -23.1791, lng: -45.8872, title: "São José dos Campos - Unidade Industrial", type: "Unidade industrial" },
  { lat: -22.9068, lng: -43.1729, title: "Rio de Janeiro - Escritório Regional", type: "Escritório" },
  { lat: -19.9167, lng: -43.9333, title: "Belo Horizonte - Centro de Pesquisa", type: "Centro de pesquisa" },
  { lat: -25.4284, lng: -49.2733, title: "Curitiba - Ponto de Reciclagem", type: "Ponto de reciclagem" },
  { lat: -30.0346, lng: -51.2177, title: "Porto Alegre - Unidade Logística", type: "Unidade logística" }
];

onMounted(() => {
  map = L.map(container.value).setView([-23.5505, -46.6333], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);
  assets.forEach((asset) => {
    L.circleMarker([asset.lat, asset.lng], { radius: 9, color: "#fff", weight: 2, fillColor: "#10b981", fillOpacity: 0.9 })
      .addTo(map)
      .bindPopup(`<strong>${asset.title}</strong><br>${asset.type}<br>Localização ilustrativa do protótipo`);
  });
});

onBeforeUnmount(() => map?.remove());
</script>

<template>
  <section class="panel">
    <h2>Localização de ativos e pontos de sustentabilidade</h2>
    <p>Os locais abaixo são ilustrativos e não representam dados verificados de ativos.</p>
    <div ref="container" class="map-frame" role="region" aria-label="Mapa ilustrativo de ativos no Brasil" />
    <ul class="asset-list" aria-label="Lista de locais apresentados no mapa">
      <li v-for="asset in assets" :key="asset.title">{{ asset.title }} — {{ asset.type }}</li>
    </ul>
  </section>
</template>
