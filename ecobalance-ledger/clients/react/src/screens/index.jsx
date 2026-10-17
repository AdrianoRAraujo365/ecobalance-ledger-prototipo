import { useEffect, useState } from "react";
import { api, formatNumber } from "../api";
import { downloadEsgReport } from "../../shared/report";
import { EsgCharts } from "../components/EsgCharts";
import AssetMap from "../components/AssetMap";
import SensitivitySimulator from "../components/SensitivitySimulator";

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = () => {
    setLoading(true);
    setError("");
    return loader().then(setData).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, deps);
  return { data, error, loading, refresh };
}

function Feedback({ error, loading }) {
  if (error) return <p className="error" role="alert">{error}</p>;
  return loading ? <p role="status">Carregando dados…</p> : null;
}

export function Dashboard({ user }) {
  const resource = useLoad(() => api("/esg-indicators/summary").then((result) => result.data));
  const summary = resource.data;
  return <section>
    <h1>Visão geral ESG</h1>
    <p>Olá, {user.nome}. Acesso atual: {user.perfilRotulo}.</p>
    <Feedback error={resource.error} loading={resource.loading} />
    {summary && <>
      <div className="cards" aria-live="polite">
        <article className="panel"><h2>Indicadores registrados</h2><p className="metric">{formatNumber(summary.totais.indicadores, 0)}</p></article>
        <article className="panel"><h2>Score ESG mais recente</h2><p className="metric">{formatNumber(summary.totais.scoreUltimoAno)}</p></article>
        <article className="panel"><h2>Variação de CO₂</h2><p className="metric">{summary.totais.variacaoCO2 == null ? "—" : `${formatNumber(summary.totais.variacaoCO2)}%`}</p></article>
      </div>
      <button className="primary" type="button" onClick={() => downloadEsgReport(summary)}>Exportar relatório ESG em PDF</button>
      <EsgCharts years={summary.anos} />
      <DataTable caption="Médias anuais dos indicadores ESG" headers={["Ano", "Registros", "Score", "CO₂ (t)", "Reciclagem (%)", "Diversidade (%)", "Conformidade (%)"]} rows={summary.anos.map((year) => [year.ano, year.qtd, formatNumber(year.scoreMedio), formatNumber(year.emissaoCO2), formatNumber(year.reciclagem), formatNumber(year.diversidade), formatNumber(year.conformidade)])} />
      <AssetMap />
    </>}
  </section>;
}

export function Indicators({ user }) {
  const resource = useLoad(() => api("/esg-indicators").then((result) => result.data));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const canWrite = (user.permissoes || []).includes("esg:write");
  async function create(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    ["ano", "consumoEnergia", "consumoAgua", "emissaoCO2", "residuosEletronicosKg", "reciclagem", "diversidade", "conformidade"].forEach((key) => { body[key] = Number(body[key]); });
    setError(""); setNotice("");
    try {
      await api("/esg-indicators", { method: "POST", body });
      formElement.reset();
      setNotice("Indicador salvo e registrado no ledger.");
      await resource.refresh();
    } catch (reason) { setError(reason.message); }
  }
  return <section>
    <h1>Indicadores ESG</h1>
    <Feedback error={resource.error} loading={resource.loading} />
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {canWrite && <form className="panel form-grid" onSubmit={create}>
      <h2>Novo indicador</h2>
      <label>Ano<input name="ano" type="number" min="2000" max="2100" required /></label>
      <label>Setor<input name="setor" maxLength="120" required /></label>
      <label>Consumo de energia<input name="consumoEnergia" type="number" min="0" step="0.01" required /></label>
      <label>Consumo de água<input name="consumoAgua" type="number" min="0" step="0.01" required /></label>
      <label>Emissão de CO₂<input name="emissaoCO2" type="number" min="0" step="0.01" required /></label>
      <label>Resíduos eletrônicos (kg)<input name="residuosEletronicosKg" type="number" min="0" step="0.01" required /></label>
      <label>Reciclagem (%)<input name="reciclagem" type="number" min="0" max="100" step="0.01" required /></label>
      <label>Diversidade (%)<input name="diversidade" type="number" min="0" max="100" step="0.01" required /></label>
      <label>Conformidade (%)<input name="conformidade" type="number" min="0" max="100" step="0.01" required /></label>
      <button className="primary" type="submit">Salvar indicador</button>
    </form>}
    {resource.data && <DataTable caption="Registros de indicadores ESG" headers={["Ano", "Setor", "Score ESG", "Emissão CO₂ (t)"]} rows={resource.data.map((row) => [row.ano, row.setor, formatNumber(row.scoreESG), formatNumber(row.emissaoCO2)])} />}
  </section>;
}

