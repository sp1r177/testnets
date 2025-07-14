const express = require('express');
const crypto = require('crypto');
const db = require('../database/db');

const router = express.Router();

// Проверка подписи Telegram WebApp
function verifyTelegramWebAppData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Сортируем параметры
    const dataCheckArr = [];
    for (const [key, value] of urlParams.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    
    const dataCheckString = dataCheckArr.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

// Авторизация через Telegram WebApp
router.post('/telegram', async (req, res) => {
  try {
    const { initData, referrerId } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData' });
    }
    
    // В разработке можем пропустить проверку подписи
    const isValid = process.env.NODE_ENV === 'development' || 
                   verifyTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    
    // Парсим данные пользователя
    const urlParams = new URLSearchParams(initData);
    const userDataString = urlParams.get('user');
    
    if (!userDataString) {
      return res.status(400).json({ error: 'No user data found' });
    }
    
    const userData = JSON.parse(userDataString);
    
    // Создаем или обновляем пользователя
    let user = await db.users.createOrUpdateUser(userData, referrerId);
    
    // Если пользователь новый и есть реферер, создаем реферальную связь
    if (referrerId && user.referrer_id === parseInt(referrerId)) {
      await db.referrals.createReferral(referrerId, user.id);
    }
    
    // Проверяем, использовал ли пользователь бесплатный анализ
    const hasUsedFreeAnalysis = await db.users.hasUsedFreeAnalysis(user.id);
    
    // Получаем последний результат, если есть
    const lastResult = await db.results.getLatestResult(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        subscription_type: user.subscription_type,
        has_used_free_analysis: hasUsedFreeAnalysis,
        last_result: lastResult
      }
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение профиля пользователя
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Получаем реферальную статистику
    const referralStats = await db.referrals.getReferralStats(user.id);
    
    // Получаем последний результат
    const lastResult = await db.results.getLatestResult(user.id);
    
    res.json({
      success: true,
      profile: {
        ...user,
        referral_stats: referralStats,
        last_result: lastResult,
        referral_link: `https://t.me/${process.env.BOT_USERNAME}?start=ref_${user.id}`
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;