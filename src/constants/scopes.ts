import type { ScopeDefinition } from '../types/tender';

// 13 Mandatory Scopes (MOSCOW STANDARD) for General Contractors
export const CONSTRUCTION_SCOPES: ScopeDefinition[] = [
  {
    id: 'vzis',
    nameRu: '1. ВЗиС',
    nameEn: 'Temporary facilities',
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
    nameRu: '2. Земляные работы',
    nameEn: 'Earthwork',
    keywords: [
      'грунт', 'котлован', 'выемка', 'насыпь', 'планировка',
      'разработка грунта', 'обратная засыпка', 'вывоз грунта',
      'утилизация грунта', 'экскаватор', 'бульдозер'
    ],
    icon: 'Mountain',
    color: '#8b5cf6'
  },
  {
    id: 'excavation',
    nameRu: '3. Ограждение котлована',
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
    nameRu: '4. Водопонижение',
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
    nameRu: '5. Свайные работы',
    nameEn: 'Piling',
    keywords: [
      'сваи', 'забивка', 'бурение', 'ростверк', 'свайное поле',
      'буронабивные сваи', 'забивные сваи', 'шнековые сваи',
      'испытание свай', 'срубка голов свай'
    ],
    icon: 'ArrowDown',
    color: '#0ea5e9'
  },
  {
    id: 'monolith_below',
    nameRu: '6. Монолит (Ниже 0)',
    nameEn: 'Concrete below grade',
    keywords: [
      'монолит подземной части', 'фундаментная плита', 'стены подвала',
      'ростверк', 'бетон ниже нуля', 'подземная часть', 'фундамент'
    ],
    icon: 'Box',
    color: '#64748b'
  },
  {
    id: 'monolith_above',
    nameRu: '7. Монолит (Выше 0)',
    nameEn: 'Concrete above grade',
    keywords: [
      'монолит надземной части', 'перекрытия', 'колонны', 'стены',
      'лестницы', 'бетон выше нуля', 'надземная часть', 'каркас'
    ],
    icon: 'Grid3x3',
    color: '#475569'
  },
  {
    id: 'waterproofing',
    nameRu: '8. Гидроизоляция/Утепление',
    nameEn: 'Waterproofing & Insulation',
    keywords: [
      'гидроизоляция', 'утепление', 'теплоизоляция', 'герметизация',
      'обмазочная', 'оклеечная', 'пенополистирол', 'минвата'
    ],
    icon: 'Shield',
    color: '#06b6d4'
  },
  {
    id: 'masonry',
    nameRu: '9. Кладка/Перегородки',
    nameEn: 'Masonry & Partitions',
    keywords: [
      'кирпич', 'блок', 'кладка', 'перегородки', 'газобетон',
      'керамический блок', 'пеноблок', 'кирпичная кладка'
    ],
    icon: 'Layers',
    color: '#f97316'
  },
  {
    id: 'roofing',
    nameRu: '10. Кровля',
    nameEn: 'Roofing',
    keywords: [
      'кровля', 'крыша', 'покрытие', 'мембрана', 'рулонная кровля',
      'мягкая кровля', 'утепление кровли', 'пароизоляция', 'водосток'
    ],
    icon: 'Home',
    color: '#22c55e'
  },
  {
    id: 'facade',
    nameRu: '11. Фасад',
    nameEn: 'Facade',
    keywords: [
      'фасад', 'вентфасад', 'штукатурка фасада', 'облицовка',
      'навесной фасад', 'утепление фасада', 'клинкер', 'керамогранит'
    ],
    icon: 'Paintbrush',
    color: '#ec4899'
  },
  {
    id: 'windows',
    nameRu: '12. Окна/Витражи',
    nameEn: 'Windows & Glazing',
    keywords: [
      'окна', 'витражи', 'остекление', 'стеклопакеты', 'алюминиевые',
      'ПВХ', 'двери', 'входные группы', 'светопрозрачные'
    ],
    icon: 'Wrench',
    color: '#71717a'
  },
  {
    id: 'external',
    nameRu: '13. Благоустройство',
    nameEn: 'Site improvements',
    keywords: [
      'благоустройство', 'асфальт', 'озеленение', 'ограждение',
      'тротуары', 'парковка', 'детская площадка', 'газон', 'освещение'
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
  scope_of_works: 'Техническое задание (ТЗ)',
  technical_report: 'Технический отчёт (ПЗ)',
  client_boq: 'BOQ Заказчика (Excel)',
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