const DEFAULT_MATRIX = [
  { nome: "Hardware", demanda: 2, valores: [0.15, 0.1, 0.2, 0.05, 0.1] },
  { nome: "Cloud/Data", demanda: 1.5, valores: [0.1, 0.4, 0.15, 0.08, 0.12] },
  { nome: "Automação", demanda: 0.8, valores: [0.05, 0.15, 0.2, 0.03, 0.15] },
  { nome: "Papel/Celulose", demanda: 1.2, valores: [0.02, 0.05, 0.03, 0.3, 0.08] },
  { nome: "TI Verde", demanda: 0.5, valores: [0.08, 0.12, 0.1, 0.04, 0.05] }
];
const cloneMatrix = () => DEFAULT_MATRIX.map((row) => ({ ...row, valores: [...row.valores] }));

export function Calculator({ user }) {
  const [matrix, setMatrix] = useState(cloneMatrix);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [entryStatus, setEntryStatus] = useState("");
  const entries = useLoad(() => api("/leontief-entries").then((response) => response.data));
  const canWrite = (user.permissoes || []).includes("leontief:write");
  async function createEntry(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    body.coeficiente = Number(body.coeficiente);
    body.demanda = Number(body.demanda);
    try {
      await api("/leontief-entries", { method: "POST", body });
      formElement.reset();
      setEntryStatus("Coeficiente salvo.");
      await entries.refresh();
    } catch (reason) { setError(reason.message); }
  }
  async function calculate(event) {
    event.preventDefault(); setError(""); setResult(null);
    try {
      const matrixA = matrix.map((row) => row.valores.map(Number));
      const demand = matrix.map((row) => Number(row.demanda));
      const result = await api("/leontief/calculate", { method: "POST", body: { matrixA, demand } });
      setResult(result.data);
    } catch (reason) { setError(reason.message); }
  }
  function updateCell(rowIndex, columnIndex, value) {
    setMatrix((current) => current.map((row, index) => index === rowIndex
      ? { ...row, valores: row.valores.map((item, column) => column === columnIndex ? Number(value) : item) }
      : row));
  }
  function optimizeMatrix() {
    setMatrix((current) => current.map((row) => ({ ...row, valores: row.valores.map((value) => Number(Math.max(0, value * 0.9).toFixed(4))) })));
  }
  function updateDemand(index, value) {
    setMatrix((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, demanda: Number(value) } : row));
  }
  return <section><h1>Calculadora de Leontief</h1>
    <form className="panel" onSubmit={calculate}>
      <h2>Matriz de coeficientes técnicos</h2>
      <p>Modelo X = (I − A)⁻¹ D; cálculo validado pelo critério de Hawkins-Simons no backend e motor NumPy configurável.</p>
      <div className="table-wrap"><table>
        <caption>Coeficientes de insumo por setor de destino</caption>
        <thead><tr><th scope="col">Setor de origem</th>{DEFAULT_MATRIX.map((row) => <th scope="col" key={row.nome}>{row.nome}</th>)}<th scope="col">Demanda</th></tr></thead>
        <tbody>{matrix.map((row, rowIndex) => <tr key={row.nome}>
          <th scope="row">{row.nome}</th>
          {row.valores.map((value, columnIndex) => <td key={columnIndex}><label htmlFor={`coefficient-${rowIndex}-${columnIndex}`} className="visually-hidden">{`Coeficiente ${row.nome} para ${DEFAULT_MATRIX[columnIndex].nome}`}</label>
            <input id={`coefficient-${rowIndex}-${columnIndex}`} type="number" min="0" max="1" step="0.01" value={value} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)} /></td>)}
          <td><label htmlFor={`demand-${rowIndex}`} className="visually-hidden">{`Demanda de ${row.nome}`}</label><input id={`demand-${rowIndex}`} type="number" min="0" step="0.1" value={row.demanda} onChange={(event) => updateDemand(rowIndex, event.target.value)} /></td>
        </tr>)}</tbody>
      </table></div>
      <div className="chart-controls">
        <button className="secondary" type="button" onClick={() => { setMatrix(cloneMatrix()); setResult(null); }}>Redefinir matriz</button>
        <button className="secondary" type="button" onClick={optimizeMatrix}>Otimizar coeficientes em 10%</button>
        <button className="primary" type="submit">Calcular produção</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
    {result && <section className="panel" aria-live="polite">
      <h2>Produção calculada</h2>
      <p>Setores: {result.setores}. Critério Hawkins-Simons: {result.hawkins_simons_valid ? "válido" : "inválido"}. Motor: {result.engine === "numpy" ? "NumPy" : "JavaScript de reserva"}.</p>
      <ol>{result.production_required.map((value, index) => <li key={index}>{DEFAULT_MATRIX[index].nome}: {formatNumber(value, 6)}</li>)}</ol>
      <details><summary>Detalhes e inversa da matriz</summary><pre className="panel result">{JSON.stringify(result, null, 2)}</pre></details>
    </section>}
    {canWrite && <form className="panel form-grid" onSubmit={createEntry}>
      <h2>Novo coeficiente</h2>
      <label>Setor de origem<input name="setorOrigem" required /></label>
      <label>Setor de destino<input name="setorDestino" required /></label>
      <label>Coeficiente<input name="coeficiente" type="number" min="0" max="1" step="0.0001" required /></label>
      <label>Demanda<input name="demanda" type="number" min="0" step="0.01" defaultValue="0" required /></label>
      <button className="primary" type="submit">Salvar coeficiente</button>
      {entryStatus && <p className="success" role="status">{entryStatus}</p>}
    </form>}
    <Feedback error={entries.error} loading={entries.loading} />
    {entries.data && <DataTable caption="Coeficientes de Leontief" headers={["Origem", "Destino", "Coeficiente", "Demanda"]} rows={entries.data.map((entry) => [entry.setorOrigem, entry.setorDestino, formatNumber(entry.coeficiente), formatNumber(entry.demanda)])} />}
    <SensitivitySimulator />
  </section>;
}

