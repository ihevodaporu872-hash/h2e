import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileSpreadsheet, Plus, Download, Filter } from 'lucide-react';
import styles from './Estimates.module.css';

const mockEstimates = [
  {
    id: 1,
    name: 'Смета на общестроительные работы',
    project: 'ЖК "Новый Горизонт"',
    total: '15,450,000 ₽',
    status: 'approved',
    date: '15.01.2025',
    author: 'Иванов А.С.'
  },
  {
    id: 2,
    name: 'Локальная смета №5 - Электромонтаж',
    project: 'ЖК "Новый Горизонт"',
    total: '3,280,000 ₽',
    status: 'review',
    date: '18.01.2025',
    author: 'Петров М.В.'
  },
  {
    id: 3,
    name: 'Смета на благоустройство территории',
    project: 'Бизнес-центр "Омега"',
    total: '8,920,000 ₽',
    status: 'draft',
    date: '20.01.2025',
    author: 'Сидорова Е.П.'
  },
];

export function Estimates() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Сметы</h1>
          <p className={styles.subtitle}>
            Управление сметной документацией
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={<Filter size={18} />}>
            Фильтры
          </Button>
          <Button icon={<Plus size={18} />}>
            Создать смету
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {mockEstimates.map(estimate => (
          <Card key={estimate.id} padding="none">
            <div className={styles.estimateCard}>
              <div className={styles.estimateHeader}>
                <FileSpreadsheet size={24} className={styles.icon} />
                <span className={`${styles.status} ${styles[estimate.status]}`}>
                  {estimate.status === 'approved' && 'Утверждена'}
                  {estimate.status === 'review' && 'На проверке'}
                  {estimate.status === 'draft' && 'Черновик'}
                </span>
              </div>

              <h3 className={styles.estimateName}>{estimate.name}</h3>
              <p className={styles.project}>{estimate.project}</p>

              <div className={styles.total}>
                <span className={styles.totalLabel}>Итого:</span>
                <span className={styles.totalValue}>{estimate.total}</span>
              </div>

              <div className={styles.meta}>
                <span>{estimate.date}</span>
                <span>{estimate.author}</span>
              </div>

              <div className={styles.cardActions}>
                <Button variant="ghost" size="small">
                  Открыть
                </Button>
                <Button variant="ghost" size="small" icon={<Download size={16} />}>
                  Скачать
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
