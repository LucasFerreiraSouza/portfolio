require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// === MIDDLEWARES ===
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// === CORS ===
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// === Rotas públicas ===
app.get("/", (req, res) => {
  res.json({ message: "Welcome to portfolio application." });
});

// Proxy para imagens do Cloudinary
app.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Parâmetro "url" é obrigatório');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao buscar imagem no Cloudinary');
    const buffer = await response.arrayBuffer();
    const ext = url.split('.').pop().toLowerCase();
    let mime = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
    else if (ext === 'gif') mime = 'image/gif';
    res.setHeader('Content-Type', mime);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar imagem');
  }
});

// === Rotas da aplicação ===
const conteudoRoutes = require("./app/routes/conteudo.routes");
app.use("/api", conteudoRoutes);

// === Inicia servidor local (não necessário no Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
