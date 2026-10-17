// Utilitários globais (jQuery): API, toasts, tema, fonte, logout, badge de notificações e gráfico de linhas
(function ($) {
  "use strict";
  var EB = (window.EB = {});

  // Cliente da API REST (usa o cookie httpOnly com o JWT)
  EB.api = function (method, url, body) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: "/api/v1" + url, method: method, dataType: "json", contentType: "application/json",
        headers: { Accept: "application/json" },
        data: body ? JSON.stringify(body) : undefined
      }).done(resolve).fail(function (xhr) {
        var d = xhr.responseJSON || null;
        if (xhr.status === 401 && !/^\/auth\/(login|register)/.test(url)) { location.href = "/login"; }
        var e = new Error((d && d.message) || "Erro " + xhr.status);
        e.status = xhr.status; e.data = d;
        reject(e);
      });
    });
  };

  EB.fmt = function (n, d) {
    return n == null || isNaN(n) ? "–" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d });
  };
  EB.brl = function (n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); };
  EB.date = function (iso) { return new Date(iso).toLocaleString("pt-BR"); };

  // Toast do Bootstrap (conteúdo via .text(): sem XSS)
  EB.toast = function (msg, type) {
    var cor = type === "error" ? "danger" : "success";
    var $t = $('<div class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true"></div>').addClass("text-bg-" + cor);
    var $f = $('<div class="d-flex"></div>').append($('<div class="toast-body"></div>').text(msg),
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>');
    $t.append($f).appendTo("#toasts");
    var t = new bootstrap.Toast($t[0], { delay: 4500 });
    $t.on("hidden.bs.toast", function () { $t.remove(); });
    t.show();
  };

  EB.showError = function ($el, msg) { $el.text(msg).prop("hidden", false); };
  EB.clearError = function ($el) { $el.text("").prop("hidden", true); };
  EB.formData = function ($form) {
    var o = {};
    $form.serializeArray().forEach(function (p) { o[p.name] = p.value; });
    return o;
  };
  EB.emptyRow = function (cols, text) {
    return $("<tr>").append($("<td>").attr("colspan", cols).addClass("text-body-secondary").text(text));
  };

  // Badge de notificações não lidas
  EB.refreshBadge = function () {
    var $b = $("#notifBadge");
    if (!$b.length) return;
    EB.api("GET", "/notifications/unread-count").then(function (r) {
      $b.text(r.naoLidas > 99 ? "99+" : r.naoLidas).toggleClass("d-none", !r.naoLidas);
      $b.attr("aria-label", r.naoLidas + " notificações não lidas");
    }).catch(function () {});
  };

  $(function () {
    var $root = $("html");

    $("#themeToggle").on("click", function () {
      var next = $root.attr("data-bs-theme") === "dark" ? "light" : "dark";
      $root.attr("data-bs-theme", next);
      $(this).attr("aria-pressed", next === "dark");
      try { localStorage.setItem("eb-theme", next); } catch (e) {}
      $(document).trigger("eb:theme");
    }).attr("aria-pressed", $root.attr("data-bs-theme") === "dark");

    function fonte(delta) {
      var atual = parseInt($root[0].style.fontSize, 10) || 100;
      var novo = Math.min(140, Math.max(90, atual + delta));
      $root.css("font-size", novo + "%");
      try { localStorage.setItem("eb-font", novo); } catch (e) {}
      $(document).trigger("eb:theme");
    }
    $("#fontUp").on("click", function () { fonte(10); });
    $("#fontDown").on("click", function () { fonte(-10); });

    $("#logoutBtn").on("click", function () {
      EB.api("POST", "/auth/logout").catch(function () {}).then(function () { location.href = "/login"; });
    });

    $("#senhaForm").on("submit", function (e) {
      e.preventDefault();
      var $form = $(this), $err = $("#senhaError"), d = EB.formData($form);
      EB.clearError($err);
      if (d.novaSenha !== d.confirma) return EB.showError($err, "As senhas não conferem");
      EB.api("PATCH", "/auth/password", { senhaAtual: d.senhaAtual, novaSenha: d.novaSenha }).then(function () {
        $form[0].reset();
        bootstrap.Modal.getInstance($("#senhaModal")[0]).hide();
        EB.toast("Senha alterada com sucesso");
        EB.refreshBadge();
      }).catch(function (ex) { EB.showError($err, ex.message); });
    });

    EB.refreshBadge();
    if ($("#notifBadge").length) setInterval(EB.refreshBadge, 60000);
  });

  // Gráfico de linhas em canvas (sem dependências extras)
  EB.lineChart = function (canvas, labels, series) {
    function draw() {
      var css = getComputedStyle(document.documentElement);
      var text = css.getPropertyValue("--bs-secondary-color").trim() || "#888";
      var grid = css.getPropertyValue("--bs-border-color").trim() || "#444";
      var dpr = window.devicePixelRatio || 1;
      var w = Math.max(240, canvas.parentElement.clientWidth), h = parseInt(canvas.getAttribute("height"), 10) || 260;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      canvas.width = w * dpr; canvas.height = h * dpr;
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = "12px system-ui, sans-serif";

      var all = series.reduce(function (a, s) { return a.concat(s.values); }, []);
      if (!labels.length || !all.length) {
        ctx.fillStyle = text; ctx.textAlign = "center";
        ctx.fillText("Sem dados para exibir", w / 2, h / 2);
        return;
      }
      var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
      if (min === max) { min = Math.max(0, min - 1); max = max + 1; }
      var pad = { l: 52, r: 14, t: 16, b: 46 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      var x = function (i) { return pad.l + (labels.length === 1 ? pw / 2 : (pw * i) / (labels.length - 1)); };
      var y = function (v) { return pad.t + ph - ((v - min) / (max - min)) * ph; };

      ctx.strokeStyle = grid; ctx.fillStyle = text; ctx.textAlign = "right"; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var v = min + ((max - min) * g) / 4, yy = y(v);
        ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(w - pad.r, yy); ctx.stroke();
        ctx.fillText(EB.fmt(v, max - min < 10 ? 1 : 0), pad.l - 6, yy + 4);
      }
      ctx.textAlign = "center";
      var passo = Math.ceil(labels.length / Math.max(1, Math.floor(pw / 48)));
      labels.forEach(function (l, i) { if (i % passo === 0) ctx.fillText(String(l), x(i), h - pad.b + 18); });

      series.forEach(function (s, k) {
        ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = 2.5;
        ctx.beginPath();
        s.values.forEach(function (v, i) { if (i) ctx.lineTo(x(i), y(v)); else ctx.moveTo(x(i), y(v)); });
        ctx.stroke();
        s.values.forEach(function (v, i) { ctx.beginPath(); ctx.arc(x(i), y(v), 3.5, 0, 6.283); ctx.fill(); });
        ctx.textAlign = "left"; ctx.fillText(s.name, pad.l + k * 140, h - 8);
      });
    }
    draw();
    $(window).on("resize", draw);
    $(document).on("eb:theme", draw);
  };
})(jQuery);
