const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置 - 简化安全头设置
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  referrerPolicy: false,
  strictTransportSecurity: false,
  xContentTypeOptions: false,
  xDnsPrefetchControl: false,
  xDownloadOptions: false,
  xFrameOptions: false,
  xPermittedCrossDomainPolicies: false,
  xPoweredBy: false,
  xXssProtection: false
}));

// CORS配置 - 完全开放
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// 移除所有安全头
app.use((req, res, next) => {
  // 移除所有可能导致问题的安全头
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Origin-Agent-Cluster');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('Referrer-Policy');
  
  // 确保静态资源正确设置Content-Type
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  
  next();
});

// 增加请求体大小限制，避免 400 错误
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
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

// 测试路由
app.get('/test', (req, res) => {
  res.render('test', { title: '服务器测试' });
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
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }
    
    const searchQuery = q.trim();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    console.log(`搜索关键词: ${searchQuery}, 页码: ${pageNum}, 每页: ${limitNum}`);
    
    // 构建搜索URL - 使用新的搜索接口
    const searchUrls = [
      `https://api.ztcgi.com/api/v2/search/videoV2?key=${encodeURIComponent(searchQuery)}&category_id=88&page=${pageNum}&pageSize=${limitNum}`,
      `https://api.ztcuc.com/api/search?keyword=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=${limitNum}`,
      `https://api.ztcuc.com/api/movies/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`,
      `https://api.ztcuc.com/api/v1/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}`
    ];
    
    let searchResults = [];
    let hasNext = false;
    let total = 0;
    
    // 尝试多个搜索接口
    for (const url of searchUrls) {
      try {
        console.log(`尝试搜索接口: ${url}`);
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'PostmanRuntime-ApipostRuntime/1.1.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Host': url.includes('api.ztcgi.com') ? 'api.ztcgi.com' : 'api.ztcuc.com',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': url.includes('api.ztcgi.com') ? 'https://www.ztcgi.com/' : 'https://www.ztcuc.com/'
          }
        });
        
        // 处理新接口的响应格式
        if (response.data) {
          let data, list, totalCount, hasNextPage;
          
          // 新接口格式 (api.ztcgi.com)
          if (url.includes('api.ztcgi.com')) {
            data = response.data;
            list = data.data || data.list || [];
            totalCount = data.total || data.totalCount || list.length;
            hasNextPage = data.hasNext || (pageNum * limitNum < totalCount);
          } 
          // 旧接口格式 (api.ztcuc.com)
          else if (response.data.code === 1) {
            data = response.data.data;
            list = data.list || [];
            totalCount = data.total || list.length;
            hasNextPage = data.hasNext || false;
          }
          
          if (list && Array.isArray(list) && list.length > 0) {
            searchResults = list;
            hasNext = hasNextPage;
            total = totalCount;
            console.log(`搜索成功，找到 ${searchResults.length} 个结果`);
            break;
          }
        }
      } catch (error) {
        console.log(`搜索接口失败: ${url}, 错误: ${error.message}`);
        continue;
      }
    }
    
    // 如果所有接口都失败，尝试从热门电影中搜索
    if (searchResults.length === 0) {
      try {
        console.log('尝试从热门电影中搜索...');
        const hotResponse = await axios.get('https://api.ztcuc.com/api/movies/hot', {
          timeout: 10000,
          headers: {
            'User-Agent': 'PostmanRuntime-ApipostRuntime/1.1.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Host': 'api.ztcuc.com',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.ztcuc.com/'
          }
        });
        
        if (hotResponse.data && hotResponse.data.code === 1) {
          const hotMovies = hotResponse.data.data || [];
          // 简单的标题匹配搜索
          searchResults = hotMovies.filter(movie => 
            movie.title && movie.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          console.log(`从热门电影中找到 ${searchResults.length} 个匹配结果`);
        }
      } catch (error) {
        console.log('从热门电影搜索失败:', error.message);
      }
    }
    
    // 处理搜索结果
    const processedResults = searchResults.map(movie => ({
      id: movie.id || movie.movie_id || Math.random().toString(36).substr(2, 9),
      title: movie.title || movie.name || '未知标题',
      cover: movie.cover || movie.poster || movie.path || movie.tvimg || movie.tagimg,
      score: movie.score || movie.rating || '',
      mask: movie.mask || movie.type || '',
      year: movie.year || movie.release_year || '',
      director: movie.director || '',
      actors: movie.actors || movie.cast || '',
      description: movie.description || movie.summary || movie.intro || '',
      category: movie.category || movie.genre || '',
      duration: movie.duration || movie.runtime || '',
      country: movie.country || movie.region || '',
      language: movie.language || '',
      update_time: movie.update_time || movie.created_at || new Date().toISOString()
    }));
    
    res.json({
      code: 1,
      msg: '搜索成功',
      data: {
        list: processedResults,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: total,
          hasNext: hasNext,
          hasPrev: pageNum > 1
        },
        searchQuery: searchQuery,
        searchTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ 
      code: 0, 
      msg: '搜索失败，请稍后重试',
      error: error.message 
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
