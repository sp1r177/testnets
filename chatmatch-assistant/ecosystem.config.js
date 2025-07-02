module.exports = {
  apps: [
    {
      name: 'chatmatch-backend',
      script: './backend/dist/index.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 1600,
      listen_timeout: 8000,
      healthcheck_timeout: 30000,
      healthcheck_interval: 30000,
      healthcheck_path: '/health',
    },
    {
      name: 'chatmatch-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/app/frontend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.FRONTEND_PORT || 3000,
        NEXT_PUBLIC_API_URL: `http://localhost:${process.env.PORT || 3001}`,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 1600,
      listen_timeout: 8000,
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/chatmatch-assistant.git',
      path: '/var/www/chatmatch-assistant',
      'pre-deploy': 'git fetch --all',
      'post-deploy': './deploy.sh && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y nodejs npm postgresql-client',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};