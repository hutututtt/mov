# 🎬 电影平台 Docker 部署指南

这是一个现代化的在线电影观看平台，支持 Docker 容器化部署。

## 📋 环境要求

- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **内存**: 至少 1GB 可用内存
- **磁盘**: 至少 2GB 可用空间

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd mov
```

### 2. 使用部署脚本（推荐）

```bash
# 启动开发环境
./deploy.sh dev

# 启动生产环境
./deploy.sh prod

# 查看帮助
./deploy.sh help
```

### 3. 手动部署

#### 开发环境
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 生产环境
```bash
# 构建并启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 部署脚本命令

| 命令 | 说明 |
|------|------|
| `./deploy.sh dev` | 启动开发环境 (端口 3000) |
| `./deploy.sh prod` | 启动生产环境 (端口 80) |
| `./deploy.sh stop` | 停止所有服务 |
| `./deploy.sh logs` | 查看应用日志 |
| `./deploy.sh status` | 查看服务状态 |
| `./deploy.sh cleanup` | 清理 Docker 资源 |
| `./deploy.sh help` | 显示帮助信息 |

## 🌐 访问地址

- **开发环境**: http://localhost:3000
- **生产环境**: http://localhost:80

## 📁 项目结构

```
mov/
├── Dockerfile                 # Docker 镜像构建文件
├── docker-compose.yml         # 开发环境配置
├── docker-compose.prod.yml    # 生产环境配置
├── .dockerignore              # Docker 忽略文件
├── deploy.sh                  # 部署脚本
├── server.js                  # 主服务器文件
├── package.json               # Node.js 依赖
├── public/                    # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
├── views/                     # 模板文件
└── logs/                      # 日志目录
```

## 🔍 监控和日志

### 查看容器状态
```bash
docker-compose ps
```

### 查看实时日志
```bash
docker-compose logs -f movie-app
```

### 查看容器资源使用
```bash
docker stats movie-streaming-platform
```

### 进入容器调试
```bash
docker-compose exec movie-app sh
```

## 🛠️ 故障排除

### 1. 端口冲突
如果端口被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:3000"  # 改为其他端口
```

### 2. 内存不足
如果遇到内存问题，可以调整资源限制：
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

### 3. 容器启动失败
```bash
# 查看详细错误信息
docker-compose logs movie-app

# 重新构建镜像
docker-compose build --no-cache
```

### 4. 清理资源
```bash
# 停止并删除容器
docker-compose down

# 清理未使用的镜像和容器
docker system prune -f

# 完全清理（包括卷）
docker-compose down --volumes --remove-orphans
```

## 🔒 安全配置

### 1. 生产环境安全
- 使用非 root 用户运行容器
- 启用健康检查
- 限制资源使用
- 配置日志轮转

### 2. HTTPS 配置（可选）
如果需要 HTTPS，可以配置 Nginx 反向代理：

```bash
# 将 SSL 证书放在 ssl/ 目录
mkdir ssl
# 复制你的证书文件到 ssl/ 目录
```

## 📊 性能优化

### 1. 镜像优化
- 使用 Alpine Linux 基础镜像
- 多阶段构建减少镜像大小
- 清理 npm 缓存

### 2. 容器优化
- 设置资源限制
- 启用健康检查
- 配置重启策略

## 🔄 更新部署

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并部署
./deploy.sh prod
```

### 回滚版本
```bash
# 切换到之前的版本
git checkout <previous-commit>

# 重新部署
./deploy.sh prod
```

## 📞 支持

如果遇到问题，请检查：
1. Docker 和 Docker Compose 版本
2. 系统资源使用情况
3. 网络连接状态
4. 容器日志信息

---

**注意**: 这是一个示例项目，请根据实际需求调整配置。
