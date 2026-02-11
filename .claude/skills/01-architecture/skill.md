# Skill: Project Architecture (React + Vite)

## Цель
Держать проект масштабируемым, быстрым и понятным: бизнес-логика отделена от UI, страницы — композиция компонентов, UI primitives — переиспользуемые.

## Принципы
- Компоненты: функциональные, с хуками
- Context API для глобального состояния (Project, Theme, Notification)
- Данные/типы — через `types/` (TypeScript interfaces)
- Не хардкодить тексты внутри JSX, кроме временного scaffolding

## Структура проекта H2E
```
src/
├── pages/              # Страницы приложения
├── components/
│   ├── ui/            # Базовые UI компоненты (Button, Card, Modal, Toast)
│   ├── layout/        # Layout, Sidebar, Header
│   ├── tables/        # DataTable и табличные компоненты
│   └── modals/        # Модальные окна
├── context/           # React Context providers
├── hooks/             # Кастомные хуки (useExcelParser и др.)
├── types/             # TypeScript типы и интерфейсы
├── styles/            # Глобальные стили
└── assets/            # Статические ресурсы
```

## Паттерны
### Page composition
Страница = набор секций и компонентов:
- `StatCard` — карточки метрик
- `Card` — контейнер контента
- `DataTable` — табличные данные
- `FileUpload` — загрузка файлов

### Data contracts
Определяй типы в `types/`:
- `Project`
- `ProjectDocument`
- `DocumentType`, `DocumentStatus`, `ProjectStatus`

### Context providers
- `ProjectContext` — управление проектами и документами
- `ThemeContext` — темная/светлая тема
- `NotificationContext` — toast уведомления

## DoD архитектуры
- Новая фича не ломает существующие маршруты
- Компоненты переиспользуемы
- Нет дублирования данных/типов в разных местах
- TypeScript строго типизирован (без `any`)
