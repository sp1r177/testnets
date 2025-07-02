# ChatMatch Assistant 🚀

> AI-powered chat continuation service with Telegram WebApp integration

**ChatMatch Assistant** — это веб-приложение, которое помогает пользователям продолжать и развивать любой чат с помощью искусственного интеллекта. Поддерживает авторизацию через Telegram, платные подписки и интеграцию с Telegram WebApp.

## 🌟 Основные функции

- **AI генерация ответов**: 3 варианта продолжения переписки в выбранном тоне
- **Тоны общения**: Флирт, дружелюбный, серьёзный
- **Telegram интеграция**: Login Widget и WebApp поддержка
- **Платные подписки**: Stripe и Telegram Stars
- **Лимиты использования**: Free (5/день) и Pro (300/месяц)
- **История генераций**: Полная история всех созданных ответов

## 🏗️ Архитектура

```
chatmatch-assistant/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/         # API маршруты
│   │   ├── utils/          # Утилиты и хелперы
│   │   └── index.ts        # Главный файл сервера
│   ├── prisma/             # База данных схема
│   └── package.json
├── frontend/               # Next.js + React + TypeScript
│   ├── app/               # App Router (Next.js 13+)
│   ├── components/        # React компоненты
│   ├── contexts/          # React контексты
│   └── package.json
├── Dockerfile             # Контейнеризация
├── ecosystem.config.js    # PM2 конфигурация
├── deploy.sh             # Скрипт деплоя
└── .env.example          # Пример переменных окружения
```

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
git clone <your-repo-url>
cd chatmatch-assistant

# Настройка окружения
chmod +x env.setup.sh
./env.setup.sh
```

### 2. Получение API ключей

#### Telegram Bot
1. Создайте бота: [@BotFather](https://t.me/BotFather) → `/newbot`
2. Получите токен и добавьте в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_BOT_USERNAME=your_bot_username
   ```