export function Ledger({ user }) {
  const resource = useLoad(() => api("/ledger-blocks").then((result) => result.data));
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const canVerify = (user.permissoes || []).includes("ledger:verify");
  async function verify() {
    setError(""); setVerification(null);
    try { setVerification((await api("/ledger-blocks/verification")).data); }
    catch (reason) { setError(reason.message); }
  }
  return <section><h1>Ledger SHA-256</h1>
    {canVerify && <button className="primary" type="button" onClick={verify}>Verificar integridade</button>}
    {error && <p className="error" role="alert">{error}</p>}
    {verification && <p className={verification.valid ? "success" : "error"} role="status">{verification.valid ? "Integridade válida." : `Foram encontradas ${verification.problemas.length} inconsistências.`}</p>}
    <Feedback error={resource.error} loading={resource.loading} />
    {resource.data && <DataTable caption="Blocos recentes do ledger" headers={["Índice", "Entidade", "Data", "Hash do bloco"]} rows={resource.data.map((row) => [row.indice, row.entidade, row.timestamp, row.blockHash])} />}
  </section>;
}

export function Notifications({ user }) {
  const resource = useLoad(() => api("/notifications").then((result) => result.data));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const canSend = (user.permissoes || []).includes("notifications:send");
  const notifications = (resource.data || []).filter((item) => filter === "all" || item.origem === "globalgap:triagem");
  async function sendNotification(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    try {
      await api("/notifications", { method: "POST", body });
      formElement.reset();
      setNotice("Notificação enviada.");
    } catch (reason) { setError(reason.message); }
  }
  async function markAllRead() {
    setError("");
    try { await api("/notifications", { method: "PATCH" }); await resource.refresh(); }
    catch (reason) { setError(reason.message); }
  }
  return <section><h1>Notificações</h1>
    <button className="secondary" type="button" onClick={markAllRead}>Marcar todas como lidas</button>
    <p role="note">Alertas GLOBALG.A.P. indicam apenas triagem interna sobre o indicador genérico de conformidade; não representam auditoria ou certificação oficial.</p>
    <div className="chart-controls" aria-label="Filtrar notificações">
      <button className="secondary" type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Todas</button>
      <button className="secondary" type="button" aria-pressed={filter === "globalgap"} onClick={() => setFilter("globalgap")}>GLOBALG.A.P.</button>
    </div>
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <Feedback error={resource.error} loading={resource.loading} />
    {canSend && <form className="panel form-grid" onSubmit={sendNotification}>
      <h2>Enviar notificação</h2>
      <label>Destinatário por perfil<select name="perfil" defaultValue="todos"><option value="todos">Todos os perfis</option><option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option></select></label>
      <label>Título<input name="titulo" maxLength="120" required /></label>
      <label>Mensagem<textarea name="mensagem" maxLength="500" required /></label>
      <label>Tipo<select name="tipo" defaultValue="info"><option value="info">Informação</option><option value="sucesso">Sucesso</option><option value="alerta">Alerta</option><option value="erro">Erro</option></select></label>
      <button className="primary" type="submit">Enviar</button>
    </form>}
    {resource.data && (notifications.length ? <ul className="notification-list">{notifications.map((item) => <li className="panel" key={item.id}><h2>{item.titulo}</h2><p>{item.mensagem}</p><p>{item.lida ? "Lida" : "Não lida"} · {new Date(item.createdAt).toLocaleString("pt-BR")}</p></li>)}</ul> : <p role="status">Nenhuma notificação nesta visualização.</p>)}
  </section>;
}

