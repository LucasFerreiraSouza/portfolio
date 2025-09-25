const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');
const multer = require('multer');
require('dotenv').config();

// --- Config JWT ---
const SECRET_KEY = process.env.TOKEN_SECRET || "P0rtf0l10";

// --- Funções JWT ---
function generateToken(user) {
  const payload = { id: user._id, email: user.email, tipoPerfil: user.tipoPerfil };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

function verifyTokenHeader(authHeader) {
  if (!authHeader) throw new Error("Token não enviado.");
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error("Token não enviado.");
  return jwt.verify(token, SECRET_KEY);
}

// --- Middlewares ---
const authMiddleware = {
  checkToken: async (req, res, next) => {
    try {
      const decoded = verifyTokenHeader(req.headers.authorization);
      req.user = decoded;

      // Atualiza presença
      await Usuario.findByIdAndUpdate(decoded.id, {
        online: true,
        lastSeen: new Date()
      });

      next();
    } catch (err) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }
  },

  requireAdmin: async (req, res, next) => {
    if (req.user.tipoPerfil !== 'admin') {
      return res.status(403).json({ message: "Acesso negado: apenas admins." });
    }
    next();
  }
};

// --- Multer para uploads ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Exporta ---
module.exports = { authMiddleware, generateToken, verifyTokenHeader, upload };
