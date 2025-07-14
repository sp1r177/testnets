# 💳 Гайд по настройке платежей Telegram Stars

## 🎯 Что нужно настроить

1. **Telegram бота** для приёма платежей
2. **Webhook** для обработки успешных платежей
3. **Реферальную систему** для автоматического начисления комиссий

---

## 📱 Шаг 1: Настройка Telegram бота

### 1.1 Создание бота
```
1. Напишите @BotFather в Telegram
2. Отправьте команду /newbot
3. Введите имя бота: "Психологический AI Тест"
4. Введите username: psychology_ai_test_bot
5. Получите токен бота (сохраните его!)
```

### 1.2 Настройка платежей
```
1. В чате с @BotFather отправьте /mybots
2. Выберите вашего бота
3. Нажмите "Payments"
4. Выберите "Telegram Stars" 
5. Подтвердите настройку
```

### 1.3 Настройка WebApp
```
1. В @BotFather выберите вашего бота
2. Нажмите "Bot Settings" → "Menu Button"
3. Нажмите "Edit Menu Button"
4. Введите URL: https://yourdomain.com/app
5. Введите текст: "🧠 Пройти тест"
```

---

## 🔧 Шаг 2: Настройка сервера

### 2.1 Обновите .env файл
```bash
# В файле .env укажите:
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
BOT_USERNAME=psychology_ai_test_bot
WEBAPP_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
```

### 2.2 Настройка webhook
```bash
# Установите webhook для получения уведомлений о платежах
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://yourdomain.com/webhook",
       "allowed_updates": ["message", "pre_checkout_query", "successful_payment"]
     }'
```

---

## 💰 Шаг 3: Как работают платежи

### 3.1 Процесс оплаты
```
1. Пользователь нажимает "Получить полный анализ"
2. Создается invoice в Telegram Stars (149₽ = 149 Stars)
3. Пользователь оплачивает через Telegram
4. Telegram отправляет webhook на ваш сервер
5. Сервер обрабатывает платеж и разблокирует контент
6. Автоматически начисляется комиссия рефереру
```

### 3.2 Структура webhook от Telegram
```json
{
  "successful_payment": {
    "currency": "XTR",
    "total_amount": 149,
    "invoice_payload": "payment_123",
    "telegram_payment_charge_id": "tpc_...",
    "provider_payment_charge_id": "ppc_..."
  }
}
```

---

## 🎁 Шаг 4: Реферальная система

### 4.1 Как работает
- **70%** комиссии с первой покупки приглашенного
- **30%** комиссии с последующих покупок
- Автоматическое начисление в Telegram Stars на баланс

### 4.2 Пример расчета
```
Первая покупка реферала: 149₽
Комиссия рефереру: 149 × 70% = 104 Stars

Вторая покупка того же реферала: 149₽  
Комиссия рефереру: 149 × 30% = 45 Stars
```

### 4.3 Генерация реферальных ссылок
```javascript
// API endpoint: GET /api/referral/link/:userId
// Возвращает ссылку вида:
"https://t.me/psychology_ai_test_bot?start=ref_ABC12345"
```

---

## 💸 Шаг 5: Получение денег на счёт

### 5.1 Telegram Stars → Реальные деньги

К сожалению, **Telegram Stars напрямую нельзя вывести на банковский счёт**. 

**Варианты монетизации:**

1. **Telegram Stars Gifts** (рекомендуется)
   - Накопленные Stars можно потратить на подарки в Telegram
   - Или обменивать с другими пользователями

2. **Альтернатива: CryptoBot**
   - Подключите CryptoBot для прямых выплат в рублях
   - Деньги поступают напрямую на ваш счёт

### 5.2 Настройка CryptoBot (альтернатива)

```bash
1. Создайте аккаунт на https://pay.crypt.bot/
2. Получите API ключ
3. Добавьте в .env: CRYPTOBOT_API_KEY=ваш_ключ
4. Измените тип платежа в коде на 'cryptobot'
```

**Плюсы CryptoBot:**
- ✅ Прямые выплаты на банковскую карту
- ✅ Поддержка рублей, USD, EUR
- ✅ Комиссия ~3%

**Плюсы Telegram Stars:**
- ✅ Встроено в Telegram
- ✅ Лучший UX для пользователей
- ✅ Никаких дополнительных регистраций

---

## 🔄 Шаг 6: Начисление реферальных комиссий

### 6.1 Автоматическое начисление
Система автоматически:
1. Определяет реферера при платеже
2. Рассчитывает процент (70% или 30%)
3. Начисляет Stars на баланс реферера
4. Обновляет статистику в базе данных

### 6.2 Проверка начислений
```sql
-- Посмотреть баланс реферера
SELECT telegram_id, stars_balance 
FROM users 
WHERE id = referrer_id;

-- Посмотреть историю начислений  
SELECT * FROM payments 
WHERE referrer_id IS NOT NULL 
AND status = 'completed';
```

---

## 🚀 Шаг 7: Тестирование

### 7.1 Локальное тестирование
```bash
1. Запустите сервер: npm start
2. Используйте ngrok для webhook: ngrok http 3000
3. Установите webhook на ngrok URL
4. Тестируйте платежи с тестовыми Stars
```

### 7.2 Продакшн
```bash
1. Разверните на VPS/Heroku
2. Настройте SSL сертификат  
3. Установите webhook на ваш домен
4. Протестируйте реальные платежи
```

---

## ⚠️ Важные моменты

### Налоги
- Уведомите налоговую о доходах от Telegram бота
- В России доходы с ботов облагаются налогом

### Безопасность
- Храните токен бота в секрете
- Используйте HTTPS для webhook
- Проверяйте подпись Telegram в webhook

### Лимиты Telegram Stars
- Минимальная сумма: 1 Star
- Максимальная сумма: 2500 Stars за транзакцию
- Ваша цена 149 Stars в пределах лимитов ✅

---

## 📊 Мониторинг

### Полезные SQL запросы
```sql
-- Общая статистика
SELECT 
  COUNT(*) as total_payments,
  SUM(amount) as total_revenue,
  SUM(referrer_reward) as total_referral_rewards
FROM payments 
WHERE status = 'completed';

-- Топ рефералов
SELECT 
  u.telegram_id,
  u.username,
  SUM(p.referrer_reward) as total_earned
FROM payments p
JOIN users u ON p.referrer_id = u.id  
WHERE p.status = 'completed'
GROUP BY u.id
ORDER BY total_earned DESC;
```

---

## 🎉 Готово!

После настройки у вас будет:
- ✅ Рабочие платежи через Telegram Stars  
- ✅ Автоматическая реферальная система
- ✅ Начисление комиссий 70%/30%
- ✅ Полная статистика доходов

**Начинайте зарабатывать!** 💰