const path = require("path");
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  root: __dirname,
  base: "/apps/react/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/v1": "http://localhost:3000",
      "/oauth": "http://localhost:3000"
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../../src/public/apps/react"),
    emptyOutDir: true
  }
});
