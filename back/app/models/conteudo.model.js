const mongoose = require("mongoose");

// Subdocumento da seção (não terá _id próprio, só dados embutidos)
const SecaoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    ordem: { type: Number, default: 0 },
  },
  { _id: false }
);

const ConteudoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    descricao: { type: String, required: true },
    imagem: { type: String, required: true },
    publicId: { type: String, required: true }, // necessário para deletar no Cloudinary

    // seção embutida
    secao: { type: SecaoSchema, required: true },

    ordem: { type: Number, default: 0 }, // usado no drag & drop dos conteúdos

    // usuário que criou o conteúdo
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    createdByUsername: String, // novo campo para rota pública

  },
  { timestamps: true }
);

module.exports = mongoose.model("Conteudo", ConteudoSchema);
