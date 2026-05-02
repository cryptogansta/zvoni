# Звони — видеозвонки

Быстрые видеозвонки в браузере. Без лишнего шума.

## Запуск (локально)

### 1. Предварительные требования

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker Desktop

### 2. Клонирование и зависимости

```bash
# Установить зависимости
pnpm install
```

### 3. Запустить инфраструктуру (PostgreSQL + Redis + LiveKit)

```bash
docker compose up -d
```

Это поднимет:
- PostgreSQL на порту `5433`
- Redis на порту `6380`
- LiveKit Server на портах `7880`, `7881`, `50100-50200/udp`

> LiveKit работает со своими собственными ключами — внешний аккаунт **не нужен**.

### 4. Настроить переменные окружения

```bash
# Backend
cp .env.example apps/api/.env
# Frontend (уже создан)
# apps/web/.env.local уже содержит нужные значения для локальной разработки
```

### 5. Выполнить миграции базы данных

```bash
cd apps/api
npx prisma migrate dev --name init
cd ../..
```

### 6. Запустить проект

```bash
# Запустить оба сервиса одновременно
pnpm dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- LiveKit: ws://localhost:7880

---

## Структура проекта

```
zvoni/
├── apps/
│   ├── api/          # Fastify backend (Node.js + TypeScript)
│   │   ├── prisma/   # Схема БД и миграции
│   │   └── src/
│   │       ├── routes/      # API endpoints
│   │       ├── providers/   # Media, Transcription, AI providers
│   │       └── ws/          # Socket.io handler
│   └── web/          # Next.js 14 frontend
│       └── src/
│           ├── app/         # Next.js App Router pages
│           ├── components/  # UI, call, chat, lobby компоненты
│           ├── lib/         # API client, Socket.io, hooks
│           └── store/       # Zustand stores
├── docker-compose.yml
└── livekit.yaml
```

## Архитектура провайдеров

### Media (LiveKit)
```
src/providers/media/LiveKitMediaProvider.ts
```
Генерирует JWT-токены для подключения к self-hosted LiveKit серверу.

### Транскрипция
```
src/providers/transcription/TranscriptionProvider.interface.ts
src/providers/transcription/MockTranscriptionProvider.ts
```
В MVP: mock. Для production подключи: Whisper, Deepgram, Yandex SpeechKit.

### AI Summary
```
src/providers/ai/AISummaryProvider.interface.ts
src/providers/ai/MockAISummaryProvider.ts
```
В MVP: mock. Для production подключи: OpenAI, Claude API.

---

## Деплой на VPS

1. Скопируй `docker-compose.yml` и `livekit.yaml` на VPS
2. В `livekit.yaml` замени ключ на секретный (мин. 32 символа)
3. В `apps/api/.env` обнови `DATABASE_URL`, `REDIS_URL`, `LIVEKIT_*`, `FRONTEND_URL`
4. В `apps/web/.env.local` обнови `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_LIVEKIT_URL` (wss://)
5. `docker compose up -d`
6. `cd apps/api && npx prisma migrate deploy`
7. Запусти `pnpm build` и `pnpm start` или используй PM2/systemd

> Убедись что на VPS открыты порты: 3000 (web), 3001 (api), 7880 (livekit ws), 50100-50200 (udp для WebRTC).

---

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| POST | /api/auth/logout | Выход |
| GET | /api/me | Текущий пользователь |
| POST | /api/rooms | Создать комнату |
| GET | /api/rooms/:id | Получить комнату |
| POST | /api/rooms/:id/join | Войти (получить LiveKit токен) |
| POST | /api/rooms/:id/leave | Покинуть комнату |
| GET | /api/rooms/:id/messages | История чата |
| POST | /api/rooms/:id/media-token | Переполучить токен |
| POST | /api/rooms/:id/transcription/start | Запустить транскрипцию |
| POST | /api/rooms/:id/transcription/stop | Остановить транскрипцию |
| GET | /api/rooms/:id/summary | Итоги встречи |
| GET | /api/join/:token | Разрешить invite-ссылку |

## Следующие этапы

- [ ] Этап 2: Мобильный браузер + PWA
- [ ] Этап 3: macOS-приложение (Tauri)
- [ ] Этап 4: iPhone (React Native)
- [ ] Этап 5: Android (React Native)
- [ ] Подключить реального AI-провайдера (транскрипция + summary)
- [ ] Шумоподавление (Krisp или RNNoise)
- [ ] Запись звонков
- [ ] Биллинг
