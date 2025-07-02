import express from 'express';
import Stripe from 'stripe';
import { authenticateToken } from './auth';
import { prisma } from '../index';
import { getUserUsageInfo } from '../utils/usage';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Get subscription info
router.get('/info', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const usageInfo = getUserUsageInfo(user);

    res.json({
      subscription: {
        type: user.subscriptionType,
        active: user.subscriptionActive,
        expiresAt: user.expiresAt,
      },
      usage: usageInfo,
      plans: {
        free: {
          name: 'Free',
          price: 0,
          currency: 'RUB',
          generations: parseInt(process.env.FREE_GENERATIONS_PER_DAY || '5'),
          period: 'day',
          features: [
            '5 генераций в день',
            '3 тона общения',
            'История последних генераций',
          ]
        },
        pro: {
          name: 'Pro',
          price: 499,
          currency: 'RUB',
          generations: parseInt(process.env.PRO_GENERATIONS_PER_MONTH || '300'),
          period: 'month',
          features: [
            '300 генераций в месяц',
            '3 тона общения',
            'Полная история генераций',
            'Приоритетная поддержка',
            'Новые функции первыми',
          ]
        }
      }
    });

  } catch (error) {
    console.error('Subscription info error:', error);
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
});

// Create Stripe checkout session
router.post('/stripe/create-checkout', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: `${user.telegramId}@telegram.user`,
        metadata: {
          telegramId: user.telegramId,
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
        telegramId: user.telegramId,
      },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get Stripe session details
router.get('/stripe/session/:sessionId', authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });

  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

// Telegram Stars payment
router.post('/telegram-stars/create-invoice', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;

    // Create payment record
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 499, // 499 stars
        currency: 'XTR', // Telegram Stars currency
        provider: 'telegram_stars',
        subscriptionType: 'pro',
        subscriptionPeriod: 'month',
        expiresAt,
        status: 'pending',
      }
    });

    // Generate invoice link with payment ID
    const invoiceLink = `${process.env.TELEGRAM_STARS_INVOICE_LINK}&start_parameter=pay_${payment.id}`;

    res.json({
      invoiceLink,
      paymentId: payment.id,
      amount: 499,
      currency: 'stars',
    });

  } catch (error) {
    console.error('Telegram Stars invoice error:', error);
    res.status(500).json({ error: 'Failed to create Telegram Stars invoice' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;

    if (user.stripeCustomerId) {
      // Get active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
      });

      // Cancel all active subscriptions
      for (const subscription of subscriptions.data) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
      }
    }

    // Update user subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionActive: false,
        // Keep expiresAt to allow access until period end
      },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled. Access will continue until the end of billing period.',
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get payment history
router.get('/payments', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        provider: true,
        status: true,
        subscriptionType: true,
        subscriptionPeriod: true,
        expiresAt: true,
        createdAt: true,
      }
    });

    const total = await prisma.payment.count({
      where: { userId: user.id }
    });

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

export default router;