#!/bin/bash

# 电影平台部署脚本
# 使用方法: ./deploy.sh [production|staging]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="movie-streaming-platform"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 函数：创建目录
create_directories() {
    print_info "创建必要目录..."
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $APP_DIR/logs
}

# 函数：备份当前版本
backup_current() {
    if [ -d "$APP_DIR" ]; then
        print_info "备份当前版本..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME
        print_info "备份完成: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# 函数：拉取最新代码
pull_code() {
    print_info "拉取最新代码..."
    cd $APP_DIR
    sudo git pull origin main
}

# 函数：安装依赖
install_dependencies() {
    print_info "安装依赖..."
    cd $APP_DIR
    sudo npm ci --production
}

# 函数：构建应用
build_app() {
    print_info "构建应用..."
    cd $APP_DIR
    # 如果有构建步骤，在这里添加
    # sudo npm run build
}

# 函数：重启服务
restart_services() {
    print_info "重启服务..."
    
    # 重启 PM2 应用
    sudo pm2 reload ecosystem.config.js --env production
    
    # 重启 Nginx
    sudo systemctl reload nginx
    
    print_info "服务重启完成"
}

# 函数：健康检查
health_check() {
    print_info "执行健康检查..."
    sleep 5
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_info "应用运行正常"
    else
        print_error "应用启动失败"
        exit 1
    fi
}

# 函数：显示部署信息
show_deployment_info() {
    print_info "部署完成！"
    echo "应用目录: $APP_DIR"
    echo "日志目录: $LOG_DIR"
    echo "备份目录: $BACKUP_DIR"
    echo ""
    print_info "常用命令:"
    echo "查看应用状态: sudo pm2 status"
    echo "查看应用日志: sudo pm2 logs $APP_NAME"
    echo "重启应用: sudo pm2 restart $APP_NAME"
    echo "查看 Nginx 状态: sudo systemctl status nginx"
}

# 主函数
main() {
    print_info "开始部署 $APP_NAME..."
    
    # 检查必要命令
    check_command "git"
    check_command "npm"
    check_command "pm2"
    check_command "nginx"
    
    # 执行部署步骤
    create_directories
    backup_current
    pull_code
    install_dependencies
    build_app
    restart_services
    health_check
    show_deployment_info
    
    print_info "部署完成！"
}

# 执行主函数
main "$@"
