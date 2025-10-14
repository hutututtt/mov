// 全局变量
let currentCategory = 'hot';
let currentPage = 1;
let totalPages = 1;
let categories = {};
let isSearchMode = false;
let currentSearchQuery = '';
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
// 不使用搜索缓存
let searchCache = {};
let searchTimeout = null;

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
const searchSuggestions = document.getElementById('searchSuggestions');

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
    
    // 实时搜索（防抖）
    searchInput.addEventListener('input', handleRealTimeSearch);
    
    // 搜索输入框焦点事件
    searchInput.addEventListener('focus', function() {
        this.classList.add('focused');
        showSearchSuggestions();
    });
    
    searchInput.addEventListener('blur', function() {
        this.classList.remove('focused');
        // 延迟隐藏建议，以便点击建议项
        setTimeout(() => {
            hideSearchSuggestions();
        }, 200);
    });
    
    // 点击外部隐藏建议
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            hideSearchSuggestions();
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
            e.preventDefault();
            e.stopPropagation();
            const modal = e.target.closest('.modal');
            closeModal(modal);
        }
    });

    // 点击模态框外部关闭
    document.addEventListener('click', function(e) {
        if (e.target === movieModal) {
            closeModal(movieModal);
        }
        if (e.target === playerModal) {
            closeModal(playerModal);
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (movieModal.style.display === 'block') {
                closeModal(movieModal);
            }
            if (playerModal.style.display === 'block') {
                closeModal(playerModal);
            }
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
        'drama': 10,
    };
    return categoryMap[category] || 32; // 默认返回近期热映
}

// 显示电影列表
function displayMovies(data) {
    console.log('电影接口数据:', data);
    
    movieList.innerHTML = '';
    
    let movies = [];
    if (currentCategory === 'hot' && data['32']) {
        movies = data['32'];
        console.log('热门电影列表:', movies);
        console.log('第一个电影数据结构:', movies[0]);
    } else if (data.list) {
        movies = data.list;
        console.log('分类电影列表:', movies);
    } else if (Array.isArray(data)) {
        movies = data;
        console.log('直接数组数据:', movies);
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
    
    // 检查各种可能的图片字段，优先使用 path 和 tvimg
    const imageFields = [movie.path, movie.tvimg, movie.tagimg, movie.cover, movie.poster];
    
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
            } else if (typeof field === 'string' && !field.includes('[object Object]')) {
                // 如果是字符串且不包含 [object Object]
                if (field.startsWith('/')) {
                    imageUrl = `https://static.ztcuc.com${field}`;
                } else if (field.startsWith('http')) {
                    imageUrl = field;
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
    
    // 构建电影元数据
    const metaItems = [];
    if (movie.score) {
        metaItems.push(`<div class="movie-meta-item"><i class="fas fa-star"></i><span>评分: ${movie.score}</span></div>`);
    }
    if (movie.year) {
        metaItems.push(`<div class="movie-meta-item"><i class="fas fa-calendar"></i><span>${movie.year}</span></div>`);
    }
    if (movie.type) {
        metaItems.push(`<div class="movie-meta-item"><i class="fas fa-film"></i><span>${movie.type}</span></div>`);
    }
    if (movie.area) {
        metaItems.push(`<div class="movie-meta-item"><i class="fas fa-globe"></i><span>${movie.area}</span></div>`);
    }
    
    movieDetail.innerHTML = `
        <div class="movie-detail">
            
            <div class="movie-detail-info">
                <h2>${movie.title}</h2>
                <div class="movie-meta">
                    ${metaItems.join('')}
                </div>
                ${movie.description ? `<div class="movie-description">${movie.description}</div>` : ''}
                ${movie.others_name && movie.others_name.length > 0 ? 
                    `<div class="movie-description"><strong>其他名称:</strong> ${movie.others_name.map(name => name.value).join(', ')}</div>` : ''}
                
                ${movie.source_list_source && movie.source_list_source.length > 0 ? `
                    <div class="play-sources">
                        <h3>播放源</h3>
                        <div class="source-list">
                            ${movie.source_list_source.map((source, index) => `
                                <button class="play-source-btn" data-source-index="${index}">
                                    <i class="fas fa-play"></i>
                                    ${source.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${movie.ftp_list && movie.ftp_list.length > 0 ? `
                    <div class="episode-list">
                        <h3>选集列表</h3>
                        <div class="episode-grid">
                            ${movie.ftp_list.map((episode, index) => `
                                <div class="episode-item" data-episode-index="${index}">
                                    <div class="episode-poster">
                                        <div class="episode-number">${episode.weight || (index + 1)}</div>
                                        <div class="episode-play-overlay">
                                            <i class="fas fa-play"></i>
                                        </div>
                                    </div>
                                    <div class="episode-info">
                                        <h4 class="episode-title">${episode.title}</h4>
                                        ${episode.time_data ? `
                                            <div class="episode-duration">
                                                <i class="fas fa-clock"></i>
                                                <span>${episode.time_data.titles_duration || '未知'}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
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
    const sourceButtons = movieDetail.querySelectorAll('.play-source-btn');
    sourceButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            // 移除其他按钮的播放状态
            sourceButtons.forEach(btn => btn.classList.remove('playing'));
            // 添加当前按钮的播放状态
            button.classList.add('playing');
            
            const source = movie.source_list_source[index];
            console.log('选择播放源:', source.name);
            
            // 清除所有选集的选中状态
            const episodeItems = movieDetail.querySelectorAll('.episode-item');
            episodeItems.forEach(ep => ep.classList.remove('selected'));
            
            // 显示提示信息
            showSourceSelectedMessage(source.name);
        });
    });
    
    // 为选集列表添加事件监听器
    const episodeItems = movieDetail.querySelectorAll('.episode-item');
    episodeItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // 检查是否已选择播放源
            const selectedSource = movieDetail.querySelector('.play-source-btn.playing');
            if (!selectedSource) {
                showError('请先选择播放源');
                return;
            }
            
            // 移除其他选集的选中状态
            episodeItems.forEach(ep => ep.classList.remove('selected'));
            // 添加当前选集的选中状态
            item.classList.add('selected');
            
            const episode = movie.ftp_list[index];
            console.log('播放选集:', episode);
            
            // 获取当前选中的播放源
            const sourceIndex = Array.from(movieDetail.querySelectorAll('.play-source-btn')).indexOf(selectedSource);
            const selectedSourceData = movie.source_list_source[sourceIndex];
            
            // 使用选中的播放源播放选集
            const episodeSource = getEpisodeFromSource(selectedSourceData, index);
            if (episodeSource.length > 0) {
                playVideo(episode.title, episodeSource, `${movie.title} - ${episode.title}`);
            } else {
                showError('该播放源暂无此选集');
            }
        });
    });
}

