const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round2 = (v) => Math.round(v * 100) / 100;

class ESGService {
  // Score = Ambiental×0,35 + Circularidade×0,15 + Social×0,20 + Governança×0,30
  // Ambiental = max(0, 100 − CO₂/20)
  score({ emissaoCO2, reciclagem, diversidade, conformidade }) {
    const ambiental = Math.max(0, 100 - Number(emissaoCO2) / 20);
    const total =
      ambiental * 0.35 +
      clamp(Number(reciclagem), 0, 100) * 0.15 +
      clamp(Number(diversidade), 0, 100) * 0.2 +
      clamp(Number(conformidade), 0, 100) * 0.3;
    return round2(clamp(total, 0, 100));
  }

  // Campos canônicos (ordem fixa) que entram no hash do ledger
  payload(ind) {
    return {
      ano: Number(ind.ano),
      setor: ind.setor,
      consumoEnergia: Number(ind.consumoEnergia),
      consumoAgua: Number(ind.consumoAgua),
      emissaoCO2: Number(ind.emissaoCO2),
      residuosEletronicosKg: Number(ind.residuosEletronicosKg),
      reciclagem: Number(ind.reciclagem),
      diversidade: Number(ind.diversidade),
      conformidade: Number(ind.conformidade),
      scoreESG: Number(ind.scoreESG)
    };
  }

  // Agrega por ano (médias) para o dashboard
  resumoPorAno(indicadores) {
    const mapa = new Map();
    for (const i of indicadores) {
      const g = mapa.get(i.ano) || { ano: i.ano, qtd: 0, score: 0, co2: 0, reciclagem: 0, diversidade: 0, conformidade: 0 };
      g.qtd += 1;
      g.score += i.scoreESG;
      g.co2 += i.emissaoCO2;
      g.reciclagem += i.reciclagem;
      g.diversidade += i.diversidade;
      g.conformidade += i.conformidade;
      mapa.set(i.ano, g);
    }
    return [...mapa.values()].sort((a, b) => a.ano - b.ano).map((g) => ({
      ano: g.ano,
      qtd: g.qtd,
      scoreMedio: round2(g.score / g.qtd),
      emissaoCO2: round2(g.co2),
      reciclagem: round2(g.reciclagem / g.qtd),
      diversidade: round2(g.diversidade / g.qtd),
      conformidade: round2(g.conformidade / g.qtd)
    }));
  }
}

module.exports = new ESGService();
