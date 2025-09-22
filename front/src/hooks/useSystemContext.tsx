import React, { useEffect, useState } from 'react'
import { IDisciplina } from '../utils/useDisciplina'

interface ISystemContext {
  disciplinas: IDisciplina[]
  setDisciplinas: React.Dispatch<React.SetStateAction<IDisciplina[]>>
  disciplinaOptions: { label: string, value: string }[]
}

const systemContext = React.createContext({} as unknown as ISystemContext)

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [disciplinas, setDisciplinas] = useState<IDisciplina[]>([])
  const [disciplinaOptions, setDisciplinaOptions] = useState<{ label: string, value: string }[]>([])

  useEffect(() => {
    if (disciplinas) {
      const mappedOptions = disciplinas.map(item => ({ label: `${item.sigla} - ${item.nomeCompleto}`, value: item.sigla }))
      setDisciplinaOptions(mappedOptions)
    }
  }, [disciplinas])

  const contextValues = {
    disciplinas,
    setDisciplinas,
    disciplinaOptions
  }

  return (
    <systemContext.Provider value={contextValues}>
      {children}
    </systemContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSystem = () => {
  const context = React.useContext(systemContext)

  if (context === undefined) throw new Error('useSystem must be used within System Provider')

  return context
}