const Usuario = require("../models/usuario.model");
const Conteudo = require("../models/conteudo.model");
const bcrypt = require("bcryptjs");
const { generateToken } = require('../utils/auth.middleware');
const Brevo = require('sib-api-v3-sdk');

const cloudinary = require("cloudinary").v2;

// Configuração do Cloudinary (usar variáveis de ambiente)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// --- Configuração Brevo ---
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const transactionalEmailsApi = new Brevo.TransactionalEmailsApi();

// --- Função auxiliar: validar assinatura ---
function isSubscriptionActive(usuario) {
  if (!usuario.datePayment || !usuario.dateExpiration) return false;
  return usuario.dateExpiration > new Date();
}

// --- Função auxiliar: gerar username único ---
const generateUsername = (nome) => {
  const base = nome
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
  return base;
};

// --- Função auxiliar: validar email ---
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- Função auxiliar: gerar código aleatório ---
const generateCode = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

// --- Registro ---
exports.register = async (req, res) => {
  try {
    const { nome, email, senha, tipoPerfil } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ message: "Preencha todos os campos." });

    if (!isValidEmail(email))
      return res.status(400).json({ message: "E-mail inválido." });

    const userExists = await Usuario.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "E-mail já cadastrado." });

    // Gerar username único
    let username = generateUsername(nome);
    let usernameExists = await Usuario.findOne({ username });
    let suffix = 1;
    while (usernameExists) {
      username = `${generateUsername(nome)}_${suffix}`;
      usernameExists = await Usuario.findOne({ username });
      suffix++;
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário com status "pending"
    const usuario = new Usuario({
      nome,
      email,
      senha: hashedPassword,
      tipoPerfil: tipoPerfil || "user",
      status: "pending",
      username,
    });

    await usuario.save();

    // Enviar e-mail com instruções de pagamento
    await transactionalEmailsApi.sendTransacEmail({
      sender: { name: "Sua Plataforma", email: "no-reply@suaempresa.com" },
      to: [{ email: usuario.email, name: usuario.nome }],
      subject: "Cadastro recebido – aguarde aprovação",
      htmlContent: `
        <h3>Olá ${usuario.nome}</h3>
        <p>Recebemos seu cadastro. Para ativar sua conta, faça o pagamento via Pix para o número XXXXXX e envie o comprovante para nosso WhatsApp junto com o e-mail utilizado no cadastro.</p>
        <p>Após a confirmação do pagamento, seu acesso será liberado por 30 dias.</p>
      `
    });

    res.status(201).json({ message: "Cadastro recebido. Verifique seu e-mail para instruções de pagamento." });
  } catch (err) {
    console.error("Erro no register:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Deletar conta com conteúdos e imagens do Cloudinary ---
exports.deleteAccount = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // 1️⃣ Buscar conteúdos do usuário
    const conteudos = await Conteudo.find({ createdBy: usuarioId });

    // 2️⃣ Deletar imagens do Cloudinary
    for (const conteudo of conteudos) {
      if (conteudo.imagem) {
        try {
          // Extrair public_id do Cloudinary a partir da URL
          // Ex: https://res.cloudinary.com/drcuskkcw/image/upload/v1758844566/portfolio/68d5d66de6f1731f76ea62d2_updated.png
          const urlParts = conteudo.imagem.split('/');
          const fileName = urlParts[urlParts.length - 1]; // 68d5d66de6f1731f76ea62d2_updated.png
          const publicId = fileName.split('.')[0]; // 68d5d66de6f1731f76ea62d2_updated
          const folder = urlParts[urlParts.length - 2]; // portfolio
          await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        } catch (err) {
          console.error("Erro ao deletar imagem do Cloudinary:", err);
        }
      }
    }

    // 3️⃣ Deletar conteúdos do Mongo
    await Conteudo.deleteMany({ createdBy: usuarioId });

    // 4️⃣ Deletar usuário
    await Usuario.findByIdAndDelete(usuarioId);

    res.json({ message: "Conta e todos os conteúdos/imagens deletados com sucesso." });
  } catch (err) {
    console.error("Erro no deleteAccount:", err);
    res.status(500).json({ error: "Erro ao deletar conta." });
  }
};

