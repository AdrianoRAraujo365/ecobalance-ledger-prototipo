const env = require("../config/env");
const NotificationService = require("./NotificationService");

class GlobalGapService {
  async assessAndNotify(indicator, authorName) {
    const conformidade = Number(indicator.conformidade);
    if (conformidade >= env.globalGapComplianceThreshold) return false;

    await NotificationService.notificarPerfis(
      ["gerente_sustentabilidade", "auditor"],
      {
        titulo: "Alerta de triagem GLOBALG.A.P.",
        mensagem: `O indicador genérico de conformidade de ${indicator.setor}/${indicator.ano} ficou em ${conformidade}%, abaixo do limite configurado de ${env.globalGapComplianceThreshold}% (registrado por ${authorName}). Este aviso é uma triagem interna; não representa auditoria, certificação nem avaliação oficial GLOBALG.A.P.`,
        tipo: "alerta",
        origem: "globalgap:triagem"
      }
    );
    return true;
  }
}

module.exports = new GlobalGapService();
