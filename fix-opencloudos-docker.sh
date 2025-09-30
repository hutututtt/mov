#!/bin/bash

# OpenCloudOS Docker 部署修复脚本
# 解决镜像拉取和网络问题

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
    echo "内核版本: $(uname -r)"
    echo "系统架构: $(uname -m)"
    echo "内存信息: $(free -h | grep Mem)"
    echo "磁盘空间: $(df -h / | tail -1)"
}

# 修复 Dockerfile 镜像源
fix_dockerfile() {
    print_message "修复 Dockerfile 镜像源..."
    
    # 备份原 Dockerfile
    cp Dockerfile Dockerfile.backup
    
    # 创建新的 Dockerfile，使用官方镜像
    cat > Dockerfile << 'EOF'
# 使用官方 Node.js 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    dumb-init

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置权限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 使用 dumb-init 启动
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
EOF
    
    print_message "Dockerfile 修复完成"
}

# 配置 Docker 镜像源
configure_docker_mirrors() {
    print_message "配置 Docker 镜像源..."
    
    # 创建 Docker 配置目录
    mkdir -p /etc/docker
    
    # 配置 Docker 镜像源
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"],
  "live-restore": true
}
EOF
    
    # 重启 Docker 服务
    systemctl restart docker
    
    print_message "Docker 镜像源配置完成"
}

# 测试 Docker 镜像拉取
test_docker_pull() {
    print_message "测试 Docker 镜像拉取..."
    
    # 测试拉取 Node.js 镜像
    if docker pull node:18-alpine; then
        print_message "Node.js 镜像拉取成功"
    else
        print_error "Node.js 镜像拉取失败"
        return 1
    fi
    
    # 测试拉取 hello-world 镜像
    if docker pull hello-world:latest; then
        print_message "hello-world 镜像拉取成功"
        docker rmi hello-world:latest
    else
        print_warning "hello-world 镜像拉取失败，但基本功能正常"
    fi
}

# 重新构建项目
rebuild_project() {
    print_message "重新构建项目..."
    
    # 清理旧的镜像和容器
    docker-compose down --remove-orphans 2>/dev/null || true
    docker rmi movie-streaming-platform 2>/dev/null || true
    
    # 重新构建
    docker-compose build --no-cache
    
    print_message "项目构建完成"
}

# 启动项目
start_project() {
    print_message "启动项目..."
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        print_message "项目启动成功"
        return 0
    else
        print_error "项目启动失败"
        return 1
    fi
}

# 显示服务状态
show_status() {
    print_message "服务状态："
    docker-compose ps
    
    echo ""
    print_message "服务日志："
    docker-compose logs --tail=20
}

# 主函数
main() {
    print_message "开始 OpenCloudOS Docker 部署修复..."
    
    check_system_info
    fix_dockerfile
    configure_docker_mirrors
    test_docker_pull
    rebuild_project
    
    if start_project; then
        show_status
        print_message "部署修复完成！"
        print_message "访问地址: http://你的服务器IP:3000"
    else
        print_error "部署失败，请检查日志"
        docker-compose logs
    fi
}

# 执行主函数
main "$@"