// 智能选择最佳播放源
function getBestSourceForEpisode(movie, episodeIndex) {
    console.log('为选集选择最佳播放源:', episodeIndex);
    
    // 优先级顺序：M3U8流媒体 > FTP
    const sourcePriority = [
        '极速蓝光',
        'BF线路', 
        'JY线路',
        'HH线路',
        'HN线路',
        'IK线路',
        'JS线路',
        'TSZ线路',
        '常规线路'
    ];
    
    // 首先尝试VIP源
    if (movie.vip_source_list_source && movie.vip_source_list_source.length > 0) {
        const vipSource = movie.vip_source_list_source[0];
        if (vipSource.source_list && vipSource.source_list[episodeIndex]) {
            console.log('使用VIP源:', vipSource.name);
            return [{
                name: vipSource.source_list[episodeIndex].source_name,
                url: vipSource.source_list[episodeIndex].url,
                quality: 'VIP高清'
            }];
        }
    }
    
    // 然后尝试普通播放源
    if (movie.source_list_source && movie.source_list_source.length > 0) {
        for (const sourceName of sourcePriority) {
            const source = movie.source_list_source.find(s => s.name === sourceName);
            if (source && source.source_list && source.source_list[episodeIndex]) {
                console.log('使用播放源:', sourceName);
                return [{
                    name: source.source_list[episodeIndex].source_name,
                    url: source.source_list[episodeIndex].url,
                    quality: sourceName.includes('蓝光') ? '蓝光' : '高清'
                }];
            }
        }
    }
    
    // 最后使用FTP源作为备选
    if (movie.ftp_list && movie.ftp_list[episodeIndex]) {
        console.log('使用FTP源作为备选');
        return [{
            name: movie.ftp_list[episodeIndex].title,
            url: movie.ftp_list[episodeIndex].url,
            quality: '标清'
        }];
    }
    
    // 如果都没有，返回空数组
    console.warn('未找到可用的播放源');
    return [];
}

