import { useEffect, useState } from "react";
import { Table, Button, message, Typography, Spin } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./admin.module.scss";

const { Title } = Typography;

const API_URL = import.meta.env.VITE_SERVER;

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  username: string;
  tipoPerfil: string;
  status: string;
  datePayment?: string;
  dateExpiration?: string;
}

export default function AdminPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para logout
  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao fazer logout");

      localStorage.removeItem("token");
      message.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      message.error("Falha ao fazer logout.");
    }
  };

  const fetchUsuarios = async () => {
    if (!token) {
      message.error("Você precisa estar logado!");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data)) {
        setUsuarios(res.data);
      } else if (Array.isArray(res.data.usuarios)) {
        setUsuarios(res.data.usuarios);
      } else {
        setUsuarios([]);
        message.warning("Formato de dados inesperado do backend.");
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || "Erro ao carregar usuários.");
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleAprovar = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/usuarios/${id}/aprovar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Usuário aprovado!");
      fetchUsuarios();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || "Erro ao aprovar usuário.");
    }
  };

  const handleRejeitar = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/usuarios/${id}/rejeitar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Usuário rejeitado!");
      fetchUsuarios();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || "Erro ao rejeitar usuário.");
    }
  };

  const columns = [
    { title: "Nome", dataIndex: "nome", key: "nome" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Perfil", dataIndex: "tipoPerfil", key: "tipoPerfil" },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Ações",
      key: "acoes",
      render: (_: any, record: Usuario) => (
        <div className={styles.actions}>
          {record.status !== "approved" && (
            <Button type="primary" onClick={() => handleAprovar(record._id)}>
              Aprovar
            </Button>
          )}
          {record.status !== "rejected" && (
            <Button danger onClick={() => handleRejeitar(record._id)}>
              Rejeitar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Administração de Usuários</Title>
        <Button type="primary" danger onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {loading ? (
        <Spin tip="Carregando usuários..." />
      ) : (
        <Table<Usuario>
          dataSource={usuarios}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
}
