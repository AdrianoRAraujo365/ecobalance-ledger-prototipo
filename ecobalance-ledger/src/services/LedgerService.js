const crypto = require("crypto");
const { LedgerBlock, ESGIndicator } = require("../models");
const ESGService = require("./ESGService");

const GENESIS = "0".repeat(64);
const sha256 = (obj) => crypto.createHash("sha256").update(typeof obj === "string" ? obj : JSON.stringify(obj)).digest("hex");

class LedgerService {
  hashBloco(b) {
    return sha256({
      indice: b.indice,
      entidade: b.entidade,
      entidadeId: b.entidadeId,
      payloadHash: b.payloadHash,
      previousHash: b.previousHash,
      usuarioId: b.usuarioId || null,
      timestamp: b.timestamp
    });
  }

  // Cria um bloco encadeado ao anterior. Use dentro de uma transação.
  async register({ entidade, entidadeId, payload, usuarioId, transaction }) {
    const ultimo = await LedgerBlock.findOne({
      order: [["indice", "DESC"]],
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined
    });
    const bloco = {
      indice: ultimo ? ultimo.indice + 1 : 1,
      entidade,
      entidadeId: String(entidadeId),
      payloadHash: sha256(payload),
      previousHash: ultimo ? ultimo.blockHash : GENESIS,
      usuarioId: usuarioId || null,
      timestamp: new Date().toISOString()
    };
    bloco.blockHash = this.hashBloco(bloco);
    return LedgerBlock.create(bloco, { transaction });
  }

  // Verifica o encadeamento, o hash de cada bloco e se os dados ainda batem com o registrado
  async verify() {
    const blocos = await LedgerBlock.findAll({ order: [["indice", "ASC"]] });
    const ids = blocos.filter((b) => b.entidade === "ESGIndicator").map((b) => b.entidadeId);
    const indicadores = ids.length ? await ESGIndicator.findAll({ where: { id: ids } }) : [];
    const porId = new Map(indicadores.map((i) => [i.id, i]));

    const problemas = [];
    let anterior = GENESIS;
    blocos.forEach((b, pos) => {
      if (b.indice !== pos + 1) problemas.push({ indice: b.indice, problema: "Sequência de índices quebrada" });
      if (b.previousHash !== anterior) problemas.push({ indice: b.indice, problema: "previousHash não confere com o bloco anterior" });
      if (this.hashBloco(b) !== b.blockHash) problemas.push({ indice: b.indice, problema: "blockHash não confere (bloco alterado)" });
      if (b.entidade === "ESGIndicator") {
        const ind = porId.get(b.entidadeId);
        if (!ind) problemas.push({ indice: b.indice, problema: "Indicador registrado foi removido" });
        else if (sha256(ESGService.payload(ind)) !== b.payloadHash) problemas.push({ indice: b.indice, problema: "Dados do indicador foram alterados após o registro" });
      }
      anterior = b.blockHash;
    });

    return { valid: problemas.length === 0, total: blocos.length, problemas };
  }
}

module.exports = new LedgerService();