// 为播放源选择最佳选集
function getBestEpisodeForSource(movie, source, episodeIndex) {
    console.log('为播放源选择最佳选集:', source.name, episodeIndex);
    
    if (source && source.source_list && source.source_list[episodeIndex]) {
        return [{
            name: source.source_list[episodeIndex].source_name,
            url: source.source_list[episodeIndex].url,
            quality: source.name.includes('蓝光') ? '蓝光' : '高清'
        }];
    }
    
    // 如果该源没有对应选集，尝试其他源
    console.warn(`播放源 ${source.name} 没有第${episodeIndex + 1}集，尝试其他源`);
    return getBestSourceForEpisode(movie, episodeIndex);
}

// 从播放源获取具体选集
function getEpisodeFromSource(source, episodeIndex) {
    console.log('从播放源获取选集:', source.name, episodeIndex);
    
    if (source && source.source_list && source.source_list[episodeIndex]) {
        return [{
            name: source.source_list[episodeIndex].source_name,
            url: source.source_list[episodeIndex].url,
            quality: source.name.includes('蓝光') ? '蓝光' : '高清'
        }];
    }
    
    console.warn(`播放源 ${source.name} 没有第${episodeIndex + 1}集`);
    return [];
}

// 显示播放源选择提示
function showSourceSelectedMessage(sourceName) {
    // 创建提示信息
    const messageDiv = document.createElement('div');
    messageDiv.className = 'source-selected-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 122, 255, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 3000;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
    `;
    messageDiv.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
            <i class="fas fa-check-circle" style="font-size: 1.2em; margin-right: 0.5rem;"></i>
            已选择播放源
        </div>
        <div style="font-size: 1.1em;">${sourceName}</div>
        <div style="font-size: 0.9em; margin-top: 0.5rem; opacity: 0.8;">请选择要播放的剧集</div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 2秒后自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 2000);
}

// 播放视频
function playVideo(sourceName, sourceList, movieTitle = '') {
    console.log('播放视频:', sourceName, sourceList);
    
    if (!sourceList || sourceList.length === 0) {
        showError('该播放源暂无可用资源');
        return;
    }
    
    // 关闭详情模态框
    movieModal.style.display = 'none';
    
    // 显示播放器模态框
    playerModal.style.display = 'block';
    
    // 创建现代化的播放器界面
    createModernVideoPlayer(sourceName, sourceList, movieTitle);
}

// 创建现代化视频播放器
function createModernVideoPlayer(sourceName, sourceList, movieTitle) {
    console.log('创建视频播放器:', sourceName);
    
    // 先清理之前的播放器内容
    videoPlayer.innerHTML = '';
    
    // 清理之前的HLS实例
    if (window.hlsInstances) {
        window.hlsInstances.forEach(hls => {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
        window.hlsInstances = [];
    }
    
    // 清理之前的控制区域
    const existingControls = playerModal.querySelector('.player-controls-container');
    if (existingControls) {
        existingControls.remove();
    }
    
    // 创建播放器容器
    const playerContainer = document.createElement('div');
    playerContainer.className = 'video-player-container';
    playerContainer.innerHTML = `
        <div class="video-player-overlay"></div>
        <div class="play-center-btn">
            <i class="fas fa-play"></i>
        </div>
        <div class="player-status">
            <span>准备播放 ${sourceName}</span>
        </div>
        <div class="video-controls">
            <button class="play-pause-btn">
                <i class="fas fa-play"></i>
            </button>
            <div class="video-progress">
                <div class="video-progress-bar"></div>
            </div>
            <div class="video-time">
                <span class="current-time">00:00</span> / <span class="total-time">00:00</span>
            </div>
            <div class="volume-control">
                <button class="volume-btn">
                    <i class="fas fa-volume-up"></i>
                </button>
                <div class="volume-slider">
                    <div class="volume-slider-bar"></div>
                </div>
            </div>
            <button class="fullscreen-btn">
                <i class="fas fa-expand"></i>
            </button>
        </div>
    `;
    
    videoPlayer.appendChild(playerContainer);
    
    // 创建底部控制区域
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'player-controls-container';
    controlsContainer.innerHTML = `
        <div class="player-info">
            <h3 class="player-title">${movieTitle || '正在播放'}</h3>
            <div class="player-quality-selector">
                <button class="quality-btn active">自动</button>
                <button class="quality-btn">高清</button>
                <button class="quality-btn">标清</button>
            </div>
        </div>
    `;
    
    // 将控制区域添加到播放器模态框
    const playerModalContent = playerModal.querySelector('.modal-content');
    playerModalContent.appendChild(controlsContainer);
    
    // 重新绑定测试视频按钮事件
    const testVideoBtn = document.getElementById('testVideoBtn');
    if (testVideoBtn) {
        testVideoBtn.addEventListener('click', function() {
            const testUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            createVideoPlayer(testUrl);
        });
    }
    
    // 创建带备用播放源的视频播放器
    createVideoPlayerWithFallback(sourceList, movieTitle);
}

// 创建带备用播放源的视频播放器
function createVideoPlayerWithFallback(sourceList, movieTitle, currentIndex = 0) {
    if (currentIndex >= sourceList.length) {
        showVideoError('所有播放源都无法播放，请尝试其他电影');
        return;
    }
    
    const currentSource = sourceList[currentIndex];
    console.log(`尝试播放源 ${currentIndex + 1}/${sourceList.length}:`, currentSource.url);
    
    // 更新状态显示
    updatePlayerStatus(`正在加载播放源 ${currentIndex + 1}/${sourceList.length}...`, 'buffering');
    
    createVideoPlayer(currentSource.url, movieTitle, () => {
        // 播放失败回调，尝试下一个播放源
        console.log(`播放源 ${currentIndex + 1} 失败，尝试下一个...`);
        createVideoPlayerWithFallback(sourceList, movieTitle, currentIndex + 1);
    });
}

// 创建视频播放器
function createVideoPlayer(url, movieTitle, onError) {
    console.log('创建视频播放器，URL:', url);
    
    // 验证URL
    if (!url || url.trim() === '') {
        showVideoError('无效的视频URL');
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
        showVideoError('无效的视频URL格式');
        return;
    }
    
    // 创建视频元素
    const video = document.createElement('video');
    video.controls = false; // 使用自定义控制栏
    video.autoplay = false;
    video.style.width = '100%';
    video.style.height = '100%';
    video.preload = 'metadata';
    video.muted = false;
    
    // 添加视频到播放器容器
    const playerContainer = videoPlayer.querySelector('.video-player-container');
    if (playerContainer) {
        playerContainer.appendChild(video);
    }
    
    // 绑定播放器控制事件
    bindVideoControls(video, movieTitle);
    
    // 初始化HLS实例数组
    if (!window.hlsInstances) {
        window.hlsInstances = [];
    }
    
    // 检查是否为M3U8流
    if (url.includes('.m3u8')) {
        console.log('检测到M3U8流媒体');
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            console.log('使用HLS.js播放');
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false
            });
            
            // 将HLS实例添加到全局数组
            window.hlsInstances.push(hls);
            
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                console.log('HLS媒体已附加');
                updatePlayerStatus('HLS流媒体已加载', 'success');
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                console.log('HLS清单解析完成，找到', data.levels.length, '个质量级别');
                updatePlayerStatus('视频准备就绪', 'success');
                hidePlayerStatus();
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
                                showVideoError('HLS播放失败: ' + data.details);
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
            updatePlayerStatus('原生HLS播放器已加载', 'success');
        } else {
            showVideoError('您的浏览器不支持HLS播放，请使用Chrome、Firefox或Safari');
            return;
        }
    } else {
        console.log('使用标准视频播放');
        video.src = url;
        updatePlayerStatus('标准视频播放器已加载', 'success');
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
            showVideoError(errorMessage + '，请尝试其他播放源');
        }
    });
    
    // 添加加载成功事件
    video.addEventListener('loadeddata', function() {
        console.log('视频加载成功');
        updatePlayerStatus('视频加载完成', 'success');
        setTimeout(() => hidePlayerStatus(), 2000);
    });
    
    // 添加可以播放事件
    video.addEventListener('canplay', function() {
        console.log('视频可以播放');
        updatePlayerStatus('视频准备就绪', 'success');
        setTimeout(() => hidePlayerStatus(), 2000);
    });
}

// 绑定视频播放器控制事件
function bindVideoControls(video, movieTitle) {
    const playPauseBtn = videoPlayer.querySelector('.play-pause-btn');
    const playCenterBtn = videoPlayer.querySelector('.play-center-btn');
    const progressBar = videoPlayer.querySelector('.video-progress-bar');
    const progressContainer = videoPlayer.querySelector('.video-progress');
    const currentTimeSpan = videoPlayer.querySelector('.current-time');
    const totalTimeSpan = videoPlayer.querySelector('.total-time');
    const volumeBtn = videoPlayer.querySelector('.volume-btn');
    const volumeSlider = videoPlayer.querySelector('.volume-slider-bar');
    const fullscreenBtn = videoPlayer.querySelector('.fullscreen-btn');
    
    // 播放/暂停按钮
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    }
    
    // 中心播放按钮
    if (playCenterBtn) {
        playCenterBtn.addEventListener('click', () => {
            video.play();
            playCenterBtn.classList.add('playing');
        });
    }
    
    // 进度条控制
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            video.currentTime = percentage * video.duration;
        });
    }
    
    // 音量控制
    if (volumeBtn && volumeSlider) {
        volumeBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            volumeBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });
        
        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            video.volume = percentage;
        });
    }
    
    // 全屏控制
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
        });
    }
    
    // 视频事件监听
    video.addEventListener('play', () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        if (playCenterBtn) {
            playCenterBtn.classList.add('playing');
        }
    });
    
    video.addEventListener('pause', () => {
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        if (playCenterBtn) {
            playCenterBtn.classList.remove('playing');
        }
    });
    
    video.addEventListener('timeupdate', () => {
        if (progressBar && video.duration) {
            const percentage = (video.currentTime / video.duration) * 100;
            progressBar.style.width = percentage + '%';
        }
        
        if (currentTimeSpan) {
            currentTimeSpan.textContent = formatTime(video.currentTime);
        }
    });
    
    video.addEventListener('loadedmetadata', () => {
        if (totalTimeSpan) {
            totalTimeSpan.textContent = formatTime(video.duration);
        }
    });
    
    video.addEventListener('volumechange', () => {
        if (volumeSlider) {
            volumeSlider.style.width = (video.volume * 100) + '%';
        }
    });
}

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// 更新播放器状态
function updatePlayerStatus(message, type = '') {
    const statusElement = videoPlayer.querySelector('.player-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `player-status show ${type}`;
    }
}

// 隐藏播放器状态
function hidePlayerStatus() {
    const statusElement = videoPlayer.querySelector('.player-status');
    if (statusElement) {
        statusElement.classList.remove('show');
    }
}

// 显示视频错误
function showVideoError(message) {
    const playerContainer = videoPlayer.querySelector('.video-player-container');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div class="video-error">
                <div class="video-error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="video-error-text">${message}</div>
                <button class="video-error-retry" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    重新加载
                </button>
            </div>
        `;
    }
}

