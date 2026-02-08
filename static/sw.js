const CACHE_NAME = 'drone-vision-v3.0';
const ASSETS = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Rajdhani:wght@500;600;700&display=swap'
];

// 설치: 에셋 캐싱
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// 페치: 캐시 우선, 실패 시 네트워크
self.addEventListener('fetch', (e) => {
    // API 요청 등은 캐시하지 않음 (/api/)
    if (e.request.url.includes('/api/')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});
