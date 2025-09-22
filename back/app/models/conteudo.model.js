const mongoose = require("mongoose");

// ======================= SCHEMA =======================
const ConteudoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  imagem: { type: String, required: true }, // base64 ou URL do PNG
}, { timestamps: true });

// ======================= MODELO =======================
const Conteudo = mongoose.model("Conteudo", ConteudoSchema, "conteudos");

module.exports = Conteudo;