// 处理搜索
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        performSearch(query);
    } else {
        // 清空搜索，返回热门电影
        exitSearchMode();
    }
}

// 执行搜索
async function performSearch(query, page = 1) {
    try {
        showLoading();
        isSearchMode = true;
        currentSearchQuery = query;
        currentPage = page;
        
        // 添加到搜索历史
        addToSearchHistory(query);
        
        console.log(`搜索: ${query}, 页码: ${page}`);
        
        // 不使用缓存，直接请求API
        console.log('直接请求API，不使用缓存');
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`);
        const data = await response.json();
        
        if (data.code === 1) {
            // 不缓存结果，直接显示
            displaySearchResults(data.data);
            updateSearchPagination(data.data.pagination);
            updateSearchUI(query, data.data.list ? data.data.list.length : 0);
        } else {
            showError(data.msg || '搜索失败');
        }
    } catch (error) {
        console.error('搜索失败:', error);
        showError('搜索失败，请检查网络连接');
    } finally {
        hideLoading();
    }
}

// 缓存功能已禁用

// 显示搜索结果
function displaySearchResults(data) {
    console.log('搜索结果数据:', data);
    
    const { list, pagination, searchQuery } = data;
    
    movieList.innerHTML = '';
    
    // 检查 list 是否存在
    if (!list || !Array.isArray(list) || list.length === 0) {
        movieList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>未找到相关电影</h3>
                <p>尝试使用其他关键词搜索</p>
                <div class="search-suggestions">
                    <span>热门搜索：</span>
                    <button class="suggestion-tag" onclick="searchSuggestion('动作')">动作</button>
                    <button class="suggestion-tag" onclick="searchSuggestion('喜剧')">喜剧</button>
                    <button class="suggestion-tag" onclick="searchSuggestion('爱情')">爱情</button>
                    <button class="suggestion-tag" onclick="searchSuggestion('科幻')">科幻</button>
                </div>
            </div>
        `;
        return;
    }
    
    // 显示电影列表
    const moviesGrid = document.createElement('div');
    moviesGrid.className = 'apple-movie-grid search-results-grid';
    
    list.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
    
    movieList.appendChild(moviesGrid);
}

