# Multi-stage build for ChatMatch Assistant
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for both frontend and backend
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd frontend && npm ci --only=production && npm cache clean --force
RUN cd backend && npm ci --only=production && npm cache clean --force

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install PM2 globally
RUN npm install pm2 -g

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copy built applications
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy PM2 ecosystem file
COPY ecosystem.config.js .

# Copy environment and deployment files
COPY .env.example .
COPY deploy.sh .
COPY env.setup.sh .

# Make scripts executable
RUN chmod +x deploy.sh env.setup.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_PORT=3000

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER nextjs

# Start both frontend and backend with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]