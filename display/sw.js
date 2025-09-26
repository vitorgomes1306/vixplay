// Service Worker para cache offline de vídeos
const CACHE_NAME = 'vixmidia-v6-cache-v1';
const STATIC_CACHE = 'vixmidia-static-v1';

// Arquivos estáticos para cache
const STATIC_FILES = [
    './v6.html',
    './v6.css',
    './configDisplay.js',
    '../public/img/logo.png'
];

// Instala o Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Cacheando arquivos estáticos');
                return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })));
            })
            .catch(error => {
                console.error('Erro ao cachear arquivos estáticos:', error);
            })
    );
    
    // Força a ativação imediata
    self.skipWaiting();
});

// Ativa o Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Remove caches antigos
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                        console.log('Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Assume controle imediato
    self.clients.claim();
});

// Intercepta requisições de rede
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Estratégia para arquivos estáticos: Cache First
    if (STATIC_FILES.some(file => request.url.includes(file))) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('Service Worker: Servindo do cache:', request.url);
                        return response;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then(cache => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return response;
                        });
                })
        );
        return;
    }
    
    // Estratégia para vídeos: Cache First com fallback
    if (request.url.includes('.mp4') || request.url.includes('.webm') || request.url.includes('.mov')) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('Service Worker: Vídeo servido do cache:', request.url);
                        return response;
                    }
                    
                    // Tenta buscar online
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                
                                // Cache apenas se o vídeo não for muito grande (< 50MB)
                                const contentLength = response.headers.get('content-length');
                                if (contentLength && parseInt(contentLength) < 50 * 1024 * 1024) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => {
                                            console.log('Service Worker: Cacheando vídeo:', request.url);
                                            cache.put(request, responseClone);
                                        })
                                        .catch(error => {
                                            console.warn('Erro ao cachear vídeo:', error);
                                        });
                                }
                            }
                            return response;
                        })
                        .catch(error => {
                            console.error('Service Worker: Erro ao buscar vídeo online:', error);
                            // Retorna uma resposta de erro personalizada
                            return new Response('Vídeo indisponível offline', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
        return;
    }
    
    // Estratégia para API: Network First com fallback para cache
    if (request.url.includes('/public/device/')) {
        event.respondWith(
            fetch(request, { timeout: 5000 })
                .then(response => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(error => {
                    console.log('Service Worker: API offline, tentando cache:', error);
                    return caches.match(request)
                        .then(response => {
                            if (response) {
                                console.log('Service Worker: Dados da API servidos do cache');
                                return response;
                            }
                            
                            // Retorna erro se não há cache
                            return new Response(JSON.stringify({
                                error: 'API indisponível e sem dados em cache'
                            }), {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                })
        );
        return;
    }
    
    // Para outras requisições, usa a estratégia padrão
    event.respondWith(fetch(request));
});

// Escuta mensagens do cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        caches.keys().then(cacheNames => {
            const cacheInfo = {
                caches: cacheNames,
                timestamp: Date.now()
            };
            event.ports[0].postMessage(cacheInfo);
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
    
    if (event.data && event.data.type === 'CACHE_MEDIA') {
        const { url, deviceKey, index } = event.data;
        cacheMediaFile(url, deviceKey, index).then(success => {
            event.ports[0].postMessage({ success, url, index });
        }).catch(error => {
            console.error('Erro ao cachear mídia:', error);
            event.ports[0].postMessage({ success: false, url, index, error: error.message });
        });
    }
    
    if (event.data && event.data.type === 'GET_CACHED_MEDIA') {
        const { deviceKey, index } = event.data;
        getCachedMedia(deviceKey, index).then(cachedUrl => {
            event.ports[0].postMessage({ cachedUrl, index });
        }).catch(error => {
            event.ports[0].postMessage({ cachedUrl: null, index });
        });
    }
});

// Sincronização em background
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Executando sincronização em background');
        event.waitUntil(doBackgroundSync());
    }
});

// Função de sincronização em background
async function doBackgroundSync() {
    try {
        // Aqui você pode implementar lógica para sincronizar dados
        // quando a conexão for restaurada
        console.log('Service Worker: Sincronização em background executada');
    } catch (error) {
        console.error('Erro na sincronização em background:', error);
    }
}

// Função para cachear arquivos de mídia grandes
async function cacheMediaFile(url, deviceKey, index) {
    try {
        const cache = await caches.open(`media-cache-${deviceKey}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Cria uma chave única para a mídia
        const cacheKey = `media_${deviceKey}_${index}`;
        const cacheUrl = new URL(cacheKey, self.location.origin);
        
        // Armazena a resposta no cache
        await cache.put(cacheUrl, response.clone());
        
        console.log(`Mídia ${index + 1} cacheada com sucesso no Service Worker`);
        return true;
    } catch (error) {
        console.error(`Erro ao cachear mídia ${index + 1}:`, error);
        return false;
    }
}

// Função para recuperar mídia cacheada
async function getCachedMedia(deviceKey, index) {
    try {
        const cache = await caches.open(`media-cache-${deviceKey}`);
        const cacheKey = `media_${deviceKey}_${index}`;
        const cacheUrl = new URL(cacheKey, self.location.origin);
        
        const cachedResponse = await cache.match(cacheUrl);
        
        if (cachedResponse) {
            // Cria uma URL blob para a mídia cacheada
            const blob = await cachedResponse.blob();
            return URL.createObjectURL(blob);
        }
        
        return null;
    } catch (error) {
        console.error(`Erro ao recuperar mídia cacheada ${index + 1}:`, error);
        return null;
    }
}