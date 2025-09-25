import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Modal,
  message,
  Form,
  Input,
  Upload,
  Button,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import styles from "./conteudoUsuario.module.scss";

const { Title } = Typography;
const { confirm } = Modal;

const API_URL = import.meta.env.VITE_SERVER;

interface SecaoResumo {
  nome: string;
  ordem: number;
}

interface Conteudo {
  _id: string;
  nome: string;
  descricao: string;
  imagem: string;
  secao: SecaoResumo;
  ordem: number;
}

interface Secao {
  nome: string;
  ordem: number;
  itens: Conteudo[];
}

export default function AuthContentPage() {
  const token = localStorage.getItem("token"); // JWT do login
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [editingConteudo, setEditingConteudo] = useState<Conteudo | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!token) {
      message.error("Você precisa estar logado!");
      navigate("/login");
      return;
    }
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conteudos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar conteúdos");
      const data: Conteudo[] = await res.json();

      const secoesMap: Record<string, Secao> = {};
      data.forEach((item) => {
        const secaoNome = item.secao?.nome || "Sem nome";
        if (!secoesMap[secaoNome]) {
          secoesMap[secaoNome] = {
            nome: secaoNome,
            ordem: item.secao?.ordem || 0,
            itens: [],
          };
        }
        secoesMap[secaoNome].itens.push(item);
      });

      setSecoes(Object.values(secoesMap).sort((a, b) => a.ordem - b.ordem));
    } catch (err) {
      message.error("Erro ao carregar conteúdos");
      console.error(err);
    }
  };

  const openPreview = (img: string) => {
    setPreviewImage(img);
    setPreviewVisible(true);
  };

  const openFormModal = (secaoNome?: string, conteudo?: Conteudo) => {
    setEditingConteudo(conteudo || null);
    setModalFormVisible(true);
    form.resetFields();
    setFileList([]);

    if (conteudo) {
      const { nome, descricao, imagem, secao } = conteudo;
      form.setFieldsValue({
        nome,
        descricao,
        secao: secao?.nome || "",
      });
      setFileList([{ url: imagem, name: "imagem.png" }]);
    } else if (secaoNome) {
      form.setFieldsValue({ nome: "", descricao: "", secao: secaoNome });
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("nome", values.nome);
      formData.append("descricao", values.descricao);
      // Envia apenas o nome da seção
      formData.append("secao", values.secao);

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("imagem", fileList[0].originFileObj);
      }

      const url = editingConteudo
        ? `${API_URL}/api/conteudos/${editingConteudo._id}`
        : `${API_URL}/api/conteudos`;

      const method = editingConteudo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro ao salvar conteúdo");
      }

      message.success(editingConteudo ? "Conteúdo atualizado!" : "Conteúdo criado!");
      setModalFormVisible(false);
      fetchContents();
    } catch (err: any) {
      message.error(err.message || "Erro ao salvar conteúdo.");
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Tem certeza que deseja excluir este conteúdo?",
      okText: "Sim",
      cancelText: "Não",
      onOk: async () => {
        try {
          const res = await fetch(`${API_URL}/api/conteudos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Erro ao deletar conteúdo");
          message.success("Conteúdo removido!");
          fetchContents();
        } catch (err) {
          message.error("Erro ao deletar conteúdo.");
          console.error(err);
        }
      },
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "SECAO") {
      const newSecoes = Array.from(secoes);
      const [moved] = newSecoes.splice(source.index, 1);
      newSecoes.splice(destination.index, 0, moved);
      setSecoes(newSecoes);

      try {
        const secoesParaAtualizar = newSecoes.map((secao, index) => ({
          nome: secao.nome,
          ordem: index,
        }));

        const res = await fetch(`${API_URL}/api/secoes/order`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ secoes: secoesParaAtualizar }),
        });

        if (!res.ok) throw new Error("Falha ao atualizar ordem das seções");
        message.success("Ordem das seções atualizada!");
      } catch (err) {
        console.error(err);
        message.error("Erro ao atualizar ordem das seções no backend.");
      }
      return;
    }

    if (type === "CONTEUDO") {
      if (source.droppableId !== destination.droppableId) return;

      const newSecoes = secoes.map((secao) => {
        if (secao.nome !== source.droppableId) return secao;
        const itens = Array.from(secao.itens);
        const [moved] = itens.splice(source.index, 1);
        itens.splice(destination.index, 0, moved);
        return { ...secao, itens };
      });

      setSecoes(newSecoes);

      try {
        const secaoAtual = newSecoes.find((s) => s.nome === source.droppableId);
        if (!secaoAtual) return;

        const itensParaAtualizar = secaoAtual.itens.map((item, index) => ({
          id: item._id,
          ordem: index,
        }));

        const res = await fetch(`${API_URL}/api/conteudos/order`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ itens: itensParaAtualizar }),
        });

        if (!res.ok) throw new Error("Falha ao atualizar ordem no backend");
        message.success("Ordem de conteúdos atualizada!");
      } catch (err) {
        console.error(err);
        message.error("Erro ao atualizar ordem no backend.");
      }
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
    <div className={`${styles.container} ${styles.background}`}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="secoes-droppable" direction="vertical" type="SECAO">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {secoes.length === 0 && (
                <div className={styles.noSections}>
                  Nenhuma seção encontrada. Clique no botão abaixo para criar uma.
                </div>
              )}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => openFormModal()}
                style={{ marginBottom: 16 }}
              >
                Criar Conteúdo
              </Button>

              {secoes.map((secao, index) => (
                <Draggable key={secao.nome} draggableId={secao.nome} index={index}>
                  {(provided) => (
                    <section
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={styles.section}
                    >
                      <Title level={2}>{secao.nome}</Title>

                      <Droppable droppableId={secao.nome} direction="horizontal" type="CONTEUDO">
                        {(provided) => (
                          <div className={styles.cardsRow} ref={provided.innerRef} {...provided.droppableProps}>
                            {secao.itens.map((conteudo, index) => (
                              <Draggable key={conteudo._id} draggableId={conteudo._id} index={index}>
                                {(provided) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    hoverable
                                    cover={
                                      <img
                                        alt={conteudo.nome}
                                        src={conteudo.imagem || "https://via.placeholder.com/150"}
                                        onClick={() => openPreview(conteudo.imagem || "https://via.placeholder.com/150")}
                                      />
                                    }
                                    actions={[
                                      <EditOutlined onClick={() => openFormModal(undefined, conteudo)} />,
                                      <DeleteOutlined onClick={() => handleDelete(conteudo._id)} />,
                                    ]}
                                  >
                                    <Card.Meta title={conteudo.nome} description={linkify(conteudo.descricao)} />
                                  </Card>
                                )}
                              </Draggable>
                            ))}

                            <Card className={styles.addCard} onClick={() => openFormModal(secao.nome)}>
                              <PlusOutlined />
                              <div>Adicionar Conteúdo</div>
                            </Card>

                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </section>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)} centered>
        <img src={previewImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%" }} />
      </Modal>

      <Modal
        open={modalFormVisible}
        title={editingConteudo ? "Editar Conteúdo" : "Adicionar Conteúdo"}
        onCancel={() => setModalFormVisible(false)}
        onOk={() => form.submit()}
        okText="Salvar"
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item name="nome" label="Nome do Conteúdo" rules={[{ required: true, message: "Digite o nome" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="descricao" label="Descrição do Conteúdo" rules={[{ required: true, message: "Digite a descrição" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="secao" label="Seção" rules={[{ required: true, message: "Digite o nome da seção" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Imagem">
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Selecionar arquivo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Button
        type="primary"
        danger
        onClick={handleLogout}
        style={{ marginBottom: 16, float: "right" }}
      >
        Logout
      </Button>
    </div>
  );
}
