#!/bin/bash

# 服务器部署脚本
# 使用方法: ./server-deploy.sh [server-ip] [username]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查参数
if [ $# -lt 2 ]; then
    print_error "使用方法: $0 <服务器IP> <用户名> [部署目录]"
    echo "示例: $0 192.168.1.100 ubuntu /opt/movie-platform"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2
DEPLOY_DIR=${3:-/opt/movie-platform}
APP_DIR="$DEPLOY_DIR/app"

print_message "开始部署到服务器: $SERVER_IP"
print_message "部署目录: $DEPLOY_DIR"

# 检查本地文件
check_local_files() {
    print_step "检查本地文件"
    
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile 不存在"
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml 不存在"
        exit 1
    fi
    
    print_message "本地文件检查完成"
}

# 创建部署包
create_deployment_package() {
    print_step "创建部署包"
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    PACKAGE_NAME="movie-platform-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # 复制文件到临时目录
    cp -r . "$TEMP_DIR/movie-platform"
    
    # 移除不需要的文件
    cd "$TEMP_DIR/movie-platform"
    rm -rf .git
    rm -rf node_modules
    rm -rf logs/*
    
    # 创建压缩包
    cd "$TEMP_DIR"
    tar -czf "$PACKAGE_NAME" movie-platform/
    
    print_message "部署包创建完成: $PACKAGE_NAME"
    echo "$TEMP_DIR/$PACKAGE_NAME"
}

# 上传到服务器
upload_to_server() {
    local package_path=$1
    
    print_step "上传文件到服务器"
    
    # 检查 SSH 连接
    if ! ssh -o ConnectTimeout=10 "$USERNAME@$SERVER_IP" "echo 'SSH连接成功'" 2>/dev/null; then
        print_error "无法连接到服务器 $SERVER_IP"
        print_warning "请确保:"
        print_warning "1. 服务器IP地址正确"
        print_warning "2. SSH密钥已配置"
        print_warning "3. 用户有sudo权限"
        exit 1
    fi
    
    # 创建服务器目录
    ssh "$USERNAME@$SERVER_IP" "sudo mkdir -p $DEPLOY_DIR && sudo chown $USERNAME:$USERNAME $DEPLOY_DIR"
    
    # 上传文件
    scp "$package_path" "$USERNAME@$SERVER_IP:$DEPLOY_DIR/"
    
    print_message "文件上传完成"
}

# 在服务器上部署
deploy_on_server() {
    local package_name=$1
    
    print_step "在服务器上部署应用"
    
    ssh "$USERNAME@$SERVER_IP" << EOF
        set -e
        
        echo "进入部署目录: $DEPLOY_DIR"
        cd $DEPLOY_DIR
        
        echo "解压部署包"
        tar -xzf $package_name
        
        echo "移动文件到app目录"
        rm -rf app
        mv movie-platform app
        
        echo "创建必要目录"
        mkdir -p logs ssl backups
        
        echo "设置权限"
        chmod +x app/deploy.sh
        
        echo "检查Docker环境"
        if ! command -v docker &> /dev/null; then
            echo "安装Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo "安装Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        echo "启动应用"
        cd app
        ./deploy.sh prod
        
        echo "清理部署包"
        rm -f $package_name
        
        echo "部署完成!"
EOF
    
    print_message "服务器部署完成"
}

# 验证部署
verify_deployment() {
    print_step "验证部署"
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    ssh "$USERNAME@$SERVER_IP" "cd $APP_DIR && ./deploy.sh status"
    
    # 测试访问
    if curl -f "http://$SERVER_IP" >/dev/null 2>&1; then
        print_message "✅ 应用部署成功!"
        print_message "访问地址: http://$SERVER_IP"
    else
        print_warning "⚠️  应用可能还在启动中，请稍后访问"
        print_message "访问地址: http://$SERVER_IP"
    fi
}

# 显示部署信息
show_deployment_info() {
    print_message "🎉 部署完成!"
    echo ""
    echo "📋 部署信息:"
    echo "  服务器: $SERVER_IP"
    echo "  用户: $USERNAME"
    echo "  目录: $DEPLOY_DIR"
    echo "  访问: http://$SERVER_IP"
    echo ""
    echo "🔧 管理命令:"
    echo "  查看状态: ssh $USERNAME@$SERVER_IP 'cd $APP_DIR && ./deploy.sh status'"
    echo "  查看日志: ssh $USERNAME@$SERVER_IP 'cd $APP_DIR && ./deploy.sh logs'"
    echo "  重启服务: ssh $USERNAME@$SERVER_IP 'cd $APP_DIR && ./deploy.sh stop && ./deploy.sh prod'"
    echo ""
    echo "📁 目录结构:"
    echo "  $DEPLOY_DIR/"
    echo "  ├── app/          # 应用代码"
    echo "  ├── logs/         # 日志文件"
    echo "  ├── ssl/          # SSL证书"
    echo "  └── backups/      # 备份文件"
}

# 主函数
main() {
    print_message "开始服务器部署流程"
    
    check_local_files
    package_path=$(create_deployment_package)
    upload_to_server "$package_path"
    deploy_on_server "$(basename "$package_path")"
    verify_deployment
    show_deployment_info
    
    # 清理临时文件
    rm -rf "$(dirname "$package_path")"
    
    print_message "部署流程完成!"
}

# 执行主函数
main
