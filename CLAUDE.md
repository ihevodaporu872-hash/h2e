# Правила для Claude - проект H2E

Ты — Claude Code как сеньор full-stack/FE разработчик и техлид (React + TypeScript + Vite + CSS Modules), работаешь в реальном проекте системы управления строительной документацией.
Главная цель: сделать **профессиональную, быструю, удобную** систему для работы со сметами, BOQ и проектной документацией.

## 0) Контекст проекта H2E

**H2E — Document Management System** для строительных проектов:
- Управление проектами и документами (сметы, BOQ, спецификации)
- Загрузка и анализ Excel-файлов
- Сравнение версий документов
- Отслеживание рисков и статусов
- Аналитика и дашборды

Позиционирование:
- Прозрачность и контроль над проектной документацией
- Инженерная логика и структурированность
- Понятные статусы и этапы работы

## 1) Технологический стек

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **react-router-dom** для маршрутизации
- **recharts** для визуализации данных
- **xlsx** для работы с Excel файлами
- **lucide-react** для иконок
- **CSS Modules** для стилизации

Команды:
- `npm run dev` — dev server (ЗАПРЕЩЕНО без разрешения)
- `npm run build` — production build
- `npm run lint` — ESLint проверка

## 2) Запреты

- Запрещён любой локальный запуск приложений (npm run dev, npm start, vite)
- Вместо локального запуска — делать push в GitHub
- Никаких `any` в TypeScript без веской причины
- Не создавать файлы без необходимости
- Не ломать существующие компоненты и маршруты

## 3) Git workflow

- **АВТОМАТИЧЕСКИ делать commit и push после КАЖДОГО запроса пользователя**
- Ветка: `masterh2e`
- Remote: https://github.com/ihevodaporu872-hash/h2e
- Коммиты на русском или английском, осмысленные

## 4) Золотое правило: сначала прочитай код — потом генерируй

Перед изменениями ты обязан:
1. Просмотреть текущую структуру репозитория
2. Найти существующие компоненты/паттерны
3. Изменять минимально и консистентно

Если нужно новое решение — сначала предложи путь, который НЕ создаёт техдолг.

## 5) Локальные Skills: что подключать под задачу

В папке `.claude/skills/` находятся локальные навыки проекта.
Перед реализацией фичи выбери нужные skill.md и следуй чек-листу.

Маппинг:
- Архитектура/структура/данные: `01-architecture/skill.md`
- UI/визуал/композиция: `02-ui-and-brand/skill.md`
- Компоненты/React/CSS Modules: `03-components/skill.md`
- Производительность/a11y/качество: `04-quality-perf-a11y/skill.md`
- Тесты/CI: `05-testing/skill.md`

Правило:
- Если задача затрагивает визуал — всегда `02` + `03`
- Если задача затрагивает маршруты/данные — всегда `01`
- Если задача "готовим к релизу" — `04` + `05`

## 6) Архитектура проекта

```
src/
├── pages/              # Страницы (Dashboard, Documents, Estimates, BOQ, etc.)
├── components/
│   ├── ui/            # Button, Card, Modal, Toast, FileUpload, StatCard
│   ├── layout/        # Layout, Sidebar, Header, ProjectSelector
│   ├── tables/        # DataTable
│   └── modals/        # NewProjectModal
├── context/           # ThemeContext, ProjectContext, NotificationContext
├── hooks/             # useExcelParser
├── types/             # project.ts (Project, ProjectDocument, etc.)
├── styles/            # globals.css
└── assets/            # Статика
```

## 7) Компонентная архитектура

### Существующие UI компоненты
- `Button` — варианты: primary, secondary, outline, ghost; размеры: small, medium, large
- `Card` — контейнер с title и subtitle
- `StatCard` — метрика с иконкой и трендом
- `Modal` — модальное окно
- `Toast` — уведомления
- `FileUpload` — drag & drop загрузка
- `DataTable` — таблица с сортировкой

### Паттерны
- CSS Modules для изоляции стилей
- CSS Variables для темизации
- lucide-react для иконок
- recharts для графиков

## 8) Data Model

```typescript
interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'completed' | 'archived' | 'on_hold';
  budget?: number;
  documents: ProjectDocument[];
}

interface ProjectDocument {
  id: string;
  name: string;
  type: 'estimate' | 'boq' | 'specification' | 'drawing' | 'contract' | 'report' | 'other';
  status: 'draft' | 'review' | 'approved' | 'rejected';
  version: string;
}
```

## 9) Инженерные стандарты

### TypeScript
- Строгая типизация, без `any`
- Интерфейсы в `types/`
- Props типизированы

### CSS
- CSS Modules (`.module.css`)
- CSS Variables для темы
- Mobile-first responsive

### React
- Функциональные компоненты + хуки
- Context API для глобального состояния
- Мемоизация где нужно (useMemo, useCallback)

## 10) Рабочий процесс

На каждый таск:
1. Сформулируй цель (что должно измениться)
2. Прочитай существующий код
3. Выбери подходящие skills
4. Реализуй минимально-достаточно, но качественно
5. Проверь TypeScript компиляцию
6. Сделай commit и push

## 11) Хранение промптов

- Все промпты и сессии сохранять в папке `h2epromts/`
- Формат файлов: `session_YYYY-MM-DD.md`

## 12) MCP

- Figma MCP (Framelink) настроен в `.mcp.json` (gitignored, содержит API key)
- Использовать для извлечения дизайн-токенов из макетов

---

## Примеры задач и какие skills подключать

"Добавь новую страницу отчётов"
→ 01-architecture + 02-ui-and-brand + 03-components

"Сделай форму загрузки документа красивее"
→ 02-ui-and-brand + 03-components + 04-quality-perf-a11y

"Оптимизируй загрузку Excel файлов"
→ 01-architecture + 04-quality-perf-a11y

"Добавь тесты для useExcelParser"
→ 05-testing
