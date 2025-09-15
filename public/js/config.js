const APP_CONFIG = {
    API_BASE_URL: 'http://localhost:4000',
    API_ENDPOINTS: {
        LOGIN: '/public/login',
        REGISTER: '/public/cadastro',
        DEVICES: '/private/devices',
        DEVICE: '/private/device',
        PANELS: '/private/paineis',
        PANEL: '/private/painel',
        MEDIAS: '/private/medias',
        MEDIA: '/private/midia',
        UPLOAD_MEDIA: '/private/uploadmidia',
        ADD_MEDIA: '/private/addmidia',
        CLIENTS: '/private/client',
        CAMPAIGNS: '/private/campaign', // ADICIONAR ESTA LINHA
        PROFILE: '/private/profile'
    }
};

// Função para construir URLs da API
function buildApiUrl(endpoint) {
    return `${APP_CONFIG.API_BASE_URL}${endpoint}`;
}

// Tornar disponível globalmente
window.APP_CONFIG = APP_CONFIG;
window.buildApiUrl = buildApiUrl;