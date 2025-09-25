import { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Path } from "./constants";

import ConteudoVisitante from "../app/conteudoVisitante/conteudoVisitante";
import ConteudoUsuario from "../app/conteudoUsuario/conteudoUsuario";
import AdminPage from "../app/admin/admin";

function RootRoutes() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [,setToken] = useState(() => localStorage.getItem("token"));

  const isLoggedIn = !!user;
  const isAdmin = user?.tipoPerfil === "admin";

  // Memoriza a função para evitar re-render desnecessário
  const handleLoginSuccess = useCallback((token: string, usuario: any) => {
    setToken(token);
    setUser(usuario);
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<ConteudoVisitante onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="/portfolio/:username"
        element={<ConteudoVisitante onLoginSuccess={handleLoginSuccess} />}
      />

      <Route
        path={Path.usuario}
        element={isLoggedIn ? <ConteudoUsuario /> : <Navigate to="/" />}
      />
      <Route
        path="/admin"
        element={isAdmin ? <AdminPage /> : <Navigate to="/" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default RootRoutes;
