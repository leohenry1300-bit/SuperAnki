/* LH Cards service worker: makes the app work offline. Version: de97f56a92 */
const CACHE = 'superanki-de97f56a92';
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
    if (url.origin === location.origin && (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/version.json'))) return;   // always read live   // the update check reads the live file
    if (url.hostname === 'api.mymemory.translated.net') return;            // translations: always live, never cached
    const sameOrigin = url.origin === location.origin;
    if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('index.html'))) {
        // instant start: the cached copy is served at once and refreshed in the background (the new version is used on the next launch)
        e.respondWith(caches.match('./index.html').then(hit => {
            const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return res; }).catch(() => hit || caches.match('./'));
            if (hit) e.waitUntil(net.catch(() => {}));
            return hit || net;
        }));
        return;
    }
    // Léo's animation clips are big and never change under the same name: kept apart (an app update does not clear them), cached copy first
    if (sameOrigin && url.pathname.includes('/mascot/')) {
        e.respondWith(caches.open('lh-mascot').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; }))));
        return;
    }
    // fonts and libraries: cached copy first, refreshed in the background
    e.respondWith(caches.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
        return hit || net;
    }));
});
