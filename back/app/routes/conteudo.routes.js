const express = require("express");
const router = express.Router();
const controller = require("../controllers/conteudo.controller");

// Upload middleware
const upload = controller.upload;

// CRUD
router.post("/conteudos", upload.single("imagem"), controller.create);
router.get("/conteudos", controller.list);
router.get("/conteudos/:id", controller.findOne);
router.put("/conteudos/:id", upload.single("imagem"), controller.update);
router.delete("/conteudos/:id", controller.remove);

module.exports = router;
