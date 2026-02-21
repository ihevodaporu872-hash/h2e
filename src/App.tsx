import { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
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

// Excel parsing types
interface ExcelColumnMapping {
  category?: string;
  responsible?: string;
  date?: string;
  comment?: string;
  pzTotal?: string;
  pzLabor?: string;
  pzMaterial?: string;
  kp?: string;
  area?: string;
  volume?: string;
  concreteGrade?: string;
  concreteVolume?: string;
  rebarTonnage?: string;
  projectName?: string;
}

// Common BOQ column name patterns (Russian/English)
const COLUMN_PATTERNS: Record<keyof ExcelColumnMapping, string[]> = {
  category: ['вид работ', 'категория', 'наименование', 'раздел', 'работы', 'category', 'work type', 'description'],
  responsible: ['ответственный', 'исполнитель', 'responsible', 'assignee', 'тип элемент'],
  date: ['дата', 'date', 'изменено', 'updated'],
  comment: ['комментарий', 'примечание', 'comment', 'note', 'remarks', 'примечание заказчика', 'примечание гп'],
  pzTotal: ['пз итого', 'пз всего', 'прямые затраты', 'итого пз', 'total cost', 'пз', 'итоговая сумма', 'итоговая сум', 'сумма'],
  pzLabor: ['пз работа', 'пз раб', 'работа', 'labor', 'трудозатраты', 'стоимость доставки'],
  pzMaterial: ['пз материал', 'пз мат', 'материал', 'material', 'материалы'],
  kp: ['кп', 'коммерческое', 'commercial', 'цена', 'price', 'цена за единицу', 'цена за ед'],
  area: ['площадь', 'area', 'м2', 'm2', 's,', 'количество заказчика', 'количество гп', 'количество'],
  volume: ['объем', 'объём', 'volume', 'м3', 'm3', 'v,'],
  concreteGrade: ['марка бетона', 'бетон', 'concrete', 'класс бетона', 'grade', 'ед. изм', 'ед.изм', 'единица'],
  concreteVolume: ['объем бетона', 'объём бетона', 'бетон м3', 'concrete volume'],
  rebarTonnage: ['арматура', 'армирование', 'rebar', 'тонн', 'tonnage', 'арм'],
  projectName: ['проект', 'объект', 'project', 'name', 'наименование проекта', 'затрата на строительство'],
};

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

  // Excel upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Project | null>(null);
  const [selectedTargetProject, setSelectedTargetProject] = useState<string>('new'); // 'new' or project id
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  // EXCEL UPLOAD FUNCTIONS
  // ==========================================

  // Find column index by pattern matching
  const findColumnIndex = (headers: string[], patterns: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toLowerCase().trim() || '';
      for (const pattern of patterns) {
        if (header.includes(pattern.toLowerCase())) {
          return i;
        }
      }
    }
    return -1;
  };

  // Parse numeric value from cell
  const parseNumericValue = (value: unknown): number => {
    if (value === null || value === undefined || value === '' || value === '-') return 0;
    if (typeof value === 'number') return value;
    const str = String(value).replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // Detect category from description
  const detectCategory = (description: string): string => {
    const desc = description.toLowerCase();
    const categoryMap: Record<string, string[]> = {
      'Монолитные работы': ['монолит', 'бетон', 'опалубка', 'железобетон', 'жб', 'фундамент'],
      'Кладочные работы': ['кладка', 'кирпич', 'газобетон', 'блок', 'перегородк'],
      'Фасадные работы': ['фасад', 'навесн', 'облицов', 'нвф', 'штукатур'],
      'Кровельные работы': ['кровл', 'крыш', 'мембран', 'водосток'],
      'Отделочные работы': ['отдел', 'покраск', 'обои', 'плитк', 'потолок', 'пол'],
      'Электромонтажные работы': ['электр', 'кабель', 'освещ', 'эм', 'щит'],
      'Сантехнические работы': ['сантех', 'водопровод', 'канализ', 'трубопровод'],
      'Вентиляция и кондиционирование': ['вентил', 'кондиц', 'овик', 'воздуховод'],
      'Слаботочные системы': ['слаботоч', 'сигнализ', 'видеонаблюд', 'скс', 'домофон'],
      'Лифтовое оборудование': ['лифт', 'подъемник', 'эскалатор'],
      'Благоустройство': ['благоустр', 'озелен', 'асфальт', 'площадк', 'дорож'],
      'Земляные работы': ['земл', 'котлован', 'выемк', 'грунт', 'обратн'],
      'Свайные работы': ['свай', 'буронабив', 'шпунт', 'забивн'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return category;
        }
      }
    }
    return 'Общестроительные работы';
  };

  // Parse Excel file
  const parseExcelFile = useCallback(async (file: File): Promise<Project> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];

          if (jsonData.length < 2) {
            throw new Error('Файл пуст или содержит менее 2 строк');
          }

          // Get headers from first row
          const headers = jsonData[0].map(h => String(h || ''));

          // Map columns
          const colIndices: Record<string, number> = {};
          for (const [key, patterns] of Object.entries(COLUMN_PATTERNS)) {
            colIndices[key] = findColumnIndex(headers, patterns);
          }

          // Extract project name from filename or first cell
          const projectName = file.name.replace(/\.(xlsx?|csv)$/i, '').replace(/[_-]/g, ' ');

          // Parse rows into work items
          const workItems: WorkItem[] = [];
          const statuses: WorkItem['status'][] = ['pending', 'in_progress', 'completed', 'review'];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            // Get category/description
            const categoryIdx = colIndices.category !== -1 ? colIndices.category : 0;
            const description = String(row[categoryIdx] || '').trim();
            if (!description || description.length < 3) continue;

            // Detect or use existing category
            const category = detectCategory(description);

            // Get numeric values
            const pzTotal = colIndices.pzTotal !== -1 ? parseNumericValue(row[colIndices.pzTotal]) : 0;
            const pzLabor = colIndices.pzLabor !== -1 ? parseNumericValue(row[colIndices.pzLabor]) : 0;
            const pzMaterial = colIndices.pzMaterial !== -1 ? parseNumericValue(row[colIndices.pzMaterial]) : 0;
            const kp = colIndices.kp !== -1 ? parseNumericValue(row[colIndices.kp]) : pzTotal * 1.1;
            const area = colIndices.area !== -1 ? parseNumericValue(row[colIndices.area]) : 0;
            const volume = colIndices.volume !== -1 ? parseNumericValue(row[colIndices.volume]) : 0;
            const concreteVolume = colIndices.concreteVolume !== -1 ? parseNumericValue(row[colIndices.concreteVolume]) : 0;
            const rebarTonnage = colIndices.rebarTonnage !== -1 ? parseNumericValue(row[colIndices.rebarTonnage]) : 0;

            // Get string values
            const responsible = colIndices.responsible !== -1 ? String(row[colIndices.responsible] || 'Не назначен') : 'Не назначен';
            const comment = colIndices.comment !== -1 ? String(row[colIndices.comment] || description) : description;
            const concreteGrade = colIndices.concreteGrade !== -1 ? String(row[colIndices.concreteGrade] || '-') : '-';

            // Get or generate date
            let dateChanged = new Date().toISOString().split('T')[0];
            if (colIndices.date !== -1 && row[colIndices.date]) {
              const dateVal = row[colIndices.date];
              if (typeof dateVal === 'number') {
                // Excel date serial number
                const excelDate = XLSX.SSF.parse_date_code(dateVal);
                dateChanged = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
              } else {
                dateChanged = String(dateVal);
              }
            }

            // Calculate V/S ratio
            const vsRatio = area > 0 ? volume / area : 0;

            // Skip rows with no meaningful data (must have at least pzTotal, kp, or area > 0)
            if (pzTotal === 0 && kp === 0 && area === 0) continue;

            workItems.push({
              id: `imported-${i}`,
              category,
              responsible: responsible.trim() || 'Не назначен',
              dateChanged,
              comment: comment.length > 200 ? comment.substring(0, 200) + '...' : comment,
              pzTotal: Math.round(pzTotal),
              pzLabor: Math.round(pzLabor),
              pzMaterial: Math.round(pzMaterial),
              kp: Math.round(kp),
              area: Math.round(area),
              volume: Math.round(volume * 100) / 100,
              vsRatio: Math.round(vsRatio * 1000) / 1000,
              concreteGrade,
              concreteVolume: Math.round(concreteVolume),
              rebarTonnage: Math.round(rebarTonnage * 10) / 10,
              status: statuses[Math.floor(Math.random() * statuses.length)],
            });
          }

          if (workItems.length === 0) {
            // Log debug info
            console.log('Headers found:', headers);
            console.log('Column indices:', colIndices);
            console.log('First data row:', jsonData[1]);
            throw new Error('Не удалось извлечь данные из файла. Проверьте формат BOQ.');
          }

          // Calculate total area (use area sum, or estimate from pzTotal if no area)
          const totalArea = workItems.reduce((sum, item) => sum + item.area, 0);
          const totalPz = workItems.reduce((sum, item) => sum + item.pzTotal, 0);

          const project: Project = {
            id: `imported-${Date.now()}`,
            name: projectName,
            code: `IMP-${Date.now().toString(36).toUpperCase()}`,
            address: 'Импортировано из Excel',
            totalArea: totalArea || Math.round(totalPz / 10) || 10000, // Estimate from total cost if no area
            workItems,
            expanded: true,
          };

          resolve(project);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsBinaryString(file);
    });
  }, []);

  // Main file upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('handleFileUpload called with:', file.name);

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setUploadError('Поддерживаются только файлы Excel (.xlsx, .xls) и CSV');
      setUploadProgress('error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Файл слишком большой. Максимальный размер: 10 МБ');
      setUploadProgress('error');
      return;
    }

    setUploadProgress('parsing');
    setUploadError(null);
    setParsedPreview(null);

    try {
      const project = await parseExcelFile(file);
      console.log('Parsed project:', project);
      setParsedPreview(project);
      setUploadProgress('success');
    } catch (error) {
      console.error('Parse error:', error);
      setUploadError(error instanceof Error ? error.message : 'Ошибка парсинга файла');
      setUploadProgress('error');
    }
  }, [parseExcelFile]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('File dropped');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Confirm import
  const confirmImport = () => {
    if (parsedPreview) {
      if (selectedTargetProject === 'new') {
        // Create new project
        setProjects(prev => [parsedPreview, ...prev]);
      } else {
        // Add items to existing project
        setProjects(prev => prev.map(project => {
          if (project.id === selectedTargetProject) {
            // Merge work items, generating new IDs to avoid conflicts
            const newWorkItems = parsedPreview.workItems.map((item, idx) => ({
              ...item,
              id: `${project.id}-imported-${Date.now()}-${idx}`,
            }));
            return {
              ...project,
              workItems: [...project.workItems, ...newWorkItems],
              totalArea: project.totalArea + parsedPreview.totalArea,
            };
          }
          return project;
        }));
      }
      setShowUploadModal(false);
      setUploadProgress('idle');
      setParsedPreview(null);
      setSelectedTargetProject('new');
    }
  };

  // Reset upload modal
  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadProgress('idle');
    setUploadError(null);
    setParsedPreview(null);
    setSelectedTargetProject('new');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // RENDER: UPLOAD MODAL
  // ==========================================
  const renderUploadModal = () => {
    if (!showUploadModal) return null;

    return (
      <div className="modal-overlay" onClick={resetUploadModal}>
        <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📥 Импорт BOQ из Excel</h2>
            <button className="modal-close" onClick={resetUploadModal}>×</button>
          </div>

          <div className="modal-body">
            {uploadProgress === 'idle' && (
              <>
                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-icon">📄</div>
                  <div className="dropzone-text">
                    <p className="dropzone-title">Перетащите файл сюда</p>
                    <p className="dropzone-subtitle">или нажмите для выбора</p>
                  </div>
                  <div className="dropzone-formats">
                    Поддерживаемые форматы: .xlsx, .xls, .csv
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />

                <div className="upload-instructions">
                  <h4>📋 Рекомендации по формату BOQ:</h4>
                  <ul>
                    <li>Первая строка должна содержать заголовки колонок</li>
                    <li>Колонки: <strong>Вид работ, ПЗ Итого, Площадь, Объём, Бетон, Арматура</strong></li>
                    <li>Числовые значения в колонках затрат, площади и объёма</li>
                    <li>Система автоматически определит категории работ</li>
                  </ul>
                </div>
              </>
            )}

            {uploadProgress === 'parsing' && (
              <div className="upload-status parsing">
                <div className="spinner"></div>
                <p>Анализ файла...</p>
              </div>
            )}

            {uploadProgress === 'error' && (
              <div className="upload-status error">
                <div className="status-icon">❌</div>
                <p className="error-message">{uploadError}</p>
                <button className="btn-secondary" onClick={() => setUploadProgress('idle')}>
                  Попробовать снова
                </button>
              </div>
            )}

            {uploadProgress === 'success' && parsedPreview && (
              <div className="upload-preview">
                <div className="preview-header">
                  <div className="status-icon success">✅</div>
                  <div className="preview-info">
                    <h3>{parsedPreview.name}</h3>
                    <p>Код: {parsedPreview.code}</p>
                  </div>
                </div>

                <div className="preview-stats">
                  <div className="preview-stat">
                    <span className="stat-value">{parsedPreview.workItems.length}</span>
                    <span className="stat-label">Позиций</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">{formatNumber(parsedPreview.totalArea)}</span>
                    <span className="stat-label">м² площадь</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">{formatCurrency(getProjectTotals(parsedPreview.workItems).pzTotal * 1000)}</span>
                    <span className="stat-label">ПЗ Итого</span>
                  </div>
                </div>

                {/* Project/Tender selector */}
                <div className="target-project-selector">
                  <h4>📁 Привязать к тендеру:</h4>
                  <select
                    className="project-select"
                    value={selectedTargetProject}
                    onChange={(e) => setSelectedTargetProject(e.target.value)}
                  >
                    <option value="new">➕ Создать новый проект</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                  {selectedTargetProject !== 'new' && (
                    <p className="selector-hint">
                      Данные будут добавлены к существующему проекту "{projects.find(p => p.id === selectedTargetProject)?.name}"
                    </p>
                  )}
                </div>

                <div className="preview-categories">
                  <h4>Категории работ:</h4>
                  <div className="category-tags">
                    {[...new Set(parsedPreview.workItems.map(w => w.category))].map(cat => (
                      <span key={cat} className="category-tag">
                        {cat} ({parsedPreview.workItems.filter(w => w.category === cat).length})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="preview-table-container">
                  <h4>Предварительный просмотр (первые 5 позиций):</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Категория</th>
                        <th>ПЗ Итого</th>
                        <th>Площадь</th>
                        <th>Объём</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPreview.workItems.slice(0, 5).map(item => (
                        <tr key={item.id}>
                          <td>{item.category}</td>
                          <td>{formatNumber(item.pzTotal)}</td>
                          <td>{item.area > 0 ? formatNumber(item.area) : '-'}</td>
                          <td>{item.volume > 0 ? formatNumber(item.volume) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedPreview.workItems.length > 5 && (
                    <p className="preview-more">...и ещё {parsedPreview.workItems.length - 5} позиций</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={resetUploadModal}>
              Отмена
            </button>
            {uploadProgress === 'success' && parsedPreview && (
              <button className="btn-primary" onClick={confirmImport}>
                <span>✓</span> Импортировать данные
              </button>
            )}
          </div>
        </div>
      </div>
    );
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
            <button className="btn-secondary" onClick={() => setShowUploadModal(true)}>
              <span>📥</span> Импорт Excel
            </button>
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

      {/* Upload Modal */}
      {renderUploadModal()}
    </div>
  );
}

export default App;