// 更新搜索分页
function updateSearchPagination(paginationData) {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) {
        console.error('分页元素未找到');
        return;
    }
    
    paginationElement.innerHTML = '';
    
    if (!paginationData || !paginationData.total || paginationData.total <= 20) {
        return;
    }
    
    const { current, hasNext, hasPrev, total } = paginationData;
    const totalPages = Math.ceil(total / 20);
    
    let paginationHTML = '<div class="pagination">';
    
    // 上一页
    if (hasPrev) {
        paginationHTML += `<button class="page-btn" onclick="performSearch('${currentSearchQuery}', ${current - 1})">
            <i class="fas fa-chevron-left"></i> 上一页
        </button>`;
    }
    
    // 页码
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(totalPages, current + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === current ? 'active' : '';
        paginationHTML += `<button class="page-btn ${isActive}" onclick="performSearch('${currentSearchQuery}', ${i})">${i}</button>`;
    }
    
    // 下一页
    if (hasNext) {
        paginationHTML += `<button class="page-btn" onclick="performSearch('${currentSearchQuery}', ${current + 1})">
            下一页 <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    paginationElement.innerHTML = paginationHTML;
}

// 更新搜索UI
function updateSearchUI(query, resultCount) {
    // 更新导航栏状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 高亮搜索输入框
    searchInput.value = query;
    searchInput.classList.add('searching');
}

// 退出搜索模式
function exitSearchMode() {
    isSearchMode = false;
    currentSearchQuery = '';
    currentPage = 1;
    
    // 恢复导航栏状态
    document.querySelector('.nav-link[data-category="hot"]').classList.add('active');
    
    // 清除搜索状态
    searchInput.value = '';
    searchInput.classList.remove('searching');
    
    const searchStatus = document.querySelector('.search-status');
    if (searchStatus) {
        searchStatus.remove();
    }
    
    // 重新加载热门电影
    currentCategory = 'hot';
    loadMovies();
}

// 添加到搜索历史
function addToSearchHistory(query) {
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        // 限制历史记录数量
        if (searchHistory.length > 10) {
            searchHistory = searchHistory.slice(0, 10);
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
}

// 搜索建议
function searchSuggestion(query) {
    searchInput.value = query;
    performSearch(query);
}

// 实时搜索（防抖）
function handleRealTimeSearch() {
    const query = searchInput.value.trim();
    
    // 清除之前的定时器
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // 如果输入为空，退出搜索模式
    if (query === '') {
        exitSearchMode();
        hideSearchSuggestions();
        return;
    }
    
    // 显示搜索建议
    showSearchSuggestions();
    
    // 设置防抖延迟
    searchTimeout = setTimeout(() => {
        if (query.length >= 2) { // 至少2个字符才开始搜索
            performSearch(query);
        }
    }, 500); // 500ms 防抖
}

// 显示搜索建议
function showSearchSuggestions() {
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
        // 显示搜索历史
        displaySearchHistory();
    } else if (query.length >= 1) {
        // 显示搜索建议
        displaySearchSuggestions(query);
    }
    
    searchSuggestions.classList.add('show');
}

// 隐藏搜索建议
function hideSearchSuggestions() {
    searchSuggestions.classList.remove('show');
}

// 显示搜索历史
function displaySearchHistory() {
    if (searchHistory.length === 0) {
        searchSuggestions.innerHTML = `
            <div class="search-suggestion-item">
                <i class="fas fa-clock icon"></i>
                <span class="text">暂无搜索历史</span>
            </div>
        `;
        return;
    }
    
    let html = '<div class="search-suggestion-item"><i class="fas fa-clock icon"></i><span class="text">搜索历史</span></div>';
    
    searchHistory.slice(0, 5).forEach(item => {
        html += `
            <div class="search-suggestion-item" onclick="selectSuggestion('${item}')">
                <i class="fas fa-history icon"></i>
                <span class="text">${item}</span>
                <span class="type">历史</span>
            </div>
        `;
    });
    
    searchSuggestions.innerHTML = html;
}

// 显示搜索建议
function displaySearchSuggestions(query) {
    const suggestions = [
        { text: '动作片', type: '类型' },
        { text: '喜剧片', type: '类型' },
        { text: '爱情片', type: '类型' },
        { text: '科幻片', type: '类型' },
        { text: '恐怖片', type: '类型' },
        { text: '悬疑片', type: '类型' },
        { text: '战争片', type: '类型' },
        { text: '动画片', type: '类型' }
    ];
    
    // 过滤匹配的建议
    const matchedSuggestions = suggestions.filter(item => 
        item.text.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchedSuggestions.length === 0) {
        searchSuggestions.innerHTML = `
            <div class="search-suggestion-item">
                <i class="fas fa-search icon"></i>
                <span class="text">搜索 "${query}"</span>
                <span class="type">关键词</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    matchedSuggestions.forEach(item => {
        html += `
            <div class="search-suggestion-item" onclick="selectSuggestion('${item.text}')">
                <i class="fas fa-tag icon"></i>
                <span class="text">${item.text}</span>
                <span class="type">${item.type}</span>
            </div>
        `;
    });
    
    searchSuggestions.innerHTML = html;
}

// 选择搜索建议
function selectSuggestion(text) {
    searchInput.value = text;
    performSearch(text);
    hideSearchSuggestions();
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
    movieList.classList.add('apple-movie-grid');
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
        
        // 停止所有视频播放并清理
        const videos = modal.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.src = '';
            video.load(); // 清理视频资源
        });
        
        // 停止HLS实例
        if (window.hlsInstances) {
            window.hlsInstances.forEach(hls => {
                if (hls && typeof hls.destroy === 'function') {
                    hls.destroy();
                }
            });
            window.hlsInstances = [];
        }
        
        // 清理播放器内容
        const videoPlayer = modal.querySelector('#videoPlayer');
        if (videoPlayer) {
            videoPlayer.innerHTML = '';
        }
        
        // 清理控制区域
        const controlsContainer = modal.querySelector('.player-controls-container');
        if (controlsContainer) {
            controlsContainer.remove();
        }
        
        console.log('模态框已关闭，视频资源已清理');
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
