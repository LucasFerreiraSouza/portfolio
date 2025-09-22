import { Button, Input} from 'antd';
import { useState, useEffect } from 'react';

import styles from './TableFilters.module.scss';

interface ITableFiltersProps {
  onSearch: (filters: Record<string, string | undefined>) => void;
  onClickAdd: () => void;
  showDescricao?: boolean;
  descricaoPlaceholder?: string;
  showDisciplina?: boolean;
  showCriador?: boolean;
  showEmail?: boolean; // <- novo
  emailPlaceholder?: string; // <- novo
  disciplinasOptions?: { label: string; value: string }[];
  initialUsuarioCriador?: string;
}

const TableFilters: React.FC<ITableFiltersProps> = ({
  onSearch,
  onClickAdd,
  showDescricao = true,
  descricaoPlaceholder = 'Filtrar',
  showCriador = false,
  showEmail = false, // <- padrão
  emailPlaceholder = 'Filtrar por e-mail', // <- padrão
  initialUsuarioCriador = '',
}) => {
  const [descricao, setDescricao] = useState<string>('');
  const [usuarioCriador, setUsuarioCriador] = useState<string>(initialUsuarioCriador);
  const [tipoPerfil, setTipoPerfil] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // <- novo estado

  useEffect(() => {
    const perfil = localStorage.getItem('tipoPerfil') || '';
    setTipoPerfil(perfil);
  }, []);

  const handleSearch = () => {
    const filters: Record<string, string | undefined> = {};
    if (showDescricao) filters.descricao = descricao;
    if (showEmail) filters.email = email; // <- novo filtro
    if (tipoPerfil === 'admin' && showCriador) {
      filters.usuarioCriador = usuarioCriador;
    }
    onSearch(filters);
  };


  return (
    <section className={styles.container}>
      <div className={styles.fieldsGroup}>
        {showDescricao && (
          <Input
            placeholder={descricaoPlaceholder}
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            onPressEnter={handleSearch}
            className={styles.inputSearch}
            allowClear
          />
        )}

        {showEmail && (
          <Input
            placeholder={emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            onPressEnter={handleSearch}
            className={styles.inputSearch}
            allowClear
          />
        )}

        {tipoPerfil === 'admin' && showCriador && (
          <Input
            placeholder="Filtrar por criador"
            value={usuarioCriador}
            onChange={e => setUsuarioCriador(e.target.value)}
            onPressEnter={handleSearch}
            className={styles.inputSearch}
            allowClear
          />
        )}

      </div>

      <div className={styles.buttonGroup}>
        <Button type="primary" onClick={handleSearch}>
          Filtrar
        </Button>
        <Button type="primary" className={styles.buttonAddMore} onClick={onClickAdd}>
          Adicionar
        </Button>
      </div>
    </section>
  );
};


export default TableFilters;
