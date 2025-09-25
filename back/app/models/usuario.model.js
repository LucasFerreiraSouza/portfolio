const mongoose = require("mongoose");

// Subdocumento de Conteúdo dentro do usuário (opcional, só se quiser embedar)
// Mas normalmente armazenamos apenas referências via createdBy
// const ConteudoSchema = require('./conteudo.model');

const UsuarioSchema = new mongoose.Schema({
  nome: { type: String, unique: false, sparse: true },
  email: { type: String, unique: true, required: true },
  senha: { type: String, required: false },

  // username para URL pública
  username: { type: String, unique: true, required: true },

  // Array de conteúdos (referências)
  conteudos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conteudo" }],

  // --- Status de aprovação ---
  status: { 
    type: String, 
    enum: ['approved', 'rejected'], 
    default: 'rejected' 
  },

  // --- Tipo de usuário ---
  tipoPerfil: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // --- Tokens e códigos ---
  activationToken: { type: String },
  activationTokenExpires: { type: Date },
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  credentialChangeCode: { type: String },
  credentialChangeExpires: { type: Date },
  credentialChangeEmail: { type: String },
  credentialChangePassword: { type: String },

  // --- Avatar ---
  avatar: { type: String, default: null },

  // --- Presença ---
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: null },

  // --- Assinatura / pagamento ---
  datePayment: { type: Date, default: null },
  dateExpiration: { type: Date, default: null },

}, { timestamps: true });

// --- Remove campos sensíveis no retorno JSON ---
UsuarioSchema.method("toJSON", function () {
  const { __v, _id, senha, activationToken, activationTokenExpires, resetToken, resetTokenExpires, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Usuario = mongoose.model("Usuario", UsuarioSchema);
module.exports = Usuario;
