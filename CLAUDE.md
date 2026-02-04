# Правила для Claude - проект H2E

## Запреты
- Запрещён любой локальный запуск приложений (npm run dev, npm start, vite и т.д.)
- Вместо локального запуска - делать push в GitHub

## Git workflow
- **АВТОМАТИЧЕСКИ делать commit и push после КАЖДОГО запроса пользователя**
- После изменений делать commit и push в репозиторий
- Ветка: masterh2e
- Remote: https://github.com/ihevodaporu872-hash/h2e/tree/masterh2e

## Хранение промптов
- Все промпты и сессии сохранять в папке `h2epromts/`
- Формат файлов: `session_YYYY-MM-DD.md`
