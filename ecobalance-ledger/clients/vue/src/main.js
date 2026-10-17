import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";
import { applyTheme, getPreferredTheme } from "../../shared/theme";

applyTheme(getPreferredTheme());

createApp(App).mount("#app");
