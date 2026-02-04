import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import type { NotificationType } from '../../context/NotificationContext';
import styles from './Toast.module.css';

const icons: Record<NotificationType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return createPortal(
    <div className={styles.container}>
      {notifications.map(notification => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={`${styles.toast} ${styles[notification.type]}`}
          >
            <Icon size={20} className={styles.icon} />
            <div className={styles.content}>
              <span className={styles.title}>{notification.title}</span>
              {notification.message && (
                <p className={styles.message}>{notification.message}</p>
              )}
            </div>
            <button
              className={styles.closeButton}
              onClick={() => removeNotification(notification.id)}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
