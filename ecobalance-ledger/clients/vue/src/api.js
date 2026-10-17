const API_ROOT = "/api/v1";

export async function api(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || `Falha na solicitação (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return result;
}

export const formatNumber = (value, digits = 2) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("pt-BR", { maximumFractionDigits: digits });
