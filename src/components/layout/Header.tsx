import { Sun, Moon, Bell, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ProjectSelector } from './ProjectSelector';
import styles from './Header.module.css';

interface HeaderProps {
  onNewProject?: () => void;
}

export function Header({ onNewProject }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>H2E</span>
          <span className={styles.logoText}>Инженерная аналитика</span>
        </div>
        <div className={styles.divider} />
        <ProjectSelector onNewProject={onNewProject} />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className={styles.iconButton} title="Уведомления">
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>

        <button className={styles.userButton}>
          <User size={20} />
          <span>Профиль</span>
        </button>
      </div>
    </header>
  );
}
