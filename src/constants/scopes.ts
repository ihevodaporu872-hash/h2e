import type { ScopeDefinition } from '../types/tender';

// 13 Standard Construction Scopes (Общестрой) for residential buildings in Russia
export const CONSTRUCTION_SCOPES: ScopeDefinition[] = [
  {
    id: 'vzis',
    nameRu: 'ВЗиС',
    nameEn: 'Temporary buildings and structures',
    keywords: [
      'временные', 'мобилизация', 'бытовки', 'ограждение стройплощадки',
      'временное электроснабжение', 'временное водоснабжение', 'демобилизация',
      'охрана', 'временные дороги', 'вахтовый городок'
    ],
    icon: 'Building2',
    color: '#6366f1'
  },
  {
    id: 'earthwork',
    nameRu: 'Земляные работы',
    nameEn: 'Earthwork',
    keywords: [
      'грунт', 'котлован', 'выемка', 'насыпь', 'планировка',
      'разработка грунта', 'обратная засыпка', 'вывоз грунта',
      'утилизация грунта', 'экскаватор', 'бульдозер', 'земля'
    ],
    icon: 'Mountain',
    color: '#8b5cf6'
  },
  {
    id: 'excavation',
    nameRu: 'Ограждение котлована',
    nameEn: 'Excavation support',
    keywords: [
      'шпунт', 'крепление', 'стенки котлована', 'ограждение котлована',
      'шпунтовое ограждение', 'стена в грунте', 'буросекущие сваи',
      'распорная система', 'анкерное крепление'
    ],
    icon: 'Fence',
    color: '#a855f7'
  },
  {
    id: 'dewatering',
    nameRu: 'Водопонижение',
    nameEn: 'Dewatering',
    keywords: [
      'водоотлив', 'дренаж', 'понижение уровня', 'насосы',
      'водопонижение', 'грунтовые воды', 'иглофильтры',
      'скважины', 'водоотведение', 'откачка'
    ],
    icon: 'Droplets',
    color: '#3b82f6'
  },
  {
    id: 'piling',
    nameRu: 'Свайные работы',
    nameEn: 'Piling',
    keywords: [
      'сваи', 'забивка', 'бурение', 'ростверк', 'свайное поле',
      'буронабивные сваи', 'забивные сваи', 'шнековые сваи',
      'испытание свай', 'срубка голов свай', 'свайный фундамент'
    ],
    icon: 'ArrowDown',
    color: '#0ea5e9'
  },
  {
    id: 'concrete',
    nameRu: 'Бетонные работы',
    nameEn: 'Concrete works',
    keywords: [
      'бетон', 'опалубка', 'заливка', 'монолит', 'бетонирование',
      'фундамент', 'плита', 'стены', 'колонны', 'перекрытия',
      'лестницы', 'B25', 'B30', 'товарный бетон'
    ],
    icon: 'Box',
    color: '#64748b'
  },
  {
    id: 'reinforcement',
    nameRu: 'Армирование',
    nameEn: 'Reinforcement',
    keywords: [
      'арматура', 'каркас', 'А500', 'А400', 'сетка',
      'армирование', 'вязка арматуры', 'арматурные работы',
      'закладные детали', 'сварка арматуры'
    ],
    icon: 'Grid3x3',
    color: '#475569'
  },
  {
    id: 'masonry',
    nameRu: 'Каменные работы',
    nameEn: 'Masonry',
    keywords: [
      'кирпич', 'блок', 'кладка', 'перегородки', 'каменные работы',
      'газобетон', 'керамический блок', 'пеноблок', 'стены из блоков',
      'кирпичная кладка', 'раствор кладочный'
    ],
    icon: 'Layers',
    color: '#f97316'
  },
  {
    id: 'steel',
    nameRu: 'Металлоконструкции',
    nameEn: 'Structural steel',
    keywords: [
      'металл', 'сварка', 'монтаж МК', 'балка', 'колонна',
      'металлоконструкции', 'стальные конструкции', 'ферма',
      'прогон', 'связи', 'лестницы металлические'
    ],
    icon: 'Wrench',
    color: '#71717a'
  },
  {
    id: 'roofing',
    nameRu: 'Кровельные работы',
    nameEn: 'Roofing',
    keywords: [
      'кровля', 'крыша', 'покрытие', 'мембрана', 'кровельные работы',
      'рулонная кровля', 'мягкая кровля', 'утепление кровли',
      'пароизоляция', 'водосток', 'парапет'
    ],
    icon: 'Home',
    color: '#22c55e'
  },
  {
    id: 'waterproofing',
    nameRu: 'Гидроизоляция',
    nameEn: 'Waterproofing',
    keywords: [
      'гидроизоляция', 'герметизация', 'обмазочная', 'оклеечная',
      'проникающая гидроизоляция', 'изоляция фундамента',
      'битумная мастика', 'рулонная изоляция'
    ],
    icon: 'Shield',
    color: '#06b6d4'
  },
  {
    id: 'finishes',
    nameRu: 'Отделочные работы',
    nameEn: 'Finishes',
    keywords: [
      'штукатурка', 'покраска', 'плитка', 'полы', 'потолки',
      'отделочные работы', 'шпаклёвка', 'обои', 'ламинат',
      'керамогранит', 'подвесной потолок', 'наливной пол'
    ],
    icon: 'Paintbrush',
    color: '#ec4899'
  },
  {
    id: 'external',
    nameRu: 'Наружные работы',
    nameEn: 'External works',
    keywords: [
      'благоустройство', 'асфальт', 'озеленение', 'ограждение',
      'наружные сети', 'тротуары', 'парковка', 'малые архитектурные формы',
      'освещение', 'детская площадка', 'газон'
    ],
    icon: 'Trees',
    color: '#10b981'
  }
];

// Helper function to get scope by ID
export function getScopeById(id: string): ScopeDefinition | undefined {
  return CONSTRUCTION_SCOPES.find(scope => scope.id === id);
}

// Helper function to get scope name in Russian
export function getScopeNameRu(id: string): string {
  return getScopeById(id)?.nameRu || id;
}

// Document type labels in Russian
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  scope_of_works: 'Техническое задание / Scope of Works',
  technical_report: 'Технический отчёт',
  client_boq: 'BOQ Заказчика',
  specifications: 'Спецификации',
  drawings_list: 'Ведомость чертежей',
  other: 'Прочее'
};

// Workflow phase labels in Russian
export const WORKFLOW_PHASE_LABELS: Record<string, string> = {
  ingestion: 'Загрузка',
  alignment: 'Классификация',
  analysis: 'Проверка',
  output: 'BOQ'
};
