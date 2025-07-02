import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const router = express.Router();

// Telegram Login Widget authentication
router.post('/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

    // Verify Telegram authentication
    if (!verifyTelegramAuth(req.body)) {
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    // Check if auth_date is not too old (1 day)
    const authTime = new Date(parseInt(auth_date) * 1000);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (authTime < oneDayAgo) {
      return res.status(401).json({ error: 'Authentication data is too old' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: id.toString() }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: id.toString(),
          username,
          firstName: first_name,
          lastName: last_name,
          photoUrl: photo_url,
          authDate: authTime,
          hash,
        }
      });
    } else {
      // Update user info
      user = await prisma.user.update({
        where: { telegramId: id.toString() },
        data: {
          username,
          firstName: first_name,
          lastName: last_name,
          photoUrl: photo_url,
          authDate: authTime,
          hash,
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        subscriptionType: user.subscriptionType,
        subscriptionActive: user.subscriptionActive,
        expiresAt: user.expiresAt,
      }
    });

  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify JWT token middleware
export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Telegram WebApp authentication
router.post('/webapp', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    // Verify Telegram WebApp initData
    if (!verifyWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid WebApp authentication' });
    }

    // Parse initData
    const urlParams = new URLSearchParams(initData);
    const user = JSON.parse(urlParams.get('user') || '{}');
    const queryId = urlParams.get('query_id');
    const chatType = urlParams.get('chat_type');
    const chatInstance = urlParams.get('chat_instance');

    // Find or create user
    let dbUser = await prisma.user.findUnique({
      where: { telegramId: user.id.toString() }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          telegramId: user.id.toString(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          photoUrl: user.photo_url,
          authDate: new Date(),
          hash: '', // WebApp doesn't provide hash
        }
      });
    }

    // Create WebApp session
    await prisma.webAppSession.create({
      data: {
        userId: dbUser.id,
        initData: JSON.parse(JSON.stringify(Object.fromEntries(urlParams))),
        queryId,
        chatType,
        chatInstance,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: dbUser.id, telegramId: dbUser.telegramId },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        photoUrl: dbUser.photoUrl,
        subscriptionType: dbUser.subscriptionType,
        subscriptionActive: dbUser.subscriptionActive,
        expiresAt: dbUser.expiresAt,
      }
    });

  } catch (error) {
    console.error('WebApp auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify Telegram Login Widget data
function verifyTelegramAuth(data: any): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const { hash, ...authData } = data;
  
  // Create data check string
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto.createHash('sha256').update(token).digest();
  
  // Create hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

// Verify Telegram WebApp initData
function verifyWebAppData(initData: string): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying WebApp data:', error);
    return false;
  }
}

export default router;