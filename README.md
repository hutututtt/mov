# 在线电影观看平台

一个基于Web的在线电影观看平台，支持多种视频格式播放，包括MP4和M3U8流媒体。

## 功能特性

- 🎬 热门电影推荐
- 🔍 电影分类浏览
- 📱 响应式设计，支持移动端
- 🎥 多种播放源支持
- 🔒 安全的内容安全策略
- ⚡ 快速加载和流畅播放

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生JavaScript + EJS模板
- **样式**: CSS3 + 响应式设计
- **播放器**: HLS.js (支持M3U8流媒体)
- **API**: 基于抓包分析的第三方API

## 快速开始

### 🚀 一键部署（推荐国内用户）

#### 方案1：Railway 部署
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/您的用户名/movie-streaming-platform)

#### 方案2：Render 部署
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/您的用户名/movie-streaming-platform)

#### 方案3：腾讯云开发
1. 访问 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 创建云函数
3. 上传代码并部署

### 🌍 Vercel 部署（需要翻墙）
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/您的用户名/movie-streaming-platform)

### 💻 本地开发

#### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn

#### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/您的用户名/movie-streaming-platform.git
cd movie-streaming-platform
```

2. 安装依赖
```bash
npm install
```

3. 启动服务器
```bash
npm start
```

4. 打开浏览器访问
```
http://localhost:3000
```

#### 开发模式
```bash
npm run dev
```

## 🌐 部署指南

### Railway 部署（推荐）
1. 点击上面的 Railway 按钮
2. 连接 GitHub 账号
3. 选择仓库
4. 等待自动部署
5. 获得 `https://xxx.railway.app` 访问链接

### Render 部署
1. 访问 [Render](https://render.com)
2. 注册账号并连接 GitHub
3. 选择 "New Web Service"
4. 选择您的仓库
5. 配置：
   - Build Command: `npm install`
   - Start Command: `npm start`
6. 点击 "Create Web Service"

### 腾讯云开发部署
1. 访问 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 创建环境
3. 进入云函数管理
4. 创建云函数，选择 Node.js 12.16
5. 上传项目代码
6. 配置触发器为 HTTP 触发器
7. 部署并获取访问地址

### 阿里云函数计算
1. 访问 [阿里云函数计算控制台](https://fc.console.aliyun.com)
2. 创建服务
3. 创建函数，选择 Node.js 运行时
4. 上传代码包
5. 配置 HTTP 触发器
6. 部署并获取访问地址

## 🖥️ 服务器部署

### 方案1：Docker 部署（推荐）

#### 使用 Docker Compose
```bash
# 克隆项目
git clone https://github.com/您的用户名/movie-streaming-platform.git
cd movie-streaming-platform

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 使用 Docker
```bash
# 构建镜像
docker build -t movie-streaming-platform .

# 运行容器
docker run -d -p 3000:3000 --name movie-app movie-streaming-platform

# 查看状态
docker ps
```

### 方案2：PM2 进程管理

#### 安装 PM2
```bash
npm install -g pm2
```

#### 部署步骤
```bash
# 1. 克隆项目到服务器
git clone https://github.com/您的用户名/movie-streaming-platform.git
cd movie-streaming-platform

# 2. 安装依赖
npm install --production

# 3. 启动应用
pm2 start ecosystem.config.js --env production

# 4. 设置开机自启
pm2 startup
pm2 save
```

#### PM2 常用命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs movie-streaming-platform

# 重启应用
pm2 restart movie-streaming-platform

# 停止应用
pm2 stop movie-streaming-platform

# 监控面板
pm2 monit
```

### 方案3：Nginx 反向代理

#### 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 配置 Nginx
```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/movie-streaming-platform
sudo ln -s /etc/nginx/sites-available/movie-streaming-platform /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 方案4：一键部署脚本

#### 使用部署脚本
```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh production
```

#### 脚本功能
- ✅ 自动备份当前版本
- ✅ 拉取最新代码
- ✅ 安装依赖
- ✅ 重启服务
- ✅ 健康检查
- ✅ 错误处理

### 服务器要求

#### 最低配置
- CPU: 1核心
- 内存: 1GB
- 存储: 10GB
- 系统: Ubuntu 18.04+ / CentOS 7+

#### 推荐配置
- CPU: 2核心
- 内存: 2GB
- 存储: 20GB
- 系统: Ubuntu 20.04+ / CentOS 8+

#### 环境要求
- Node.js 14.0+
- Nginx 1.18+
- PM2 (可选)
- Docker (可选)

## 项目结构

```
mov/
├── server.js              # 服务器主文件
├── package.json           # 项目配置
├── views/                 # 视图模板
│   └── index.ejs         # 主页面模板
├── public/               # 静态资源
│   ├── css/
│   │   └── style.css     # 样式文件
│   ├── js/
│   │   └── app.js        # 前端逻辑
│   └── images/           # 图片资源
└── README.md             # 项目说明
```

## API接口

### 获取热门电影
```
GET /api/movies/hot
```

### 获取分类电影
```
GET /api/movies/category/:id?page=1
```

### 获取电影详情
```
GET /api/movie/:id
```

### 获取分类列表
```
GET /api/categories
```

## 使用说明

1. **浏览电影**: 在首页可以看到热门电影推荐
2. **分类筛选**: 点击顶部导航可以按分类浏览电影
3. **查看详情**: 点击电影卡片查看详细信息
4. **播放视频**: 在详情页选择播放源进行观看
5. **搜索功能**: 使用顶部搜索框搜索电影（开发中）

## 支持的视频格式

- **MP4**: 直接播放
- **M3U8**: 使用HLS.js进行流媒体播放

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. 本项目仅供学习和研究使用
2. 请遵守相关法律法规，不得用于商业用途
3. 视频资源来源于第三方，请确保合法使用
4. 建议在安全的网络环境下使用

## 免责声明

本项目仅用于技术学习和研究目的。使用者应当遵守当地法律法规，不得将本项目用于任何非法用途。项目作者不承担任何法律责任。

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持热门电影浏览
- 支持分类筛选
- 支持多种播放源
- 响应式设计
