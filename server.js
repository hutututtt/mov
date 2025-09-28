const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:", "ftp:", "blob:"],
      connectSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API 基础配置
const API_BASE = 'https://api.ztcgi.com/api';
const STATIC_BASE = 'https://static.ztcuc.com';

// 获取静态资源域名
let staticDomain = STATIC_BASE;
const updateStaticDomain = async () => {
  try {
    const response = await axios.get(`${API_BASE}/resourceDomainConfig`);
    if (response.data && response.data.data) {
      staticDomain = response.data.data;
    }
  } catch (error) {
    console.log('使用默认静态域名');
  }
};

// 更新静态域名
updateStaticDomain();

// 路由
app.get('/', (req, res) => {
  res.render('index', { title: '在线电影平台' });
});

// 获取电影分类列表
app.get('/api/categories', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/dyTag/list?category_id=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; MI 9 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:423;packageName:com.jp3.xg3',
        'X-Requested-With': 'com.jp3.xg3'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: '获取分类失败' });
  }
});

// 获取热门电影列表
app.get('/api/movies/hot', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/dyTag/hand_data?category_id=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; MI 9 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:423;packageName:com.jp3.xg3',
        'X-Requested-With': 'com.jp3.xg3'
      }
    });
    
    // 处理图片URL
    const data = response.data;
    if (data.data && data.data['32']) {
      data.data['32'] = data.data['32'].map(movie => ({
        ...movie,
        cover: movie.path ? `${staticDomain}${movie.path}` : null,
        poster: movie.tvimg ? `${staticDomain}${movie.tvimg}` : null
      }));
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取热门电影失败' });
  }
});

// 获取分类电影列表
app.get('/api/movies/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${API_BASE}/dyTag/tpl2_data?id=${id}&page=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; MI 9 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:423;packageName:com.jp3.xg3',
        'X-Requested-With': 'com.jp3.xg3'
      }
    });
    
    // 处理图片URL
    const data = response.data;
    if (data.data && data.data.list) {
      data.data.list = data.data.list.map(movie => ({
        ...movie,
        cover: movie.path ? `${staticDomain}${movie.path}` : null,
        poster: movie.tvimg ? `${staticDomain}${movie.tvimg}` : null
      }));
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取分类电影失败' });
  }
});

// 获取电影详情
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${API_BASE}/video/detailv2?id=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; MI 9 Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/137.0.7151.115 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:423;packageName:com.jp3.xg3',
        'X-Requested-With': 'com.jp3.xg3'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: '获取电影详情失败' });
  }
});

// 搜索电影
app.get('/api/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }
    
    // 这里可以添加搜索接口，暂时返回空结果
    res.json({ code: 1, msg: '搜索功能开发中', data: { list: [] } });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
