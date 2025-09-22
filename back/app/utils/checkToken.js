const jwt = require('jsonwebtoken');

const SECRET = process.env.TOKEN_SECRET || "P0rtf0l10";

module.exports = function checkToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Token ausente');
    return res.status(401).json({ msg: 'Acesso negado!' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;  // payload completo

    setActor(req.user); // salva o ator no contexto da request
    next();
  } catch (err) {
    console.error('Erro ao verificar token:', err.message);
    res.status(401).json({ msg: 'Token inválido!' });
  }
};
