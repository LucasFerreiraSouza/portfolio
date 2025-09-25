import { useEffect, useState } from "react";
import { Table, Button, Modal, message, Form, Input, Select } from "antd";
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { confirm } = Modal;
const { Option } = Select;

const API_URL = import.meta.env.VITE_SERVER;

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  tipoPerfil: string;
  status: string;
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      message.error("Você precisa estar logado!");
      navigate("/login");
      return;
    }
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      const data: Usuario[] = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      message.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const openFormModal = (usuario?: Usuario) => {
    setEditingUsuario(usuario || null);
    setModalVisible(true);
    form.resetFields();
    if (usuario) {
      form.setFieldsValue({ nome: usuario.nome, email: usuario.email, tipoPerfil: usuario.tipoPerfil });
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const url = editingUsuario
        ? `${API_URL}/api/admin/usuarios/${editingUsuario._id}`
        : `${API_URL}/api/admin/usuarios`;
      const method = editingUsuario ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Erro ao salvar usuário");
      message.success(editingUsuario ? "Usuário atualizado!" : "Usuário criado!");
      setModalVisible(false);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      message.error("Erro ao salvar usuário");
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Deseja realmente deletar este usuário?",
      okText: "Sim",
      cancelText: "Não",
      onOk: async () => {
        try {
          const res = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Erro ao deletar usuário");
          message.success("Usuário deletado!");
          fetchUsuarios();
        } catch (err) {
          console.error(err);
          message.error("Erro ao deletar usuário");
        }
      },
    });
  };

  const handleStatusChange = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/usuarios/${id}/${approve ? "aprovar" : "rejeitar"}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao alterar status do usuário");
      message.success(`Usuário ${approve ? "aprovado" : "rejeitado"}!`);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      message.error("Erro ao alterar status do usuário");
    }
  };

  const columns = [
    { title: "Nome", dataIndex: "nome" },
    { title: "E-mail", dataIndex: "email" },
    { title: "Perfil", dataIndex: "tipoPerfil" },
    { title: "Status", dataIndex: "status" },
    {
      title: "Ações",
      render: (_: any, record: Usuario) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => openFormModal(record)} style={{ marginRight: 8 }} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record._id)} style={{ marginRight: 8 }} />
          {record.status !== "approved" && (
            <Button icon={<CheckOutlined />} onClick={() => handleStatusChange(record._id, true)} type="primary" style={{ marginRight: 8 }} />
          )}
          {record.status !== "rejected" && (
            <Button icon={<CloseOutlined />} onClick={() => handleStatusChange(record._id, false)} danger />
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => openFormModal()}>
        Adicionar Usuário
      </Button>

      <Table dataSource={usuarios} columns={columns} rowKey="_id" loading={loading} />

      <Modal
        title={editingUsuario ? "Editar Usuário" : "Adicionar Usuário"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Salvar"
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: "Digite o nome" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="E-mail" rules={[{ required: true, message: "Digite o e-mail" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tipoPerfil" label="Perfil" rules={[{ required: true }]}>
            <Select>
              <Option value="user">Usuário</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
