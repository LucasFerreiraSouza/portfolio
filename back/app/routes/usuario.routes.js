const express = require("express");
const router = express.Router();
const usuarios = require("../controllers/usuario.controller");
const { authMiddleware } = require("../utils/auth.middleware");

// --- Rotas públicas ---
router.post("/register", usuarios.register);
router.post("/authenticate", usuarios.login);

// Rota pública para listar conteúdos pelo username
router.get("/:username/conteudos", usuarios.listPublicContents);

// --- Login / Logout ---
router.post("/logout", authMiddleware.checkToken, usuarios.logout);

// --- Perfil ---
router.get("/profile", authMiddleware.checkToken, usuarios.getProfile);
router.put("/profile", authMiddleware.checkToken, usuarios.updateProfile);
router.delete("/profile", authMiddleware.checkToken, usuarios.deleteAccount);

// --- Admin ---
router.patch("/:id/aprovar", authMiddleware.checkToken, authMiddleware.requireAdmin, usuarios.aprovarUsuario);
router.patch("/:id/rejeitar", authMiddleware.checkToken, authMiddleware.requireAdmin, usuarios.rejeitarUsuario);

module.exports = router;