// --- Login ---
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
    if (usuario.status !== "approved") return res.status(403).json({ error: "Conta não aprovada ou pendente." });

    const validPassword = await bcrypt.compare(senha, usuario.senha);
    if (!validPassword) return res.status(401).json({ error: "Senha inválida." });

    usuario.online = true;
    usuario.lastSeen = new Date();
    await usuario.save();

    const token = generateToken(usuario);

    res.json({
      token,
      usuario: usuario.toJSON(),
      assinaturaAtiva: isSubscriptionActive(usuario),
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Logout ---
exports.logout = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    await Usuario.findByIdAndUpdate(usuarioId, { online: false, lastSeen: new Date() });
    res.json({ message: "Logout realizado com sucesso." });
  } catch (err) {
    console.error("Erro no logout:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Obter perfil ---
exports.getProfile = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(usuario.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Atualizar perfil ---
exports.updateProfile = async (req, res) => {
  try {
    const { nome, senha } = req.body;
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    if (nome) usuario.nome = nome;
    if (senha) usuario.senha = await bcrypt.hash(senha, 10);

    await usuario.save();
    res.json({ message: "Perfil atualizado com sucesso.", usuario: usuario.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Solicitar alteração de credenciais ---
exports.requestCredentialChange = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    if (!email && !senha)
      return res.status(400).json({ error: "Informe e-mail ou senha para alterar." });

    const code = generateCode(6);
    usuario.credentialChangeCode = code;
    usuario.credentialChangeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    if (email) usuario.credentialChangeEmail = email;
    if (senha) usuario.credentialChangePassword = await bcrypt.hash(senha, 10);

    await usuario.save();

    // Enviar código por e-mail
    await transactionalEmailsApi.sendTransacEmail({
      sender: { name: "Sua Plataforma", email: "no-reply@suaempresa.com" },
      to: [{ email: usuario.email, name: usuario.nome }],
      subject: "Código de confirmação para alteração de credenciais",
      htmlContent: `<p>Seu código de confirmação é: <b>${code}</b></p><p>Válido por 30 minutos.</p>`
    });

    res.json({ message: "Código de verificação enviado ao seu e-mail." });
  } catch (err) {
    console.error("Erro no requestCredentialChange:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Confirmar alteração de credenciais ---
exports.confirmCredentialChange = async (req, res) => {
  try {
    const { code } = req.body;
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    if (!usuario.credentialChangeCode || usuario.credentialChangeCode !== code)
      return res.status(400).json({ error: "Código inválido." });

    if (usuario.credentialChangeExpires < new Date())
      return res.status(400).json({ error: "Código expirado." });

    if (usuario.credentialChangeEmail) usuario.email = usuario.credentialChangeEmail;
    if (usuario.credentialChangePassword) usuario.senha = usuario.credentialChangePassword;

    // Limpar campos temporários
    usuario.credentialChangeCode = null;
    usuario.credentialChangeExpires = null;
    usuario.credentialChangeEmail = null;
    usuario.credentialChangePassword = null;

    await usuario.save();
    res.json({ message: "Credenciais atualizadas com sucesso.", usuario: usuario.toJSON() });
  } catch (err) {
    console.error("Erro no confirmCredentialChange:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Admin: listar usuários ---
exports.listUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().lean();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};

// --- Admin: aprovar usuário ---
exports.aprovarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    // Atualizar status e datas de assinatura
    usuario.status = "approved";
    usuario.datePayment = new Date();
    usuario.dateExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    await usuario.save();

    // Enviar e-mail de aprovação com link do portfólio
    const portfolioLink = `https://portfolio-front-opal-rho.vercel.app/?user=${usuario.username}`;
    await transactionalEmailsApi.sendTransacEmail({
      sender: { name: "Sua Plataforma", email: "no-reply@suaempresa.com" },
      to: [{ email: usuario.email, name: usuario.nome }],
      subject: "Conta aprovada e pronta para uso",
      htmlContent: `
        <h3>Olá ${usuario.nome},</h3>
        <p>Sua conta foi aprovada com sucesso!</p>
        <p>Você já pode acessar seu portfólio através do link abaixo:</p>
        <p><a href="${portfolioLink}">${portfolioLink}</a></p>
        <p>Seu acesso é válido por 30 dias a partir de hoje.</p>
      `
    });

    res.json({ message: "Usuário aprovado com sucesso e e-mail enviado com o link do portfólio." });
  } catch (err) {
    console.error("Erro na aprovação:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};


// --- Admin: rejeitar usuário ---
exports.rejeitarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    usuario.status = "rejected";
    await usuario.save();

    await transactionalEmailsApi.sendTransacEmail({
      sender: { name: "Sua Plataforma", email: "no-reply@suaempresa.com" },
      to: [{ email: usuario.email, name: usuario.nome }],
      subject: "Conta rejeitada",
      htmlContent: `<p>Infelizmente sua conta não foi aprovada.</p>`
    });

    res.json({ message: "Usuário rejeitado com sucesso." });
  } catch (err) {
    console.error("Erro na rejeição:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Ativar assinatura ---
exports.activateSubscription = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    usuario.datePayment = new Date();
    usuario.dateExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    await usuario.save();

    res.json({ message: "Assinatura ativada!", usuario: usuario.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Middleware: verificar assinatura ---
exports.requireSubscription = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    if (!isSubscriptionActive(usuario)) {
      return res.status(403).json({ error: "Assinatura expirada ou inexistente." });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Middleware: verificar admin ---
exports.requireAdmin = async (req, res, next) => {
  if (req.user.tipoPerfil !== "admin") {
    return res.status(403).json({ error: "Acesso negado: apenas administradores." });
  }
  next();
};

// --- Rota pública: listar conteúdos do usuário pelo username ---
exports.listPublicContents = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ message: "Username obrigatório." });

    const usuario = await Usuario.findOne({ username });
    if (!usuario) return res.status(404).json({ message: "Usuário não encontrado." });

    const conteudos = await Conteudo.find({ createdBy: usuario._id }).lean();
    if (!conteudos.length) return res.status(404).json({ message: "Nenhum conteúdo encontrado." });

    // Agrupar por seção
    const agrupados = conteudos
      .sort((a, b) => a.secao.ordem - b.secao.ordem || a.ordem - b.ordem)
      .reduce((acc, item) => {
        const secaoNome = item.secao.nome;
        if (!acc[secaoNome]) acc[secaoNome] = { ordem: item.secao.ordem, itens: [] };
        acc[secaoNome].itens.push({
          _id: item._id,
          nome: item.nome,
          descricao: item.descricao,
          imagem: item.imagem,
          secao: item.secao.nome,
          ordem: item.ordem
        });
        return acc;
      }, {});

    res.json(Object.values(agrupados));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

