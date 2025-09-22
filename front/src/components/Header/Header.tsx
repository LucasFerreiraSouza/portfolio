import styles from './Header.module.scss'
import { ArrowLeft } from '@phosphor-icons/react'

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode; // ✅ Permite JSX
  onBack?: () => void;
}

function Header({ title, subtitle, onBack }: HeaderProps) {
  return (
    <>
      {onBack && (
        <button
          type='button'
          onClick={onBack}
          className={styles.buttonBack}
        >
          <ArrowLeft /> <span>Voltar</span>
        </button>
      )}
      <header className={styles.header}>
        <h3 className={styles.mainTitle}>{title}</h3>
        <p>{subtitle}</p>
      </header>
    </>
  )
}

export default Header
