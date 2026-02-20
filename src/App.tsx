import { useState, useEffect } from 'react';
import './App.css';

type Theme = 'light' | 'dark';

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊' },
  { id: 'indicators', label: 'Основные показатели', icon: '📈' },
  { id: 'checklist', label: 'Чеклист', icon: '✅' },
  { id: 'nuances', label: 'Нюансы', icon: '⚠️' },
  { id: 'analytics', label: 'Аналитика', icon: '📉' },
  { id: 'faq', label: 'Вопросы-Ответы', icon: '❓' },
];

// Work categories (13 categories)
const WORK_CATEGORIES = [
  'Монолитные работы',
  'Кладочные работы',
  'Фасадные работы',
  'Кровельные работы',
  'Отделочные работы',
  'Электромонтажные работы',
  'Сантехнические работы',
  'Вентиляция и кондиционирование',
  'Слаботочные системы',
  'Лифтовое оборудование',
  'Благоустройство',
  'Земляные работы',
  'Свайные работы',
];

// ==========================================
// INDICATORS PAGE TYPES
// ==========================================

interface WorkItem {
  id: string;
  category: string;
  responsible: string;
  dateChanged: string;
  comment: string;
  pzTotal: number;
  pzLabor: number;
  pzMaterial: number;
  kp: number;
  area: number;
  volume: number;
  vsRatio: number;
  concreteGrade: string;
  concreteVolume: number;
  rebarTonnage: number;
  status: 'pending' | 'in_progress' | 'completed' | 'review';
}

interface Project {
  id: string;
  name: string;
  code: string;
  address: string;
  totalArea: number;
  workItems: WorkItem[];
  expanded?: boolean;
}

// ==========================================
// CHECKLIST PAGE TYPES
// ==========================================

type ChecklistStatus =
  | 'Учтено'
  | 'Готово'
  | 'Получено - Выбрано'
  | 'Не учтено'
  | 'Не готов'
  | 'Недост. информ.'
  | 'Не за генподрядом'
  | 'Отсутствует в проекте';

interface ChecklistItem {
  id: string;
  itemName: string;
  date: string;
  responsible: string;
  status: ChecklistStatus;
  comment: string;
}

interface ChecklistSection {
  id: string;
  name: string;
  items: ChecklistItem[];
  expanded?: boolean;
}

interface ChecklistProject {
  id: string;
  name: string;
  code: string;
  sections: ChecklistSection[];
  expanded?: boolean;
}

// Checklist sections
const CHECKLIST_SECTIONS = [
  'ВЗиС (Временные здания и сооружения)',
  'Водопонижение',
  'Шпунтовое ограждение',
  'Свайные работы',
  'Монолитные работы (нулевой цикл)',
  'Монолитные работы (надземная часть)',
  'Кладочные работы',
  'Фасадные работы',
  'Кровельные работы',
  'Внутренняя отделка',
  'Инженерные системы',
  'Благоустройство',
];

