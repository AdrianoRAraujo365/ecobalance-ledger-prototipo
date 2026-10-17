// Tailwind (Play CDN) convivendo com Bootstrap: prefixo "tw-" e sem preflight, para não haver conflito de classes/reset.
// Observação: o Play CDN é indicado para protótipos; em produção, compile o CSS (Tailwind CLI).
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  prefix: "tw-",
  corePlugins: { preflight: false },
  darkMode: ["selector", '[data-bs-theme="dark"]']
};
