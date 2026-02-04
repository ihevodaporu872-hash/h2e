import {
  FileSpreadsheet,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Upload,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { useProject } from '../context/ProjectContext';
import styles from './Dashboard.module.css';

const progressData = [
  { month: 'Янв', plan: 15, fact: 12 },
  { month: 'Фев', plan: 28, fact: 25 },
  { month: 'Мар', plan: 42, fact: 40 },
  { month: 'Апр', plan: 55, fact: 52 },
  { month: 'Май', plan: 68, fact: 63 },
  { month: 'Июн', plan: 80, fact: 72 },
];

const budgetData = [
  { name: 'СМР', value: 45, color: '#3b82f6' },
  { name: 'Материалы', value: 28, color: '#10b981' },
  { name: 'Оборудование', value: 15, color: '#f59e0b' },
  { name: 'Проектирование', value: 8, color: '#8b5cf6' },
  { name: 'Прочее', value: 4, color: '#6b7280' },
];

const workloadData = [
  { name: 'Пн', hours: 45 },
  { name: 'Вт', hours: 52 },
  { name: 'Ср', hours: 48 },
  { name: 'Чт', hours: 61 },
  { name: 'Пт', hours: 55 },
  { name: 'Сб', hours: 32 },
  { name: 'Вс', hours: 18 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const formatBudget = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} млрд`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)} млн`;
    return `${value.toLocaleString()} ₽`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Панель управления</h1>
          <p className={styles.subtitle}>
            {currentProject
              ? `Проект: ${currentProject.name} (${currentProject.code})`
              : 'Обзор проектной документации и аналитика'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            icon={<Calendar size={18} />}
          >
            Январь 2025
          </Button>
          <Button
            icon={<Upload size={18} />}
            onClick={() => navigate('/documents')}
          >
            Загрузить файл
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Бюджет проекта"
          value={currentProject?.budget ? formatBudget(currentProject.budget) : '—'}
          icon={<DollarSign size={20} />}
          trend={{ value: 92, label: 'освоено' }}
          color="blue"
        />
        <StatCard
          title="Документов"
          value={currentProject?.documents.length || 0}
          icon={<FolderOpen size={20} />}
          trend={{ value: 12, label: 'за месяц' }}
          color="green"
        />
        <StatCard
          title="Открытых рисков"
          value="3"
          icon={<AlertTriangle size={20} />}
          trend={{ value: -2, label: 'закрыто' }}
          color="yellow"
        />
        <StatCard
          title="Выполнение"
          value="72%"
          icon={<Target size={20} />}
          trend={{ value: 5, label: 'к плану' }}
          color="green"
        />
      </div>

      {/* Графики */}
      <div className={styles.chartsRow}>
        <Card title="Прогресс выполнения" subtitle="План vs Факт, % готовности">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="planGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="factGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="plan"
                  name="План"
                  stroke="#3b82f6"
                  fill="url(#planGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="fact"
                  name="Факт"
                  stroke="#10b981"
                  fill="url(#factGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
              План
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} />
              Факт
            </span>
          </div>
        </Card>

        <Card title="Структура бюджета" subtitle="Распределение затрат">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                  formatter={(value: number) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.budgetLegend}>
            {budgetData.map((item, i) => (
              <div key={i} className={styles.budgetItem}>
                <span className={styles.budgetColor} style={{ backgroundColor: item.color }} />
                <span className={styles.budgetName}>{item.name}</span>
                <span className={styles.budgetValue}>{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Нижняя секция */}
      <div className={styles.bottomGrid}>
        {/* Последние документы */}
        <Card title="Последние документы" subtitle="Недавно загруженные файлы">
          <div className={styles.documentList}>
            {(currentProject?.documents.slice(0, 4) || [
              { id: '1', name: 'Смета_корпус_А.xlsx', updatedAt: new Date(), status: 'approved' },
              { id: '2', name: 'BOQ_фундамент_v2.xlsx', updatedAt: new Date(Date.now() - 86400000), status: 'review' },
            ]).map((doc) => (
              <div key={doc.id} className={styles.documentItem}>
                <FileSpreadsheet size={20} className={styles.docIcon} />
                <div className={styles.docInfo}>
                  <span className={styles.docName}>{doc.name}</span>
                  <span className={styles.docDate}>
                    {new Date(doc.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <span className={`${styles.status} ${styles[doc.status]}`}>
                  {doc.status === 'draft' && 'Черновик'}
                  {doc.status === 'approved' && 'Согласован'}
                  {doc.status === 'review' && 'На проверке'}
                </span>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            fullWidth
            className={styles.viewAllButton}
            onClick={() => navigate('/documents')}
          >
            Все документы <ArrowRight size={16} />
          </Button>
        </Card>

        {/* Активность команды */}
        <Card title="Активность команды" subtitle="Рабочие часы за неделю">
          <div className={styles.chartContainer} style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                  formatter={(value: number) => [`${value} ч`, 'Часов']}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.teamStats}>
            <div className={styles.teamStat}>
              <Users size={16} />
              <span>12 участников</span>
            </div>
            <div className={styles.teamStat}>
              <Activity size={16} />
              <span>311 ч за неделю</span>
            </div>
          </div>
        </Card>

        {/* Текущие задачи */}
        <Card title="Текущие задачи" subtitle="Требуют внимания">
          <div className={styles.taskList}>
            <div className={`${styles.taskItem} ${styles.urgent}`}>
              <AlertTriangle size={18} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>Согласовать смету корпуса Б</span>
                <span className={styles.taskMeta}>Срок: сегодня</span>
              </div>
            </div>
            <div className={`${styles.taskItem} ${styles.warning}`}>
              <Clock size={18} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>Ответить на RFI #45</span>
                <span className={styles.taskMeta}>Срок: завтра</span>
              </div>
            </div>
            <div className={styles.taskItem}>
              <CheckCircle size={18} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>Проверить акт КС-2</span>
                <span className={styles.taskMeta}>Срок: 25 янв</span>
              </div>
            </div>
            <div className={styles.taskItem}>
              <TrendingUp size={18} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>Обновить график работ</span>
                <span className={styles.taskMeta}>Срок: 28 янв</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            fullWidth
            className={styles.viewAllButton}
            onClick={() => navigate('/schedule')}
          >
            Все задачи <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    </div>
  );
}
