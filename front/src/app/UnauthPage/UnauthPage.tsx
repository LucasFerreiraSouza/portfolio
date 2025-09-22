import { useEffect, useState } from "react";
import { Button, Col, Row, Typography, Card, Spin, Modal } from "antd";
import styles from "./UnauthPage.module.scss";

const { Title, Paragraph } = Typography;

interface Conteudo {
  _id: string;
  nome: string;
  descricao: string;
  imagem: string;
}

function UnauthPage() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/conteudos")
      .then(res => res.json())
      .then(data => {
        setConteudos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar conteúdos:", err);
        setLoading(false);
      });
  }, []);

  const habilidades = [
    { nome: "C#", img: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/csharp.svg" },
    { nome: "HTML", img: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/html5.svg" },
    { nome: "CSS", img: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/css3.svg" },
    { nome: "JavaScript", img: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/javascript.svg" },
    { nome: "SQL", img: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mysql.svg" },
  ];

  const iconSize = 70;

  const openModal = (img: string) => {
    setModalImage(img);
    setModalVisible(true);
  };

  const renderCards = (filterNames: string[] | ((c: Conteudo) => boolean)) =>
    loading ? (
      <Spin tip="Carregando..." />
    ) : (
      <div className={styles.cardsRow}>
        {conteudos
          .filter(c =>
            typeof filterNames === "function"
              ? filterNames(c)
              : filterNames.includes(c.nome.toLowerCase())
          )
          .map(conteudo => (
            <div className={styles.cardWrapper} key={conteudo._id}>
              <div className={styles.cardImage} onClick={() => openModal(conteudo.imagem)}>
                <img src={conteudo.imagem} alt={conteudo.nome} />
              </div>
              <Card bordered={false} bodyStyle={{ padding: "1rem" }}>
                <Card.Meta title={conteudo.nome} description={conteudo.descricao} />
              </Card>
            </div>
          ))}
      </div>
    );

  return (
    <div className={styles.container}>
      {/* HERO */}
      <section className={styles.hero}>
        <Title level={1}>Olá, eu sou Lucas Ferreira 👋</Title>
        <Paragraph>
          Desenvolvedor focado em <strong>React, Node.js e QA</strong>. Apaixonado por tecnologia, games e resolver problemas com código.
        </Paragraph>
        <Paragraph>
          Nasci em Itapetininga, estudei Edificações e hoje curso <strong>Análise e Desenvolvimento de Sistemas na FATEC</strong>. Já atuei na equipe de suporte de TI do grupo Abrão Reze e atualmente desenvolvo meu TCC: um jogo educativo para pessoas com TDAH.
        </Paragraph>
        <Button type="primary" size="large" href="#projetos">Ver meus projetos</Button>
      </section>

      {/* HABILIDADES */}
      <section id="habilidades" className={styles.skills}>
        <Title level={2}>Habilidades</Title>
        <Row gutter={[16, 16]}>
          {habilidades.map(skill => (
            <Col key={skill.nome}>
              <img src={skill.img} alt={skill.nome} width={iconSize} height={iconSize} />
            </Col>
          ))}
        </Row>
      </section>

      {/* PROJETOS */}
      <section id="projetos" className={styles.projects}>
        <Title level={2}>Projetos</Title>
        {renderCards(["fatec", "ifsp","cubo magico"])}
      </section>

      {/* CURSOS E CERTIFICADOS */}
      <section id="cursos" className={styles.courses}>
        <Title level={2}>Cursos e Certificados</Title>
        {renderCards(c => c.nome.toLowerCase().includes("certificado") || c.nome.toLowerCase().includes("curso"))}
      </section>

      {/* MAIS SOBRE MIM */}
      <section id="extras" className={styles.extras}>
        <Title level={2}>Mais sobre mim</Title>
        {renderCards(["desenho", "abrao reze", "lucas ferreira", "guitarra"])}
      </section>

      {/* CONTATO */}
      <section id="contato" className={styles.contact}>
        <Title level={2}>Contato</Title>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <a href="https://github.com/LucasFerreiraSouza" target="_blank" rel="noreferrer">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" alt="GitHub" width={30} />
            </a>
          </Col>
          <Col>
            <a href="https://www.linkedin.com/in/lucas-ferreira-de-souza-758195215/" target="_blank" rel="noreferrer">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" alt="LinkedIn" width={30} />
            </a>
          </Col>
          <Col>
            <a href="mailto:lucasferreirasouza22@gmail.com">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg" alt="Email" width={30} />
            </a>
          </Col>
          <Col>
            <a href="https://wa.me/5515997651019" target="_blank" rel="noreferrer">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg" alt="WhatsApp" width={30} />
            </a>
          </Col>
          <Col>
            <a href="https://www.instagram.com/lucaox/" target="_blank" rel="noreferrer">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" width={30} />
            </a>
          </Col>
        </Row>
      </section>

      {/* MODAL DE PREVIEW */}
      <Modal
        visible={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        centered
        width="100%"
        bodyStyle={{ padding: 0, backgroundColor: "#ffffffff", height: "100vh" }}
        style={{ top: 0 }}
        maskStyle={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
      >
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <img
            src={modalImage}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain"
            }}
          />
        </div>
      </Modal>
    </div>
  );
}

export default UnauthPage;
