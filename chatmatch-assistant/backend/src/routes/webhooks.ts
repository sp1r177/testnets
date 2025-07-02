import express from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { prisma } from '../index';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe webhook
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send('Missing stripe signature or webhook secret');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Telegram webhook for bot updates
router.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    
    // Handle pre-checkout query (for Telegram Stars)
    if (update.pre_checkout_query) {
      await handleTelegramPreCheckout(update.pre_checkout_query);
    }
    
    // Handle successful payment (for Telegram Stars)
    if (update.message && update.message.successful_payment) {
      await handleTelegramPaymentSuccess(update.message);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Telegram webhook processing failed' });
  }
});

// Handle Stripe checkout completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Create payment record
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.payment.create({
    data: {
      userId,
      amount: session.amount_total || 0,
      currency: session.currency || 'rub',
      provider: 'stripe',
      stripePaymentIntentId: session.payment_intent as string,
      subscriptionType: 'pro',
      subscriptionPeriod: 'month',
      expiresAt,
      status: 'succeeded',
    }
  });

  // Update user subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionActive: true,
      subscriptionType: 'pro',
      expiresAt,
    }
  });

  console.log(`Subscription activated for user ${userId}`);
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer ${customerId}`);
    return;
  }

  // Extend subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: true,
      subscriptionType: 'pro',
      expiresAt,
    }
  });

  console.log(`Subscription renewed for user ${user.id}`);
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer ${customerId}`);
    return;
  }

  // Keep subscription active until expires_at, but don't renew
  console.log(`Payment failed for user ${user.id}, subscription will expire at ${user.expiresAt}`);
}

// Handle subscription update
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer ${customerId}`);
    return;
  }

  const isActive = subscription.status === 'active';
  const expiresAt = new Date(subscription.current_period_end * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: isActive,
      expiresAt,
    }
  });

  console.log(`Subscription updated for user ${user.id}: ${subscription.status}`);
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error(`User not found for Stripe customer ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionActive: false,
      subscriptionType: 'free',
    }
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

// Handle Telegram pre-checkout query
async function handleTelegramPreCheckout(preCheckoutQuery: any) {
  const { id, from, currency, total_amount, invoice_payload } = preCheckoutQuery;
  
  // Verify the payment
  // In a real implementation, you'd validate the payment details
  
  // Answer pre-checkout query
  // This would typically be done through the Telegram Bot API
  console.log(`Pre-checkout query from user ${from.id} for ${total_amount} ${currency}`);
}

// Handle Telegram successful payment
async function handleTelegramPaymentSuccess(message: any) {
  const { from, successful_payment } = message;
  const { telegram_payment_charge_id, provider_payment_charge_id, total_amount, currency } = successful_payment;

  try {
    // Extract payment ID from invoice_payload if it contains our payment reference
    const paymentId = successful_payment.invoice_payload?.split('_')[1];
    
    if (paymentId) {
      // Update payment record
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'succeeded',
          telegramStarsId: telegram_payment_charge_id,
        }
      });

      // Get payment to update user subscription
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: true }
      });

      if (payment) {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionActive: true,
            subscriptionType: 'pro',
            expiresAt: payment.expiresAt,
          }
        });

        console.log(`Telegram Stars payment succeeded for user ${payment.userId}`);
      }
    }
  } catch (error) {
    console.error('Error processing Telegram payment:', error);
  }
}

export default router;