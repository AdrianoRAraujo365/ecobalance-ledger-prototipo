"""Motor numérico do EcoBalance Ledger (NumPy).

Modelo de Leontief: X = (I - A)^-1 · D, com validação de Hawkins-Simons
(todos os menores principais líderes de I - A positivos).
Protegido por chave interna (header X-API-Key = PY_API_KEY).
"""
import hmac
import os

import numpy as np
from flask import Flask, jsonify, request

app = Flask(__name__)
API_KEY = os.environ.get("PY_API_KEY", "")
EPS = 1e-12
MAX_SETORES = 12

if len(API_KEY) < 16:
    raise SystemExit("PY_API_KEY ausente ou curta demais (mínimo 16 caracteres).")


def erro(msg, status, **extra):
    return jsonify({"message": msg, **extra}), status


@app.before_request
def exigir_chave():
    if request.path == "/health":
        return None
    enviada = request.headers.get("X-API-Key", "")
    if not hmac.compare_digest(enviada.encode(), API_KEY.encode()):
        return erro("Chave de API inválida", 401)
    return None


@app.get("/health")
def health():
    return jsonify({"status": "online", "engine": "numpy", "numpy": np.__version__})


@app.post("/leontief/calculate")
def calcular():
    dados = request.get_json(silent=True) or {}
    try:
        A = np.array(dados["matrixA"], dtype=float)
        D = np.array(dados["demand"], dtype=float)
    except (KeyError, ValueError, TypeError):
        return erro("matrixA e demand devem ser numéricos", 400)

    n = A.shape[0] if A.ndim == 2 else 0
    if n < 1 or n > MAX_SETORES or A.shape != (n, n):
        return erro("A matriz de coeficientes técnicos deve ser quadrada (1 a %d setores)" % MAX_SETORES, 400)
    if D.shape != (n,):
        return erro("O vetor de demanda deve ter o mesmo tamanho da matriz", 400)
    if not (np.isfinite(A).all() and np.isfinite(D).all()):
        return erro("A matriz e a demanda devem conter apenas números finitos", 400)
    if (A < 0).any() or (A > 1).any():
        return erro("Os coeficientes técnicos devem estar entre 0 e 1", 400)
    if (D < 0).any():
        return erro("A demanda final não pode ser negativa", 400)

    M = np.eye(n) - A
    minors = [float(np.linalg.det(M[:k, :k])) for k in range(1, n + 1)]
    if not all(m > EPS for m in minors):
        return erro("A matriz não atende ao critério de Hawkins-Simons.", 422,
                    principal_minors=[round(m, 6) for m in minors])

    inversa = np.linalg.inv(M)
    X = inversa @ D
    if (X < -EPS).any():
        return erro("O resultado possui produção negativa, indicando inconsistência produtiva.", 422)

    r = lambda v: np.round(v, 6).tolist()
    return jsonify({
        "setores": n,
        "hawkins_simons_valid": True,
        "principal_minors": [round(m, 6) for m in minors],
        "inverse_matrix": r(inversa),
        "production_required": r(np.maximum(X, 0)),
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5001")))
