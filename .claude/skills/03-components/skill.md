# Skill: Component Implementation (React + CSS Modules)

## Цель
Использовать существующие UI компоненты как основу интерфейса, CSS Modules для изоляции стилей.

## Существующие компоненты H2E
### UI Components (`components/ui/`)
- `Button` — кнопки (primary, secondary, outline, ghost)
- `Card` — контейнер с заголовком и подзаголовком
- `StatCard` — карточка метрики с иконкой и трендом
- `Modal` — модальное окно
- `Toast` — уведомления
- `FileUpload` — загрузка файлов (drag & drop)

### Layout Components (`components/layout/`)
- `Layout` — основной layout
- `Sidebar` — навигация с секциями
- `Header` — шапка с поиском и действиями
- `ProjectSelector` — выбор проекта

### Tables (`components/tables/`)
- `DataTable` — таблица с сортировкой

## Правила использования
- UI primitives только из существующих компонентов
- Кастомные компоненты строятся из primitives
- Стили: через CSS Modules, избегай inline styles

## CSS Modules hygiene
- Имена классов: camelCase (`styles.cardHeader`)
- Группировать логически связанные стили
- Использовать CSS Variables для цветов/размеров
- Не дублировать стили — выносить общее в globals.css

## Создание нового компонента
1. Создать `ComponentName.tsx` и `ComponentName.module.css`
2. Определить TypeScript интерфейс для props
3. Использовать существующие UI primitives где возможно
4. Добавить поддержку темной темы через CSS Variables

## DoD
- Компоненты соответствуют существующим паттернам
- Минимум кастомного кода
- Код читается и легко поддерживается
- Props типизированы
