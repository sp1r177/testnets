# 🚀 Быстрый деплой Telegram WebApp

## 📋 Подготовка

### 1. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/BotFather)
2. Создайте бота: `/newbot`
3. Скопируйте токен бота
4. Установите WebApp кнопку:
   ```
   /setmenubutton
   @your_bot_name
   WebApp
   https://yourdomain.com/app
   ```

### 2. Настройка проекта

```bash
# Клонирование
git clone <repository>
cd telegram-relationship-ai

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл
```

## 🌐 Деплой на VPS

```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start backend/index.js --name "relationship-ai"
pm2 startup
pm2 save

# Настройка Nginx
sudo nano /etc/nginx/sites-available/relationship-ai
```

### Конфигурация Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Установка webhook:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook"}'
```

## ☁️ Деплой на Heroku

```bash
# Создание приложения
heroku create your-app-name

# Настройка переменных
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set WEBAPP_URL=https://your-app-name.herokuapp.com

# Деплой
git push heroku main

# Установка webhook
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app-name.herokuapp.com/webhook"}'
```

## 🔧 Настройка CryptoBot

1. Найдите [@CryptoBot](https://t.me/CryptoBot)
2. Создайте приложение: `/app`
3. Получите API ключ
4. Добавьте в `.env`:
   ```
   CRYPTOBOT_API_KEY=your_api_key
   ```

## ✅ Проверка

1. Откройте своего бота в Telegram
2. Нажмите кнопку меню для запуска WebApp
3. Пройдите тест
4. Проверьте оплату и реферальную систему

## 🐛 Решение проблем

### Бот не отвечает:
- Проверьте webhook: `/getWebhookInfo`
- Убедитесь, что сервер доступен по HTTPS

### WebApp не открывается:
- Проверьте URL в настройках бота
- Убедитесь, что статические файлы раздаются корректно

### База данных не создается:
- Проверьте права на запись в директории проекта
- Убедитесь, что SQLite установлен

---

💡 **Совет**: Для быстрого тестирования используйте ngrok:
```bash
ngrok http 3000
# Используйте HTTPS URL от ngrok для webhook
```