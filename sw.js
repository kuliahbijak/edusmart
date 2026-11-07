/* EduSmart Suite — service worker: cangkang aplikasi tersimpan (buka instan & offline), pustaka/model cache-first,
   font stale-while-revalidate. Panggilan API (POST ke Apps Script) TIDAK pernah di-cache. Naikkan VERSI tiap rilis. */
const VERSI = 'edusmart-v1.0.0';
const CANGKANG = ['./', 'index.html', 'offline.html', 'manifest.webmanifest', 'css/app.css?v=1.0.0', 'js/config.js?v=1.0.0', 'js/icons.js?v=1.0.0', 'js/core.js?v=1.0.0', 'js/app.js?v=1.0.0',
  'js/pages/dashboard.js?v=1.0.0', 'js/pages/presensi.js?v=1.0.0', 'js/pages/lms.js?v=1.0.0', 'js/pages/cbt.js?v=1.0.0', 'js/pages/kurikulum.js?v=1.0.0', 'js/pages/bk.js?v=1.0.0',
  'js/pages/laporan.js?v=1.0.0', 'js/pages/dokumen.js?v=1.0.0', 'js/pages/notifikasi.js?v=1.0.0', 'js/pages/pengaturan.js?v=1.0.0', 'img/icon-192.png', 'img/icon-512.png', 'img/favicon-32.png'];
const PUSTAKA = 'edusmart-pustaka-v1';   // vendor & model (besar, jarang berubah)

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(CANGKANG); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSI && k !== PUSTAKA && k.indexOf('edusmart-font') !== 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'lewati') self.skipWaiting(); });

self.addEventListener('fetch', function (e) {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                         // API POST → selalu jaringan
  if (/script\.google(usercontent)?\.com$/.test(url.hostname) || url.hostname === 'accounts.google.com') return;
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { e.respondWith(swr(req, 'edusmart-font')); return; }
  if (url.origin !== location.origin) return;
  if (/\/(vendor|models)\//.test(url.pathname)) { e.respondWith(cacheDulu(req, PUSTAKA)); return; }
  if (req.mode === 'navigate') {                                            // halaman: jaringan dulu, cadangan cangkang
    e.respondWith(fetch(req).then(function (r) { const c = r.clone(); caches.open(VERSI).then(function (k) { k.put('index.html', c); }); return r; }).catch(function () { return caches.match('index.html').then(function (r) { return r || caches.match('offline.html'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { if (r.ok) { const c = r.clone(); caches.open(VERSI).then(function (k) { k.put(req, c); }); } return r; }); }));
});
function cacheDulu(req, nama) { return caches.open(nama).then(function (c) { return c.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { if (r.ok) c.put(req, r.clone()); return r; }); }); }); }
function swr(req, nama) { return caches.open(nama).then(function (c) { return c.match(req).then(function (hit) { const f = fetch(req).then(function (r) { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(function () { return hit; }); return hit || f; }); }); }
