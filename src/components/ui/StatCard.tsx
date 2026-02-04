import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'blue'
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.iconWrapper}>
          {icon}
        </div>
      </div>

      <div className={styles.value}>{value}</div>

      {trend && (
        <div className={`${styles.trend} ${isPositive ? styles.positive : styles.negative}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  );
}
