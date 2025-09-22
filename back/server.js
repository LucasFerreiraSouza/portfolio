require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const fetch = require('node-fetch');

const checkToken = require('./app/utils/checkToken');

const app = express();

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

// === Conexão com MongoDB ===
mongoose.set('strictQuery', false);
mongoose.set('bufferCommands', false);
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado ao banco de dados com sucesso!"))
  .catch(err => console.error("Erro ao conectar ao DB:", err.message));

// **Exporta o app para Vercel**
module.exports = app;
