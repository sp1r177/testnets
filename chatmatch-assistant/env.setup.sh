#!/bin/bash

echo "🚀 ChatMatch Assistant - Environment Setup"
echo "==========================================="

# Copy .env.example to .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "📝 Please edit .env file with your actual configuration:"
    echo "   - Database credentials"
    echo "   - Telegram bot token and webhook secret"
    echo "   - OpenAI API key"
    echo "   - Stripe keys and price ID"
    echo "   - JWT secret"
    echo ""
    echo "💡 You can get these keys from:"
    echo "   🤖 Telegram: https://core.telegram.org/bots#creating-a-new-bot"
    echo "   🧠 OpenAI: https://platform.openai.com/api-keys"
    echo "   💳 Stripe: https://dashboard.stripe.com/apikeys"
    echo ""
else
    echo "⚠️  .env file already exists. Skipping..."
fi

# Make sure the script is executable
chmod +x deploy.sh 2>/dev/null || true

echo "🎯 Next steps:"
echo "   1. Edit .env file with your keys"
echo "   2. Run: ./deploy.sh"
echo ""