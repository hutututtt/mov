module.exports = {
  apps: [{
    name: 'movie-streaming-platform',
    script: 'server.js',
    instances: 1, // 宝塔推荐单实例
    exec_mode: 'fork',
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
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // 重启策略
    min_uptime: '10s',
    max_restarts: 5,
    // 健康检查
    health_check_grace_period: 3000,
    // 进程配置
    kill_timeout: 5000,
    listen_timeout: 3000,
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 宝塔优化配置
    autorestart: true,
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
