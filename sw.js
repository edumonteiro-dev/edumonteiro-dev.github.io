/**
 * EM Dev — Service Worker (PWA Static Cache)
 * Strategy: Cache-First for static assets, Network-First for HTML.
 * Zero external dependencies. No analytics. No tracking.
 */
'use strict';

const CACHE_NAME   = 'em-dev-v4';
const OFFLINE_URL  = './index.html';

const PRECACHE = [
  './',
  './index.html',
  './contract.html',
  './legal.html',
  './manifest.json',
  './assets/logo.svg',
  './assets/favicon.svg',
];

// ── INSTALL: precache static shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: purge old caches ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-First for assets, Network-First for HTML ────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    // HTML: Network-First with offline fallback
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    // Assets: Cache-First
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
