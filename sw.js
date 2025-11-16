// Service Workerのバージョン - 更新時は必ずこの数字を変更してください！
const CACHE_VERSION = 'v20241115-005';
const CACHE_NAME = 'hamuchira-cache-' + CACHE_VERSION;

// キャッシュするファイルのリスト
const urlsToCache = [
  './',
  './index.html',
  './hamchira_profile_site.html',
  './hamuchira-icon.png',
  './favicon.png',
  './app-icon.png',
  './main-visual.jpg',
  // 画像ファイル
  './hamuoff.jpg',
  './hamumvp.jpg',
  './youtube.jpg',
  './hamuchira-pedia.jpg',
  './hamuchira-soukan.png',
  './hamuchira-keizu.png',
  './keisikisimyu.jpg',
  './haymihyou.jpg',
  './hampiyou.jpg',
  './gachagacha.jpg',
  './hamuketsu-poyo.jpg',
  './hamuketsu-card.jpg',
  './hamukororin.jpg'
];

// Service Workerのインストール
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching app shell');
        // キャッシュに失敗してもインストールを続行
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, {cache: 'no-cache'});
        })).catch(function(error) {
          console.log('[Service Worker] Cache failed for some assets:', error);
        });
      })
      .then(function() {
        // 新しいService Workerをすぐにアクティブ化
        return self.skipWaiting();
      })
  );
});

// Service Workerのアクティベーション
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker...', event);
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // 古いキャッシュを削除
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // 新しいService Workerをすべてのクライアントで即座に有効化
      return self.clients.claim();
    })
  );
});

// リクエストの処理（Network First戦略）
self.addEventListener('fetch', function(event) {
  // HTMLファイルとスプレッドシートデータは常に最新を取得
  if (event.request.url.includes('.html') || 
      event.request.url.includes('docs.google.com/spreadsheets')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'
      })
        .then(function(response) {
          return response;
        })
        .catch(function() {
          // ネットワークに失敗したらキャッシュから返す
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // その他のリソースはキャッシュ優先
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュになければネットワークから取得
        return fetch(event.request).then(function(response) {
          // レスポンスが有効でない場合はそのまま返す
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // レスポンスをキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// skipWaitingメッセージを受け取ったら即座にアクティブ化
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
