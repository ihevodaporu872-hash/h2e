import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  headerAction?: ReactNode;
}

export function Card({
  children,
  title,
  subtitle,
  className = '',
  padding = 'medium',
  headerAction
}: CardProps) {
  const classNames = [
    styles.card,
    styles[padding],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {(title || subtitle || headerAction) && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
