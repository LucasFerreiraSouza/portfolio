const express = require("express");
const router = express.Router();
const controller = require("../controllers/conteudo.controller");

// Upload middleware
const upload = controller.upload;

// Atualizar ordem dos conteúdos dentro da mesma seção
router.put("/conteudos/order", controller.updateOrder);

// Atualizar ordem das seções
router.put("/secoes/order", controller.updateSectionOrder);

// Atualizar nome ou descrição de uma seção
router.put("/secoes/:nome", controller.updateSection);

// CRUD de conteúdos
router.post("/conteudos", upload.single("imagem"), controller.create);
router.get("/conteudos", controller.list);
router.get("/conteudos/agrupados", controller.listBySecao);
router.get("/conteudos/:id", controller.findOne);
router.put("/conteudos/:id", upload.single("imagem"), controller.update);
router.delete("/conteudos/:id", controller.remove);

module.exports = router;
