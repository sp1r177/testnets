# 🧠 AI Анализ Отношений - Telegram WebApp

Полнофункциональный Telegram WebApp для AI-анализа отношений с монетизацией через подписки и реферальную систему.

## ✨ Возможности

- 🎯 **AI-анализ отношений** - 7 вопросов для определения архетипа
- 💳 **Монетизация** - Telegram Stars и CryptoBot интеграция
- 🔗 **Реферальная система** - 50% с каждой покупки по реферальной ссылке
- 📱 **Адаптивный дизайн** - Полная поддержка Telegram WebApp API
- 🎨 **Современный UI** - Красивый дизайн в стиле Telegram
- 📊 **База данных** - SQLite с полной схемой данных

## 🚀 Быстрый запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните переменные:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
CRYPTOBOT_API_KEY=your_cryptobot_api_key_here
WEBAPP_URL=https://yourdomain.com
BOT_USERNAME=your_bot_username
PORT=3000
NODE_ENV=production
```

### 3. Запуск приложения

```bash
# Для разработки
npm run dev

# Для продакшена
npm start
```

## 📋 Настройка Telegram бота

### 1. Создание бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Получите токен бота
4. Установите WebApp URL:
   ```
   /setmenubutton
   @your_bot_name
   WebApp
   https://yourdomain.com/app
   ```

### 2. Настройка webhook

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook"}'
```

### 3. Команды бота

Установите команды через BotFather:

```
start - 🧠 Начать анализ отношений
help - ℹ️ Помощь
profile - 👤 Мой профиль
```

## 🏗️ Архитектура проекта

```
telegram-relationship-ai/
├── backend/
│   ├── index.js              # Основной сервер
│   ├── database/
│   │   ├── schema.sql        # Схема базы данных
│   │   └── db.js            # Модуль работы с БД
│   └── routes/
│       ├── auth.js          # Авторизация
│       ├── questions.js     # Вопросы теста
│       ├── answers.js       # Ответы пользователей
│       ├── result.js        # Генерация результатов
│       ├── purchase.js      # Покупки и платежи
│       └── referral.js      # Реферальная система
├── public/
│   ├── index.html           # HTML интерфейс
│   ├── style.css            # Стили
│   └── app.js              # JavaScript логика
├── package.json
└── README.md
```

## 💳 Настройка платежей

### Telegram Stars

Telegram Stars поддерживаются нативно через Telegram Bot API:

```javascript
// Пример создания инвойса
const invoiceData = {
    chat_id: user.telegram_id,
    title: "Личный AI-план на 7 дней",
    description: "Персональный план развития отношений",
    payload: "payment_123",
    provider_token: "", // Для Stars не нужен
    currency: "XTR", // Telegram Stars
    prices: [{
        label: "AI план",
        amount: 149
    }]
};
```

### CryptoBot

1. Регистрируйтесь на [CryptoBot](https://t.me/CryptoBot)
2. Создайте приложение и получите API ключ
3. Добавьте ключ в `.env`:
   ```env
   CRYPTOBOT_API_KEY=your_api_key
   ```

## 🔄 API Endpoints

### Авторизация
- `POST /api/auth/telegram` - Авторизация через Telegram WebApp
- `GET /api/auth/profile/:userId` - Получение профиля пользователя

### Тестирование
- `GET /api/questions` - Получение всех вопросов
- `POST /api/answers` - Сохранение ответа
- `GET /api/answers/user/:userId` - Ответы пользователя
- `POST /api/result/generate` - Генерация результата
- `GET /api/result/user/:userId` - Получение результата

### Покупки
- `GET /api/purchase/products` - Список продуктов
- `POST /api/purchase/create-invoice/stars` - Создание инвойса для Stars
- `POST /api/purchase/create-invoice/crypto` - Создание инвойса для CryptoBot
- `GET /api/purchase/status/:paymentId` - Статус платежа

### Реферальная система
- `GET /api/referral/stats/:userId` - Статистика рефералов
- `GET /api/referral/link/:userId` - Реферальная ссылка
- `POST /api/referral/withdraw/:userId` - Вывод средств

## 🗄️ База данных

Проект использует SQLite с следующими таблицами:

- `users` - Пользователи
- `questions` - Вопросы теста
- `answers` - Ответы пользователей
- `results` - Результаты анализа
- `payments` - Платежи
- `referrals` - Реферальная система
- `archetypes` - Архетипы отношений

База данных автоматически создается при первом запуске.

## 🎨 Архетипы отношений

1. **Романтик** - Живет любовью и верит в идеальные отношения
2. **Избегающий** - Ценит свободу и боится потерять независимость  
3. **Стратег** - Подходит к отношениям рационально
4. **Искатель** - Ищет себя и свое место в любви

## 💰 Монетизация

### Продукты

1. **Личный AI-план на 7 дней** - 149 ₽
2. **Месячный путь + обратная связь** - 499 ₽
3. **Полный менторинг** - 999 ₽

### Реферальная система

- 50% с каждой покупки по реферальной ссылке
- Минимальная сумма для вывода: 100 Stars
- Автоматическое начисление после успешной оплаты

## 🚀 Деплой

### На VPS/VDS

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd telegram-relationship-ai
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Настройте `.env` файл

4. Установите PM2 для управления процессами:
   ```bash
   npm install -g pm2
   pm2 start backend/index.js --name "relationship-ai"
   pm2 startup
   pm2 save
   ```

5. Настройте Nginx (опционально):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### На Heroku

1. Создайте приложение:
   ```bash
   heroku create your-app-name
   ```

2. Установите переменные окружения:
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   heroku config:set WEBAPP_URL=https://your-app-name.herokuapp.com
   ```

3. Деплой:
   ```bash
   git push heroku main
   ```

### На Railway/Render

Просто подключите GitHub репозиторий и настройте переменные окружения.

## 🛠️ Разработка

### Структура кода

- Все API роуты находятся в `backend/routes/`
- Frontend логика в `public/app.js`
- Стили в `public/style.css`
- База данных инициализируется автоматически

### Добавление новых вопросов

Отредактируйте файл `backend/database/schema.sql` и добавьте новые вопросы в таблицу `questions`.

### Добавление новых архетипов

Добавьте новые архетипы в таблицу `archetypes` и обновите логику анализа в `backend/routes/result.js`.

## 🔧 Настройка

### Кастомизация дизайна

Измените CSS переменные в `public/style.css`:

```css
:root {
    --primary-color: #2481cc;
    --accent-color: #ff6b6b;
    --border-radius: 12px;
}
```

### Изменение вопросов

Обновите SQL в `schema.sql` или добавьте новые вопросы через API.

## 📊 Мониторинг

Проект логирует все важные события:

- Авторизации пользователей
- Прохождение тестов
- Успешные платежи
- Реферальные начисления

## 🔒 Безопасность

- Проверка подписи Telegram WebApp
- Валидация всех входящих данных
- Защита от SQL инъекций
- Rate limiting (рекомендуется добавить)

## 📞 Поддержка

При возникновении вопросов:

1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Проверьте webhook Telegram бота
4. Убедитесь, что база данных создалась корректно

## 🚧 TODO

- [ ] Добавить rate limiting
- [ ] Реализовать админ панель
- [ ] Добавить аналитику
- [ ] Интеграция с AI API для более продвинутого анализа
- [ ] Поддержка нескольких языков
- [ ] Push уведомления

## 📄 Лицензия

MIT License

---

🎯 **Цель проекта**: Создать вирусный, монетизируемый продукт для анализа отношений в Telegram с красивым UI и полной функциональностью.