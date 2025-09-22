const dbConfig = require("../config/db.config.js");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// Inicializa o objeto db
const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

// Importa modelos
db.conteudos = require("./conteudo.model.js");

module.exports = db;
