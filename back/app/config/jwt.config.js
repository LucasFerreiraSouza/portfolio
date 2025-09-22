require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.TOKEN_SECRET;
if (!SECRET_KEY) console.warn("⚠️ TOKEN_SECRET não está definido no .env!");

// Gera token JWT a partir de um objeto usuário
function generateToken(user) {
  const payload = { id: user._id.toString(), email: user.email, tipoPerfil: user.tipoPerfil };
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

// Verifica token e retorna o payload decodificado
function verifyToken(authHeader) {
  return new Promise((resolve, reject) => {
    if (!authHeader) return reject(new Error('Authorization header não fornecido'));
    const token = authHeader.split(' ')[1];
    if (!token) return reject(new Error('Token não fornecido'));

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// Middleware para Express
function checkToken(req, res, next) {
  console.log('[JWT] Headers recebidos:', req.headers);
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ msg: 'Acesso negado! Authorization header ausente.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Acesso negado! Token ausente.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('[JWT] Token decodificado:', decoded);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tipoPerfil: decoded.tipoPerfil
    };
    next();
  } catch (err) {
    console.error('[JWT] Token inválido ou expirado:', err.message);
    res.status(401).json({ msg: 'Token inválido ou expirado!' });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  checkToken
};
