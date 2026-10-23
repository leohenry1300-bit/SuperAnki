/* LH Cards service worker: makes the app work offline. Version: 0c799c83de */
const CACHE = 'superanki-0c799c83de';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('superanki-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.hostname.endsWith('supabase.co')) return;           // sync always goes to the network
    if (url.origin === location.origin && url.pathname.endsWith('/sw.js')) return;   // the update check reads the live file
    if (url.hostname === 'api.mymemory.translated.net') return;            // translations: always live, never cached
    const sameOrigin = url.origin === location.origin;
    if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('index.html'))) {
        // newest version when online, cached copy when offline
        e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
            .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
        return;
    }
    // fonts and libraries: cached copy first, refreshed in the background
    e.respondWith(caches.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
        return hit || net;
    }));
});
