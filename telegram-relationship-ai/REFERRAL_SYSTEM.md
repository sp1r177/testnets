# 🔗 Система реферальных ссылок

## Обзор

Каждый пользователь получает **уникальную реферальную ссылку** с персональным кодом для приглашения новых пользователей. Система поддерживает отслеживание кликов, успешных регистраций и автоматическое начисление комиссий.

## 🎯 Как это работает

### 1. Генерация реферальной ссылки

При первом запросе ссылки для пользователя создается **уникальный 8-символьный код** из букв и цифр:

```
Пример: REF4B8K9
```

Ссылка имеет вид:
```
https://t.me/your_bot?start=ref_REF4B8K9
```

### 2. Переход по ссылке

Когда новый пользователь переходит по реферальной ссылке:

1. **Клик отслеживается** - увеличивается счетчик кликов
2. Telegram бот получает команду `/start ref_REF4B8K9`
3. Бот открывает WebApp с параметром `?refCode=REF4B8K9`
4. WebApp определяет ID реферера по коду

### 3. Регистрация и привязка

При авторизации нового пользователя:

1. Система ищет реферера по коду
2. Создается запись в таблице `referrals`
3. У нового пользователя устанавливается `referrer_id`
4. Увеличивается счетчик успешных рефералов

### 4. Начисление комиссий

При покупке подписки реферируемым пользователем:

1. Рассчитывается 50% комиссия от суммы покупки
2. Комиссия зачисляется на баланс реферера в Stars
3. Обновляется статистика реферальных доходов

## 📊 API Endpoints

### Получить реферальную ссылку
```
GET /api/referral/link/:userId
```

**Ответ:**
```json
{
  "success": true,
  "referral_code": "REF4B8K9",
  "referral_link": "https://t.me/your_bot?start=ref_REF4B8K9",
  "stats": {
    "clicks": 15,
    "successful_referrals": 3
  },
  "share_text": "🧠 Узнай свой архетип в отношениях!..."
}
```

### Отследить клик
```
POST /api/referral/track-click
{
  "code": "REF4B8K9"
}
```

### Получить информацию о коде
```
GET /api/referral/code/REF4B8K9
```

### Статистика рефералов
```
GET /api/referral/stats/:userId
```

## 🗄️ Структура базы данных

### Таблица `referral_codes`
```sql
CREATE TABLE referral_codes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    code TEXT UNIQUE NOT NULL,           -- Уникальный код (REF4B8K9)
    clicks INTEGER DEFAULT 0,           -- Количество кликов
    successful_referrals INTEGER DEFAULT 0,  -- Успешные регистрации
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,                 -- Дата истечения (опционально)
    is_active INTEGER DEFAULT 1         -- Активность кода
);
```

### Таблица `referrals`
```sql
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY,
    referrer_id INTEGER,                 -- ID пригласившего
    referred_id INTEGER,                 -- ID приглашенного
    reward_paid REAL DEFAULT 0,         -- Выплаченная награда
    first_purchase_made INTEGER DEFAULT 0,  -- Сделал ли первую покупку
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 💰 Система вознаграждений

### Размер комиссий
- **50%** от суммы каждой покупки реферируемого пользователя
- Выплачивается в Telegram Stars на баланс реферера

### Примеры вознаграждений
| Покупка реферала | Комиссия реферера |
|------------------|-------------------|
| 149₽             | 74.5₽ (74 Stars) |
| 499₽             | 249.5₽ (250 Stars) |
| 999₽             | 499.5₽ (500 Stars) |

## 🎨 Интеграция с Frontend

### Получение реферальной ссылки пользователя

```javascript
async function getUserReferralLink(userId) {
    const response = await fetch(`/api/referral/link/${userId}`);
    const data = await response.json();
    
    return {
        link: data.referral_link,
        code: data.referral_code,
        shareText: data.share_text,
        stats: data.stats
    };
}
```

### Кнопка "Поделиться"

```javascript
function shareReferralLink(link, shareText) {
    if (navigator.share) {
        navigator.share({
            title: 'AI-анализ отношений',
            text: shareText,
            url: link
        });
    } else {
        // Fallback - копируем в буфер обмена
        navigator.clipboard.writeText(shareText);
        showNotification('Ссылка скопирована!');
    }
}
```

## 📱 Пример использования

### В профиле пользователя

```html
<div class="referral-section">
    <h3>💝 Пригласи друзей</h3>
    <div class="referral-stats">
        <div class="stat">
            <span class="number">15</span>
            <span class="label">Кликов</span>
        </div>
        <div class="stat">
            <span class="number">3</span>
            <span class="label">Рефералов</span>
        </div>
        <div class="stat">
            <span class="number">750</span>
            <span class="label">Stars заработано</span>
        </div>
    </div>
    
    <button class="share-btn" onclick="shareReferralLink()">
        📤 Поделиться ссылкой
    </button>
    
    <div class="referral-link">
        <input type="text" value="https://t.me/your_bot?start=ref_REF4B8K9" readonly>
        <button onclick="copyLink()">📋</button>
    </div>
</div>
```

## 🔒 Безопасность

### Уникальность кодов
- Коды генерируются случайно из 36 символов (A-Z, 0-9)
- Вероятность коллизии: 1 к 36^8 = 1:2,821,109,907,456
- Автоматическая проверка на уникальность

### Защита от злоупотреблений
- Один реферальный код на пользователя
- Нельзя пригласить самого себя
- Коммиссия начисляется только за первую покупку

### Мониторинг
- Отслеживание всех кликов и регистраций
- Логирование подозрительной активности
- Возможность деактивации кодов

## 🚀 Развертывание

Убедитесь, что в `.env` указан правильный `BOT_USERNAME`:

```env
BOT_USERNAME=relationship_ai_bot
WEBAPP_URL=https://yourdomain.com
```

Система автоматически создаст таблицу `referral_codes` при первом запуске.

## 📈 Аналитика

### Топ рефералов
```
GET /api/referral/leaderboard
```

### История доходов
```
GET /api/referral/earnings/:userId
```

### Детальная статистика
- Конверсия кликов в регистрации
- Средний доход с реферала
- Временная динамика активности

---

**Готово!** 🎉 Теперь каждый пользователь получает уникальную реферальную ссылку для приглашения друзей с автоматическим начислением комиссий.