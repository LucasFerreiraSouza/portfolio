const Usuario = require("../models/usuario.model");
const Conteudo = require("../models/conteudo.model");
const bcrypt = require("bcryptjs");
const { transporter } = require("../utils/nodeMailer");
const { generateToken } = require('../utils/auth.middleware');

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

exports.register = async (req, res) => {
  try {
    const { nome, email, senha, tipoPerfil } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ message: "Preencha todos os campos." });

    const userExists = await Usuario.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "E-mail já cadastrado." });

    const hashedPassword = await bcrypt.hash(senha, 10);

    // Gerar username único
    let username = generateUsername(nome);
    let usernameExists = await Usuario.findOne({ username });
    let suffix = 1;
    while (usernameExists) {
      username = `${generateUsername(nome)}_${suffix}`;
      usernameExists = await Usuario.findOne({ username });
      suffix++;
    }

    const usuario = new Usuario({
      nome,
      email,
      senha: hashedPassword,
      tipoPerfil: tipoPerfil || "user",
      status: "approved",
      username, // <- aqui é fundamental
    });

    await usuario.save();
    res.status(201).json({ message: "Usuário registrado com sucesso.", usuario: usuario.toJSON() });
  } catch (err) {
    console.error("Erro no register:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Login de usuário ---
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
    if (usuario.status !== "approved") return res.status(403).json({ error: "Conta não aprovada." });

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
    await Usuario.findByIdAndUpdate(usuarioId, {
      online: false,
      lastSeen: new Date(),
    });
    res.json({ message: "Logout realizado com sucesso." });
  } catch (err) {
    console.error("Erro no logout:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Obter dados do perfil ---
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


// Admin: listar todos os usuários
exports.listUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().lean();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
};

// --- Deletar conta ---
exports.deleteAccount = async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.user.id);
    res.json({ message: "Conta excluída com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Admin: Aprovar usuário ---
exports.aprovarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    usuario.status = "approved";
    await usuario.save();

    await transporter.sendMail({
      to: usuario.email,
      subject: "Conta aprovada",
      text: "Sua conta foi aprovada. Faça login e aproveite.",
    });

    res.json({ message: "Usuário aprovado com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor." });
  }
};

// --- Admin: Rejeitar usuário ---
exports.rejeitarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    usuario.status = "rejected";
    await usuario.save();

    await transporter.sendMail({
      to: usuario.email,
      subject: "Conta rejeitada",
      text: "Infelizmente sua conta não foi aprovada.",
    });

    res.json({ message: "Usuário rejeitado com sucesso." });
  } catch (err) {
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
