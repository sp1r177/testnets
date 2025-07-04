# 🔧 Интеграция Frontend с вашим Express Backend

## 📁 Структура файлов

Убедитесь, что ваша папка `public/` содержит:
```
public/
├── index.html      # Главная страница WebApp
├── style.css       # Стили приложения  
├── app.js          # Логика приложения
└── integration-guide.md  # Это руководство
```

## ⚙️ Настройка Express сервера

Добавьте следующий код в ваш основной файл сервера (обычно `app.js` или `server.js`):

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Middleware для JSON
app.use(express.json());

// Статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Роут для главной страницы WebApp
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ваши существующие API роуты
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter); 
app.use('/api/result', resultRouter);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WebApp available at: http://localhost:${PORT}/app`);
});
```

## 🔗 Формат API endpoints

Убедитесь, что ваши API endpoints возвращают данные в следующем формате:

### GET /api/questions
```javascript
// Ожидаемый формат ответа:
[
    {
        "id": 1,
        "text": "Какой ваш любимый цвет?", // или "question"
        "answers": [ // или "options"
            { "text": "Красный", "value": "red" },
            { "text": "Синий", "value": "blue" },
            { "text": "Зелёный", "value": "green" }
        ]
    },
    // ... больше вопросов
]

// Альтернативный формат (тоже поддерживается):
[
    {
        "question": "Какой ваш любимый цвет?",
        "options": ["Красный", "Синий", "Зелёный"]
    }
]
```

### POST /api/answers
```javascript
// Отправляемые данные:
{
    "answers": ["red", "blue", "green", ...] // массив выбранных ответов
}

// Ожидаемый ответ:
{
    "success": true,
    "message": "Ответы сохранены"
}
```

### POST /api/result/generate
```javascript
// Ожидаемый ответ (любой из форматов):
{
    "result": "Ваш результат: вы творческая личность!"
}
// или
{
    "text": "Ваш результат: вы творческая личность!"
}
// или просто строка:
"Ваш результат: вы творческая личность!"
```

## 📱 Telegram WebApp настройка

### 1. Настройка бота

В вашем Telegram боте добавьте команду для открытия WebApp:

```javascript
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', (ctx) => {
    ctx.reply('Добро пожаловать! Пройдите тест:', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🔍 Начать разбор',
                    web_app: { url: 'https://your-domain.com/app' }
                }
            ]]
        }
    });
});

// Обработка данных от WebApp
bot.on('web_app_data', (ctx) => {
    const data = JSON.parse(ctx.message.web_app_data.data);
    console.log('Получены данные от WebApp:', data);
    
    ctx.reply(`✅ Тест пройден! Вопросов: ${data.questionsCount}`);
});
```

### 2. Настройка WebApp URL

В настройках вашего бота через [@BotFather](https://t.me/BotFather):
1. Выберите ваш бот
2. Bot Settings → Web App
3. Укажите URL: `https://your-domain.com/app`

## 🎨 Кастомизация

### Изменение текстов
Отредактируйте `index.html` для изменения заголовков и текстов.

### Изменение стилей
Отредактируйте `style.css` для изменения цветов и оформления.

### Изменение логики
Отредактируйте `app.js` для изменения поведения приложения.

## 🧪 Тестирование

### 1. Локальное тестирование
```bash
# Запустите ваш сервер
node server.js

# Откройте в браузере
http://localhost:3000/app
```

### 2. Тестирование в Telegram
1. Используйте [ngrok](https://ngrok.com/) для локального тестирования:
   ```bash
   ngrok http 3000
   ```
2. Обновите WebApp URL в настройках бота на ngrok URL

## 📋 Checklist

- [ ] ✅ Файлы `index.html`, `style.css`, `app.js` в папке `public/`
- [ ] ✅ Express настроен для обслуживания статических файлов
- [ ] ✅ Роут `/app` ведёт на `index.html`
- [ ] ✅ API endpoints возвращают данные в правильном формате
- [ ] ✅ CORS настроен (если фронт и бэк на разных доменах)
- [ ] ✅ HTTPS включён (обязательно для Telegram WebApp)
- [ ] ✅ WebApp URL настроен в боте

## 🐛 Отладка

### Проверка API
```bash
# Тестируйте ваши endpoints:
curl http://localhost:3000/api/questions
curl -X POST http://localhost:3000/api/answers -H "Content-Type: application/json" -d '{"answers":["test"]}'
curl -X POST http://localhost:3000/api/result/generate
```

### Проверка WebApp
1. Откройте Developer Tools в браузере
2. Проверьте Console на ошибки
3. Проверьте Network tab для API запросов

## 🚀 Production deployment

Не забудьте:
- Настроить HTTPS
- Обновить WebApp URL в боте на production URL
- Настроить переменные окружения
- Добавить обработку ошибок

---

**Готово! 🎉** Ваш Telegram WebApp теперь интегрирован с backend.