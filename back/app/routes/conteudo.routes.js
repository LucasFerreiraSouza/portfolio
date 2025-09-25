const express = require("express");
const router = express.Router();
const controller = require("../controllers/conteudo.controller");

// ===================
// ROTAS DE CONTEÚDO
// ===================

// Criar conteúdo (upload de imagem obrigatório)
router.post(
  "/conteudos",
  controller.checkToken,
  controller.upload.single("imagem"),
  controller.create
);

// Listar todos os conteúdos do usuário logado
router.get("/conteudos", controller.checkToken, controller.list);

// Listar conteúdos agrupados por seção
router.get("/conteudos/agrupados", controller.checkToken, controller.listBySecao);

// Buscar conteúdo por ID
router.get("/conteudos/:id", controller.checkToken, controller.findOne);

// Atualizar conteúdo (opcionalmente atualizar imagem)
router.put(
  "/conteudos/:id",
  controller.checkToken,
  controller.upload.single("imagem"),
  controller.update
);

// Deletar conteúdo
router.delete("/conteudos/:id", controller.checkToken, controller.remove);

// ===================
// ROTAS DE ORDEM
// ===================

// Atualizar ordem de conteúdos
router.patch("/conteudos/order", controller.checkToken, controller.updateOrder);

// Atualizar ordem de seções
router.patch("/secoes/order", controller.checkToken, controller.updateSectionOrder);

// Atualizar nome ou descrição de uma seção
router.put("/secoes/:nome", controller.checkToken, controller.updateSection);


module.exports = router;
