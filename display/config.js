const DISPLAY_CONFIG = {
    API_BASE_URL: 'http://localhost:4000',
    STATIC_BASE_URL: 'http://localhost', // Para arquivos estáticos como imagens
    API_ENDPOINTS: {
        DEVICE_BY_KEY: '/public/device',     // CORRIGIDO: GET /public/device/:deviceKey
        LOTTERY_MEGA_SENA: '/public/panel/lottery/mega-sena'  // GET /public/panel/lottery/mega-sena
    },
    STATIC_PATHS: {
        LOGO: '/img/vixmidia_dark.png'
    }
};

// Função para construir URLs da API
function buildDisplayApiUrl(endpoint, param = '') {
    const url = `${DISPLAY_CONFIG.API_BASE_URL}${endpoint}`;
    return param ? `${url}/${param}` : url;
}

// Função para construir URLs de arquivos estáticos
function buildStaticUrl(path) {
    return `${DISPLAY_CONFIG.STATIC_BASE_URL}${path}`;
}

// Tornar disponível globalmente
window.DISPLAY_CONFIG = DISPLAY_CONFIG;
window.buildDisplayApiUrl = buildDisplayApiUrl;
window.buildStaticUrl = buildStaticUrl;