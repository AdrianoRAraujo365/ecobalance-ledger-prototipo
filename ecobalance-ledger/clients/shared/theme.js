export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem("eb-client-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch (error) {
    console.warn("Não foi possível ler o tema salvo:", error);
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  try {
    localStorage.setItem("eb-client-theme", theme);
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de tema:", error);
  }
  document.dispatchEvent(new Event("eb:theme"));
}
