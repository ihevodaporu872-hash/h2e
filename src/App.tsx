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
// TENDER TABLE TYPES (Excel-like hierarchical)
// ==========================================

interface TenderRow {
  id: string;
  name: string;           // A: Затрата тендера (Комментарий)
  category: string;       // Вид работ (detected from name)
  volume: number;         // B: Объем
  unit: string;           // C: Ед. изм.
  pzLabor: number;        // D: Прямые затраты - Итого работ за ед.
  pzMaterial: number;     // E: Прямые затраты - Итого материалов за единицу
  pzTotal: number;        // F: Прямые затраты - Итого за единицу
  kzLabor: number;        // G: Коммерческие затраты - Итого работ за ед.
  kzMaterial: number;     // H: Коммерческие затраты - Итого материалов за единицу
  kzTotal: number;        // I: Коммерческие затраты - Итого за единицу
  totalPerGBA: number;    // J: Итого за единицу общей площади
  isSection: boolean;     // true for main sections (01., 02., etc.)
  sectionId?: string;     // parent section id for sub-items
}

interface TenderSection {
  id: string;
  name: string;
  rows: TenderRow[];
  expanded: boolean;
  // Aggregated totals
  totals: {
    pzLabor: number;
    pzMaterial: number;
    pzTotal: number;
    kzLabor: number;
    kzMaterial: number;
    kzTotal: number;
    totalPerGBA: number;
  };
}

interface TenderFile {
  id: string;
  name: string;           // File name (e.g., "Затраты_Поликлиника_v2_Прямые_25-02-2026")
  uploadedAt: string;     // Upload timestamp
  calculationDate: string; // User-specified date "Расчеты по дате изменения"
  sections: TenderSection[];
  expanded: boolean;
}

interface TenderProject {
  id: string;
  name: string;           // Project name (e.g., "305. Поликлиника (ASTERUS)")
  code: string;
  files: TenderFile[];    // Multiple uploaded files
  expanded: boolean;
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
  // Column A: Work item name
  category: ['затрата тендера', 'затрата', 'вид работ', 'категория', 'наименование', 'раздел', 'работы', 'category', 'work type', 'description', 'название', 'позиция', 'item', 'name'],
  responsible: ['ответственный', 'исполнитель', 'responsible', 'assignee', 'подрядчик', 'contractor'],
  date: ['дата', 'date', 'изменено', 'updated', 'срок'],
  comment: ['комментарий', 'примечание', 'comment', 'note', 'remarks', 'описание', 'details'],
  // Column F: Прямые затраты - Итого за единицу
  pzTotal: ['итого за единицу', 'прямые затраты', 'пз итого', 'итого пз', 'total cost', 'итоговая сумма', 'сумма', 'итого', 'total', 'стоимость'],
  // Column D: Прямые затраты - Итого работ
  pzLabor: ['итого работ', 'работ за ед', 'пз работа', 'labor', 'трудозатраты', 'монтаж'],
  // Column E: Прямые затраты - Итого материалы
  pzMaterial: ['итого материал', 'материалы за', 'пз материал', 'материал', 'material', 'материалы'],
  // Column I: Коммерческие затраты - Итого за единицу
  kp: ['коммерческ', 'кп', 'commercial', 'цена', 'price'],
  // Column B: Объем or quantity
  area: ['объем', 'объём', 'volume', 'количество', 'кол-во', 'qty', 'quantity', 'площадь', 'area'],
  volume: ['объем', 'объём', 'volume', 'м3', 'm3'],
  // Column C: Ед. изм.
  concreteGrade: ['ед. изм', 'ед.изм', 'единица', 'ед', 'unit', 'марка'],
  concreteVolume: ['объем бетона', 'объём бетона', 'бетон м3', 'concrete volume'],
  rebarTonnage: ['арматура', 'армирование', 'rebar', 'тонн', 'tonnage', 'арм'],
  // Column J: Итого за единицу общей площади
  projectName: ['итого за единицу общей площади', 'общей площади', 'за единицу общей', 'проект', 'объект', 'project'],
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
  const [searchQuery, setSearchQuery] = useState('');

  // Tender projects state (hierarchical Excel data)
  const [tenderProjects, setTenderProjects] = useState<TenderProject[]>([]);

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

