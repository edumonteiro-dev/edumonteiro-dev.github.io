/**
 * EM Dev — Service Worker v8-i18n (PWA Static Cache)
 * Cache version includes i18n dictionary hash — guarantees automatic
 * invalidation whenever translations change, eliminating language-bleed
 * from stale cache hits. Zero external dependencies.
 *
 * Cache name format: em-dev-v8-<i18n-hash>
 * i18n dict SHA256 prefix (first 8 chars): 50c192df
 */
'use strict';

const CACHE_NAME  = 'em-dev-v8-50c192df';
const OFFLINE_URL = './';

const PRECACHE = [
  './',
  './index.html',
  './blog.html',
  './contract.html',
  './legal.html',
  './mvp-scope.html',
  './proposta.html',
  './privacy.html',
  './terms.html',
  './cookies.html',
  './manifest.json',
  './sw.js',
  './assets/logo.svg',
  './assets/favicon.svg',
];

// ── INSTALL: precache static shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())   // force activate immediately
  );
});

// ── ACTIVATE: purge ALL stale caches (including old i18n versions) ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Purging stale cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network-First for HTML (always fresh i18n), Cache-First for assets ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    // HTML pages: Network-First — ensures i18n is always current
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    // Static assets: Cache-First with network fallback
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return response;
        });
      })
    );
  }
});
