import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhooks';
import userRoutes from './routes/user';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Special handling for Stripe webhooks (raw body needed)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ChatMatch Assistant Backend',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 ChatMatch Assistant Backend is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});