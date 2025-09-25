import { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal, Card, Typography } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Path } from "../../routes/constants";

const { Title } = Typography;

interface Props {
  onLoginSuccess?: (token: string) => void;
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
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_SERVER;

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);

  // Buscar conteúdos do Lucas Ferreira
  const fetchConteudos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/usuarios/lucas_ferreira/conteudos`);
      setConteudos(res.data);
    } catch (err) {
      console.error(err);
      message.error("Erro ao carregar portfólio do Lucas Ferreira.");
    }
  };

  useEffect(() => {
    fetchConteudos();
  }, []);

  const handleLogin = async (values: any) => {
  setLoading(true);
  try {
    const res = await axios.post(`${API_BASE}/api/usuarios/authenticate`, values);
    message.success("Login realizado com sucesso!");

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.usuario));

    if (onLoginSuccess) onLoginSuccess(res.data.token);

    closeModal();

    // Navega de acordo com o perfil
    if (res.data.usuario.tipoPerfil === "admin") {
      navigate("/admin");
    } else {
      navigate(Path.usuario);
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

  const openPreview = (img: string) => {
    setPreviewImage(img);
    setPreviewVisible(true);
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

      {/* Modal de Login / Registro */}
      <Modal
        title={mode === "login" ? "Login" : "Registrar"}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
      >
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

      {/* Portfólio do Lucas Ferreira */}
      {conteudos.map((secao, index) => {
        const secaoNome = secao.itens.length > 0 ? secao.itens[0].secao : `Seção ${secao.ordem + 1}`;
        return (
          <section key={index} style={{ marginBottom: 32, padding: 16, borderRadius: 8, backgroundColor: "#f5f5f5" }}>
              <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
                {secaoNome}
              </Title>
              
              <div style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 8,
                flexWrap: "wrap",
                justifyContent: "center"
              }}>
                {secao.itens.map((item) => (
                  <Card
                    key={item._id}
                    hoverable
                    style={{ minWidth: 200, flex: "1 0 200px", maxWidth: 300 }}
                    cover={
                      <img
                        alt={item.nome}
                        src={item.imagem}
                        onClick={() => openPreview(item.imagem)}
                        style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: "0.5rem 0.5rem 0 0" }}
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

      {/* Modal de preview de imagem */}
      <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)} centered>
        <img src={previewImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />
      </Modal>
    </div>
  );
};

export default ConteudoVisitante;
