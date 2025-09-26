// Exemplo de como usar os dados do dispositivo no frontend
// Este arquivo demonstra como acessar e utilizar os dados retornados pela API

// 1. Verificar se o dispositivo está conectado e obter informações básicas
function verificarStatusDispositivo() {
    const deviceInfo = getDeviceInfo();
    
    if (!deviceInfo) {
        console.log('❌ Dispositivo não conectado ou dados não disponíveis');
        return false;
    }
    
    console.log('✅ Dispositivo conectado:', deviceInfo.device.name);
    console.log('📋 Painel:', deviceInfo.panel.name);
    console.log('🎬 Mídias disponíveis:', deviceInfo.panel.mediaCount);
    
    return true;
}

// 2. Exibir informações do dispositivo na tela
function exibirInformacoesDispositivo() {
    const device = getDeviceData();
    const panel = getPanelData();
    
    if (!device || !panel) {
        console.log('Dados do dispositivo não disponíveis');
        return;
    }
    
    // Criar elemento para mostrar informações
    const infoDiv = document.createElement('div');
    infoDiv.id = 'device-info';
    infoDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        z-index: 9999;
    `;
    
    infoDiv.innerHTML = `
        <strong>📱 ${device.name}</strong><br>
        🔑 Chave: ${device.deviceKey}<br>
        📺 Painel: ${panel.name}<br>
        🎬 Mídias: ${panel.medias ? panel.medias.length : 0}<br>
        📍 Status: ${device.statusDevice}<br>
        🕒 Conectado: ${new Date(device.updatedAt).toLocaleTimeString()}
    `;
    
    // Remover info anterior se existir
    const existingInfo = document.getElementById('device-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    document.body.appendChild(infoDiv);
    
    // Auto-remover após 10 segundos
    setTimeout(() => {
        if (document.getElementById('device-info')) {
            infoDiv.remove();
        }
    }, 10000);
}

// 3. Monitorar mudanças nos dados do dispositivo
function monitorarDispositivo() {
    let ultimaAtualizacao = null;
    
    setInterval(() => {
        const device = getDeviceData();
        
        if (device && device.updatedAt !== ultimaAtualizacao) {
            ultimaAtualizacao = device.updatedAt;
            console.log('🔄 Dados do dispositivo atualizados:', new Date(device.updatedAt));
            
            // Aqui você pode executar ações quando os dados são atualizados
            // Por exemplo: atualizar interface, sincronizar dados, etc.
        }
    }, 5000); // Verifica a cada 5 segundos
}

// 4. Função para enviar dados do dispositivo para analytics ou logs
function enviarAnalyticsDispositivo() {
    const deviceInfo = getDeviceInfo();
    
    if (!deviceInfo) {
        return;
    }
    
    const analyticsData = {
        deviceId: deviceInfo.device.id,
        deviceName: deviceInfo.device.name,
        panelId: deviceInfo.panel.id,
        panelName: deviceInfo.panel.name,
        mediaCount: deviceInfo.panel.mediaCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`
    };
    
    console.log('📊 Dados para analytics:', analyticsData);
    
    // Aqui você enviaria os dados para seu sistema de analytics
    // fetch('/analytics', { method: 'POST', body: JSON.stringify(analyticsData) });
}

// 5. Função para personalizar interface baseada no dispositivo
function personalizarInterface() {
    const device = getDeviceData();
    const panel = getPanelData();
    
    if (!device || !panel) {
        return;
    }
    
    // Personalizar baseado no tipo de dispositivo
    if (device.type === 'TV') {
        document.body.style.fontSize = '24px';
        console.log('📺 Interface otimizada para TV');
    } else if (device.type === 'TABLET') {
        document.body.style.fontSize = '18px';
        console.log('📱 Interface otimizada para Tablet');
    }
    
    // Personalizar baseado no formato
    if (device.format === 'LANDSCAPE') {
        document.body.classList.add('landscape-mode');
    } else if (device.format === 'PORTRAIT') {
        document.body.classList.add('portrait-mode');
    }
    
    // Adicionar nome do dispositivo no título da página
    document.title = `${panel.name} - ${device.name}`;
}

// 6. Exemplo de uso das funções
function exemploUso() {
    // Aguardar os dados estarem disponíveis
    const aguardarDados = setInterval(() => {
        if (verificarStatusDispositivo()) {
            clearInterval(aguardarDados);
            
            // Executar funções de exemplo
            exibirInformacoesDispositivo();
            personalizarInterface();
            monitorarDispositivo();
            enviarAnalyticsDispositivo();
            
            console.log('🚀 Exemplo de uso dos dados do dispositivo executado com sucesso!');
        }
    }, 1000);
}

// Executar exemplo quando a página carregar
// window.addEventListener('load', exemploUso);

// Exportar funções para uso global
window.verificarStatusDispositivo = verificarStatusDispositivo;
window.exibirInformacoesDispositivo = exibirInformacoesDispositivo;
window.monitorarDispositivo = monitorarDispositivo;
window.enviarAnalyticsDispositivo = enviarAnalyticsDispositivo;
window.personalizarInterface = personalizarInterface;
window.exemploUso = exemploUso;

console.log('📋 Arquivo de exemplo carregado. Use exemploUso() para testar as funcionalidades.');