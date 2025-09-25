// app/utils/logger.js
const { getActor } = require('./requestContext');

async function createLog({ action, entity, before = null, after = null, actor = null }) {
  if (!action || !entity) {
    console.warn("Logger: 'action' e 'entity' são obrigatórios.");
    return;
  }

  try {
    const db = require("../models");
    const Log = db.logs;

    // Se actor não for passado, tenta pegar do AsyncLocalStorage
    if (!actor) {
      actor = getActor() || { id: 'system', nome: 'Sistema' }; // fallback seguro
    }

    await Log.create({
      action,
      entity,
      before,
      after,
      actor,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Erro ao salvar log:", err.message);
  }
}

module.exports = { createLog };
