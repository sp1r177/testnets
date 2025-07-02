import express from 'express';
import { authenticateToken } from './auth';
import { getUserUsageInfo } from '../utils/usage';

const router = express.Router();

// Get current user info
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const usageInfo = getUserUsageInfo(user);

    res.json({
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
        createdAt: user.createdAt,
      },
      usage: usageInfo
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;