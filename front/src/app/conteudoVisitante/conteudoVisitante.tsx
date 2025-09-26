import { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal, Card, Typography } from "antd";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Path } from "../../routes/constants";

const { Title } = Typography;

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  tipoPerfil: string;
}

interface Props {
  onLoginSuccess?: (token: string, usuario: Usuario) => void;
}

interface Conteudo {
  _id: string;
  nome: string;
  descricao: string;
  imagem: string;
  secao: string;
  ordem: number;
}

interface Secao {
  ordem: number;
  itens: Conteudo[];
}

const ConteudoVisitante: React.FC<Props> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [conteudos, setConteudos] = useState<Secao[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_SERVER;

  // Aplica token salvo no axios
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (userStr && onLoginSuccess) {
        const usuario: Usuario = JSON.parse(userStr);
        onLoginSuccess(token, usuario);
      }
    }
  }, []);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  const getUsernameFromUrl = (): string => {
    const searchParams = new URLSearchParams(location.search);
    let usuario = searchParams.get("user");
    if (!usuario && location.search.startsWith("?")) {
      usuario = location.search.replace("?", "");
    }
    return usuario || "lucas_ferreira";
  };

  const fetchConteudos = async () => {
    const usuario = getUsernameFromUrl();
    try {
      const res = await axios.get(`${API_BASE}/api/usuarios/${usuario}/conteudos`);
      setConteudos(res.data);
    } catch (err) {
      console.error(err);
      message.error(`Erro ao carregar portfólio de ${usuario}.`);
    }
  };

  useEffect(() => {
    fetchConteudos();
  }, [location.search]);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/usuarios/authenticate`, values);
      message.success("Login realizado com sucesso!");

      const { token, usuario } = res.data as { token: string; usuario: Usuario };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(usuario));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (onLoginSuccess) onLoginSuccess(token, usuario);

      closeModal();

      // Navegação imediata sem setTimeout
      if (usuario.tipoPerfil === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(Path.usuario, { replace: true });
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/usuarios/register`, values);
      message.success("Registro realizado com sucesso! Faça login.");
      setMode("login");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Erro ao registrar usuário.");
    } finally {
      setLoading(false);
    }
  };



  const linkify = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Button type="primary" onClick={openModal} style={{ marginBottom: 24 }}>
        Login / Registro
      </Button>

      <Modal title={mode === "login" ? "Login" : "Registrar"} open={isModalVisible} onCancel={closeModal} footer={null}>
        {mode === "login" ? (
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item label="E-mail" name="email" rules={[{ required: true, message: "Informe seu e-mail" }]}>
              <Input type="email" />
            </Form.Item>

            <Form.Item label="Senha" name="senha" rules={[{ required: true, message: "Informe sua senha" }]}>
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Entrar
              </Button>
              <Button type="link" onClick={() => setMode("register")}>
                Registrar-se
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleRegister}>
            <Form.Item label="Nome" name="nome" rules={[{ required: true, message: "Informe seu nome" }]}>
              <Input />
            </Form.Item>

            <Form.Item label="E-mail" name="email" rules={[{ required: true, message: "Informe seu e-mail" }]}>
              <Input type="email" />
            </Form.Item>

            <Form.Item label="Senha" name="senha" rules={[{ required: true, message: "Informe sua senha" }]}>
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Registrar
              </Button>
              <Button type="link" onClick={() => setMode("login")}>
                Já tenho conta
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {conteudos.map((secao, index) => {
        const secaoNome = secao.itens.length > 0 ? secao.itens[0].secao : `Seção ${secao.ordem + 1}`;
        return (
          <section key={index} style={{ marginBottom: 32, padding: 16, borderRadius: 8, backgroundColor: "#f5f5f5" }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
              {secaoNome}
            </Title>

            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {secao.itens.map((item) => (
                <Card
                  key={item._id}
                  hoverable
                  className="customCard"
                  cover={
                    <img
                      alt={item.nome}
                      src={item.imagem}
                      className="customCardImg"
                    />
                  }
                >
                  <Card.Meta title={item.nome} description={linkify(item.descricao)} />
                </Card>

              ))}
            </div>
          </section>
        );
      })}

    </div>
  );
};

export default ConteudoVisitante;
