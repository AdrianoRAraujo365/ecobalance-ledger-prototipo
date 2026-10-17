// Carregado no <head> para evitar "flash" do tema errado
(function () {
  try {
    var t = localStorage.getItem("eb-theme");
    if (!t) t = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", t);
    var f = parseInt(localStorage.getItem("eb-font"), 10);
    if (f >= 90 && f <= 140) document.documentElement.style.fontSize = f + "%";
  } catch (e) { /* localStorage indisponível */ }
})();
