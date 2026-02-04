import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sun, Moon, Save } from 'lucide-react';
import styles from './Settings.module.css';

export function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        <p className={styles.subtitle}>
          Персонализация и конфигурация системы
        </p>
      </div>

      <div className={styles.sections}>
        <Card title="Внешний вид" subtitle="Настройки отображения интерфейса">
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Тема оформления</span>
              <span className={styles.settingDescription}>
                Выберите светлую или тёмную тему интерфейса
              </span>
            </div>
            <div className={styles.themeToggle}>
              <button
                className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <Sun size={18} />
                <span>Светлая</span>
              </button>
              <button
                className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
                <Moon size={18} />
                <span>Тёмная</span>
              </button>
            </div>
          </div>
        </Card>

        <Card title="Профиль" subtitle="Информация о пользователе">
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Имя</label>
              <input
                type="text"
                className={styles.formInput}
                defaultValue="Иван Петров"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                className={styles.formInput}
                defaultValue="i.petrov@company.ru"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Должность</label>
              <input
                type="text"
                className={styles.formInput}
                defaultValue="Инженер-сметчик"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Отдел</label>
              <input
                type="text"
                className={styles.formInput}
                defaultValue="ПТО"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <Button icon={<Save size={18} />}>
              Сохранить изменения
            </Button>
          </div>
        </Card>

        <Card title="Уведомления" subtitle="Настройки оповещений">
          <div className={styles.checkboxList}>
            <label className={styles.checkboxItem}>
              <input type="checkbox" defaultChecked />
              <span>Уведомлять о новых документах</span>
            </label>
            <label className={styles.checkboxItem}>
              <input type="checkbox" defaultChecked />
              <span>Уведомлять об ответах на вопросы</span>
            </label>
            <label className={styles.checkboxItem}>
              <input type="checkbox" />
              <span>Еженедельная сводка по рискам</span>
            </label>
            <label className={styles.checkboxItem}>
              <input type="checkbox" defaultChecked />
              <span>Оповещения об изменениях в сметах</span>
            </label>
          </div>
        </Card>

        <Card title="О системе" subtitle="Информация о версии">
          <div className={styles.aboutInfo}>
            <div className={styles.aboutRow}>
              <span>Версия:</span>
              <span>1.0.0</span>
            </div>
            <div className={styles.aboutRow}>
              <span>Платформа:</span>
              <span>H2E Engineering Analytics</span>
            </div>
            <div className={styles.aboutRow}>
              <span>Лицензия:</span>
              <span>Корпоративная</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
