require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require('node-fetch');

// Importa a função correta de conexão
const connectDB = require("./app/config/db.config");

// Rotas
const usuarioRoutes = require("./app/routes/usuario.routes");
const conteudoRoutes = require("./app/routes/conteudo.routes");

const app = express();
const PORT = process.env.PORT || 8080;

// === Conecta ao MongoDB ===
console.log("Iniciando conexão com MongoDB...");
connectDB()
  .then(() => console.log("MongoDB conectado com sucesso!"))
  .catch(err => {
    console.error("Erro ao conectar ao MongoDB:", err);
    process.exit(1);
  });

// === MIDDLEWARES ===
console.log("Configurando middlewares...");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === CORS ===
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const corsOptions = {
  origin: (origin, callback) => {
    console.log("Verificando origem:", origin);
    if (allowedOrigins.includes(origin) || !origin) {
      console.log("Origem permitida:", origin);
      callback(null, true);
    } else {
      console.warn("Origem bloqueada:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
console.log("CORS configurado");

// === Rotas públicas ===
app.get("/", (req, res) => {
  console.log("Requisição GET na rota /");
  res.json({ message: "Welcome to portfolio application." });
});

// === Proxy para imagens do Cloudinary ===
app.get('/proxy-image', async (req, res) => {
  console.log("Requisição GET /proxy-image com query:", req.query);
  const { url } = req.query;
  if (!url) {
    console.warn("Parâmetro 'url' não fornecido");
    return res.status(400).send('Parâmetro "url" é obrigatório');
  }
  try {
    console.log("Buscando imagem em:", url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao buscar imagem no Cloudinary');
    const buffer = await response.arrayBuffer();
    const ext = url.split('.').pop().toLowerCase();
    let mime = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
    else if (ext === 'gif') mime = 'image/gif';
    console.log("Enviando imagem com MIME:", mime);
    res.setHeader('Content-Type', mime);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Erro no proxy de imagem:", err);
    res.status(500).send('Erro ao buscar imagem');
  }
});

// === Rotas da aplicação ===
console.log("Registrando rotas da aplicação...");
app.use("/api/usuarios", (req, res, next) => {
  console.log("Rota /api/usuarios chamada:", req.method, req.url);
  next();
}, usuarioRoutes);

app.use("/api", (req, res, next) => {
  console.log("Rota /api chamada:", req.method, req.url);
  next();
}, conteudoRoutes);

// === Inicia servidor local (não necessário no Vercel) ===
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

console.log("Server.js carregado");
module.exports = app;
