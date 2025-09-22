import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import UsuariosRepository from '../repositories/UsuariosRepository';
import { ITeacher } from '../app/Teacher/TeacherInterfaces';
import { IStudent } from '../app/Student/StudentInterfaces';

type Perfil = 'teacher' | 'student';

export function useGlobalAutoApprove<T extends ITeacher | IStudent>(perfil: Perfil) {
  const storageKey = `autoApprove_${perfil}`;

  const [globalAutoApprove, setGlobalAutoApprove] = useState<boolean>(() => {
    const stored = sessionStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : false;
  });

  const [loading, setLoading] = useState(false);

  // Busca estado inicial
  const getGlobalAutoApprove = useCallback(async () => {
  try {
    setLoading(true);
    let backendAuto = false;

    if (perfil === 'teacher') {
      const res = await UsuariosRepository.getGlobalAutoApproveTeacher();
      backendAuto = res.teacher ?? false;
    } else {
      const res = await UsuariosRepository.getGlobalAutoApproveStudent();
      backendAuto = res.student ?? false;
    }

    setGlobalAutoApprove(backendAuto); // usa sempre o valor do backend
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
  }, [perfil]);

  // Alterna estado global
  const toggleGlobal = useCallback(
    async (checked: boolean, setData?: (updater: (prev: T[]) => T[]) => void) => {
      try {
        setLoading(true);
        let res: any;

        // Atualiza backend apenas uma vez
        if (perfil === 'teacher') {
          res = await UsuariosRepository.setGlobalAutoApproveTeacher(checked);
        } else {
          res = await UsuariosRepository.setGlobalAutoApproveStudent(checked);
        }

        // Atualiza visual e sessionStorage
        setGlobalAutoApprove(checked);
        sessionStorage.setItem(storageKey, String(checked));

        // Atualiza status apenas dos usuários realmente aprovados pelo backend
        if (checked && setData && res.updatedUsers?.length) {
          setData(prev =>
            prev.map(item => {
              const updated = res.updatedUsers.find((u: T) => u.id === item.id);
              return updated ? { ...item, status: 'approved' } : item;
            })
          );
        }

        // Mensagens de sucesso
        message.success(
          checked
            ? 'Aprovação automática ativada com sucesso!'
            : 'Aprovação automática desativada com sucesso!'
        );

      } catch (err: any) {
        console.error('[useGlobalAutoApprove] Erro ao alterar estado global:', err);
        message.error('Erro ao alterar estado da aprovação automática.');
      } finally {
        setLoading(false);
      }
    },
    [perfil, storageKey]
  );

  useEffect(() => {
    getGlobalAutoApprove();
  }, [getGlobalAutoApprove]);

  return {
    globalAutoApprove,
    loadingGlobalAuto: loading,
    getGlobalAutoApprove,
    toggleGlobal,
  };
}
