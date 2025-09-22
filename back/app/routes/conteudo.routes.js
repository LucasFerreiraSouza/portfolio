const express = require("express");
const router = express.Router();
const conteudoController = require("../controllers/conteudo.controller");

// POST (create)
router.post(
  "/conteudos",
  conteudoController.upload.single("imagem"),
  conteudoController.create
);

// GET (list)
router.get("/conteudos", conteudoController.list);

// GET by ID (findOne)
router.get("/conteudos/:id", conteudoController.findOne);

// PUT (update)
router.put(
  "/conteudos/:id",
  conteudoController.upload.single("imagem"),
  conteudoController.update
);

// DELETE
router.delete("/conteudos/:id", conteudoController.remove);

module.exports = router;
