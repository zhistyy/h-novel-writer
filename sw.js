// Service Worker - 离线缓存策略
const CACHE_NAME = 'linxiao-writer-v1';

// 需要预缓存的文件
const PRECACHE_URLS = [
  'index.html',
  'manifest.json',
  'icon.svg'
];

// 安装阶段 - 预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 网络优先，缓存兜底
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // API 请求不缓存
  if (event.request.url.includes('api.deepseek.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 缓存成功响应的静态资源
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络离线时，用缓存兜底
        return caches.match(event.request).then((cached) => {
          return cached || new Response('离线中', { status: 408 });
        });
      })
  );
});
