# 使用国内镜像源的 Node.js 镜像
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    dumb-init

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 创建日志目录
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["npm", "start"]
