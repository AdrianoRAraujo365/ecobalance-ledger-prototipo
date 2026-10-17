// Limitador simples em memória (por IP) para login/registro. Em produção com
// várias réplicas, troque por um armazenamento compartilhado (ex.: Redis).
module.exports = ({ janelaMs = 15 * 60 * 1000, max = 20 } = {}) => {
  const hits = new Map();
  setInterval(() => {
    const agora = Date.now();
    for (const [ip, h] of hits) if (agora > h.reset) hits.delete(ip);
  }, janelaMs).unref();

  return (req, res, next) => {
    const agora = Date.now();
    const h = hits.get(req.ip) || { count: 0, reset: agora + janelaMs };
    if (agora > h.reset) { h.count = 0; h.reset = agora + janelaMs; }
    h.count += 1;
    hits.set(req.ip, h);
    if (h.count > max) {
      return res.status(429).json({ success: false, message: "Muitas tentativas. Tente novamente mais tarde." });
    }
    next();
  };
};