export function Users({ user }) {
  const resource = useLoad(() => api("/users").then((result) => result.data), [user.id]);
  const canWrite = (user.permissoes || []).includes("users:write");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function createUser(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    try {
      await api("/users", { method: "POST", body });
      formElement.reset();
      setNotice("Usuário criado.");
      await resource.refresh();
    } catch (reason) { setError(reason.message); }
  }
  async function toggleUser(row) {
    setError(""); setNotice("");
    try {
      await api(`/users/${row.id}`, { method: "PATCH", body: { ativo: !row.ativo } });
      setNotice("Status do usuário atualizado.");
      await resource.refresh();
    } catch (reason) { setError(reason.message); }
  }
  async function changeProfile(row, perfil) {
    setError(""); setNotice("");
    try {
      await api(`/users/${row.id}`, { method: "PATCH", body: { perfil } });
      setNotice("Perfil do usuário atualizado.");
      await resource.refresh();
    } catch (reason) { setError(reason.message); }
  }
  return <section><h1>Usuários</h1><Feedback error={resource.error} loading={resource.loading} />
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="success" role="status">{notice}</p>}
    {canWrite && <form className="panel form-grid" onSubmit={createUser}>
      <h2>Criar usuário</h2>
      <label>Nome<input name="nome" minLength="3" maxLength="120" required /></label>
      <label>E-mail<input name="email" type="email" maxLength="160" required /></label>
      <label>Senha inicial<input name="senha" type="password" minLength="8" autoComplete="new-password" required /></label>
      <label>Perfil<select name="perfil" defaultValue="usuario"><option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option></select></label>
      <button className="primary" type="submit">Criar usuário</button>
    </form>}
    {resource.data && <div className="table-wrap"><table>
      <caption>Usuários da plataforma</caption>
      <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Status</th>{canWrite && <th scope="col">Ação</th>}</tr></thead>
      <tbody>{resource.data.map((row) => <tr key={row.id}><td>{row.nome}</td><td>{row.email}</td><td>{canWrite
        ? <select aria-label={`Perfil de ${row.nome}`} value={row.perfil} disabled={row.id === user.id} onChange={(event) => changeProfile(row, event.target.value)}>
          <option value="usuario">Usuário</option><option value="analista_dados">Analista de Dados</option><option value="auditor">Auditor ESG</option><option value="gerente_sustentabilidade">Gerente de Sustentabilidade</option>
        </select>
        : row.perfil}</td><td>{row.ativo ? "Ativo" : "Inativo"}</td>{canWrite && <td><button className="secondary" type="button" disabled={row.id === user.id} onClick={() => toggleUser(row)}>{row.ativo ? "Desativar" : "Ativar"}</button></td>}</tr>)}</tbody>
    </table></div>}
  </section>;
}

function DataTable({ caption, headers, rows }) {
  return <div className="table-wrap"><table>
    <caption>{caption}</caption>
    <thead><tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>Nenhum registro disponível.</td></tr>}</tbody>
  </table></div>;
}
