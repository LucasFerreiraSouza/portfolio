import { Route, Routes, Navigate } from "react-router-dom";
import { Path } from "./constants";

// Componentes
import ConteudoVisitante from "../app/conteudoVisitante/conteudoVisitante"; // visitante
import ConteudoUsuario from "../app/conteudoUsuario/conteudoUsuario"; // usuário logado
import Admin from "../app/admin/admin"; // admin

// --- Helpers ---
const isLoggedIn = () => !!localStorage.getItem("token");

const isAdmin = () => {
  const user = localStorage.getItem("user");
  if (!user) return false;
  try {
    const parsed = JSON.parse(user);
    return parsed.tipoPerfil === "admin";
  } catch {
    return false;
  }
};

// --- Rotas ---
function RootRoutes() {
  return (
    <Routes>
      {/* Página pública para visitantes */}
      <Route path="/" element={<ConteudoVisitante />} />
      <Route path="/portfolio/:username" element={<ConteudoVisitante />} />

      {/* Página de usuário logado */}
      <Route
        path={Path.usuario} // crie Path.usuario = "/usuario"
        element={isLoggedIn() ? <ConteudoUsuario /> : <Navigate to="/" />}
      />

      {/* Página de admin */}
      <Route
        path="/admin"
        element={isAdmin() ? <Admin /> : <Navigate to="/" />}
      />

      {/* Redirecionar qualquer rota desconhecida para visitante */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default RootRoutes;
