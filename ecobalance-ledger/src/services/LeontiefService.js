// Modelo de Insumo-Produto de Leontief: X = (I − A)⁻¹ · D
// com validação de Hawkins-Simons (menores principais líderes de I − A > 0).
const env = require("../config/env");
const EPS = 1e-12;

function erro(msg, status = 422, details) {
  const e = new Error(msg);
  e.status = status;
  if (details) e.details = details;
  return e;
}

class LeontiefService {
  validarEntrada(A, D) {
    const n = A.length;
    if (!A.every((l) => Array.isArray(l) && l.length === n)) throw erro("A matriz de coeficientes técnicos deve ser quadrada.", 400);
    if (D.length !== n) throw erro("O vetor de demanda deve ter o mesmo tamanho da matriz.", 400);
    const ok = (v) => typeof v === "number" && Number.isFinite(v);
    if (!A.flat().every(ok) || !D.every(ok)) throw erro("A matriz e a demanda devem conter apenas números.", 400);
    if (A.flat().some((v) => v < 0 || v > 1)) throw erro("Os coeficientes técnicos devem estar entre 0 e 1.", 400);
    if (D.some((v) => v < 0)) throw erro("A demanda final não pode ser negativa.", 400);
  }

  // Menores principais líderes via eliminação de Gauss sem pivoteamento:
  // todos > 0  ⇔  todos os pivôs > 0
  menoresPrincipais(M) {
    const n = M.length;
    const T = M.map((l) => [...l]);
    const minors = [];
    let acumulado = 1;
    for (let k = 0; k < n; k++) {
      const pivo = T[k][k];
      acumulado *= pivo;
      minors.push(acumulado);
      if (!(pivo > EPS)) return { valid: false, minors };
      for (let i = k + 1; i < n; i++) {
        const f = T[i][k] / pivo;
        for (let j = k; j < n; j++) T[i][j] -= f * T[k][j];
      }
    }
    return { valid: true, minors };
  }

  // Gauss-Jordan: inversa de M
  inversa(M) {
    const n = M.length;
    const T = M.map((l, i) => [...l, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(T[r][c]) > Math.abs(T[p][c])) p = r;
      if (Math.abs(T[p][c]) < EPS) throw erro("A matriz I − A não é inversível.", 400);
      [T[c], T[p]] = [T[p], T[c]];
      const d = T[c][c];
      for (let j = 0; j < 2 * n; j++) T[c][j] /= d;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = T[r][c];
        if (f !== 0) for (let j = 0; j < 2 * n; j++) T[r][j] -= f * T[c][j];
      }
    }
    return T.map((l) => l.slice(n));
  }

  // Cálculo local (JavaScript) — usado como fallback quando o motor NumPy está indisponível
  calcularLocal(A, D) {
    const n = A.length;
    const M = A.map((l, i) => l.map((v, j) => (i === j ? 1 : 0) - v));

    const hs = this.menoresPrincipais(M);
    if (!hs.valid) {
      throw erro("A matriz não atende ao critério de Hawkins-Simons.", 422, { principal_minors: hs.minors });
    }

    const inv = this.inversa(M);
    const X = inv.map((linha) => linha.reduce((s, v, j) => s + v * D[j], 0));
    if (X.some((v) => v < -EPS)) throw erro("O resultado possui produção negativa, indicando inconsistência produtiva.", 422);

    const r = (v) => Math.round(v * 1e6) / 1e6;
    return {
      setores: n,
      hawkins_simons_valid: true,
      principal_minors: hs.minors.map(r),
      inverse_matrix: inv.map((l) => l.map(r)),
      production_required: X.map((v) => r(Math.max(0, v)))
    };
  }

  // Motor NumPy (python/app.py). 422 do Python = matriz inválida (não cai no fallback).
  async calcularNumpy(A, D) {
    const res = await fetch(env.pythonUrl + "/leontief/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": env.pyKey },
      body: JSON.stringify({ matrixA: A, demand: D }),
      signal: AbortSignal.timeout(4000)
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 422) throw erro(body.message || "Matriz inválida", 422, { principal_minors: body.principal_minors });
    if (!res.ok) throw new Error("Motor NumPy respondeu " + res.status);
    return body;
  }

  async calculate(A, D) {
    this.validarEntrada(A, D);
    if (env.pythonUrl) {
      try {
        return { ...(await this.calcularNumpy(A, D)), engine: "numpy" };
      } catch (e) {
        if (e.status) throw e; // erro de validação: propaga
        console.warn("Motor NumPy indisponível, usando fallback JS:", e.message);
      }
    }
    return { ...this.calcularLocal(A, D), engine: "js-fallback" };
  }
}

module.exports = new LeontiefService();
