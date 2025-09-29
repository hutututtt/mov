module.exports = {
  apps: [{
    name: 'movie-streaming-platform',
    script: 'server.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 自动重启配置
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // 重启策略
    min_uptime: '10s',
    max_restarts: 10,
    // 健康检查
    health_check_grace_period: 3000,
    // 集群配置
    kill_timeout: 5000,
    listen_timeout: 3000,
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/movie-streaming-platform.git',
      path: '/var/www/movie-streaming-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
