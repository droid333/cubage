// Point de vigilance : Incrémentation stricte de la version pour forcer la mise à jour CDN sur GitHub Pages
const CACHE_NAME = 'cubage-v5.6';

const ASSETS = [
    'index.html',
    'style.css',
    'app.js',
    'state.js',
    'storage.js',
    'keyboard.js',
    'manifest.json',
    'jspdf.umd.min.js',
    'sw.js', // Point de vigilance : Alignement rigoureux avec le nom réel du fichier sur GitHub
    'icon.png',
    'screenshot-mobile.png',
    'screenshot-desktop.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => {
            return self.skipWaiting(); // Force l'activation immédiate sans attendre la fermeture de l'app
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // Nettoyage rigoureux des anciens caches obsolètes
                    }
                })
            );
        }).then(() => {
            return self.clients.claim(); // Prend le contrôle immédiat des pages ouvertes
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Stratégie de mise en cache : Cache-First pour une autonomie totale en mode déconnecté en forêt
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
