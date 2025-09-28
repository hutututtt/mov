// 全局变量
let currentCategory = 'hot';
let currentPage = 1;
let totalPages = 1;
let categories = {};

// DOM 元素
const movieList = document.getElementById('movieList');
const loading = document.getElementById('loading');
const pagination = document.getElementById('pagination');
const movieModal = document.getElementById('movieModal');
const playerModal = document.getElementById('playerModal');
const movieDetail = document.getElementById('movieDetail');
const videoPlayer = document.getElementById('videoPlayer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    bindEvents();
    bindGlobalEvents(); // 只绑定一次全局事件
});

// 初始化应用
async function initializeApp() {
    try {
        showLoading();
        await loadCategories();
        await loadMovies();
    } catch (error) {
        console.error('初始化失败:', error);
        showError('应用初始化失败，请刷新页面重试');
    } finally {
        hideLoading();
    }
}

// 绑定事件
function bindEvents() {
    // 导航链接点击事件
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            if (category !== currentCategory) {
                switchCategory(category);
            }
        });
    });

    // 搜索功能
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 测试视频按钮
    const testVideoBtn = document.getElementById('testVideoBtn');
    if (testVideoBtn) {
        testVideoBtn.addEventListener('click', function() {
            // 使用一个公开的测试视频
            const testUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            createVideoPlayer(testUrl);
        });
    }
}

// 全局事件监听器 - 只绑定一次
function bindGlobalEvents() {
    // 模态框关闭事件 - 使用事件委托
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        }
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === movieModal) {
            closeModal(movieModal);
        }
        if (e.target === playerModal) {
            closeModal(playerModal);
        }
    });
}

// 加载分类
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.code === 1) {
            categories = data.data;
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 切换分类
async function switchCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    await loadMovies();
}

// 加载电影列表
async function loadMovies() {
    try {
        showLoading();
        let response;
        
        if (currentCategory === 'hot') {
            response = await fetch('/api/movies/hot');
        } else {
            // 根据分类ID获取电影
            const categoryId = getCategoryId(currentCategory);
            response = await fetch(`/api/movies/category/${categoryId}?page=${currentPage}`);
        }
        
        const data = await response.json();
        
        if (data.code === 1) {
            displayMovies(data.data);
            updatePagination(data.data);
        } else {
            showError(data.msg || '加载电影失败');
        }
    } catch (error) {
        console.error('加载电影失败:', error);
        showError('网络错误，请检查网络连接');
    } finally {
        hideLoading();
    }
}

// 获取分类ID
function getCategoryId(category) {
    const categoryMap = {
        'action': 8,
        'comedy': 9,
        'drama': 10
    };
    return categoryMap[category] || 32; // 默认返回近期热映
}

// 显示电影列表
function displayMovies(data) {
    console.log('热门电影接口数据:', data);
    
    movieList.innerHTML = '';
    
    let movies = [];
    if (currentCategory === 'hot' && data['32']) {
        movies = data['32'];
        console.log('热门电影列表:', movies);
        console.log('第一个电影数据结构:', movies[0]);
    } else if (data.list) {
        movies = data.list;
        console.log('分类电影列表:', movies);
    }
    
    if (movies.length === 0) {
        movieList.innerHTML = '<div class="no-movies">暂无电影数据</div>';
        return;
    }
    
    movies.forEach((movie, index) => {
        console.log(`电影 ${index + 1}:`, movie);
        const movieCard = createMovieCard(movie);
        movieList.appendChild(movieCard);
    });
}

