const express = require("express");
const router = express.Router();
const conteudoController = require("../controllers/conteudo.controller");

// CRUD
router.post("/conteudos", conteudoController.upload.single("imagem"), conteudoController.create);
router.get("/conteudos", conteudoController.list);
router.get("/conteudos/:id", conteudoController.findOne);
router.put("/conteudos/:id", conteudoController.upload.single("imagem"), conteudoController.update);
router.delete("/conteudos/:id", conteudoController.remove);

module.exports = router;