#### OpenAI API
1. Перейдите на [OpenAI Platform](https://platform.openai.com/api-keys)
2. Создайте API ключ и добавьте в `.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

#### Stripe
1. Зарегистрируйтесь на [Stripe Dashboard](https://dashboard.stripe.com)
2. Создайте продукт "Pro Subscription" (499 ₽/месяц)
3. Добавьте ключи в `.env`:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   ```

### 3. Локальная разработка

```bash
# Запуск PostgreSQL (Docker)
docker run --name postgres-chatmatch \
  -e POSTGRES_DB=chatmatch_db \
  -e POSTGRES_USER=chatmatch \
  -e POSTGRES_PASSWORD=chatmatch_password \
  -p 5432:5432 -d postgres:15

# Бэкенд
cd backend
npm install
npm run dev

# Фронтенд (в новом терминале)
cd frontend
npm install
npm run dev
```

### 4. Production деплой

```bash
# На чистом Ubuntu сервере
chmod +x deploy.sh
sudo ./deploy.sh

# Или с переменными окружения
PORT=3001 DATABASE_URL="postgresql://..." ./deploy.sh
```

## 🔧 API Endpoints

### Авторизация
- `POST /api/auth/telegram` - Telegram Login Widget
- `POST /api/auth/webapp` - Telegram WebApp авторизация

### Чат и генерация
- `GET /api/chat/tones` - Доступные тоны
- `POST /api/chat/generate` - Генерация ответов
- `GET /api/chat/history` - История генераций
- `POST /api/chat/select/:id` - Отметить выбранный ответ

### Подписки
- `GET /api/subscription/info` - Информация о подписке
- `POST /api/subscription/stripe/create-checkout` - Stripe Checkout
- `POST /api/subscription/telegram-stars/create-invoice` - Telegram Stars
- `POST /api/subscription/cancel` - Отмена подписки

### Webhooks
- `POST /api/webhooks/stripe` - Stripe события
- `POST /api/webhooks/telegram` - Telegram bot события

## 🎯 Тоны общения

### Флирт
```javascript
{
  id: 'flirt',
  name: 'Флирт',
  description: 'Игривый и романтичный тон'
}
```

### Дружелюбный
```javascript
{
  id: 'friendly', 
  name: 'Дружелюбный',
  description: 'Тёплый и открытый тон'
}
```

### Серьёзный
```javascript
{
  id: 'serious',
  name: 'Серьёзный', 
  description: 'Деловой и вдумчивый тон'
}
```

## 💳 Модель подписки

### Free Plan
- ✅ 5 генераций в день
- ✅ 3 тона общения
- ✅ История последних генераций

### Pro Plan (499 ₽/месяц)
- ✅ 300 генераций в месяц
- ✅ 3 тона общения
- ✅ Полная история генераций
- ✅ Приоритетная поддержка
- ✅ Новые функции первыми

## 🔌 Telegram WebApp интеграция

### Настройка бота
```javascript
// Команды бота
/start - Запуск бота
/webapp - Открыть WebApp
/help - Помощь
```

### WebApp кнопка
```javascript
const webAppButton = {
  text: "🚀 Открыть ChatMatch Assistant",
  web_app: {
    url: "https://your-domain.com"
  }
};
```

### Обмен данными
```javascript
// Отправка данных из WebApp в бота
window.Telegram.WebApp.sendData(JSON.stringify({
  action: 'generation_completed',
  data: { generationId: '...' }
}));
```

## 🔐 Безопасность

### Telegram авторизация
- Проверка подписи через HMAC-SHA256
- Валидация временных меток (24 часа)
- Безопасное хранение токенов в httpOnly cookies

### API безопасность
- JWT токены с 30-дневным сроком действия
- Rate limiting (100 запросов/15 минут)
- CORS настройки
- Helmet.js security headers

### Stripe безопасность
- Webhook signature verification
- Secure customer ID mapping
- PCI DSS compliance

## 📊 Мониторинг

### PM2 Dashboard
```bash
pm2 monit              # Мониторинг в реальном времени
pm2 logs               # Просмотр логов
pm2 status             # Статус процессов
```

### Логи
```bash
# Структура логов
logs/
├── backend-error.log
├── backend-out.log
├── frontend-error.log
└── frontend-out.log
```

### Health Checks
```bash
curl http://localhost:3001/health
# Ответ: {"status":"OK","timestamp":"...","service":"ChatMatch Assistant Backend"}
```

## 🚀 Деплой и масштабирование

### Docker
```bash
# Сборка образа
docker build -t chatmatch-assistant .

# Запуск
docker run -d \
  --name chatmatch-app \
  -p 3000:3000 \
  -p 3001:3001 \
  -e DATABASE_URL="..." \
  chatmatch-assistant
```

### Nginx конфигурация
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

### SSL/TLS
```bash
# Certbot для Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 🔄 Обновление тонов

### Добавление нового тона
1. Обновите `backend/src/routes/chat.ts`:
```javascript
const TONES = {
  // ... существующие тоны
  business: {
    name: 'Деловой',
    description: 'Профессиональный корпоративный тон',
    systemPrompt: 'Ты помогаешь в деловой переписке...'
  }
};
```

2. Обновите фронтенд компоненты для отображения нового тона

### Настройка промптов
Промпты находятся в `TONES` объекте и могут быть настроены для каждого тона индивидуально.

## 🐛 Отладка

### Распространённые проблемы

#### База данных не подключается
```bash
# Проверка подключения
psql $DATABASE_URL -c "SELECT 1;"

# Миграции
cd backend && npx prisma db push
```

#### Telegram webhook не работает
```bash
# Установка webhook
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://your-domain.com/api/webhooks/telegram"
```

#### Stripe webhook fails
1. Проверьте endpoint URL в Stripe Dashboard
2. Убедитесь что webhook secret правильный
3. Проверьте логи: `pm2 logs backend`

## 📈 Performance

### Оптимизация
- Кэширование статических файлов через Nginx
- Gzip сжатие
- Image optimization в Next.js
- Database connection pooling

### Масштабирование
- Горизонтальное масштабирование с PM2 cluster mode
- Load balancing с Nginx
- Database read replicas для PostgreSQL
- CDN для статических ресурсов

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/new-feature`)
3. Commit изменения (`git commit -am 'Add new feature'`)
4. Push в branch (`git push origin feature/new-feature`)
5. Создайте Pull Request

## 📄 License

MIT License - см. [LICENSE](LICENSE) файл.

## 👥 Команда

- **Разработка**: ChatMatch Assistant Team
- **Поддержка**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@chatmatch-assistant.com

---

<div align="center">
  <p>Сделано с ❤️ для лучшего общения</p>
  <p>
    <a href="https://t.me/your_bot">Telegram Bot</a> •
    <a href="https://your-domain.com">Website</a> •
    <a href="https://github.com/your-repo">GitHub</a>
  </p>
</div>