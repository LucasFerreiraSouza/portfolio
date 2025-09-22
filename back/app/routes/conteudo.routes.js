const express = require("express");
const router = express.Router();
const conteudoController = require("../controllers/conteudo.controller");
const multer = require("multer");

// Config do multer (salvar em memória ou disco)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CRUD
router.post("/conteudos", upload.single("imagem"), conteudoController.create);
router.get("/conteudos", conteudoController.list); // <- ajustado
router.get("/conteudos/:id", async (req, res) => { // <- criar findOne inline
  try {
    const conteudo = await require("../models/conteudo.model").findById(req.params.id).lean();
    if (!conteudo) return res.status(404).json({ message: "Conteúdo não encontrado." });
    res.json(conteudo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/conteudos/:id", upload.single("imagem"), conteudoController.update);
router.delete("/conteudos/:id", conteudoController.remove); // <- ajustado

module.exports = router;
