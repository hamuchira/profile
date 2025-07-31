// Service Worker for はむチラ PWA
const CACHE_NAME = 'hamuchira-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main-visual.jpg',
  '/youtube-channel.jpg',
  '/hamuchira-pedia.jpg',
  '/hamuchira-gacha.jpg',
  '/color-simulator.jpg',
  '/age-calculator.jpg',
  '/hampiyou.jpg',
  '/hamuchira-icon.png',
  '/favicon.png',
  '/app-icon.png',
  '/manifest.json'
];

// インストール時のキャッシュ
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, {cache: 'reload'});
        }));
      })
      .catch(function(error) {
        console.log('Cache addAll failed:', error);
      })
  );
  self.skipWaiting();
});

// アクティベーション時の古いキャッシュ削除
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// リクエストの処理（キャッシュファーストストラテジー）
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにある場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(function(response) {
          // 有効なレスポンスかチェック
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function() {
          // ネットワークエラーの場合、基本的なHTMLを返す（オフライン対応）
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});