// Mock function to generate checklist data
function generateChecklistData(): ChecklistProject[] {
  const statuses: ChecklistStatus[] = [
    'Учтено', 'Готово', 'Получено - Выбрано',
    'Не учтено', 'Не готов', 'Недост. информ.',
    'Не за генподрядом', 'Отсутствует в проекте'
  ];

  const responsibles = [
    'Иванов А.С.', 'Петров В.И.', 'Сидоров К.Н.',
    'Козлов Д.М.', 'Новиков П.А.', 'Морозов Е.В.'
  ];

  const createItems = (sectionName: string): ChecklistItem[] => {
    const itemTemplates: Record<string, string[]> = {
      'ВЗиС': ['Бытовки рабочих', 'Бытовки ИТР', 'Склады материалов', 'Временное ограждение', 'Временное освещение', 'Временное электроснабжение'],
      'Водопонижение': ['Скважины водопонижения', 'Насосное оборудование', 'Система отвода воды', 'Мониторинг уровня грунтовых вод'],
      'Шпунтовое ограждение': ['Шпунт Ларсена', 'Буросекущиеся сваи', 'Распорная система', 'Анкерное крепление'],
      'Свайные работы': ['Буронабивные сваи', 'Забивные сваи', 'Ростверки', 'Испытания свай'],
      'Монолитные работы (нулевой цикл)': ['Фундаментная плита', 'Стены подвала', 'Перекрытие над подвалом', 'Гидроизоляция'],
      'Монолитные работы (надземная часть)': ['Колонны', 'Стены', 'Перекрытия', 'Лестничные марши', 'Балконные плиты'],
      'Кладочные работы': ['Наружные стены', 'Внутренние перегородки', 'Перемычки', 'Армирование кладки'],
      'Фасадные работы': ['Утепление фасада', 'Навесной фасад', 'Штукатурный фасад', 'Остекление'],
      'Кровельные работы': ['Утепление кровли', 'Гидроизоляция кровли', 'Кровельное покрытие', 'Водоотвод'],
      'Внутренняя отделка': ['Штукатурка', 'Стяжка пола', 'Покраска', 'Плиточные работы'],
      'Инженерные системы': ['Отопление', 'Водоснабжение', 'Канализация', 'Вентиляция', 'Электрика', 'Слаботочные системы'],
      'Благоустройство': ['Асфальтирование', 'Озеленение', 'Малые архитектурные формы', 'Детская площадка'],
    };

    const sectionKey = Object.keys(itemTemplates).find(key => sectionName.includes(key)) || 'ВЗиС';
    const templates = itemTemplates[sectionKey] || itemTemplates['ВЗиС'];

    return templates.map((itemName, index) => ({
      id: `item-${sectionName}-${index}`,
      itemName,
      date: `2024-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      comment: getRandomComment(itemName),
    }));
  };

  const getRandomComment = (itemName: string): string => {
    const comments = [
      `Объём ${itemName.toLowerCase()} согласован по ПД.`,
      `Ожидается уточнение по ${itemName.toLowerCase()}.`,
      `${itemName} - требуется дополнительная информация от проектировщика.`,
      `Коммерческое предложение получено. Выбран подрядчик.`,
      `Работы не входят в объём генподряда.`,
      `Отсутствует в проектной документации.`,
      `Расчёт выполнен по BIM модели.`,
      `Согласовано с заказчиком.`,
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  };

  const projects: ChecklistProject[] = [
    {
      id: 'chk-proj-1',
      name: 'ЖК SVET',
      code: 'SVET-2024',
      expanded: true,
      sections: CHECKLIST_SECTIONS.map((sectionName, idx) => ({
        id: `section-svet-${idx}`,
        name: sectionName,
        items: createItems(sectionName),
        expanded: idx === 0,
      })),
    },
    {
      id: 'chk-proj-2',
      name: 'Садовническая 76',
      code: 'SAD76-2024',
      expanded: false,
      sections: CHECKLIST_SECTIONS.map((sectionName, idx) => ({
        id: `section-sad-${idx}`,
        name: sectionName,
        items: createItems(sectionName),
        expanded: false,
      })),
    },
    {
      id: 'chk-proj-3',
      name: 'ЖК Парковый',
      code: 'PARK-2024',
      expanded: false,
      sections: CHECKLIST_SECTIONS.map((sectionName, idx) => ({
        id: `section-park-${idx}`,
        name: sectionName,
        items: createItems(sectionName),
        expanded: false,
      })),
    },
  ];

  return projects;
}

// Mock function for Indicators page
function parseExcelToProjectData(): Project[] {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'ЖК SVET',
      code: 'SVET-2024',
      address: 'г. Москва, ул. Светлая, д. 15',
      totalArea: 125000,
      expanded: true,
      workItems: [
        { id: 'w1-1', category: 'Монолитные работы', responsible: 'Иванов А.С.', dateChanged: '2024-02-15', comment: 'Объём рассчитан по BIM модели.', pzTotal: 8500, pzLabor: 3200, pzMaterial: 5300, kp: 9200, area: 45000, volume: 12500, vsRatio: 0.278, concreteGrade: 'B30 W8 F150', concreteVolume: 11800, rebarTonnage: 1450, status: 'in_progress' },
        { id: 'w1-2', category: 'Кладочные работы', responsible: 'Петров В.И.', dateChanged: '2024-02-14', comment: 'Газобетон D500, толщина 400мм.', pzTotal: 4200, pzLabor: 1800, pzMaterial: 2400, kp: 4600, area: 32000, volume: 8400, vsRatio: 0.263, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 45, status: 'pending' },
        { id: 'w1-3', category: 'Фасадные работы', responsible: 'Сидоров К.Н.', dateChanged: '2024-02-10', comment: 'НВФ с утеплителем 150мм.', pzTotal: 6800, pzLabor: 2500, pzMaterial: 4300, kp: 7400, area: 28000, volume: 0, vsRatio: 0, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'review' },
        { id: 'w1-4', category: 'Кровельные работы', responsible: 'Козлов Д.М.', dateChanged: '2024-02-08', comment: 'ПВХ мембрана, утепление 200мм.', pzTotal: 3200, pzLabor: 1400, pzMaterial: 1800, kp: 3500, area: 4200, volume: 840, vsRatio: 0.2, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'completed' },
        { id: 'w1-5', category: 'Земляные работы', responsible: 'Новиков П.А.', dateChanged: '2024-01-20', comment: 'Котлован глубиной 12м.', pzTotal: 2100, pzLabor: 900, pzMaterial: 1200, kp: 2400, area: 5200, volume: 62400, vsRatio: 12, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'completed' },
        { id: 'w1-6', category: 'Свайные работы', responsible: 'Морозов Е.В.', dateChanged: '2024-01-25', comment: 'Буронабивные сваи Ø620, L=24м.', pzTotal: 4500, pzLabor: 1800, pzMaterial: 2700, kp: 4900, area: 0, volume: 2890, vsRatio: 0, concreteGrade: 'B25 W6', concreteVolume: 2890, rebarTonnage: 380, status: 'completed' },
      ],
    },
    {
      id: 'proj-2',
      name: 'Садовническая 76',
      code: 'SAD76-2024',
      address: 'г. Москва, Садовническая наб., д. 76',
      totalArea: 45000,
      expanded: false,
      workItems: [
        { id: 'w2-1', category: 'Монолитные работы', responsible: 'Белов С.А.', dateChanged: '2024-02-12', comment: 'Реконструкция. Усиление конструкций.', pzTotal: 12500, pzLabor: 5200, pzMaterial: 7300, kp: 13800, area: 18000, volume: 5400, vsRatio: 0.3, concreteGrade: 'B35 W10 F200', concreteVolume: 5100, rebarTonnage: 720, status: 'in_progress' },
        { id: 'w2-2', category: 'Отделочные работы', responsible: 'Орлова М.П.', dateChanged: '2024-02-11', comment: 'Премиум отделка.', pzTotal: 18500, pzLabor: 8200, pzMaterial: 10300, kp: 20200, area: 42000, volume: 0, vsRatio: 0, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'pending' },
        { id: 'w2-3', category: 'Электромонтажные работы', responsible: 'Волков И.Д.', dateChanged: '2024-02-09', comment: 'Полная замена электрики.', pzTotal: 8900, pzLabor: 4500, pzMaterial: 4400, kp: 9800, area: 45000, volume: 0, vsRatio: 0, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'review' },
        { id: 'w2-4', category: 'Лифтовое оборудование', responsible: 'Соколов А.Н.', dateChanged: '2024-02-05', comment: '4 лифта OTIS.', pzTotal: 24000, pzLabor: 6000, pzMaterial: 18000, kp: 26500, area: 0, volume: 0, vsRatio: 0, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'pending' },
      ],
    },
    {
      id: 'proj-3',
      name: 'ЖК Парковый',
      code: 'PARK-2024',
      address: 'г. Москва, ул. Парковая, д. 25',
      totalArea: 85000,
      expanded: false,
      workItems: [
        { id: 'w3-1', category: 'Монолитные работы', responsible: 'Кузнецов В.В.', dateChanged: '2024-02-14', comment: 'Монолитный каркас.', pzTotal: 7200, pzLabor: 2800, pzMaterial: 4400, kp: 7900, area: 35000, volume: 9800, vsRatio: 0.28, concreteGrade: 'B30 W6 F100', concreteVolume: 9200, rebarTonnage: 1100, status: 'in_progress' },
        { id: 'w3-2', category: 'Благоустройство', responsible: 'Зайцева Е.К.', dateChanged: '2024-02-13', comment: 'Детская площадка, парковка.', pzTotal: 5600, pzLabor: 2200, pzMaterial: 3400, kp: 6100, area: 12000, volume: 2400, vsRatio: 0.2, concreteGrade: 'B20', concreteVolume: 1800, rebarTonnage: 85, status: 'pending' },
        { id: 'w3-3', category: 'Вентиляция и кондиционирование', responsible: 'Попов Н.С.', dateChanged: '2024-02-07', comment: 'VRF система.', pzTotal: 9800, pzLabor: 3800, pzMaterial: 6000, kp: 10700, area: 85000, volume: 0, vsRatio: 0, concreteGrade: '-', concreteVolume: 0, rebarTonnage: 0, status: 'review' },
      ],
    },
  ];

  return mockProjects;
}

// Sort types
type SortField = 'category' | 'responsible' | 'dateChanged' | 'pzTotal' | 'pzLabor' | 'pzMaterial' | 'kp' | 'area' | 'volume' | 'vsRatio' | 'rebarTonnage';
type SortDirection = 'asc' | 'desc';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Indicators page state
  const [projects, setProjects] = useState<Project[]>([]);
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Checklist page state
  const [checklistProjects, setChecklistProjects] = useState<ChecklistProject[]>([]);
  const [checklistFilter, setChecklistFilter] = useState<string>('all');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load mock data on mount
  useEffect(() => {
    const data = parseExcelToProjectData();
    setProjects(data);
    const checklistData = generateChecklistData();
    setChecklistProjects(checklistData);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowUserMenu(false);
  };

  // Indicators page functions
  const toggleProjectExpanded = (projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredSortedItems = (items: WorkItem[]): WorkItem[] => {
    let filtered = items;
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.category.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query) ||
        item.comment.toLowerCase().includes(query)
      );
    }
    return [...filtered].sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const formatNumber = (num: number): string => num.toLocaleString('ru-RU');
  const formatCurrency = (num: number): string => num.toLocaleString('ru-RU') + ' ₽';

  const getStatusBadge = (status: WorkItem['status']) => {
    const statusMap = {
      pending: { label: 'Ожидание', class: 'status-pending' },
      in_progress: { label: 'В работе', class: 'status-progress' },
      completed: { label: 'Завершено', class: 'status-completed' },
      review: { label: 'На проверке', class: 'status-review' },
    };
    const { label, class: className } = statusMap[status];
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getProjectTotals = (items: WorkItem[]) => {
    return items.reduce((acc, item) => ({
      pzTotal: acc.pzTotal + item.pzTotal,
      pzLabor: acc.pzLabor + item.pzLabor,
      pzMaterial: acc.pzMaterial + item.pzMaterial,
      kp: acc.kp + item.kp,
      area: acc.area + item.area,
      volume: acc.volume + item.volume,
      concreteVolume: acc.concreteVolume + item.concreteVolume,
      rebarTonnage: acc.rebarTonnage + item.rebarTonnage,
    }), { pzTotal: 0, pzLabor: 0, pzMaterial: 0, kp: 0, area: 0, volume: 0, concreteVolume: 0, rebarTonnage: 0 });
  };

  // Checklist page functions
  const toggleChecklistProjectExpanded = (projectId: string) => {
    setChecklistProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const toggleChecklistSectionExpanded = (projectId: string, sectionId: string) => {
    setChecklistProjects(prev => prev.map(p =>
      p.id === projectId
        ? {
            ...p,
            sections: p.sections.map(s =>
              s.id === sectionId ? { ...s, expanded: !s.expanded } : s
            ),
          }
        : p
    ));
  };

  const getChecklistStatusClass = (status: ChecklistStatus): string => {
    const greenStatuses = ['Учтено', 'Готово', 'Получено - Выбрано'];
    const redStatuses = ['Не учтено', 'Не готов', 'Недост. информ.'];
    const greyStatuses = ['Не за генподрядом', 'Отсутствует в проекте'];

    if (greenStatuses.includes(status)) return 'checklist-status-green';
    if (redStatuses.includes(status)) return 'checklist-status-red';
    if (greyStatuses.includes(status)) return 'checklist-status-grey';
    return '';
  };

  const getProjectReadiness = (project: ChecklistProject) => {
    const allItems = project.sections.flatMap(s => s.items);
    const total = allItems.length;
    const greenStatuses = ['Учтено', 'Готово', 'Получено - Выбрано'];
    const redStatuses = ['Не учтено', 'Не готов', 'Недост. информ.'];
    const greyStatuses = ['Не за генподрядом', 'Отсутствует в проекте'];

    const green = allItems.filter(i => greenStatuses.includes(i.status)).length;
    const red = allItems.filter(i => redStatuses.includes(i.status)).length;
    const grey = allItems.filter(i => greyStatuses.includes(i.status)).length;
    const readiness = total > 0 ? Math.round((green / total) * 100) : 0;

    return { total, green, red, grey, readiness };
  };

  const filterChecklistItems = (items: ChecklistItem[]): ChecklistItem[] => {
    if (checklistFilter === 'all') return items;
    if (checklistFilter === 'green') {
      const greenStatuses = ['Учтено', 'Готово', 'Получено - Выбрано'];
      return items.filter(i => greenStatuses.includes(i.status));
    }
    if (checklistFilter === 'red') {
      const redStatuses = ['Не учтено', 'Не готов', 'Недост. информ.'];
      return items.filter(i => redStatuses.includes(i.status));
    }
    if (checklistFilter === 'grey') {
      const greyStatuses = ['Не за генподрядом', 'Отсутствует в проекте'];
      return items.filter(i => greyStatuses.includes(i.status));
    }
    return items;
  };

  // ==========================================
  // RENDER: CHECKLIST PAGE
  // ==========================================
  const renderChecklistPage = () => {
    return (
      <div className="checklist-page">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Чеклист СУ-10</h1>
            <p className="page-description">Мастер-чеклист готовности сметной документации</p>
          </div>
          <div className="page-actions">
            <button className="btn-secondary">
              <span>📥</span> Импорт
            </button>
            <button className="btn-primary">
              <span>📤</span> Экспорт
            </button>
          </div>
        </div>

        {/* Summary Table */}
        <div className="checklist-summary">
          <h3>📊 Сводка по проектам</h3>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Проект</th>
                <th>Код</th>
                <th className="th-center">Всего позиций</th>
                <th className="th-center">
                  <span className="dot dot-green"></span> Готово
                </th>
                <th className="th-center">
                  <span className="dot dot-red"></span> Не готово
                </th>
                <th className="th-center">
                  <span className="dot dot-grey"></span> Не применимо
                </th>
                <th className="th-center">Готовность</th>
              </tr>
            </thead>
            <tbody>
              {checklistProjects.map(project => {
                const stats = getProjectReadiness(project);
                return (
                  <tr key={project.id}>
                    <td className="td-project-name">{project.name}</td>
                    <td className="td-code">{project.code}</td>
                    <td className="td-center">{stats.total}</td>
                    <td className="td-center td-green">{stats.green}</td>
                    <td className="td-center td-red">{stats.red}</td>
                    <td className="td-center td-grey">{stats.grey}</td>
                    <td className="td-center">
                      <div className="readiness-bar-container">
                        <div className="readiness-bar" style={{ width: `${stats.readiness}%` }}></div>
                        <span className="readiness-text">{stats.readiness}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${checklistFilter === 'all' ? 'active' : ''}`}
              onClick={() => setChecklistFilter('all')}
            >
              Все
            </button>
            <button
              className={`filter-btn filter-green ${checklistFilter === 'green' ? 'active' : ''}`}
              onClick={() => setChecklistFilter('green')}
            >
              <span className="dot dot-green"></span> Готово
            </button>
            <button
              className={`filter-btn filter-red ${checklistFilter === 'red' ? 'active' : ''}`}
              onClick={() => setChecklistFilter('red')}
            >
              <span className="dot dot-red"></span> Не готово
            </button>
            <button
              className={`filter-btn filter-grey ${checklistFilter === 'grey' ? 'active' : ''}`}
              onClick={() => setChecklistFilter('grey')}
            >
              <span className="dot dot-grey"></span> Не применимо
            </button>
          </div>
        </div>

        {/* Projects with Sections */}
        <div className="checklist-projects">
          {checklistProjects.map(project => (
            <div key={project.id} className="checklist-project">
              {/* Project Header */}
              <div
                className="checklist-project-header"
                onClick={() => toggleChecklistProjectExpanded(project.id)}
              >
                <span className="expand-icon">{project.expanded ? '▼' : '▶'}</span>
                <div className="project-info">
                  <h2>{project.name}</h2>
                  <span className="project-code">{project.code}</span>
                </div>
                <div className="project-readiness">
                  <span className="readiness-label">Готовность:</span>
                  <span className="readiness-value">{getProjectReadiness(project).readiness}%</span>
                </div>
              </div>

              {/* Sections */}
              {project.expanded && (
                <div className="checklist-sections">
                  {project.sections.map(section => {
                    const filteredItems = filterChecklistItems(section.items);
                    if (checklistFilter !== 'all' && filteredItems.length === 0) return null;

                    return (
                      <div key={section.id} className="checklist-section">
                        {/* Section Header */}
                        <div
                          className="checklist-section-header"
                          onClick={() => toggleChecklistSectionExpanded(project.id, section.id)}
                        >
                          <span className="expand-icon">{section.expanded ? '▼' : '▶'}</span>
                          <span className="section-name">{section.name}</span>
                          <span className="section-count">({filteredItems.length} позиций)</span>
                        </div>

                        {/* Section Items */}
                        {section.expanded && (
                          <div className="checklist-items-container">
                            <table className="checklist-table">
                              <thead>
                                <tr>
                                  <th className="th-id">№</th>
                                  <th className="th-item">Позиция</th>
                                  <th className="th-date">Дата</th>
                                  <th className="th-responsible">Ответственный</th>
                                  <th className="th-status">Статус</th>
                                  <th className="th-comment">Комментарий</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredItems.map((item, index) => (
                                  <tr key={item.id} className={getChecklistStatusClass(item.status)}>
                                    <td className="td-id">{index + 1}</td>
                                    <td className="td-item">{item.itemName}</td>
                                    <td className="td-date">{item.date}</td>
                                    <td className="td-responsible">{item.responsible}</td>
                                    <td className="td-status">
                                      <span className={`checklist-badge ${getChecklistStatusClass(item.status)}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="td-comment" title={item.comment}>
                                      {item.comment.length > 50
                                        ? item.comment.substring(0, 50) + '...'
                                        : item.comment}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="checklist-legend">
          <h4>Условные обозначения статусов:</h4>
          <div className="legend-grid">
            <div className="legend-group">
              <span className="legend-title green">Готово (зелёный):</span>
              <span>Учтено, Готово, Получено - Выбрано</span>
            </div>
            <div className="legend-group">
              <span className="legend-title red">Не готово (красный):</span>
              <span>Не учтено, Не готов, Недост. информ.</span>
            </div>
            <div className="legend-group">
              <span className="legend-title grey">Не применимо (серый):</span>
              <span>Не за генподрядом, Отсутствует в проекте</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: INDICATORS PAGE
  // ==========================================
  const renderIndicatorsPage = () => {
    return (
      <div className="indicators-page">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Основные показатели</h1>
            <p className="page-description">Сводка по проектам и видам работ</p>
          </div>
          <div className="page-actions">
            <button className="btn-secondary"><span>📥</span> Импорт Excel</button>
            <button className="btn-primary"><span>📤</span> Экспорт</button>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">Все категории</option>
            {WORK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="projects-container">
          {projects.map(project => {
            const filteredItems = getFilteredSortedItems(project.workItems);
            const totals = getProjectTotals(project.workItems);
            if (filterCategory !== 'all' && filteredItems.length === 0) return null;

            return (
              <div key={project.id} className="project-section">
                <div className="project-header" onClick={() => toggleProjectExpanded(project.id)}>
                  <div className="project-expand">{project.expanded ? '▼' : '▶'}</div>
                  <div className="project-info">
                    <h2>{project.name}</h2>
                    <span className="project-code">{project.code}</span>
                    <span className="project-address">{project.address}</span>
                  </div>
                  <div className="project-stats">
                    <div className="project-stat"><span className="stat-label">Площадь</span><span className="stat-value">{formatNumber(project.totalArea)} м²</span></div>
                    <div className="project-stat"><span className="stat-label">Бетон</span><span className="stat-value">{formatNumber(totals.concreteVolume)} м³</span></div>
                    <div className="project-stat"><span className="stat-label">Арматура</span><span className="stat-value">{formatNumber(totals.rebarTonnage)} т</span></div>
                    <div className="project-stat highlight"><span className="stat-label">ПЗ Итого</span><span className="stat-value">{formatCurrency(totals.pzTotal * 1000)}</span></div>
                  </div>
                </div>

                {project.expanded && (
                  <div className="work-items-table-container">
                    <table className="work-items-table">
                      <thead>
                        <tr>
                          <th className="th-category" onClick={() => handleSort('category')}>Вид работ {getSortIcon('category')}</th>
                          <th className="th-responsible" onClick={() => handleSort('responsible')}>Ответственный {getSortIcon('responsible')}</th>
                          <th className="th-date" onClick={() => handleSort('dateChanged')}>Дата {getSortIcon('dateChanged')}</th>
                          <th className="th-comment">Комментарий</th>
                          <th className="th-number" onClick={() => handleSort('pzTotal')}>ПЗ Итого {getSortIcon('pzTotal')}</th>
                          <th className="th-number" onClick={() => handleSort('pzLabor')}>ПЗ Раб {getSortIcon('pzLabor')}</th>
                          <th className="th-number" onClick={() => handleSort('pzMaterial')}>ПЗ Мат {getSortIcon('pzMaterial')}</th>
                          <th className="th-number" onClick={() => handleSort('kp')}>КП {getSortIcon('kp')}</th>
                          <th className="th-number" onClick={() => handleSort('area')}>S, м² {getSortIcon('area')}</th>
                          <th className="th-number" onClick={() => handleSort('volume')}>V, м³ {getSortIcon('volume')}</th>
                          <th className="th-number" onClick={() => handleSort('vsRatio')}>V/S {getSortIcon('vsRatio')}</th>
                          <th className="th-concrete">Бетон</th>
                          <th className="th-number" onClick={() => handleSort('rebarTonnage')}>Арм., т {getSortIcon('rebarTonnage')}</th>
                          <th className="th-status">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map(item => (
                          <tr key={item.id}>
                            <td className="td-category">{item.category}</td>
                            <td className="td-responsible">{item.responsible}</td>
                            <td className="td-date">{item.dateChanged}</td>
                            <td className="td-comment" title={item.comment}>{item.comment.length > 40 ? item.comment.substring(0, 40) + '...' : item.comment}</td>
                            <td className="td-number">{formatNumber(item.pzTotal)}</td>
                            <td className="td-number">{formatNumber(item.pzLabor)}</td>
                            <td className="td-number">{formatNumber(item.pzMaterial)}</td>
                            <td className="td-number td-kp">{formatNumber(item.kp)}</td>
                            <td className="td-number">{item.area > 0 ? formatNumber(item.area) : '-'}</td>
                            <td className="td-number">{item.volume > 0 ? formatNumber(item.volume) : '-'}</td>
                            <td className="td-number">{item.vsRatio > 0 ? item.vsRatio.toFixed(3) : '-'}</td>
                            <td className="td-concrete">{item.concreteGrade}</td>
                            <td className="td-number">{item.rebarTonnage > 0 ? formatNumber(item.rebarTonnage) : '-'}</td>
                            <td className="td-status">{getStatusBadge(item.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="totals-row">
                          <td colSpan={4}><strong>ИТОГО:</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.pzTotal)}</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.pzLabor)}</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.pzMaterial)}</strong></td>
                          <td className="td-number td-kp"><strong>{formatNumber(totals.kp)}</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.area)}</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.volume)}</strong></td>
                          <td className="td-number">-</td>
                          <td className="td-number"><strong>{formatNumber(totals.concreteVolume)}</strong></td>
                          <td className="td-number"><strong>{formatNumber(totals.rebarTonnage)}</strong></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="legend-section">
          <h4>Условные обозначения:</h4>
          <div className="legend-items">
            <div className="legend-item"><strong>ПЗ</strong> - Прямые затраты (тыс. ₽)</div>
            <div className="legend-item"><strong>КП</strong> - Коммерческое предложение (тыс. ₽)</div>
            <div className="legend-item"><strong>S</strong> - Площадь (м²)</div>
            <div className="legend-item"><strong>V</strong> - Объём (м³)</div>
            <div className="legend-item"><strong>V/S</strong> - Отношение объёма к площади</div>
            <div className="legend-item"><strong>Арм.</strong> - Арматура (тонн)</div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <div className="page-content">
            <h1>Дашборд</h1>
            <p className="page-description">Обзор ключевых метрик и показателей проекта</p>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-info"><span className="stat-value">24</span><span className="stat-label">Активных проектов</span></div></div>
              <div className="stat-card"><div className="stat-icon">📄</div><div className="stat-info"><span className="stat-value">156</span><span className="stat-label">Документов</span></div></div>
              <div className="stat-card"><div className="stat-icon">⚠️</div><div className="stat-info"><span className="stat-value">8</span><span className="stat-label">Требуют внимания</span></div></div>
              <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-info"><span className="stat-value">92%</span><span className="stat-label">Выполнено</span></div></div>
            </div>
          </div>
        );
      case 'indicators':
        return renderIndicatorsPage();
      case 'checklist':
        return renderChecklistPage();
      case 'nuances':
        return (
          <div className="page-content">
            <h1>Нюансы</h1>
            <p className="page-description">Особенности и важные детали проектов</p>
            <div className="placeholder-content"><span className="placeholder-icon">⚠️</span><p>Раздел в разработке</p></div>
          </div>
        );
      case 'analytics':
        return (
          <div className="page-content">
            <h1>Аналитика</h1>
            <p className="page-description">Детальный анализ данных и отчётность</p>
            <div className="placeholder-content"><span className="placeholder-icon">📉</span><p>Раздел в разработке</p></div>
          </div>
        );
      case 'faq':
        return (
          <div className="page-content">
            <h1>Вопросы-Ответы</h1>
            <p className="page-description">Часто задаваемые вопросы и справочная информация</p>
            <div className="placeholder-content"><span className="placeholder-icon">❓</span><p>Раздел в разработке</p></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            {!sidebarCollapsed && <span className="logo-text">H2E Platform</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-item ${activeNav === item.id ? 'active' : ''}`} onClick={() => setActiveNav(item.id)} title={sidebarCollapsed ? item.label : undefined}>
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
            <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {!sidebarCollapsed && <span className="nav-label">{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <h2 className="header-title">Аналитическая платформа</h2>
            <span className="header-subtitle">Строительный инжиниринг</span>
          </div>
          <div className="header-right">
            <button className="admin-btn" title="Панель администратора">
              <span className="admin-icon">⚙️</span>
              <span className="admin-label">Администратор</span>
            </button>
            <div className="user-account">
              <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">{isLoggedIn ? '👤' : '○'}</div>
                <span className="user-name">{isLoggedIn ? 'Инженер' : 'Гость'}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  {isLoggedIn ? (
                    <>
                      <div className="dropdown-header"><span className="dropdown-email">engineer@h2e.ru</span></div>
                      <button className="dropdown-item"><span>👤</span> Профиль</button>
                      <button className="dropdown-item"><span>⚙️</span> Настройки</button>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}><span>🚪</span> Выйти</button>
                    </>
                  ) : (
                    <>
                      <button className="dropdown-item" onClick={handleLogin}><span>🔑</span> Войти</button>
                      <button className="dropdown-item"><span>📝</span> Регистрация</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
