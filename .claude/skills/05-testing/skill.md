# Skill: Testing & CI

## Цель
Не ломать приложение при росте функционала и быстро ловить ошибки.

## Минимум (обязательно)
- `npm run lint` — ESLint проверка
- `npm run build` — TypeScript компиляция + Vite build без ошибок

## Типы тестов для H2E
### Unit тесты (рекомендуется)
- Хуки: useExcelParser
- Утилиты: форматирование дат, размеров файлов, бюджета
- Context логика: добавление/удаление проектов и документов

### Integration тесты (опционально)
- Загрузка файла через FileUpload
- Навигация между страницами
- Переключение темы

## Инструменты (если добавлять тесты)
- Vitest — test runner
- @testing-library/react — тестирование компонентов
- @testing-library/user-event — симуляция действий

## CI Pipeline (GitHub Actions)
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

## DoD
- Любой PR проходит lint и build
- Критические сценарии покрыты тестами (если тесты добавлены)
- Build artifacts корректно генерируются в dist/
