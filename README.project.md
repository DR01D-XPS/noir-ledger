# Noir Ledger by droid

`Noir Ledger` — премиальный full-stack сервис для учета личных финансов с темным интерфейсом, мультивалютностью, аналитикой, накоплениями, AI-ассистентом и разбором чеков через OpenAI.

Проект построен на `Next.js 16`, `TypeScript`, `Tailwind CSS`, `Radix UI`, `Recharts` и `OpenAI Responses API`.

## Что уже есть

- встроенные аккаунты `email + пароль` без внешней auth-зависимости
- синхронизация данных между устройствами через один аккаунт и серверное хранилище
- dashboard с балансом, расходами, доходами, целями и AI-сводкой
- CRUD для операций
- категории с готовыми иконками и согласованной палитрой
- цели накопления и пополнения целей
- аналитика с интерактивными графиками
- OpenAI-ассистент по личным финансам
- AI-разбор чеков с автозаполнением суммы, даты и категории
- мультивалютность с переключением валюты отображения в профиле
- PWA-ready интерфейс и standalone-поведение на iPhone

## Стек

- `Next.js 16` App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Radix UI`
- `Recharts`
- `OpenAI Responses API`

## Быстрый запуск

1. Установи зависимости:

```bash
npm install
```

2. Создай локальный env-файл:

```bash
cp .env.example .env.local
```

3. Заполни переменные окружения:

- `NEXT_PUBLIC_APP_URL`
- `NOIR_DATA_DIR` при желании задать собственную папку для аккаунтов и данных
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

4. Запусти приложение:

```bash
npm run dev
```

5. Открой:

```text
http://localhost:3000
```

## Переменные окружения

Смотри шаблон в [.env.example](/e:/informatica/финансы/.env.example).

Минимально нужны:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY`

Опционально:

- `NOIR_DATA_DIR`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## OpenAI

OpenAI используется для:

- AI-сводки и рекомендаций
- AI-чата по личным финансам
- разбора чеков и автозанесения расходов

Если `OPENAI_API_KEY` не указан, AI-маршруты вернут понятную ошибку настройки. Скрытых mock-режимов в приложении нет.

## Структура проекта

```text
src/
  app/
    (app)/                    защищенные страницы приложения
    api/
      account/state/          серверное хранилище финансового состояния
      ai/chat/                AI-чат
      ai/insights/            AI-аналитика
      ai/receipt/             разбор чеков
      auth/login/             вход по email и паролю
      auth/logout/            завершение сессии
      auth/register/          создание аккаунта
      auth/session/           текущая серверная сессия
      exchange-rates/         курсы валют
      health/                 healthcheck
  components/
    providers/                auth и finance providers
    *.tsx                     экраны, shell, графики, диалоги и UI
  lib/
    ai.ts                     сервисный слой OpenAI
    auth.ts                   клиентская авторизация
    currency.ts               мультивалютность и конвертация
    finance.ts                аналитика и вычисления
    local-store.ts            встроенные аккаунты и серверное хранилище
    presets.ts                готовые иконки и стили
    repository.ts             слой работы с данными
    seed.ts                   дефолтные профили и категории
    supabase/                 typed helpers
deploy/
  *.service                  systemd unit-файлы
  *.timer                    таймеры healthcheck
  *.caddy                    конфиг reverse proxy
```

## Продакшен

В папке [deploy](/e:/informatica/финансы/deploy) лежат шаблоны для:

- `systemd` сервиса приложения
- healthcheck-скрипта и таймера автоподнятия
- reverse proxy конфигурации

## Проверка качества

Перед деплоем рекомендуется прогнать:

```bash
npm run lint
npm run typecheck
npm run build
```

## Важно

- интерфейс сделан только в dark-стиле
- новые категории и цели создаются из готовых иконок и согласованных цветов
- все пользовательские данные привязаны к аккаунту и доступны на разных устройствах
- AI-слой отделен от UI и работает через отдельный сервисный слой
