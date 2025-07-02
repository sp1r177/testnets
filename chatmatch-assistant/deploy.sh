#!/bin/bash

# ChatMatch Assistant - Production Deployment Script
# This script sets up and deploys the application on a clean Ubuntu server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PORT=3001
DEFAULT_FRONTEND_PORT=3000
DEFAULT_NODE_VERSION="18"

# Get environment variables or use defaults
PORT=${PORT:-$DEFAULT_PORT}
FRONTEND_PORT=${FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT}
DATABASE_URL=${DATABASE_URL:-""}
NODE_VERSION=${NODE_VERSION:-$DEFAULT_NODE_VERSION}

echo -e "${BLUE}🚀 ChatMatch Assistant - Production Deployment${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. This is not recommended for production."
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system packages
print_info "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
print_status "System packages updated"

# Install basic dependencies
print_info "Installing basic dependencies..."
sudo apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates \
    build-essential git unzip supervisor nginx certbot python3-certbot-nginx ufw
print_status "Basic dependencies installed"

# Install Node.js
if ! command_exists node || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt $NODE_VERSION ]]; then
    print_info "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js $(node -v) installed"
else
    print_status "Node.js $(node -v) already installed"
fi

# Install PM2 globally
if ! command_exists pm2; then
    print_info "Installing PM2..."
    sudo npm install -g pm2
    pm2 startup
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

# Install PostgreSQL if DATABASE_URL is not provided
if [[ -z "$DATABASE_URL" ]]; then
    print_info "Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    print_info "Setting up database..."
    sudo -u postgres createdb chatmatch_db 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER chatmatch WITH ENCRYPTED PASSWORD 'chatmatch_password';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chatmatch_db TO chatmatch;" 2>/dev/null || true
    
    DATABASE_URL="postgresql://chatmatch:chatmatch_password@localhost:5432/chatmatch_db"
    print_status "PostgreSQL setup completed"
else
    print_status "Using provided DATABASE_URL"
fi

# Setup application directory
APP_DIR="/var/www/chatmatch-assistant"
print_info "Setting up application directory at $APP_DIR..."

if [[ -d "$APP_DIR" ]]; then
    print_warning "Application directory exists. Backing up..."
    sudo mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$USER "$APP_DIR"
print_status "Application directory created"

# Copy application files
print_info "Copying application files..."
cp -r . "$APP_DIR/"
cd "$APP_DIR"

# Setup environment file
print_info "Setting up environment configuration..."
if [[ ! -f ".env" ]]; then
    cp .env.example .env
    
    # Update .env with provided values
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|g" .env
    sed -i "s|PORT=.*|PORT=$PORT|g" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:$FRONTEND_PORT|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:$FRONTEND_PORT|g" .env
    
    print_warning "Please edit .env file with your API keys:"
    print_info "  - TELEGRAM_BOT_TOKEN"
    print_info "  - OPENAI_API_KEY"
    print_info "  - STRIPE_SECRET_KEY"
    print_info "  - JWT_SECRET"
fi
print_status "Environment configuration ready"

# Install dependencies
print_info "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

print_info "Installing frontend dependencies..."
cd frontend
npm ci --only=production
cd ..

print_status "Dependencies installed"

# Build applications
print_info "Building backend..."
cd backend
npm run build
print_status "Backend built successfully"

print_info "Running database migrations..."
npx prisma generate
npx prisma db push
cd ..

print_info "Building frontend..."
cd frontend
npm run build
print_status "Frontend built successfully"
cd ..

# Create logs directory
mkdir -p logs

# Setup Nginx
print_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/chatmatch-assistant > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

sudo ln -sf /etc/nginx/sites-available/chatmatch-assistant /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_status "Nginx configured"

# Setup firewall
print_info "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
print_status "Firewall configured"

# Start applications with PM2
print_info "Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
print_status "Applications started with PM2"

# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

print_status "PM2 log rotation configured"

# Final status check
print_info "Checking application status..."
sleep 5

if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
    print_status "Backend is running on port $PORT"
else
    print_error "Backend health check failed"
fi

if curl -f http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
    print_status "Frontend is running on port $FRONTEND_PORT"
else
    print_error "Frontend health check failed"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   🔗 Application URL: http://your-domain.com"
echo -e "   🔧 Backend API: http://your-domain.com/api"
echo -e "   📊 Backend Port: $PORT"
echo -e "   🌐 Frontend Port: $FRONTEND_PORT"
echo -e "   💾 Database: PostgreSQL"
echo -e "   📁 App Directory: $APP_DIR"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "   1. Edit .env file with your API keys"
echo -e "   2. Configure your domain name"
echo -e "   3. Setup SSL certificate: sudo certbot --nginx"
echo -e "   4. Setup Telegram webhook: https://your-domain.com/api/webhooks/telegram"
echo -e "   5. Configure Stripe webhook: https://your-domain.com/api/webhooks/stripe"
echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "   📊 Check status: pm2 status"
echo -e "   📋 View logs: pm2 logs"
echo -e "   🔄 Restart: pm2 restart all"
echo -e "   ⏹️  Stop: pm2 stop all"
echo -e "   🗑️  Remove: pm2 delete all"
echo ""