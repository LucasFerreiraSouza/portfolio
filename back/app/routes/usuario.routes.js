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

// --- Alteração de credenciais (e-mail/senha) ---
router.post("/profile/request-change", authMiddleware.checkToken, usuarios.requestCredentialChange);
router.post("/profile/confirm-change", authMiddleware.checkToken, usuarios.confirmCredentialChange);

// --- Assinatura ---
router.post("/profile/activate-subscription", authMiddleware.checkToken, usuarios.activateSubscription);

// --- Admin ---
router.get("/", authMiddleware.checkToken, authMiddleware.requireAdmin, usuarios.listUsuarios);
router.patch("/:id/aprovar", authMiddleware.checkToken, authMiddleware.requireAdmin, usuarios.aprovarUsuario);
router.patch("/:id/rejeitar", authMiddleware.checkToken, authMiddleware.requireAdmin, usuarios.rejeitarUsuario);

module.exports = router;