  // Enhanced import modal state
  const [importStep, setImportStep] = useState<'upload' | 'configure' | 'preview'>('upload');
  const [editableProjectName, setEditableProjectName] = useState<string>('');
  const [detectedColumns, setDetectedColumns] = useState<Record<string, number>>({});
  const [showAllPreviewRows, setShowAllPreviewRows] = useState(false);
  const [excludedRowIds, setExcludedRowIds] = useState<Set<string>>(new Set());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedWorkItems, setEditedWorkItems] = useState<WorkItem[]>([]);

  // Tender project selection for upload
  const [selectedTenderProjectId, setSelectedTenderProjectId] = useState<string>('new');
  const [newTenderProjectName, setNewTenderProjectName] = useState<string>('');
  const [pendingTenderProject, setPendingTenderProject] = useState<TenderProject | null>(null);
  const [fileCalculationDate, setFileCalculationDate] = useState<string>(''); // "Расчеты по дате изменения"

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

  // Tender project toggle functions
  const toggleTenderProjectExpanded = (projectId: string) => {
    setTenderProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, expanded: !p.expanded } : p))
    );
  };

  const toggleTenderFileExpanded = (projectId: string, fileId: string) => {
    setTenderProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId ? { ...f, expanded: !f.expanded } : f
              ),
            }
          : p
      )
    );
  };

  const toggleTenderSectionExpanded = (projectId: string, fileId: string, sectionId: string) => {
    setTenderProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      sections: f.sections.map((s) =>
                        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
                      ),
                    }
                  : f
              ),
            }
          : p
      )
    );
  };

  // State for editing comments in tender table
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState<string>('');

  // Update comment/category in tender row
  const updateTenderRowComment = (projectId: string, fileId: string, rowId: string, newComment: string) => {
    setTenderProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      sections: f.sections.map((s) => ({
                        ...s,
                        rows: s.rows.map((r) =>
                          r.id === rowId ? { ...r, category: newComment } : r
                        ),
                      })),
                    }
                  : f
              ),
            }
          : p
      )
    );
  };

  // Start editing a comment
  const startEditingComment = (rowId: string, currentValue: string) => {
    setEditingCommentId(rowId);
    setEditingCommentValue(currentValue);
  };

  // Save the edited comment
  const saveEditedComment = (projectId: string, fileId: string, rowId: string) => {
    updateTenderRowComment(projectId, fileId, rowId, editingCommentValue);
    setEditingCommentId(null);
    setEditingCommentValue('');
  };

  // Cancel editing
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentValue('');
  };

  const formatNumber = (num: number): string => num.toLocaleString('ru-RU');
  const formatCurrency = (num: number): string => num.toLocaleString('ru-RU') + ' ₽';

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
    console.log('parseExcelFile called for:', file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log('FileReader onload triggered');
        try {
          const data = e.target?.result;
          console.log('Data loaded, size:', typeof data === 'string' ? data.length : 'unknown');
          const workbook = XLSX.read(data, { type: 'binary' });
          console.log('Workbook parsed, sheets:', workbook.SheetNames);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];

          console.log('JSON data rows:', jsonData.length);
          console.log('First 5 rows:', jsonData.slice(0, 5));

          if (jsonData.length < 2) {
            throw new Error('Файл пуст или содержит менее 2 строк');
          }

          // Check if this is "Затрата тендера" format (Moscow tender format)
          // Fixed column positions: A=name, B=volume, C=unit, D-F=Прямые, G-I=Коммерческие, J=Total/GBA
          let isTenderFormat = false;
          let dataStartRow = 0;

          for (let i = 0; i < Math.min(5, jsonData.length); i++) {
            const row = jsonData[i];
            if (!row) continue;
            const firstCell = String(row[0] || '').toLowerCase();
            // Check for "затрата тендера" header or numbered items like "01."
            if (firstCell.includes('затрата') || firstCell.includes('тендер')) {
              isTenderFormat = true;
              console.log('Detected tender format at row:', i);
              continue;
            }
            // Find first data row (starts with "01." or similar pattern)
            if (/^\d{2}\./.test(String(row[0] || ''))) {
              dataStartRow = i;
              isTenderFormat = true;
              console.log('Data starts at row:', i);
              break;
            }
          }

          const workItems: WorkItem[] = [];
          const projectName = file.name.replace(/\.(xlsx?|csv)$/i, '').replace(/[_-]/g, ' ');

          // Initialize colIndices at outer scope so it's available for error messages
          let colIndices: Record<string, number> = {};

          if (isTenderFormat) {
            // Use FIXED column positions for tender format
            // A(0)=Затрата, B(1)=Объем, C(2)=Ед.изм, D(3)=ПЗ работ, E(4)=ПЗ матер, F(5)=ПЗ итого
            // G(6)=КП работ, H(7)=КП матер, I(8)=КП итого, J(9)=Итого/GBA
            console.log('Using tender format with fixed columns');

            colIndices = {
              category: 0,      // A - Затрата тендера
              area: 1,          // B - Объем
              concreteGrade: 2, // C - Ед. изм.
              pzLabor: 3,       // D - Итого работ (Прямые)
              pzMaterial: 4,    // E - Итого материалы (Прямые)
              pzTotal: 5,       // F - Итого за единицу (Прямые)
              kp: 8,            // I - Итого за единицу (Коммерческие)
              projectName: 9,   // J - Итого за единицу общей площади
            };
            setDetectedColumns(colIndices);

            for (let i = dataStartRow; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;

              const description = String(row[0] || '').trim();
              if (!description || description.length < 3) continue;

              // Skip header-like rows
              if (description.toLowerCase().includes('затрата тендера')) continue;
              if (description.toLowerCase().includes('прямые затраты')) continue;

              // Detect category from description
              const category = detectCategory(description);

              // Get values from fixed positions
              const volume = parseNumericValue(row[1]);
              const unit = String(row[2] || '-');
              const pzLabor = parseNumericValue(row[3]);
              const pzMaterial = parseNumericValue(row[4]);
              const pzTotal = parseNumericValue(row[5]);
              // KP labor and material are in columns 6-7 but we only use the total (column 8)
              parseNumericValue(row[6]); // kpLabor - available but not stored
              parseNumericValue(row[7]); // kpMaterial - available but not stored
              const kp = parseNumericValue(row[8]);
              const totalGBA = parseNumericValue(row[9]);

              // Skip rows with no data (but keep main section headers)
              const isMainSection = /^\d{2}\.\s+[А-ЯЁA-Z]/.test(description);
              const hasData = pzTotal > 0 || kp > 0 || totalGBA > 0;

              if (!hasData && !isMainSection) continue;

              workItems.push({
                id: `imported-${i}`,
                category,
                responsible: 'Не назначен',
                dateChanged: new Date().toISOString().split('T')[0],
                comment: description,
                pzTotal: Math.round(pzTotal),
                pzLabor: Math.round(pzLabor),
                pzMaterial: Math.round(pzMaterial),
                kp: Math.round(kp || pzTotal * 1.1),
                area: Math.round(volume) || 1,
                volume: Math.round(volume * 100) / 100,
                vsRatio: 0,
                concreteGrade: unit,
                concreteVolume: Math.round(totalGBA),
                rebarTonnage: 0,
                status: 'pending' as const,
              });
            }
          } else {
            // Fallback: Use pattern matching for other Excel formats
            let headerRowIndex = 0;
            const headerKeywords = ['затрата', 'объем', 'ед. изм', 'ед.изм', 'прямые', 'коммерческ', 'итого',
              'наименование', 'количество', 'сумма', 'цена', 'стоимость', 'работ', 'материал'];

            for (let i = 0; i < Math.min(15, jsonData.length); i++) {
              const row = jsonData[i];
              if (!row) continue;
              const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
              const matchCount = headerKeywords.filter(kw => rowStr.includes(kw)).length;
              if (matchCount >= 2) {
                headerRowIndex = i;
                break;
              }
            }

            const headers = jsonData[headerRowIndex]?.map(h => String(h || '')) || [];
            colIndices = {};
            for (const [key, patterns] of Object.entries(COLUMN_PATTERNS)) {
              colIndices[key] = findColumnIndex(headers, patterns);
            }
            setDetectedColumns(colIndices);

            const startRow = headerRowIndex + 1;
            for (let i = startRow; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.length === 0) continue;

              const categoryIdx = colIndices.category !== -1 ? colIndices.category : 0;
              const description = String(row[categoryIdx] || '').trim();
              if (!description || description.length < 3) continue;

              const category = detectCategory(description);
              const pzTotal = colIndices.pzTotal !== -1 ? parseNumericValue(row[colIndices.pzTotal]) : 0;
              const pzLabor = colIndices.pzLabor !== -1 ? parseNumericValue(row[colIndices.pzLabor]) : 0;
              const pzMaterial = colIndices.pzMaterial !== -1 ? parseNumericValue(row[colIndices.pzMaterial]) : 0;
              const kp = colIndices.kp !== -1 ? parseNumericValue(row[colIndices.kp]) : pzTotal * 1.1;
              const area = colIndices.area !== -1 ? parseNumericValue(row[colIndices.area]) : 0;

              if (pzTotal === 0 && kp === 0 && area === 0) continue;

              workItems.push({
                id: `imported-${i}`,
                category,
                responsible: 'Не назначен',
                dateChanged: new Date().toISOString().split('T')[0],
                comment: description,
                pzTotal: Math.round(pzTotal),
                pzLabor: Math.round(pzLabor),
                pzMaterial: Math.round(pzMaterial),
                kp: Math.round(kp),
                area: Math.round(area) || 1,
                volume: 0,
                vsRatio: 0,
                concreteGrade: '-',
                concreteVolume: 0,
                rebarTonnage: 0,
                status: 'pending' as const,
              });
            }
          }

          console.log('Work items parsed:', workItems.length);

          if (workItems.length === 0) {
            // Build helpful error message with detected columns info
            const colNames: Record<string, string> = {
              category: 'Наименование',
              pzTotal: 'Сумма/ПЗ Итого',
              area: 'Площадь/Количество',
              volume: 'Объём',
            };
            const foundCols = Object.entries(colIndices)
              .filter(([, idx]) => idx !== -1)
              .map(([key]) => colNames[key] || key)
              .filter(Boolean)
              .slice(0, 5);
            const missingRequired = ['category', 'pzTotal'].filter(key => colIndices[key] === -1);

            let errorMsg = 'Не удалось извлечь данные из файла.';
            if (missingRequired.length > 0) {
              errorMsg += ` Не найдены обязательные колонки: ${missingRequired.map(k => colNames[k]).join(', ')}.`;
            }
            if (foundCols.length > 0) {
              errorMsg += ` Найдены колонки: ${foundCols.join(', ')}.`;
            }
            errorMsg += ' Убедитесь, что файл содержит заголовки колонок и данные.';

            throw new Error(errorMsg);
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

  // Parse Excel file to hierarchical TenderProject format
  const parseExcelToTenderProject = useCallback(async (file: File): Promise<TenderProject> => {
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

          // ============================================
          // ROBUST COLUMN DETECTION - Scan all headers
          // ============================================

          interface ColumnMap {
            name: number;           // Затрата тендера
            volume: number;         // Объем
            unit: number;           // Ед. изм.
            pzLabor: number;        // Прямые затраты - Итого работ за ед.
            pzMaterial: number;     // Прямые затраты - Итого материалов за ед.
            pzTotal: number;        // Прямые затраты - Итого за единицу
            kzLabor: number;        // Коммерческие затраты - Итого работ за ед.
            kzMaterial: number;     // Коммерческие затраты - Итого материалов за ед.
            kzTotal: number;        // Коммерческие затраты - Итого за единицу
            totalPerGBA: number;    // Итого за ед. общей площади
          }

          const colMap: ColumnMap = {
            name: 0,
            volume: -1,
            unit: -1,
            pzLabor: -1,
            pzMaterial: -1,
            pzTotal: -1,
            kzLabor: -1,
            kzMaterial: -1,
            kzTotal: -1,
            totalPerGBA: -1,
          };

          // Collect ALL headers from first 5 rows into a combined view
          // This handles merged cells where headers span multiple rows
          const headerRows: (string | number | null)[][] = [];
          let dataStartRow = 0;

          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (!row) continue;

            const firstCell = String(row[0] || '').trim();

            // Check if this is a data row (starts with "01." or similar)
            if (/^\d{2}\./.test(firstCell)) {
              dataStartRow = i;
              break;
            }

            // This is a header row
            headerRows.push(row);
          }

          console.log('Header rows found:', headerRows.length);
          console.log('Data starts at row:', dataStartRow);

          // Build a combined header string for each column (merge all header rows)
          const maxCols = Math.max(...headerRows.map(r => r?.length || 0));
          const combinedHeaders: string[] = [];

          for (let col = 0; col < maxCols; col++) {
            const parts: string[] = [];
            for (const row of headerRows) {
              if (row && row[col]) {
                parts.push(String(row[col]).trim());
              }
            }
            combinedHeaders[col] = parts.join(' ').toLowerCase();
          }

          console.log('Combined headers:', combinedHeaders);

          // Track which columns are in PZ vs KZ group based on header order
          let currentGroup: 'none' | 'pz' | 'kz' = 'none';
          let pzItogoColumns: number[] = [];
          let kzItogoColumns: number[] = [];

          // Scan combined headers to find columns
          for (let col = 0; col < combinedHeaders.length; col++) {
            const header = combinedHeaders[col];

            // Detect main columns
            if (header.includes('затрата') && header.includes('тендер')) {
              colMap.name = col;
            } else if (header === 'объем' || (header.includes('объем') && !header.includes('итого'))) {
              colMap.volume = col;
            } else if (header.includes('ед') && header.includes('изм')) {
              colMap.unit = col;
            }

            // Detect group transitions
            if (header.includes('прямые') && header.includes('затрат')) {
              currentGroup = 'pz';
            } else if (header.includes('коммерческ') && header.includes('затрат')) {
              currentGroup = 'kz';
            }

            // Detect "Итого за ед. общей площади" - this ends the KZ group
            if (header.includes('итого') && header.includes('общ') && header.includes('площ')) {
              colMap.totalPerGBA = col;
              currentGroup = 'none';
            }

            // Collect "Итого" columns within each group
            if (header.includes('итого')) {
              if (currentGroup === 'pz') {
                // Check for specific sub-columns
                if (header.includes('работ') && header.includes('за ед')) {
                  colMap.pzLabor = col;
                } else if (header.includes('материал') && header.includes('за ед')) {
                  colMap.pzMaterial = col;
                } else if (header.includes('за единицу') ||
                           (header.includes('итого') && !header.includes('работ') && !header.includes('материал'))) {
                  pzItogoColumns.push(col);
                }
              } else if (currentGroup === 'kz') {
                // Check for specific sub-columns
                if (header.includes('работ') && header.includes('за ед')) {
                  colMap.kzLabor = col;
                } else if (header.includes('материал') && header.includes('за ед')) {
                  colMap.kzMaterial = col;
                } else if (header.includes('за единицу') ||
                           (header.includes('итого') && !header.includes('работ') && !header.includes('материал'))) {
                  kzItogoColumns.push(col);
                }
              }
            }
          }

          // Fallback: Use last "Итого" column in each group as the total
          if (colMap.pzTotal < 0 && pzItogoColumns.length > 0) {
            colMap.pzTotal = pzItogoColumns[pzItogoColumns.length - 1];
          }
          if (colMap.kzTotal < 0 && kzItogoColumns.length > 0) {
            colMap.kzTotal = kzItogoColumns[kzItogoColumns.length - 1];
          }

          // More aggressive fallback: scan for any "Итого" patterns in sequence
          // Look for patterns like: "Итого работ", "Итого материал", "Итого" (total)
          if (colMap.pzLabor < 0 || colMap.pzMaterial < 0 || colMap.pzTotal < 0 ||
              colMap.kzLabor < 0 || colMap.kzMaterial < 0 || colMap.kzTotal < 0) {

            // Find ALL columns that contain "Итого"
            const allItogoColumns: {col: number, header: string}[] = [];
            for (let col = 0; col < combinedHeaders.length; col++) {
              if (combinedHeaders[col].includes('итого')) {
                allItogoColumns.push({ col, header: combinedHeaders[col] });
              }
            }

            console.log('All Итого columns found:', allItogoColumns);

            // Split into two halves: first half = PZ, second half = KZ
            if (allItogoColumns.length >= 6) {
              const midpoint = Math.floor(allItogoColumns.length / 2);
              const pzCols = allItogoColumns.slice(0, midpoint);
              const kzCols = allItogoColumns.slice(midpoint);

              // Last 3 in each half: работы, материалы, итого
              if (pzCols.length >= 3 && colMap.pzTotal < 0) {
                colMap.pzLabor = pzCols[pzCols.length - 3].col;
                colMap.pzMaterial = pzCols[pzCols.length - 2].col;
                colMap.pzTotal = pzCols[pzCols.length - 1].col;
              }
              if (kzCols.length >= 3 && colMap.kzTotal < 0) {
                // Exclude the last one if it's "итого общей площади"
                const lastKz = kzCols[kzCols.length - 1];
                if (lastKz.header.includes('общ') && lastKz.header.includes('площ')) {
                  colMap.totalPerGBA = lastKz.col;
                  if (kzCols.length >= 4) {
                    colMap.kzLabor = kzCols[kzCols.length - 4].col;
                    colMap.kzMaterial = kzCols[kzCols.length - 3].col;
                    colMap.kzTotal = kzCols[kzCols.length - 2].col;
                  }
                } else {
                  colMap.kzLabor = kzCols[kzCols.length - 3].col;
                  colMap.kzMaterial = kzCols[kzCols.length - 2].col;
                  colMap.kzTotal = kzCols[kzCols.length - 1].col;
                }
              }
            }
          }

          // Simple positional fallbacks
          if (colMap.volume < 0) colMap.volume = 2;
          if (colMap.unit < 0) colMap.unit = 3;

          // Log final column mapping
          console.log('Final column mapping:', colMap);

          const projectName = file.name.replace(/\.(xlsx?|csv)$/i, '').replace(/[_-]/g, ' ');
          const sections: TenderSection[] = [];
          let currentSection: TenderSection | null = null;

          for (let i = dataStartRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const name = String(row[colMap.name] || '').trim();
            if (!name || name.length < 2) continue;

            // Skip header rows that might appear in data
            const nameLower = name.toLowerCase();
            if (nameLower.includes('затрата тендера')) continue;
            if (nameLower.includes('прямые затраты')) continue;
            if (nameLower.includes('коммерческие затраты')) continue;

            // Extract values using detected column positions
            const volume = colMap.volume >= 0 ? parseNumericValue(row[colMap.volume]) : 0;
            const unit = colMap.unit >= 0 ? String(row[colMap.unit] || '') : '';
            const pzLabor = colMap.pzLabor >= 0 ? parseNumericValue(row[colMap.pzLabor]) : 0;
            const pzMaterial = colMap.pzMaterial >= 0 ? parseNumericValue(row[colMap.pzMaterial]) : 0;
            const pzTotal = colMap.pzTotal >= 0 ? parseNumericValue(row[colMap.pzTotal]) : 0;
            const kzLabor = colMap.kzLabor >= 0 ? parseNumericValue(row[colMap.kzLabor]) : 0;
            const kzMaterial = colMap.kzMaterial >= 0 ? parseNumericValue(row[colMap.kzMaterial]) : 0;
            const kzTotal = colMap.kzTotal >= 0 ? parseNumericValue(row[colMap.kzTotal]) : 0;
            const totalPerGBA = colMap.totalPerGBA >= 0 ? parseNumericValue(row[colMap.totalPerGBA]) : 0;

            // Check if this is a main section (XX. NAME) or sub-item (XX.XX. NAME)
            const isSectionHeader = /^\d{2}\.\s+[А-ЯЁA-Z]/.test(name) && !/^\d{2}\.\d{2}\./.test(name);

            // Detect category from the item name
            const category = detectCategory(name);

            const tenderRow: TenderRow = {
              id: `row-${i}`,
              name,
              category,
              volume,
              unit,
              pzLabor,
              pzMaterial,
              pzTotal,
              kzLabor,
              kzMaterial,
              kzTotal,
              totalPerGBA,
              isSection: isSectionHeader,
              sectionId: currentSection?.id,
            };

            if (isSectionHeader) {
              // Save previous section if exists
              if (currentSection && currentSection.rows.length > 0) {
                sections.push(currentSection);
              }

              // Start new section
              currentSection = {
                id: `section-${i}`,
                name,
                rows: [tenderRow],
                expanded: true,
                totals: {
                  pzLabor,
                  pzMaterial,
                  pzTotal,
                  kzLabor,
                  kzMaterial,
                  kzTotal,
                  totalPerGBA,
                },
              };
            } else if (currentSection) {
              // Add to current section
              tenderRow.sectionId = currentSection.id;
              currentSection.rows.push(tenderRow);
            }
          }

          // Add last section
          if (currentSection && currentSection.rows.length > 0) {
            sections.push(currentSection);
          }

          // NO CALCULATIONS - Section totals use values directly from Excel section header row

          // Return parsed data (will be wrapped in TenderFile/TenderProject in confirmImport)
          const parsedData = {
            name: projectName, // File name from Excel
            sections,
          };

          resolve(parsedData as unknown as TenderProject);
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
      // Parse both formats
      const [project, tenderProject] = await Promise.all([
        parseExcelFile(file),
        parseExcelToTenderProject(file),
      ]);

      setParsedPreview(project);
      setEditableProjectName(project.name);
      setEditedWorkItems(project.workItems);
      setExcludedRowIds(new Set());

      // Store tender project for later - let user select/create tender project name first
      // tenderProject is actually {name, sections} from parseExcelToTenderProject
      const parsedData = tenderProject as unknown as { name: string; sections: TenderSection[] };
      if (parsedData.sections.length > 0) {
        setPendingTenderProject(tenderProject);
        setNewTenderProjectName(''); // Let user enter project name
        setSelectedTenderProjectId('new'); // Default to creating new project
      }

      setImportStep('preview');
      setUploadProgress('success');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ошибка парсинга файла');
      setUploadProgress('error');
    }
  }, [parseExcelFile, parseExcelToTenderProject]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
    console.log('handleFileInputChange triggered');
    const files = e.target.files;
    console.log('Files selected:', files?.length, files?.[0]?.name);
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Update work item in editable list
  const updateWorkItem = useCallback((id: string, updates: Partial<WorkItem>) => {
    setEditedWorkItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Toggle row exclusion
  const toggleRowExclusion = useCallback((id: string) => {
    setExcludedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Get items to import (excluding excluded rows)
  const getItemsToImport = useCallback(() => {
    return editedWorkItems.filter(item => !excludedRowIds.has(item.id));
  }, [editedWorkItems, excludedRowIds]);

  // Confirm import
  const confirmImport = () => {
    const itemsToImport = getItemsToImport();

    // Handle tender project import (for Основные показатели)
    if (pendingTenderProject) {
      const projectName = newTenderProjectName.trim() || 'Новый проект';
      // pendingTenderProject is actually {name, sections} from parseExcelToTenderProject
      const parsedData = pendingTenderProject as unknown as { name: string; sections: TenderSection[] };
      const fileName = parsedData.name; // Original file name

      // Create the file object from pending tender project
      // Clear the "Комментарий" (category) column - user will add comments manually
      const sectionsWithClearedComments = parsedData.sections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          category: '', // Clear comment field on upload - will show "+ добавить" hint
        })),
      }));

      const newFile: TenderFile = {
        id: `file-${Date.now()}`,
        name: fileName,
        uploadedAt: new Date().toISOString(),
        calculationDate: fileCalculationDate || new Date().toISOString().split('T')[0], // Use today if not specified
        sections: sectionsWithClearedComments,
        expanded: true,
      };

      if (selectedTenderProjectId === 'new') {
        // Create new tender project with user-provided name
        const newProject: TenderProject = {
          id: `tender-${Date.now()}`,
          name: projectName,
          code: `PRJ-${Date.now().toString(36).toUpperCase()}`,
          files: [newFile],
          expanded: true,
        };
        setTenderProjects(prev => [...prev, newProject]);
      } else {
        // Add file to existing tender project
        setTenderProjects(prev => prev.map(project => {
          if (project.id === selectedTenderProjectId) {
            return {
              ...project,
              files: [...project.files, newFile],
            };
          }
          return project;
        }));
      }
    }

    // Handle legacy project import
    if (itemsToImport.length > 0) {
      const projectToImport: Project = {
        id: `imported-${Date.now()}`,
        name: editableProjectName || parsedPreview?.name || 'Импортированный проект',
        code: parsedPreview?.code || `IMP-${Date.now().toString(36).toUpperCase()}`,
        address: parsedPreview?.address || 'Импортировано из Excel',
        totalArea: itemsToImport.reduce((sum, item) => sum + item.area, 0) || 10000,
        workItems: itemsToImport,
        expanded: true,
      };

      if (selectedTargetProject === 'new') {
        setProjects(prev => [projectToImport, ...prev]);
      } else {
        setProjects(prev => prev.map(project => {
          if (project.id === selectedTargetProject) {
            const newWorkItems = itemsToImport.map((item, idx) => ({
              ...item,
              id: `${project.id}-imported-${Date.now()}-${idx}`,
            }));
            return {
              ...project,
              workItems: [...project.workItems, ...newWorkItems],
              totalArea: project.totalArea + projectToImport.totalArea,
            };
          }
          return project;
        }));
      }
    }

    resetUploadModal();
    // Navigate to Indicators page to show the imported data
    setActiveNav('indicators');
  };

  // Reset upload modal
  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadProgress('idle');
    setUploadError(null);
    setParsedPreview(null);
    setSelectedTargetProject('new');
    setImportStep('upload');
    setEditableProjectName('');
    setEditedWorkItems([]);
    setExcludedRowIds(new Set());
    setShowAllPreviewRows(false);
    setEditingRowId(null);
    setDetectedColumns({});
    // Reset tender project selection
    setSelectedTenderProjectId('new');
    setNewTenderProjectName('');
    setPendingTenderProject(null);
    setFileCalculationDate('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // RENDER: UPLOAD MODAL
  // ==========================================
  const renderUploadModal = () => {
    console.log('renderUploadModal called, showUploadModal:', showUploadModal);
    if (!showUploadModal) return null;
    console.log('Modal should render now!');

    const itemsToImport = getItemsToImport();
    const totalPz = itemsToImport.reduce((sum, item) => sum + item.pzTotal, 0);
    const totalArea = itemsToImport.reduce((sum, item) => sum + item.area, 0);
    const categories = [...new Set(editedWorkItems.map(w => w.category))];
    const displayedItems = showAllPreviewRows ? editedWorkItems : editedWorkItems.slice(0, 10);

    // Column name mapping for display
    const columnLabels: Record<string, string> = {
      category: 'Наименование',
      pzTotal: 'Сумма',
      pzLabor: 'Работа',
      pzMaterial: 'Материал',
      kp: 'Цена',
      area: 'Количество',
      volume: 'Объём',
      responsible: 'Ответственный',
      date: 'Дата',
    };

    return (
      <div className="modal-overlay" onClick={resetUploadModal}>
        <div className="upload-modal upload-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Импорт BOQ из Excel</h2>
            <button className="modal-close" onClick={resetUploadModal}>×</button>
          </div>

          {/* Step Indicator */}
          <div className="import-steps">
            <div className={`import-step ${importStep === 'upload' ? 'active' : uploadProgress === 'success' ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Загрузка</span>
            </div>
            <div className="step-connector" />
            <div className={`import-step ${importStep === 'preview' ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Настройка</span>
            </div>
            <div className="step-connector" />
            <div className={`import-step ${importStep === 'preview' && itemsToImport.length > 0 ? 'ready' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Импорт</span>
            </div>
          </div>

          <div className="modal-body">
            {/* STEP 1: Upload */}
            {(uploadProgress === 'idle' || uploadProgress === 'parsing') && (
              <>
                {uploadProgress === 'idle' && (
                  <>
                    <div
                      className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className="dropzone-text">
                        <p className="dropzone-title">Перетащите файл сюда</p>
                        <p className="dropzone-subtitle">или нажмите для выбора</p>
                      </div>
                      <div className="dropzone-formats">
                        Поддерживаемые форматы: .xlsx, .xls, .csv (до 10 МБ)
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn-primary"
                      style={{ marginTop: '1rem', width: '100%' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Выбрать файл
                    </button>

                    <div className="upload-instructions">
                      <h4>Рекомендации по формату:</h4>
                      <ul>
                        <li>Файл должен содержать заголовки колонок</li>
                        <li>Поддерживаемые колонки: <strong>Наименование, Сумма, Количество, Цена</strong></li>
                        <li>Система автоматически определит категории работ</li>
                        <li>После загрузки можно отредактировать данные</li>
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
              </>
            )}

            {/* Error State */}
            {uploadProgress === 'error' && (
              <div className="upload-status error">
                <div className="status-icon-large">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="error-message">{uploadError}</p>
                <button className="btn-secondary" onClick={() => setUploadProgress('idle')}>
                  Попробовать снова
                </button>
              </div>
            )}

            {/* STEP 2: Preview & Configure */}
            {uploadProgress === 'success' && parsedPreview && (
              <div className="upload-preview">
                {/* Editable Project Name */}
                <div className="preview-project-name">
                  <label>Название проекта:</label>
                  <input
                    type="text"
                    className="project-name-input"
                    value={editableProjectName}
                    onChange={(e) => setEditableProjectName(e.target.value)}
                    placeholder="Введите название проекта"
                  />
                </div>

                {/* Stats */}
                <div className="preview-stats">
                  <div className="preview-stat">
                    <span className="stat-value">{itemsToImport.length}</span>
                    <span className="stat-label">Позиций к импорту</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">{formatNumber(totalArea)}</span>
                    <span className="stat-label">м² площадь</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-value">{formatCurrency(totalPz * 1000)}</span>
                    <span className="stat-label">Сумма</span>
                  </div>
                </div>

                {/* Detected Columns Info */}
                {Object.keys(detectedColumns).length > 0 && (
                  <div className="detected-columns">
                    <h4>Распознанные колонки:</h4>
                    <div className="column-tags">
                      {Object.entries(detectedColumns)
                        .filter(([, idx]) => idx !== -1)
                        .slice(0, 6)
                        .map(([key, idx]) => (
                          <span key={key} className="column-tag">
                            {columnLabels[key] || key}: колонка {idx + 1}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tender Project Selector for Основные показатели */}
                {pendingTenderProject && (
                  <div className="target-project-selector tender-project-selector">
                    <h4>📊 Тендерный проект (Основные показатели):</h4>
                    <select
                      className="project-select"
                      value={selectedTenderProjectId}
                      onChange={(e) => setSelectedTenderProjectId(e.target.value)}
                    >
                      <option value="new">+ Создать новый тендерный проект</option>
                      {tenderProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </option>
                      ))}
                    </select>
                    {selectedTenderProjectId === 'new' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          Название тендерного проекта: <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="project-name-input"
                          value={newTenderProjectName}
                          onChange={(e) => setNewTenderProjectName(e.target.value)}
                          placeholder="Например: 305. Поликлиника (ASTERUS)"
                          required
                          style={{
                            borderColor: !newTenderProjectName.trim() ? '#ef4444' : undefined,
                          }}
                        />
                      </div>
                    )}
                    <p className="selector-hint">
                      {selectedTenderProjectId === 'new'
                        ? 'Будет создан новый тендерный проект с указанным названием'
                        : `Данные будут добавлены в существующий проект "${tenderProjects.find(p => p.id === selectedTenderProjectId)?.name}"`
                      }
                    </p>

                    {/* Date input for calculations - REQUIRED */}
                    <div className="calculation-date-input" style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                        📅 Расчеты по дате изменения: <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        className="project-name-input"
                        value={fileCalculationDate}
                        onChange={(e) => setFileCalculationDate(e.target.value)}
                        required
                        style={{
                          width: '200px',
                          borderColor: !fileCalculationDate ? '#ef4444' : undefined,
                        }}
                      />
                      {!fileCalculationDate && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          Обязательное поле
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Target Project Selector (Legacy) */}
                <div className="target-project-selector" style={{ display: 'none' }}>
                  <h4>Привязать к проекту:</h4>
                  <select
                    className="project-select"
                    value={selectedTargetProject}
                    onChange={(e) => setSelectedTargetProject(e.target.value)}
                  >
                    <option value="new">+ Создать новый проект</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categories Summary */}
                <div className="preview-categories">
                  <h4>Категории работ:</h4>
                  <div className="category-tags">
                    {categories.map(cat => {
                      const count = itemsToImport.filter(w => w.category === cat).length;
                      return (
                        <span key={cat} className={`category-tag ${count === 0 ? 'excluded' : ''}`}>
                          {cat} ({count})
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Editable Table */}
                <div className="preview-table-container">
                  <div className="preview-table-header">
                    <h4>Данные для импорта:</h4>
                    {excludedRowIds.size > 0 && (
                      <span className="excluded-count">
                        Исключено: {excludedRowIds.size}
                      </span>
                    )}
                  </div>
                  <div className="preview-table-scroll">
                    <table className="preview-table editable">
                      <thead>
                        <tr>
                          <th className="th-checkbox">
                            <input
                              type="checkbox"
                              checked={excludedRowIds.size === 0}
                              onChange={() => {
                                if (excludedRowIds.size === 0) {
                                  setExcludedRowIds(new Set(editedWorkItems.map(w => w.id)));
                                } else {
                                  setExcludedRowIds(new Set());
                                }
                              }}
                              title="Выбрать все"
                            />
                          </th>
                          <th>Категория</th>
                          <th>Описание</th>
                          <th className="th-number">Сумма</th>
                          <th className="th-number">Кол-во</th>
                          <th className="th-actions"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedItems.map(item => {
                          const isExcluded = excludedRowIds.has(item.id);
                          const isEditing = editingRowId === item.id;

                          return (
                            <tr key={item.id} className={`${isExcluded ? 'row-excluded' : ''} ${isEditing ? 'row-editing' : ''}`}>
                              <td className="td-checkbox">
                                <input
                                  type="checkbox"
                                  checked={!isExcluded}
                                  onChange={() => toggleRowExclusion(item.id)}
                                />
                              </td>
                              <td>
                                {isEditing ? (
                                  <select
                                    className="category-select"
                                    value={item.category}
                                    onChange={(e) => updateWorkItem(item.id, { category: e.target.value })}
                                  >
                                    {WORK_CATEGORIES.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="Общестроительные работы">Общестроительные работы</option>
                                  </select>
                                ) : (
                                  <span className="category-cell">{item.category}</span>
                                )}
                              </td>
                              <td className="td-description">
                                <span title={item.comment}>
                                  {item.comment.length > 40 ? item.comment.substring(0, 40) + '...' : item.comment}
                                </span>
                              </td>
                              <td className="td-number">{formatNumber(item.pzTotal)}</td>
                              <td className="td-number">{item.area > 0 ? formatNumber(item.area) : '-'}</td>
                              <td className="td-actions">
                                <button
                                  className="btn-icon"
                                  onClick={() => setEditingRowId(isEditing ? null : item.id)}
                                  title={isEditing ? 'Готово' : 'Редактировать'}
                                >
                                  {isEditing ? '✓' : '✎'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {editedWorkItems.length > 10 && (
                    <button
                      className="btn-show-more"
                      onClick={() => setShowAllPreviewRows(!showAllPreviewRows)}
                    >
                      {showAllPreviewRows
                        ? 'Скрыть'
                        : `Показать все (${editedWorkItems.length} позиций)`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={resetUploadModal}>
              Отмена
            </button>
            {uploadProgress === 'success' && (pendingTenderProject || itemsToImport.length > 0) && (
              <button
                className="btn-primary"
                onClick={confirmImport}
                disabled={!!pendingTenderProject && (!fileCalculationDate || (selectedTenderProjectId === 'new' && !newTenderProjectName.trim()))}
                style={{ opacity: (pendingTenderProject && (!fileCalculationDate || (selectedTenderProjectId === 'new' && !newTenderProjectName.trim()))) ? 0.5 : 1 }}
              >
                {pendingTenderProject && selectedTenderProjectId === 'new' && !newTenderProjectName.trim()
                  ? 'Укажите название проекта'
                  : pendingTenderProject && !fileCalculationDate
                    ? 'Укажите дату расчетов'
                    : `Импортировать`
                }
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
    // Calculate totals for a file
    const getFileTotals = (file: TenderFile) => {
      return file.sections.reduce(
        (acc, section) => ({
          pzLabor: acc.pzLabor + section.totals.pzLabor,
          pzMaterial: acc.pzMaterial + section.totals.pzMaterial,
          pzTotal: acc.pzTotal + section.totals.pzTotal,
          kzLabor: acc.kzLabor + section.totals.kzLabor,
          kzMaterial: acc.kzMaterial + section.totals.kzMaterial,
          kzTotal: acc.kzTotal + section.totals.kzTotal,
          totalPerGBA: acc.totalPerGBA + section.totals.totalPerGBA,
        }),
        { pzLabor: 0, pzMaterial: 0, pzTotal: 0, kzLabor: 0, kzMaterial: 0, kzTotal: 0, totalPerGBA: 0 }
      );
    };

    // Calculate grand totals for tender project (sum of all files)
    const getTenderProjectTotals = (project: TenderProject) => {
      return project.files.reduce(
        (acc, file) => {
          const fileTotals = getFileTotals(file);
          return {
            pzLabor: acc.pzLabor + fileTotals.pzLabor,
            pzMaterial: acc.pzMaterial + fileTotals.pzMaterial,
            pzTotal: acc.pzTotal + fileTotals.pzTotal,
            kzLabor: acc.kzLabor + fileTotals.kzLabor,
            kzMaterial: acc.kzMaterial + fileTotals.kzMaterial,
            kzTotal: acc.kzTotal + fileTotals.kzTotal,
            totalPerGBA: acc.totalPerGBA + fileTotals.totalPerGBA,
          };
        },
        { pzLabor: 0, pzMaterial: 0, pzTotal: 0, kzLabor: 0, kzMaterial: 0, kzTotal: 0, totalPerGBA: 0 }
      );
    };

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
        </div>

        {/* Tender Projects with Files */}
        {tenderProjects.length > 0 && (
          <div className="tender-projects-container">
            {tenderProjects.map((project) => {
              const projectTotals = getTenderProjectTotals(project);

              return (
                <div key={project.id} className="tender-project-section">
                  {/* Project Header (e.g., "305. Поликлиника (ASTERUS)") */}
                  <div
                    className="tender-project-header"
                    onClick={() => toggleTenderProjectExpanded(project.id)}
                  >
                    <div className="project-expand">{project.expanded ? '▼' : '▶'}</div>
                    <div className="project-info">
                      <h2>{project.name}</h2>
                      <span className="project-code">{project.code} • {project.files.length} файл(ов)</span>
                    </div>
                    <div className="project-stats">
                      <div className="project-stat">
                        <span className="stat-label">ПЗ Итого</span>
                        <span className="stat-value">{formatNumber(projectTotals.pzTotal)}</span>
                      </div>
                      <div className="project-stat highlight">
                        <span className="stat-label">КЗ Итого</span>
                        <span className="stat-value">{formatNumber(projectTotals.kzTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Files within Project */}
                  {project.expanded && project.files.map((file) => {
                    const fileTotals = getFileTotals(file);

                    return (
                      <div key={file.id} className="tender-file-section">
                        {/* File Header (e.g., "Затраты_Поликлиника_v2_Прямые_25-02-2026") */}
                        <div
                          className="tender-file-header"
                          onClick={() => toggleTenderFileExpanded(project.id, file.id)}
                        >
                          <div className="file-expand">{file.expanded ? '▼' : '▶'}</div>
                          <div className="file-info">
                            <span className="file-name">📄 {file.name}</span>
                            <span className="file-date">
                              Расчеты по дате: {new Date(file.calculationDate).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <div className="file-stats">
                            <span className="file-stat">ПЗ: {formatNumber(fileTotals.pzTotal)}</span>
                            <span className="file-stat highlight">КЗ: {formatNumber(fileTotals.kzTotal)}</span>
                          </div>
                        </div>

                        {/* Table with sections (shown when file is expanded) */}
                        {file.expanded && (
                          <div className="tender-table-container">
                            <table className="tender-table">
                              <thead>
                                <tr className="tender-header-row-1">
                                  <th rowSpan={2} className="th-name">Вид работ</th>
                                  <th rowSpan={2} className="th-category">Комментарий</th>
                                  <th rowSpan={2} className="th-volume">Объем</th>
                                  <th rowSpan={2} className="th-unit">Ед. изм.</th>
                                  <th colSpan={3} className="th-group th-pz">Прямые Затраты</th>
                                  <th colSpan={3} className="th-group th-kz">Коммерческие Затраты</th>
                                  <th rowSpan={2} className="th-gba">Итого за ед. общей площади</th>
                                </tr>
                                <tr className="tender-header-row-2">
                                  <th className="th-sub th-pz">Итого работ за ед.</th>
                                  <th className="th-sub th-pz">Итого материалов за ед.</th>
                                  <th className="th-sub th-pz">Итого за единицу</th>
                                  <th className="th-sub th-kz">Итого работ за ед.</th>
                                  <th className="th-sub th-kz">Итого материалов за ед.</th>
                                  <th className="th-sub th-kz">Итого за единицу</th>
                                </tr>
                              </thead>
                              <tbody>
                                {file.sections.map((section) => (
                                  <>
                                    {/* Section Header Row (Green) */}
                                    <tr
                                      key={section.id}
                                      className="tender-section-row"
                                      onClick={() => toggleTenderSectionExpanded(project.id, file.id, section.id)}
                                    >
                                      <td className="td-name td-section">
                                        <span className="section-expand">
                                          {section.expanded ? '▼' : '▶'}
                                        </span>
                                        {section.name}
                                      </td>
                                      <td className="td-category">{section.rows[0]?.category || ''}</td>
                                      <td className="td-volume">
                                        {section.rows[0]?.volume > 0
                                          ? formatNumber(section.rows[0].volume)
                                          : ''}
                                      </td>
                                      <td className="td-unit">{section.rows[0]?.unit || ''}</td>
                                      <td className="td-number td-pz">
                                        {formatNumber(section.totals.pzLabor)}
                                      </td>
                                      <td className="td-number td-pz">
                                        {formatNumber(section.totals.pzMaterial)}
                                      </td>
                                      <td className="td-number td-pz td-total">
                                        {formatNumber(section.totals.pzTotal)}
                                      </td>
                                      <td className="td-number td-kz">
                                        {formatNumber(section.totals.kzLabor)}
                                      </td>
                                      <td className="td-number td-kz">
                                        {formatNumber(section.totals.kzMaterial)}
                                      </td>
                                      <td className="td-number td-kz td-total">
                                        {formatNumber(section.totals.kzTotal)}
                                      </td>
                                      <td className="td-number td-gba">
                                        {formatNumber(section.totals.totalPerGBA)}
                                      </td>
                                    </tr>

                                    {/* Sub-items (shown when section is expanded) */}
                                    {section.expanded &&
                                      section.rows
                                        .filter((row) => !row.isSection)
                                        .map((row) => (
                                          <tr key={row.id} className="tender-item-row">
                                            <td className="td-name td-subitem">{row.name}</td>
                                            <td
                                              className="td-category td-editable"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingComment(row.id, row.category);
                                              }}
                                            >
                                              {editingCommentId === row.id ? (
                                                <input
                                                  type="text"
                                                  className="comment-edit-input"
                                                  value={editingCommentValue}
                                                  onChange={(e) => setEditingCommentValue(e.target.value)}
                                                  onBlur={() => saveEditedComment(project.id, file.id, row.id)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      saveEditedComment(project.id, file.id, row.id);
                                                    } else if (e.key === 'Escape') {
                                                      cancelEditingComment();
                                                    }
                                                  }}
                                                  autoFocus
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              ) : (
                                                <span className="editable-text" title="Нажмите для редактирования">
                                                  {row.category || <em style={{ color: 'var(--text-tertiary)' }}>+ добавить</em>}
                                                </span>
                                              )}
                                            </td>
                                            <td className="td-volume">
                                              {row.volume > 0 ? formatNumber(row.volume) : ''}
                                            </td>
                                            <td className="td-unit">{row.unit}</td>
                                            <td className="td-number td-pz">
                                              {row.pzLabor > 0 ? formatNumber(row.pzLabor) : ''}
                                            </td>
                                            <td className="td-number td-pz">
                                              {row.pzMaterial > 0 ? formatNumber(row.pzMaterial) : ''}
                                            </td>
                                            <td className="td-number td-pz td-total">
                                              {row.pzTotal > 0 ? formatNumber(row.pzTotal) : ''}
                                            </td>
                                            <td className="td-number td-kz">
                                              {row.kzLabor > 0 ? formatNumber(row.kzLabor) : ''}
                                            </td>
                                            <td className="td-number td-kz">
                                              {row.kzMaterial > 0 ? formatNumber(row.kzMaterial) : ''}
                                            </td>
                                            <td className="td-number td-kz td-total">
                                              {row.kzTotal > 0 ? formatNumber(row.kzTotal) : ''}
                                            </td>
                                            <td className="td-number td-gba">
                                              {row.totalPerGBA > 0 ? formatNumber(row.totalPerGBA) : ''}
                                            </td>
                                          </tr>
                                        ))}
                                  </>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="tender-totals-row">
                                  <td colSpan={4}>
                                    <strong>ИТОГО ({file.name}):</strong>
                                  </td>
                                  <td className="td-number td-pz">
                                    <strong>{formatNumber(fileTotals.pzLabor)}</strong>
                                  </td>
                                  <td className="td-number td-pz">
                                    <strong>{formatNumber(fileTotals.pzMaterial)}</strong>
                                  </td>
                                  <td className="td-number td-pz td-total">
                                    <strong>{formatNumber(fileTotals.pzTotal)}</strong>
                                  </td>
                                  <td className="td-number td-kz">
                                    <strong>{formatNumber(fileTotals.kzLabor)}</strong>
                                  </td>
                                  <td className="td-number td-kz">
                                    <strong>{formatNumber(fileTotals.kzMaterial)}</strong>
                                  </td>
                                  <td className="td-number td-kz td-total">
                                    <strong>{formatNumber(fileTotals.kzTotal)}</strong>
                                  </td>
                                  <td className="td-number td-gba">
                                    <strong>{formatNumber(fileTotals.totalPerGBA)}</strong>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state when no tender projects */}
        {tenderProjects.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>Нет загруженных данных</h3>
            <p>Импортируйте Excel файл для отображения показателей</p>
            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
              <span>📥</span> Импорт Excel
            </button>
          </div>
        )}

        <div className="legend-section">
          <h4>Условные обозначения:</h4>
          <div className="legend-items">
            <div className="legend-item"><strong>ПЗ</strong> - Прямые затраты</div>
            <div className="legend-item"><strong>КЗ</strong> - Коммерческие затраты</div>
            <div className="legend-item"><span className="legend-color legend-green"></span> Вид работы (раздел)</div>
            <div className="legend-item"><span className="legend-color legend-white"></span> Подпозиция</div>
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
