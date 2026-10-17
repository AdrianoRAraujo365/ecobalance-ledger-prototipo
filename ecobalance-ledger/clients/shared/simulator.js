export function calculateSimulation({ hardware, energia, automacao, investimento }) {
  const eficienciaTotal = hardware * 0.3 + energia * 0.4 + automacao * 0.3;
  const economia = investimento * (eficienciaTotal / 100) * 0.5;
  return {
    eficienciaTotal,
    economia,
    roi: ((economia * 3 - investimento) / investimento) * 100,
    payback: economia > 0 ? Math.ceil((investimento / economia) * 12) : null,
    deltaX: eficienciaTotal * 0.8,
    co2: eficienciaTotal * 0.6
  };
}
