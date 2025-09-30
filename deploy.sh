#!/bin/bash

# 电影平台 Docker 部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "Docker 环境检查通过"
}

# 创建必要的目录
create_directories() {
    print_step "创建必要的目录"
    mkdir -p logs
    mkdir -p ssl
    print_message "目录创建完成"
}

# 构建镜像
build_image() {
    print_step "构建 Docker 镜像"
    docker-compose build --no-cache
    print_message "镜像构建完成"
}

# 启动开发环境
start_dev() {
    print_step "启动开发环境"
    docker-compose up -d
    print_message "开发环境启动完成"
    print_message "访问地址: http://localhost:3000"
}

# 启动生产环境
start_prod() {
    print_step "启动生产环境"
    docker-compose -f docker-compose.prod.yml up -d
    print_message "生产环境启动完成"
    print_message "访问地址: http://localhost:80"
}

# 停止服务
stop_services() {
    print_step "停止服务"
    docker-compose down
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    print_message "服务已停止"
}

# 查看日志
view_logs() {
    print_step "查看应用日志"
    docker-compose logs -f movie-app
}

# 查看状态
view_status() {
    print_step "查看服务状态"
    docker-compose ps
}

# 清理资源
cleanup() {
    print_step "清理 Docker 资源"
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    print_message "清理完成"
}

# 显示帮助信息
show_help() {
    echo "电影平台 Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  ./deploy.sh dev      - 启动开发环境"
    echo "  ./deploy.sh prod     - 启动生产环境"
    echo "  ./deploy.sh stop     - 停止所有服务"
    echo "  ./deploy.sh logs     - 查看应用日志"
    echo "  ./deploy.sh status   - 查看服务状态"
    echo "  ./deploy.sh cleanup  - 清理 Docker 资源"
    echo "  ./deploy.sh help     - 显示帮助信息"
    echo ""
    echo "环境要求:"
    echo "  - Docker 20.10+"
    echo "  - Docker Compose 2.0+"
    echo "  - 至少 1GB 可用内存"
}

# 主函数
main() {
    local command=${1:-help}
    
    case $command in
        dev)
            check_docker
            create_directories
            build_image
            start_dev
            ;;
        prod)
            check_docker
            create_directories
            build_image
            start_prod
            ;;
        stop)
            stop_services
            ;;
        logs)
            view_logs
            ;;
        status)
            view_status
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"