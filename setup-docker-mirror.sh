# Docker 镜像加速器配置脚本
# 适用于中国大陆服务器

#!/bin/bash

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

# 创建 Docker 配置目录
mkdir -p /etc/docker

# 配置镜像加速器
print_message "配置 Docker 镜像加速器..."

cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

print_message "Docker 配置完成"

# 重启 Docker 服务
print_message "重启 Docker 服务..."
systemctl daemon-reload
systemctl restart docker

# 等待 Docker 启动
sleep 5

# 验证配置
print_message "验证 Docker 配置..."
docker info | grep -A 10 "Registry Mirrors"

print_message "Docker 镜像加速器配置完成！"
print_warning "如果仍有问题，请检查服务器网络连接"
