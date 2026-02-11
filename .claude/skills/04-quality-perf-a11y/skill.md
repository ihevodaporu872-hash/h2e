# Skill: Quality, Performance, Accessibility

## Цель
Приложение быстрое, доступное, без регрессий.

## Performance
- Lazy loading для тяжелых компонентов (recharts)
- Vite code splitting (уже настроено в vite.config.ts)
- Оптимизация бандла: vendor chunks разделены
- Минимизация re-renders через React.memo, useMemo, useCallback

## Работа с Excel файлами
- xlsx библиотека для парсинга
- Web Workers для тяжелых операций (опционально)
- Показывать loading state при обработке

## Accessibility (a11y)
- Семантические теги (header, nav, main, section, article)
- Keyboard navigation для всех интерактивных элементов
- Focus states видимые
- aria-label для иконок-кнопок без текста
- Достаточный контраст текста

## UX safeguards
- Loading states для асинхронных операций
- Error states с понятными сообщениями
- Empty states (когда нет данных)
- Toast уведомления для feedback

## Responsive Design
- Mobile-first подход
- Breakpoints: 768px (tablet), 1024px (desktop)
- Sidebar коллапсируется на мобильных

## DoD (Release checklist)
- `npm run lint` без ошибок
- `npm run build` успешен
- Навигация работает на всех breakpoints
- Формы не падают при ошибках
- Темная тема отображается корректно
