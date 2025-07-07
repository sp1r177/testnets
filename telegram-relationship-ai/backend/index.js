const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const db = require('./database/db');

// Routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const resultRoutes = require('./routes/result');
const purchaseRoutes = require('./routes/purchase');
const referralRoutes = require('./routes/referral');
const psychTestRoutes = require('./routes/psychological_test');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Telegram WebApp headers validation
app.use((req, res, next) => {
  // Для Telegram WebApp добавляем специальные заголовки
  res.header('X-Frame-Options', 'ALLOWALL');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/result', resultRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/psychtest', psychTestRoutes);

// Telegram WebApp route
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/psychological_test.html'));
});

// Webhook для Telegram бота
app.post('/webhook', express.json(), (req, res) => {
  console.log('Webhook received:', req.body);
  
  const { message, callback_query } = req.body;
  
  if (message) {
    handleMessage(message);
  }
  
  if (callback_query) {
    handleCallbackQuery(callback_query);
  }
  
  res.sendStatus(200);
});

// Обработка сообщений
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  
  if (text === '/start') {
    sendWelcomeMessage(chatId);
  } else if (text.startsWith('/start ref_')) {
    const referralCode = text.split('ref_')[1];
    
    // Проверяем, является ли это числовым ID (старая система) или кодом (новая система)
    if (/^\d+$/.test(referralCode)) {
      // Старая система - числовой ID
      sendWelcomeMessage(chatId, referralCode, 'id');
    } else {
      // Новая система - буквенно-цифровой код
      try {
        // Отслеживаем клик
        await fetch(`${process.env.WEBAPP_URL || 'http://localhost:3000'}/api/referral/track-click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: referralCode })
        });
        
        sendWelcomeMessage(chatId, referralCode, 'code');
      } catch (error) {
        console.error('Error tracking referral click:', error);
        sendWelcomeMessage(chatId, referralCode, 'code');
      }
    }
  }
}

// Обработка callback queries
function handleCallbackQuery(callbackQuery) {
  // Здесь можно обрабатывать нажатия на inline кнопки
  console.log('Callback query:', callbackQuery);
}

// Отправка приветственного сообщения
async function sendWelcomeMessage(chatId, referralParam = null, referralType = null) {
  const axios = require('axios');
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  let refParam = '';
  if (referralParam) {
    if (referralType === 'code') {
      refParam = `?refCode=${referralParam}`;
    } else {
      refParam = `?ref=${referralParam}`;
    }
  }
  
  const keyboard = {
    inline_keyboard: [[
      {
        text: "🧠 Узнать свой архетип в отношениях",
        web_app: { url: `${process.env.WEBAPP_URL}/app${refParam}` }
      }
    ]]
  };
  
  let message = `🎯 *Добро пожаловать в AI-анализ отношений!*

Узнай свой архетип в любви за 2 минуты.

💡 *Что ты получишь:*
• Персональный анализ твоего типа в отношениях
• Понимание своих сильных и слабых сторон
• Рекомендации для улучшения отношений

🎁 *Первый анализ — бесплатно!*`;

  // Добавляем персонализированное сообщение для рефералов
  if (referralParam) {
    message += `\n\n💝 *Тебя пригласил друг!* Получи эксклюзивный анализ по специальной ссылке.`;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Инициализация базы данных
db.initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WebApp URL: ${process.env.WEBAPP_URL}/app`);
});