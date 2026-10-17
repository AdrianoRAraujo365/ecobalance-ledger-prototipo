import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await onLogin(email, senha);
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="panel login-panel" aria-labelledby="login-heading">
        <h1 id="login-heading">Entrar no EcoBalance Ledger</h1>
        <p>Acesse os indicadores e ferramentas de sustentabilidade.</p>
        <form onSubmit={submit}>
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="login-password">Senha</label>
          <input id="login-password" type="password" autoComplete="current-password" required value={senha} onChange={(event) => setSenha(event.target.value)} />
          {erro && <p className="error" role="alert">{erro}</p>}
          <button className="primary" type="submit" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}
