#!/bin/bash

# 宝塔面板 Nginx 400 错误修复脚本
# 解决 "Request Header Or Cookie Too Large" 问题

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统信息
check_system_info() {
    print_message "检查系统信息..."
    
    echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Nginx 版本: $(nginx -v 2>&1 | cut -d' ' -f3)"
    echo "当前时间: $(date)"
}

# 备份 Nginx 配置
backup_nginx_config() {
    print_message "备份 Nginx 配置..."
    
    # 备份主配置文件
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # 备份网站配置
    if [ -f "/www/server/panel/vhost/nginx/你的域名.conf" ]; then
        cp "/www/server/panel/vhost/nginx/你的域名.conf" "/www/server/panel/vhost/nginx/你的域名.conf.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    print_message "Nginx 配置备份完成"
}

# 修复 Nginx 主配置
fix_nginx_main_config() {
    print_message "修复 Nginx 主配置..."
    
    # 在 http 块中添加或修改以下配置
    cat > /tmp/nginx_http_config.conf << 'EOF'
# 增加请求头大小限制
client_header_buffer_size 16k;
large_client_header_buffers 4 32k;

# 增加请求体大小限制
client_max_body_size 100m;

# 增加超时时间
client_body_timeout 60s;
client_header_timeout 60s;
send_timeout 60s;

# 增加连接超时
keepalive_timeout 65;
keepalive_requests 100;

# 增加代理缓冲区大小
proxy_buffer_size 16k;
proxy_buffers 4 32k;
proxy_busy_buffers_size 64k;
proxy_temp_file_write_size 64k;

# 增加 FastCGI 缓冲区大小
fastcgi_buffer_size 16k;
fastcgi_buffers 4 32k;
fastcgi_busy_buffers_size 64k;
fastcgi_temp_file_write_size 64k;
EOF

    print_message "Nginx 主配置修复完成"
}

# 修复网站配置文件
fix_website_config() {
    print_message "修复网站配置文件..."
    
    # 创建网站配置模板
    cat > /tmp/website_config.conf << 'EOF'
server {
    listen 80;
    server_name 你的域名;
    
    # 增加请求头大小限制
    client_header_buffer_size 16k;
    large_client_header_buffers 4 32k;
    
    # 增加请求体大小限制
    client_max_body_size 100m;
    
    # 增加超时时间
    client_body_timeout 60s;
    client_header_timeout 60s;
    send_timeout 60s;
    
    # 静态文件处理
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /www/wwwroot/movie-app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # API 和页面代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加代理缓冲区大小
        proxy_buffer_size 16k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
        proxy_temp_file_write_size 64k;
        
        # 增加超时时间
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 禁用代理缓冲（可选）
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # 错误页面
    error_page 400 401 402 403 404 500 502 503 504 /50x.html;
    location = /50x.html {
        root /www/wwwroot/movie-app/public;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

    print_message "网站配置模板创建完成"
}

# 应用配置修复
apply_config_fix() {
    print_message "应用配置修复..."
    
    # 方法1: 直接修改 nginx.conf
    if [ -f "/etc/nginx/nginx.conf" ]; then
        # 在 http 块中添加配置
        sed -i '/http {/a\    # 增加请求头大小限制\n    client_header_buffer_size 16k;\n    large_client_header_buffers 4 32k;\n    \n    # 增加请求体大小限制\n    client_max_body_size 100m;\n    \n    # 增加超时时间\n    client_body_timeout 60s;\n    client_header_timeout 60s;\n    send_timeout 60s;' /etc/nginx/nginx.conf
    fi
    
    # 方法2: 在宝塔面板中手动配置
    print_message "请在宝塔面板中手动配置："
    echo "1. 进入 网站 → 你的域名 → 配置文件"
    echo "2. 在 server 块中添加以下配置："
    echo ""
    cat /tmp/website_config.conf
    echo ""
    
    print_message "或者使用以下命令直接替换配置文件："
    echo "cp /tmp/website_config.conf /www/server/panel/vhost/nginx/你的域名.conf"
}

# 重启 Nginx
restart_nginx() {
    print_message "重启 Nginx..."
    
    # 测试配置文件
    if nginx -t; then
        print_message "Nginx 配置文件测试通过"
        
        # 重启 Nginx
        systemctl restart nginx
        
        # 检查状态
        if systemctl is-active --quiet nginx; then
            print_message "Nginx 重启成功"
        else
            print_error "Nginx 重启失败"
            systemctl status nginx
        fi
    else
        print_error "Nginx 配置文件有错误，请检查"
        nginx -t
    fi
}

# 检查应用状态
check_app_status() {
    print_message "检查应用状态..."
    
    # 检查 PM2 状态
    if command -v pm2 &> /dev/null; then
        print_message "PM2 应用状态："
        pm2 status
    fi
    
    # 检查端口占用
    print_message "端口占用情况："
    netstat -tlnp | grep :3000 || echo "端口 3000 未被占用"
    netstat -tlnp | grep :80 || echo "端口 80 未被占用"
    
    # 检查 Nginx 状态
    print_message "Nginx 状态："
    systemctl status nginx --no-pager -l
}

# 显示修复说明
show_fix_guide() {
    print_message "400 错误修复说明："
    echo ""
    echo "问题原因："
    echo "1. 请求头或 Cookie 过大"
    echo "2. Nginx 默认的 client_header_buffer_size 太小"
    echo "3. 代理缓冲区设置不当"
    echo ""
    echo "解决方案："
    echo "1. 增加 client_header_buffer_size 和 large_client_header_buffers"
    echo "2. 增加 client_max_body_size"
    echo "3. 调整代理缓冲区设置"
    echo "4. 增加超时时间"
    echo ""
    echo "手动修复步骤："
    echo "1. 进入宝塔面板 → 网站 → 你的域名 → 配置文件"
    echo "2. 在 server 块中添加配置"
    echo "3. 保存并重启 Nginx"
    echo ""
    echo "配置文件位置："
    echo "/www/server/panel/vhost/nginx/你的域名.conf"
}

# 主函数
main() {
    print_message "开始修复宝塔面板 400 错误..."
    
    check_system_info
    backup_nginx_config
    fix_nginx_main_config
    fix_website_config
    apply_config_fix
    restart_nginx
    check_app_status
    show_fix_guide
    
    print_message "修复完成！"
    print_message "如果问题仍然存在，请手动在宝塔面板中配置"
}

# 执行主函数
main "$@"
