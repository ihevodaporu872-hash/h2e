import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Plus, CheckCircle, Clock } from 'lucide-react';
import styles from './Risks.module.css';

const risks = [
  {
    id: 1,
    title: 'Задержка поставки металлоконструкций',
    description: 'Поставщик уведомил о возможной задержке на 2 недели из-за проблем с логистикой',
    impact: 'high',
    probability: 'medium',
    status: 'open',
    owner: 'Петров М.В.',
    created: '15.01.2025',
    mitigation: 'Рассмотреть альтернативных поставщиков, заключить резервный договор'
  },
  {
    id: 2,
    title: 'Расхождение в объёмах земляных работ',
    description: 'Фактические объёмы превышают проектные на 15%, требуется корректировка сметы',
    impact: 'medium',
    probability: 'high',
    status: 'in_progress',
    owner: 'Иванов А.С.',
    created: '12.01.2025',
    mitigation: 'Подготовить акт на дополнительные работы, согласовать с заказчиком'
  },
  {
    id: 3,
    title: 'Недостаточная квалификация субподрядчика',
    description: 'Электромонтажные работы выполняются с отставанием от графика',
    impact: 'medium',
    probability: 'low',
    status: 'closed',
    owner: 'Сидорова Е.П.',
    created: '08.01.2025',
    mitigation: 'Привлечены дополнительные бригады, проведено обучение'
  },
];

const getImpactLabel = (impact: string) => {
  switch (impact) {
    case 'high': return 'Высокое';
    case 'medium': return 'Среднее';
    case 'low': return 'Низкое';
    default: return impact;
  }
};

const getProbabilityLabel = (prob: string) => {
  switch (prob) {
    case 'high': return 'Высокая';
    case 'medium': return 'Средняя';
    case 'low': return 'Низкая';
    default: return prob;
  }
};

export function Risks() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Журнал рисков</h1>
          <p className={styles.subtitle}>
            Управление проектными рисками
          </p>
        </div>
        <Button icon={<Plus size={18} />}>
          Добавить риск
        </Button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <AlertTriangle size={24} className={styles.openIcon} />
          <div>
            <span className={styles.statValue}>1</span>
            <span className={styles.statLabel}>Открытых</span>
          </div>
        </div>
        <div className={styles.stat}>
          <Clock size={24} className={styles.progressIcon} />
          <div>
            <span className={styles.statValue}>1</span>
            <span className={styles.statLabel}>В работе</span>
          </div>
        </div>
        <div className={styles.stat}>
          <CheckCircle size={24} className={styles.closedIcon} />
          <div>
            <span className={styles.statValue}>1</span>
            <span className={styles.statLabel}>Закрытых</span>
          </div>
        </div>
      </div>

      <div className={styles.risksList}>
        {risks.map(risk => (
          <Card key={risk.id} padding="none">
            <div className={styles.riskCard}>
              <div className={styles.riskHeader}>
                <div className={styles.riskTitle}>
                  {risk.status === 'open' && <AlertTriangle size={20} className={styles.openIcon} />}
                  {risk.status === 'in_progress' && <Clock size={20} className={styles.progressIcon} />}
                  {risk.status === 'closed' && <CheckCircle size={20} className={styles.closedIcon} />}
                  <h3>{risk.title}</h3>
                </div>
                <span className={`${styles.statusBadge} ${styles[risk.status.replace('_', '')]}`}>
                  {risk.status === 'open' && 'Открыт'}
                  {risk.status === 'in_progress' && 'В работе'}
                  {risk.status === 'closed' && 'Закрыт'}
                </span>
              </div>

              <p className={styles.description}>{risk.description}</p>

              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Влияние:</span>
                  <span className={`${styles.metricValue} ${styles[risk.impact]}`}>
                    {getImpactLabel(risk.impact)}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Вероятность:</span>
                  <span className={`${styles.metricValue} ${styles[risk.probability]}`}>
                    {getProbabilityLabel(risk.probability)}
                  </span>
                </div>
              </div>

              <div className={styles.mitigation}>
                <span className={styles.mitigationLabel}>Меры по снижению:</span>
                <p>{risk.mitigation}</p>
              </div>

              <div className={styles.riskFooter}>
                <span>Ответственный: {risk.owner}</span>
                <span>Создан: {risk.created}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
