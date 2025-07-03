const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Получение реферальной статистики пользователя
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Получаем статистику рефералов
    const stats = await db.referrals.getReferralStats(user.id);
    
    // Получаем список рефералов
    const db_instance = db.getDB();
    
    db_instance.all(`
      SELECT 
        u.first_name,
        u.username,
        r.created_at,
        r.reward_paid,
        r.first_purchase_made
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `, [user.id], (err, referrals) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        stats: {
          total_referrals: stats.total_referrals || 0,
          total_rewards: stats.total_rewards || 0,
          successful_referrals: stats.successful_referrals || 0,
          current_balance: user.stars_balance || 0,
          referral_link: `https://t.me/${process.env.BOT_USERNAME || 'your_bot'}?start=ref_${user.id}`
        },
        referrals: referrals || []
      });
    });
    
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Генерация реферальной ссылки
router.get('/link/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const referralLink = `https://t.me/${process.env.BOT_USERNAME || 'your_bot'}?start=ref_${user.id}`;
    
    res.json({
      success: true,
      referral_link: referralLink,
      share_text: `🧠 Узнай свой архетип в отношениях!

Пройди бесплатный AI-анализ и получи персональные рекомендации для улучшения отношений.

💝 По моей ссылке первый анализ бесплатно!

${referralLink}`
    });
    
  } catch (error) {
    console.error('Referral link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Создание реферальной связи (используется при регистрации)
router.post('/create', async (req, res) => {
  try {
    const { referrerId, referredId } = req.body;
    
    if (!referrerId || !referredId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Проверяем, что пользователи существуют
    const referrer = await db.users.getUserByTelegramId(referrerId);
    const referred = await db.users.getUserByTelegramId(referredId);
    
    if (!referrer || !referred) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем, что пользователь не пытается пригласить сам себя
    if (referrer.id === referred.id) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }
    
    // Создаем реферальную связь
    const referralId = await db.referrals.createReferral(referrer.id, referred.id);
    
    res.json({
      success: true,
      referral_id: referralId
    });
    
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Вывод средств (конвертация Stars в деньги или другие бонусы)
router.post('/withdraw/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, method } = req.body; // method: 'stars_to_money', 'stars_to_subscription'
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.stars_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Минимальная сумма для вывода
    const MIN_WITHDRAWAL = 100;
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ 
        error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} stars` 
      });
    }
    
    const db_instance = db.getDB();
    
    // Списываем средства
    db_instance.run(
      'UPDATE users SET stars_balance = stars_balance - ? WHERE id = ?',
      [amount, user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Здесь можно добавить логику для реального вывода средств
        // Например, отправка запроса в платёжную систему
        
        res.json({
          success: true,
          message: 'Withdrawal request submitted',
          remaining_balance: user.stars_balance - amount
        });
      }
    );
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение топ рефералов (лидерборд)
router.get('/leaderboard', async (req, res) => {
  try {
    const db_instance = db.getDB();
    
    db_instance.all(`
      SELECT 
        u.first_name,
        u.username,
        COUNT(r.referred_id) as total_referrals,
        SUM(r.reward_paid) as total_earned,
        u.stars_balance
      FROM users u
      LEFT JOIN referrals r ON u.id = r.referrer_id
      WHERE u.stars_balance > 0 OR COUNT(r.referred_id) > 0
      GROUP BY u.id
      HAVING total_referrals > 0
      ORDER BY total_earned DESC, total_referrals DESC
      LIMIT 10
    `, [], (err, leaders) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        leaderboard: leaders || []
      });
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение истории реферальных доходов
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const db_instance = db.getDB();
    
    db_instance.all(`
      SELECT 
        p.amount,
        p.referrer_reward,
        p.product_type,
        p.created_at,
        u.first_name as referred_user_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.referrer_id = ? AND p.status = 'completed' AND p.referrer_reward > 0
      ORDER BY p.created_at DESC
    `, [user.id], (err, earnings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        earnings: earnings || []
      });
    });
    
  } catch (error) {
    console.error('Earnings history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;