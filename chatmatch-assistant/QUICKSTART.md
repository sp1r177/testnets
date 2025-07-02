# ChatMatch Assistant - Quick Start Guide 🚀

## Структура проекта
```
chatmatch-assistant/
├── 📁 backend/              # Node.js + Express + TypeScript API
│   ├── src/routes/          # API маршруты (auth, chat, subscription, webhooks)
│   ├── src/utils/           # Утилиты (usage limits, helpers)
│   ├── prisma/schema.prisma # Database schema
│   └── package.json
├── 📁 frontend/             # Next.js + React + TypeScript UI
│   ├── app/                 # Next.js App Router
│   ├── components/          # React компоненты
│   ├── contexts/            # React контексты (Auth)
│   └── package.json
├── 🐳 Dockerfile            # Контейнеризация
├── ⚙️ ecosystem.config.js   # PM2 конфигурация
├── 🚀 deploy.sh             # Production deployment script
├── 🔧 env.setup.sh          # Environment setup script
└── 📚 README.md             # Полная документация
```

## 🏃‍♂️ Быстрый старт (5 минут)

### 1. Настройка окружения
```bash
# Клонирование проекта
git clone <your-repo-url>
cd chatmatch-assistant

# Настройка .env файла
chmod +x env.setup.sh
./env.setup.sh

# Редактирование .env с вашими API ключами
nano .env
```

### 2. Получение API ключей

| Сервис | Ссылка | Переменная |
|--------|--------|------------|
| Telegram Bot | [@BotFather](https://t.me/BotFather) | `TELEGRAM_BOT_TOKEN` |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | `OPENAI_API_KEY` |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) | `STRIPE_SECRET_KEY` |

### 3. Локальный запуск

#### База данных (PostgreSQL)
```bash
docker run --name postgres-chatmatch \
  -e POSTGRES_DB=chatmatch_db \
  -e POSTGRES_USER=chatmatch \
  -e POSTGRES_PASSWORD=chatmatch_password \
  -p 5432:5432 -d postgres:15
```

#### Backend (терминал 1)
```bash
cd backend
npm install
npm run db:push    # Database setup
npm run dev        # Start on :3001
```

#### Frontend (терминал 2)
```bash
cd frontend
npm install
npm run dev        # Start on :3000
```

### 4. Production деплой
```bash
# На Ubuntu сервере
chmod +x deploy.sh
sudo ./deploy.sh

# Или с кастомными параметрами
PORT=3001 DATABASE_URL="postgresql://..." ./deploy.sh
```

## 🔑 Обязательные API ключи

### Telegram Bot Setup
1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Используйте команду `/newbot`
3. Скопируйте токен в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
   TELEGRAM_BOT_USERNAME=your_bot_username
   ```

### OpenAI API
1. Зарегистрируйтесь на [OpenAI Platform](https://platform.openai.com)
2. Создайте API ключ
3. Добавьте в `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

### Stripe (для платежей)
1. Создайте аккаунт на [Stripe](https://dashboard.stripe.com)
2. Создайте продукт "Pro Subscription" (499 ₽/месяц)
3. Добавьте ключи:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   ```

## 🎯 Тестирование

### Проверка бэкенда
```bash
curl http://localhost:3001/health
# Ожидаемый ответ: {"status":"OK","service":"ChatMatch Assistant Backend"}
```

### Проверка фронтенда
Откройте http://localhost:3000 в браузере

### Генерация тестового ответа
```bash
# Сначала авторизуйтесь через Telegram Login Widget
# Затем попробуйте API:
curl -X POST http://localhost:3001/api/chat/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "chatMessages": [
      {"sender": "other", "text": "Привет! Как дела?"}
    ],
    "tone": "friendly"
  }'
```

## 📱 Telegram WebApp

### Настройка WebApp кнопки
```javascript
// В коде вашего Telegram бота
const webAppButton = {
  text: "🚀 Открыть ChatMatch",
  web_app: {
    url: "https://your-domain.com"
  }
};
```

### Webhook настройка
```bash
# Установка webhook для бота
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.com/api/webhooks/telegram"
```

## 🐛 Устранение проблем

### База данных не подключается
```bash
# Проверка подключения
psql $DATABASE_URL -c "SELECT 1;"

# Пересоздание схемы
cd backend && npx prisma db push --force-reset
```

### PM2 процессы
```bash
pm2 status          # Статус процессов
pm2 logs            # Логи всех процессов
pm2 restart all     # Перезапуск
pm2 delete all      # Остановка всех процессов
```

### Nginx конфигурация
```bash
sudo nginx -t       # Проверка конфигурации
sudo systemctl reload nginx  # Перезагрузка
```

## 🔄 Обновление и развертывание

### Локальные изменения
```bash
# Backend
cd backend && npm run build && npm run dev

# Frontend  
cd frontend && npm run build && npm run dev
```

### Production обновление
```bash
# Остановка сервисов
pm2 stop all

# Обновление кода
git pull origin main

# Пересборка и запуск
./deploy.sh

# Проверка статуса
pm2 status
```

## 📊 Мониторинг

### PM2 Dashboard
```bash
pm2 monit           # Real-time monitoring
pm2 logs --lines 100 # Последние 100 строк логов
```

### Системные ресурсы
```bash
htop               # CPU и память
df -h              # Дисковое пространство
systemctl status nginx postgresql  # Статус сервисов
```

## 🎨 Кастомизация

### Добавление нового тона
1. Отредактируйте `backend/src/routes/chat.ts`:
```javascript
const TONES = {
  // ... существующие тоны
  casual: {
    name: 'Непринужденный',
    description: 'Расслабленный разговорный тон',
    systemPrompt: 'Отвечай непринужденно и расслабленно...'
  }
};
```

2. Обновите фронтенд для отображения нового тона

### Изменение лимитов
Отредактируйте `.env`:
```
FREE_GENERATIONS_PER_DAY=10
PRO_GENERATIONS_PER_MONTH=500
```

## 🔗 Полезные ссылки

- 📚 [Полная документация](README.md)
- 🤖 [Telegram Bot API](https://core.telegram.org/bots/api)
- 🧠 [OpenAI API](https://platform.openai.com/docs)
- 💳 [Stripe API](https://stripe.com/docs/api)
- 🚀 [Next.js Docs](https://nextjs.org/docs)

---

**Готово! 🎉** Ваш ChatMatch Assistant должен работать на http://localhost:3000