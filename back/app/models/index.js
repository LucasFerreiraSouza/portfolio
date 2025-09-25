const dbConfig = require("../config/db.config");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// Inicializa o objeto db
const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

// --- Importa modelos ---
db.conteudos = require("./conteudo.model.js");
db.usuarios = require("./usuario.model.js"); // ✅ adiciona o modelo de usuários

module.exports = db;
