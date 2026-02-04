import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Plus } from 'lucide-react';
import styles from './BOQ.module.css';

const volumeData = [
  { name: 'Бетон', plan: 450, fact: 420, unit: 'м³' },
  { name: 'Арматура', plan: 85, fact: 82, unit: 'т' },
  { name: 'Кирпич', plan: 25000, fact: 24500, unit: 'шт' },
  { name: 'Металлоконструкции', plan: 120, fact: 115, unit: 'т' },
  { name: 'Кабель', plan: 3500, fact: 3200, unit: 'м' },
];

const categoryData = [
  { name: 'СМР', value: 45, color: '#3b82f6' },
  { name: 'Материалы', value: 30, color: '#10b981' },
  { name: 'Оборудование', value: 15, color: '#f59e0b' },
  { name: 'Прочее', value: 10, color: '#6366f1' },
];

export function BOQ() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>BOQ / Анализ объёмов</h1>
          <p className={styles.subtitle}>
            Ведомость объёмов работ и материалов
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" icon={<Filter size={18} />}>
            Фильтры
          </Button>
          <Button variant="outline" icon={<Download size={18} />}>
            Экспорт
          </Button>
          <Button icon={<Plus size={18} />}>
            Добавить позицию
          </Button>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <Card title="План vs Факт" subtitle="Сравнение объёмов по основным позициям">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="plan" name="План" fill="var(--accent-primary)" radius={4} />
                <Bar dataKey="fact" name="Факт" fill="var(--accent-success)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Структура затрат" subtitle="Распределение по категориям">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legend}>
            {categoryData.map((item, i) => (
              <div key={i} className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className={styles.legendValue}>{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Детализация объёмов" subtitle="Подробная информация по позициям">
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Наименование</span>
            <span>Ед. изм.</span>
            <span>План</span>
            <span>Факт</span>
            <span>Отклонение</span>
            <span>Статус</span>
          </div>
          {volumeData.map((item, i) => {
            const deviation = ((item.fact - item.plan) / item.plan * 100).toFixed(1);
            const isNegative = parseFloat(deviation) < 0;
            return (
              <div key={i} className={styles.tableRow}>
                <span className={styles.name}>{item.name}</span>
                <span>{item.unit}</span>
                <span>{item.plan.toLocaleString()}</span>
                <span>{item.fact.toLocaleString()}</span>
                <span className={isNegative ? styles.negative : styles.positive}>
                  {deviation}%
                </span>
                <span className={`${styles.status} ${Math.abs(parseFloat(deviation)) < 5 ? styles.ok : styles.warning}`}>
                  {Math.abs(parseFloat(deviation)) < 5 ? 'В норме' : 'Отклонение'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
