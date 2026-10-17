const path = require("path");
const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");

module.exports = defineConfig({
  root: __dirname,
  base: "/apps/vue/",
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      "/api/v1": "http://localhost:3000",
      "/oauth": "http://localhost:3000"
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../../src/public/apps/vue"),
    emptyOutDir: true
  }
});