// 创建电影卡片
function createMovieCard(movie) {
    console.log('创建电影卡片:', movie.title);
    console.log('图片字段:', {
        cover: movie.cover,
        poster: movie.poster,
        path: movie.path,
        tvimg: movie.tvimg,
        tagimg: movie.tagimg
    });
    
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.addEventListener('click', () => showMovieDetail(movie.id));
    
    // 确定图片URL - 处理对象类型的图片字段
    let imageUrl = '/images/placeholder.jpg';
    
    // 检查各种可能的图片字段
    const imageFields = [movie.cover, movie.poster, movie.path, movie.tvimg, movie.tagimg];
    
    for (let field of imageFields) {
        if (field) {
            if (typeof field === 'string' && field.startsWith('/')) {
                // 如果是相对路径，需要拼接完整域名
                imageUrl = `https://static.ztcuc.com${field}`;
                break;
            } else if (typeof field === 'string' && field.startsWith('http')) {
                // 如果已经是完整URL
                imageUrl = field;
                break;
            } else if (typeof field === 'object' && field.value) {
                // 如果是对象，取value字段
                if (field.value.startsWith('/')) {
                    imageUrl = `https://static.ztcuc.com${field.value}`;
                } else if (field.value.startsWith('http')) {
                    imageUrl = field.value;
                }
                break;
            }
        }
    }
    
    console.log('使用的图片URL:', imageUrl);
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${imageUrl}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 loading="lazy">
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            ${movie.score ? `<div class="movie-score">${movie.score}</div>` : ''}
            ${movie.mask ? `<div class="movie-mask">${movie.mask}</div>` : ''}
        </div>
    `;
    
    // 添加图片错误处理和加载优化
    const img = card.querySelector('.movie-poster');
    const container = card.querySelector('.movie-poster-container');
    if (img && container) {
        // 预加载图片
        const preloadImg = new Image();
        preloadImg.onload = function() {
            console.log('图片加载成功:', this.src);
            img.src = this.src;
            img.style.opacity = '1';
            container.classList.add('loaded');
        };
        preloadImg.onerror = function() {
            console.log('图片加载失败，使用占位符:', this.src);
            img.src = '/images/placeholder.jpg';
            img.style.opacity = '1';
            container.classList.add('loaded');
        };
        preloadImg.src = imageUrl;
    }
    
    return card;
}

// 显示电影详情
async function showMovieDetail(movieId) {
    try {
        showLoading();
        const response = await fetch(`/api/movie/${movieId}`);
        const data = await response.json();
        
        if (data.code === 1) {
            displayMovieDetail(data.data);
            movieModal.style.display = 'block';
        } else {
            showError(data.msg || '获取电影详情失败');
        }
    } catch (error) {
        console.error('获取电影详情失败:', error);
        showError('网络错误，请检查网络连接');
    } finally {
        hideLoading();
    }
}

// 显示电影详情内容
function displayMovieDetail(movie) {
    // 确定详情页面图片URL
    let detailImageUrl = '/images/placeholder.jpg';
    const detailImageFields = [movie.poster, movie.cover, movie.path, movie.tvimg, movie.tagimg];
    
    for (let field of detailImageFields) {
        if (field) {
            if (typeof field === 'string' && field.startsWith('/')) {
                detailImageUrl = `https://static.ztcuc.com${field}`;
                break;
            } else if (typeof field === 'string' && field.startsWith('http')) {
                detailImageUrl = field;
                break;
            } else if (typeof field === 'object' && field.value) {
                if (field.value.startsWith('/')) {
                    detailImageUrl = `https://static.ztcuc.com${field.value}`;
                } else if (field.value.startsWith('http')) {
                    detailImageUrl = field.value;
                }
                break;
            }
        }
    }
    
    console.log('详情页面图片URL:', detailImageUrl);
    
    movieDetail.innerHTML = `
        <div class="movie-detail">
            <div class="movie-detail-poster-container">
                <img src="${detailImageUrl}" 
                     alt="${movie.title}" 
                     class="movie-detail-poster"
                     loading="lazy">
            </div>
            <div class="movie-detail-info">
                <h1>${movie.title}</h1>
                ${movie.score ? `<div class="score">评分: ${movie.score}</div>` : ''}
                ${movie.description ? `<p class="description">${movie.description}</p>` : ''}
                ${movie.others_name && movie.others_name.length > 0 ? 
                    `<p><strong>其他名称:</strong> ${movie.others_name.map(name => name.value).join(', ')}</p>` : ''}
                
                ${movie.source_list_source && movie.source_list_source.length > 0 ? `
                    <div class="sources">
                        <h3>播放源</h3>
                        <div class="source-list">
                            ${movie.source_list_source.map((source, index) => `
                                <button class="source-btn" data-source-index="${index}">
                                    ${source.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // 添加详情页面图片预加载
    const detailImg = movieDetail.querySelector('.movie-detail-poster');
    const detailContainer = movieDetail.querySelector('.movie-detail-poster-container');
    if (detailImg && detailContainer) {
        const preloadImg = new Image();
        preloadImg.onload = function() {
            detailImg.src = this.src;
            detailImg.style.opacity = '1';
            detailContainer.classList.add('loaded');
        };
        preloadImg.onerror = function() {
            detailImg.src = '/images/placeholder.jpg';
            detailImg.style.opacity = '1';
            detailContainer.classList.add('loaded');
        };
        preloadImg.src = detailImageUrl;
    }
    
    // 为播放源按钮添加事件监听器
    const sourceButtons = movieDetail.querySelectorAll('.source-btn');
    sourceButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const source = movie.source_list_source[index];
            playVideo(source.name, source.source_list);
        });
    });
}

// 播放视频
function playVideo(sourceName, sourceList) {
    console.log('播放视频:', sourceName, sourceList);
    
    if (!sourceList || sourceList.length === 0) {
        showError('该播放源暂无可用资源');
        return;
    }
    
    // 关闭详情模态框
    movieModal.style.display = 'none';
    
    // 显示播放器模态框
    playerModal.style.display = 'block';
    
    // 创建视频播放器，支持多个播放源
    createVideoPlayerWithFallback(sourceList);
}

// 创建带备用播放源的视频播放器
function createVideoPlayerWithFallback(sourceList, currentIndex = 0) {
    if (currentIndex >= sourceList.length) {
        showError('所有播放源都无法播放，请尝试其他电影');
        return;
    }
    
    const currentSource = sourceList[currentIndex];
    console.log(`尝试播放源 ${currentIndex + 1}/${sourceList.length}:`, currentSource.url);
    
    createVideoPlayer(currentSource.url, () => {
        // 播放失败回调，尝试下一个播放源
        console.log(`播放源 ${currentIndex + 1} 失败，尝试下一个...`);
        createVideoPlayerWithFallback(sourceList, currentIndex + 1);
    });
}

// 创建视频播放器
function createVideoPlayer(url, onError) {
    console.log('创建视频播放器，URL:', url);
    
    // 验证URL
    if (!url || url.trim() === '') {
        showError('无效的视频URL');
        return;
    }
    
    // 检查URL安全性
    try {
        const urlObj = new URL(url);
        console.log('URL解析成功:', {
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            pathname: urlObj.pathname
        });
        
        // 检查协议安全性并尝试修复
        if (urlObj.protocol === 'http:' && window.location.protocol === 'https:') {
            console.warn('混合内容警告: HTTPS页面尝试加载HTTP资源');
            // 尝试将HTTP转换为HTTPS
            const httpsUrl = url.replace('http:', 'https:');
            console.log('尝试使用HTTPS URL:', httpsUrl);
            url = httpsUrl;
        }
    } catch (e) {
        console.error('URL解析失败:', e);
        showError('无效的视频URL格式');
        return;
    }
    
    videoPlayer.innerHTML = '';
    
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = false; // 改为false，避免自动播放被阻止
    video.style.width = '100%';
    video.style.height = '100%';
    video.preload = 'metadata';
    
    // 添加加载状态显示
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = '<div class="spinner"></div><p>正在加载视频...</p>';
    loadingDiv.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white;';
    videoPlayer.appendChild(loadingDiv);
    
    // 检查是否为M3U8流
    if (url.includes('.m3u8')) {
        console.log('检测到M3U8流媒体');
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            console.log('使用HLS.js播放');
            const hls = new Hls({
                debug: true,
                enableWorker: true,
                lowLatencyMode: false
            });
            
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                console.log('HLS媒体已附加');
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                console.log('HLS清单解析完成，找到', data.levels.length, '个质量级别');
                loadingDiv.style.display = 'none';
                videoPlayer.appendChild(video);
            });
            
            hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS播放错误:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('尝试恢复网络错误...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('尝试恢复媒体错误...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('HLS播放失败，尝试下一个播放源...');
                            if (onError && typeof onError === 'function') {
                                onError();
                            } else {
                                showError('HLS播放失败: ' + data.details);
                            }
                            break;
                    }
                }
            });
            
            hls.loadSource(url);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            console.log('使用原生HLS播放');
            video.src = url;
            loadingDiv.style.display = 'none';
            videoPlayer.appendChild(video);
        } else {
            showError('您的浏览器不支持HLS播放，请使用Chrome、Firefox或Safari');
            return;
        }
    } else {
        console.log('使用标准视频播放');
        video.src = url;
        loadingDiv.style.display = 'none';
        videoPlayer.appendChild(video);
    }
    
    // 添加错误处理
    video.addEventListener('error', function(e) {
        const error = video.error;
        console.error('视频播放错误:', {
            error: error,
            code: error ? error.code : 'unknown',
            message: error ? error.message : 'unknown error',
            networkState: video.networkState,
            readyState: video.readyState
        });
        
        let errorMessage = '视频播放失败';
        if (error) {
            switch (error.code) {
                case 1:
                    errorMessage = '视频加载被中止';
                    break;
                case 2:
                    errorMessage = '网络错误导致视频下载失败';
                    break;
                case 3:
                    errorMessage = '视频解码错误';
                    break;
                case 4:
                    errorMessage = '不支持的视频格式或编码';
                    break;
                default:
                    errorMessage = `视频播放错误 (代码: ${error.code})`;
            }
        }
        
        // 如果有错误回调函数，调用它；否则显示错误信息
        if (onError && typeof onError === 'function') {
            onError();
        } else {
            showError(errorMessage + '，请尝试其他播放源');
        }
    });
    
    // 添加加载成功事件
    video.addEventListener('loadeddata', function() {
        console.log('视频加载成功');
        loadingDiv.style.display = 'none';
    });
    
    // 添加加载开始事件
    video.addEventListener('loadstart', function() {
        console.log('开始加载视频');
    });
    
    // 添加可以播放事件
    video.addEventListener('canplay', function() {
        console.log('视频可以播放');
        loadingDiv.style.display = 'none';
    });
    
    // 添加播放事件
    video.addEventListener('play', function() {
        console.log('视频开始播放');
    });
    
    // 添加暂停事件
    video.addEventListener('pause', function() {
        console.log('视频暂停');
    });
}

// 处理搜索
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        // 这里可以实现搜索功能
        showError('搜索功能开发中，敬请期待');
    }
}

// 更新分页
function updatePagination(data) {
    pagination.innerHTML = '';
    
    if (currentCategory === 'hot') {
        // 热门电影不需要分页
        return;
    }
    
    const hasNext = data.hasNext || false;
    const hasPrev = currentPage > 1;
    
    if (hasPrev || hasNext) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.disabled = !hasPrev;
        prevBtn.addEventListener('click', () => {
            if (hasPrev) {
                currentPage--;
                loadMovies();
            }
        });
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.disabled = !hasNext;
        nextBtn.addEventListener('click', () => {
            if (hasNext) {
                currentPage++;
                loadMovies();
            }
        });
        
        pagination.appendChild(prevBtn);
        pagination.appendChild(nextBtn);
    }
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'flex';
    movieList.style.display = 'none';
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
    movieList.style.display = 'grid';
}

// 显示错误信息
function showError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 107, 107, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 3000;
        font-weight: bold;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// 关闭模态框函数
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        // 停止视频播放
        const video = videoPlayer.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    }
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
