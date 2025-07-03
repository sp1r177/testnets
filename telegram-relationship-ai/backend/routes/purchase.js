const express = require('express');
const axios = require('axios');
const db = require('../database/db');

const router = express.Router();

// Продукты для покупки
const PRODUCTS = {
  week_plan: {
    name: 'Личный AI-план на 7 дней',
    price: 149, // рубли
    stars_price: 149, // Stars
    description: 'Персональный план развития отношений на неделю'
  },
  month_plan: {
    name: 'Месячный путь + обратная связь',
    price: 499,
    stars_price: 499,
    description: 'Комплексная программа с обратной связью на месяц'
  },
  full_mentoring: {
    name: 'Полный менторинг',
    price: 999,
    stars_price: 999,
    description: 'Полное сопровождение и менторинг в отношениях'
  }
};

// Получение списка продуктов
router.get('/products', (req, res) => {
  res.json({
    success: true,
    products: PRODUCTS
  });
});

// Создание инвойса для Telegram Stars
router.post('/create-invoice/stars', async (req, res) => {
  try {
    const { userId, productType } = req.body;
    
    if (!userId || !productType || !PRODUCTS[productType]) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const product = PRODUCTS[productType];
    const user = await db.users.getUserByTelegramId(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем реферера для расчёта вознаграждения
    let referrerId = user.referrer_id;
    let referrerReward = 0;
    
    if (referrerId) {
      referrerReward = Math.floor(product.stars_price * 0.5); // 50% рефереру
    }
    
    // Создаем запись о платеже
    const paymentId = await db.payments.createPayment(
      user.id,
      product.stars_price,
      'stars',
      productType,
      referrerId,
      referrerReward
    );
    
    // Создаем инвойс в Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const invoiceData = {
      chat_id: user.telegram_id,
      title: product.name,
      description: product.description,
      payload: `payment_${paymentId}`,
      provider_token: '', // Для Stars не нужен
      currency: 'XTR', // Telegram Stars
      prices: [{
        label: product.name,
        amount: product.stars_price
      }]
    };
    
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendInvoice`,
      invoiceData
    );
    
    if (response.data.ok) {
      res.json({
        success: true,
        payment_id: paymentId,
        invoice_url: response.data.result
      });
    } else {
      throw new Error('Failed to create invoice');
    }
    
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Создание платежа через CryptoBot
router.post('/create-invoice/crypto', async (req, res) => {
  try {
    const { userId, productType } = req.body;
    
    if (!userId || !productType || !PRODUCTS[productType]) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }
    
    const product = PRODUCTS[productType];
    const user = await db.users.getUserByTelegramId(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем реферера
    let referrerId = user.referrer_id;
    let referrerReward = 0;
    
    if (referrerId) {
      referrerReward = Math.floor(product.price * 0.5);
    }
    
    // Создаем запись о платеже
    const paymentId = await db.payments.createPayment(
      user.id,
      product.price * 100, // в копейках
      'cryptobot',
      productType,
      referrerId,
      referrerReward
    );
    
    // Создаем инвойс в CryptoBot
    const cryptoBotData = {
      asset: 'RUB',
      amount: product.price,
      description: product.description,
      hidden_message: `Спасибо за покупку ${product.name}!`,
      paid_btn_name: 'callback',
      paid_btn_url: `${process.env.WEBAPP_URL}/payment-success?id=${paymentId}`,
      payload: `payment_${paymentId}`,
      allow_comments: false,
      allow_anonymous: true
    };
    
    const response = await axios.post(
      'https://pay.crypt.bot/api/createInvoice',
      cryptoBotData,
      {
        headers: {
          'Crypto-Pay-API-Token': process.env.CRYPTOBOT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.ok) {
      res.json({
        success: true,
        payment_id: paymentId,
        invoice_url: response.data.result.pay_url
      });
    } else {
      throw new Error('Failed to create CryptoBot invoice');
    }
    
  } catch (error) {
    console.error('CryptoBot invoice error:', error);
    res.status(500).json({ error: 'Failed to create CryptoBot invoice' });
  }
});

// Webhook для подтверждения платежа (Telegram Stars)
router.post('/webhook/stars', async (req, res) => {
  try {
    const { pre_checkout_query, successful_payment } = req.body;
    
    if (pre_checkout_query) {
      // Предварительная проверка платежа
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        pre_checkout_query_id: pre_checkout_query.id,
        ok: true
      });
    }
    
    if (successful_payment) {
      // Обработка успешного платежа
      const payloadParts = successful_payment.invoice_payload.split('_');
      const paymentId = parseInt(payloadParts[1]);
      
      // Обновляем статус платежа
      await db.payments.updatePaymentStatus(
        paymentId,
        'completed',
        successful_payment.telegram_payment_charge_id
      );
      
      // Обновляем подписку пользователя и начисляем реферальные
      await processSuccessfulPayment(paymentId);
    }
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('Stars webhook error:', error);
    res.sendStatus(200);
  }
});

// Webhook для подтверждения платежа (CryptoBot)
router.post('/webhook/crypto', async (req, res) => {
  try {
    const { invoice_id, status, asset, amount } = req.body;
    
    if (status === 'paid') {
      // Находим платеж по payload
      const payloadParts = req.body.payload.split('_');
      const paymentId = parseInt(payloadParts[1]);
      
      // Обновляем статус платежа
      await db.payments.updatePaymentStatus(
        paymentId,
        'completed',
        invoice_id
      );
      
      // Обрабатываем успешный платеж
      await processSuccessfulPayment(paymentId);
    }
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('CryptoBot webhook error:', error);
    res.sendStatus(200);
  }
});

// Обработка успешного платежа
async function processSuccessfulPayment(paymentId) {
  try {
    // Получаем информацию о платеже
    const db_instance = db.getDB();
    
    db_instance.get(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId],
      async (err, payment) => {
        if (err || !payment) {
          console.error('Payment not found:', paymentId);
          return;
        }
        
        // Обновляем подписку пользователя
        const subscriptionMap = {
          week_plan: 'week',
          month_plan: 'month',
          full_mentoring: 'premium'
        };
        
        const subscriptionType = subscriptionMap[payment.product_type];
        
        db_instance.run(
          'UPDATE users SET subscription_type = ? WHERE id = ?',
          [subscriptionType, payment.user_id]
        );
        
        // Начисляем реферальное вознаграждение
        if (payment.referrer_id && payment.referrer_reward > 0) {
          db_instance.run(
            'UPDATE users SET stars_balance = stars_balance + ? WHERE id = ?',
            [payment.referrer_reward, payment.referrer_id]
          );
          
          // Отмечаем в реферальной таблице
          db_instance.run(
            'UPDATE referrals SET reward_paid = ?, first_purchase_made = 1 WHERE referrer_id = ? AND referred_id = ?',
            [payment.referrer_reward, payment.referrer_id, payment.user_id]
          );
        }
        
        // Отправляем уведомление пользователю
        await sendPurchaseNotification(payment.user_id, payment.product_type);
      }
    );
    
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

// Отправка уведомления о покупке
async function sendPurchaseNotification(userId, productType) {
  try {
    const db_instance = db.getDB();
    
    db_instance.get(
      'SELECT telegram_id FROM users WHERE id = ?',
      [userId],
      async (err, user) => {
        if (err || !user) return;
        
        const product = PRODUCTS[productType];
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        
        const message = `🎉 *Поздравляем с покупкой!*

Вы успешно приобрели: *${product.name}*

🎯 Что дальше:
• Ваша подписка активирована
• Получите доступ к расширенным функциям
• Персональные рекомендации уже ждут вас

Спасибо за доверие! 💜`;

        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: user.telegram_id,
          text: message,
          parse_mode: 'Markdown'
        });
      }
    );
    
  } catch (error) {
    console.error('Error sending purchase notification:', error);
  }
}

// Проверка статуса платежа
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const db_instance = db.getDB();
    
    db_instance.get(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId],
      (err, payment) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!payment) {
          return res.status(404).json({ error: 'Payment not found' });
        }
        
        res.json({
          success: true,
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            method: payment.method,
            product_type: payment.product_type,
            created_at: payment.created_at
          }
        });
      }
    );
    
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;