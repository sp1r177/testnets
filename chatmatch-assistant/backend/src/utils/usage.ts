import { User } from '@prisma/client';

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_GENERATIONS_PER_DAY || '5');
const PRO_MONTHLY_LIMIT = parseInt(process.env.PRO_GENERATIONS_PER_MONTH || '300');

export async function checkUsageLimit(user: User): Promise<boolean> {
  const now = new Date();
  const resetDate = new Date(user.lastResetDate);
  
  // Check if counters need to be reset
  const isNewDay = now.getDate() !== resetDate.getDate() || 
                   now.getMonth() !== resetDate.getMonth() ||
                   now.getFullYear() !== resetDate.getFullYear();

  const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                     now.getFullYear() !== resetDate.getFullYear();

  // Determine effective usage based on resets
  const effectiveDailyUsage = isNewDay ? 0 : user.dailyGenerations;
  const effectiveMonthlyUsage = isNewMonth ? 0 : user.monthlyGenerations;

  // Check subscription status and expiry
  const isSubscriptionActive = user.subscriptionActive && 
    user.expiresAt && 
    user.expiresAt > now;

  if (isSubscriptionActive) {
    // Pro user: check monthly limit
    return effectiveMonthlyUsage < PRO_MONTHLY_LIMIT;
  } else {
    // Free user: check daily limit
    return effectiveDailyUsage < FREE_DAILY_LIMIT;
  }
}

export function getUserUsageInfo(user: User) {
  const now = new Date();
  const resetDate = new Date(user.lastResetDate);
  
  // Check if counters need to be reset
  const isNewDay = now.getDate() !== resetDate.getDate() || 
                   now.getMonth() !== resetDate.getMonth() ||
                   now.getFullYear() !== resetDate.getFullYear();

  const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                     now.getFullYear() !== resetDate.getFullYear();

  // Determine effective usage
  const effectiveDailyUsage = isNewDay ? 0 : user.dailyGenerations;
  const effectiveMonthlyUsage = isNewMonth ? 0 : user.monthlyGenerations;

  // Check subscription status
  const isSubscriptionActive = user.subscriptionActive && 
    user.expiresAt && 
    user.expiresAt > now;

  if (isSubscriptionActive) {
    return {
      type: 'pro',
      used: effectiveMonthlyUsage,
      limit: PRO_MONTHLY_LIMIT,
      remaining: PRO_MONTHLY_LIMIT - effectiveMonthlyUsage,
      resetDate: getNextMonthStart(),
      period: 'monthly'
    };
  } else {
    return {
      type: 'free',
      used: effectiveDailyUsage,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT - effectiveDailyUsage,
      resetDate: getNextDayStart(),
      period: 'daily'
    };
  }
}

function getNextDayStart(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

function getNextMonthStart(): Date {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth;
}