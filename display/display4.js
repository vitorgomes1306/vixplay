class VixMediaDisplay {
    constructor() {
        this.currentMediaIndex = 0;
        this.playlist = [];
        this.deviceKey = null;
        this.mediaElement = document.getElementById('mediaElement');
        this.playerContainer = document.getElementById('playerContainer');
        this.keyRegistrationContainer = document.getElementById('keyRegistrationContainer');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.userLogo = document.getElementById('userLogo');
        
        this.init();
    }

    init() {
        // Event listeners do player
        this.mediaElement.addEventListener('ended', () => this.playNextMedia());
        this.mediaElement.addEventListener('error', () => this.playNextMedia());

        // Gerar chave única do dispositivo e iniciar verificação
        this.deviceKey = this.generateDeviceKey();
        this.checkDeviceRegistration();
    }

    // Gera chave única e imutável baseada no dispositivo
    generateDeviceKey() {
        // Usar características únicas do dispositivo para gerar chave consistente
        const deviceInfo = [
            navigator.userAgent,
            screen.width,
            screen.height,
            screen.colorDepth,
            navigator.language,
            navigator.platform,
            new Date().getTimezoneOffset()
        ].join('|');
        
        // Gerar hash simples e converter para formato A-F0-9
        let hash = 0;
        for (let i = 0; i < deviceInfo.length; i++) {
            const char = deviceInfo.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32bit
        }
        
        // Converter para hexadecimal e pegar 6 caracteres
        const hexHash = Math.abs(hash).toString(16).toUpperCase();
        return hexHash.substring(0, 6).padEnd(6, '0');
    }

    async checkDeviceRegistration() {
        try {
            this.showLoading();
            
            // CORREÇÃO: Usar as configurações do config.js
            const apiUrl = buildDisplayApiUrl(DISPLAY_CONFIG.API_ENDPOINTS.DEVICE_BY_KEY.replace(':key', this.deviceKey));
            console.log('Fazendo requisição para:', apiUrl);
            console.log('Chave do dispositivo:', this.deviceKey);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status da resposta:', response.status);
            console.log('Response OK:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Dados recebidos da API:', JSON.stringify(data, null, 2));
                
                // Armazena os dados do dispositivo e painel
      if (data.device) {
        console.log('📱 Dados do dispositivo:', data.device);
        window.deviceData = data.device;
        console.log(`✅ Dispositivo "${data.device.name}" conectado com sucesso!`);
        
        // Configurar layout baseado no formato do dispositivo
        const deviceFormat = data.device.format || 'HORIZONTAL';
        configureDeviceLayout(deviceFormat);
      }
      
      if (data.panel) {
        console.log('📺 Dados do painel:', data.panel);
        window.panelData = data.panel;
        console.log(`📋 Painel: "${data.panel.name}" com ${data.panel.medias.length} mídia(s)`);
      }
                
                // Verificar se existe data.panel
                console.log('data.panel existe?', !!data.panel);
                if (data.panel) {
                    console.log('data.panel.medias existe?', !!data.panel.medias);
                    console.log('Quantidade de mídias:', data.panel.medias ? data.panel.medias.length : 0);
                }
                
                if (data.panel && data.panel.medias && data.panel.medias.length > 0) {
                    console.log('✅ Dispositivo encontrado com mídias - carregando playlist');
                    console.log('🔍 Detalhes das mídias:', data.panel.medias);
                    // Dispositivo encontrado - carregar playlist
                    await this.loadPlaylist(data.panel.medias);
                    this.loadUserInfo(data.panel);
                    console.log('🚀 Chamando startPlayer...');
                    this.startPlayer();
                } else {
                    console.log('❌ Condições não atendidas:');
                    console.log('   - data.panel existe?', !!data.panel);
                    console.log('   - data.panel.medias existe?', data.panel ? !!data.panel.medias : 'N/A');
                    console.log('   - data.panel.medias.length > 0?', data.panel && data.panel.medias ? data.panel.medias.length > 0 : 'N/A');
                    console.log('   - Valor de data.panel.medias.length:', data.panel && data.panel.medias ? data.panel.medias.length : 'N/A');
                    // Dispositivo não encontrado - exibir chave para cadastro
                    this.showKeyForRegistration();
                }
            } else {
                console.log('❌ Erro HTTP na consulta:', response.status, response.statusText);
                // Erro na consulta - exibir chave para cadastro
                this.showKeyForRegistration();
            }
        } catch (error) {
            console.error('❌ Erro ao verificar dispositivo:', error);
            this.showKeyForRegistration();
        }
    }

    async loadPlaylist(medias) {
        console.log('📋 Carregando playlist com', medias.length, 'mídias');
        this.playlist = medias.map(media => ({
            id: media.id,
            name: media.title || 'Mídia sem nome',
            url: media.url,
            type: media.type,
            duration: parseInt(media.duration) || 10000 // duração em ms
        }));
        
        console.log('✅ Playlist carregada:', this.playlist);
    }

    loadUserInfo(panel) {
        // Aqui você pode carregar informações do usuário/painel
        // Por enquanto, vamos usar um logo padrão se disponível
        if (panel.logoUrl) {
            this.userLogo.src = panel.logoUrl;
            this.userLogo.style.display = 'block';
        }
    }

    startPlayer() {
        console.log('🎬 INICIANDO PLAYER - FUNÇÃO CHAMADA!');
        console.log('📊 Playlist atual:', this.playlist);
        console.log('📊 Quantidade de mídias na playlist:', this.playlist.length);
        
        this.hideLoading();
        
        // FORÇAR OCULTAÇÃO DA DIV DA CHAVE ANTES DE MOSTRAR O PLAYER
        console.log('🔒 FORÇANDO OCULTAÇÃO DA DIV DA CHAVE');
        this.keyRegistrationContainer.classList.add('hidden');
        this.keyRegistrationContainer.style.display = 'none';
        
        this.showPlayer(); // Esta função já vai ocultar a div da chave
        
        if (this.playlist.length > 0) {
            console.log(`🎯 Iniciando reprodução com ${this.playlist.length} mídias`);
            this.playMedia(0);
        } else {
            console.log('⚠️ Nenhuma mídia encontrada na playlist - voltando para tela de cadastro');
            this.showKeyForRegistration();
        }
    }

    playVideo(media) {
        console.log('🎥 Reproduzindo vídeo:', media.url);
        // Limpar imagens anteriores
        const playerContent = document.getElementById('playerContent');
        const existingImg = playerContent.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }
        
        this.mediaElement.src = media.url;
        this.mediaElement.style.display = 'block';
        
        // Tentar reproduzir com muted primeiro (política de autoplay)
        this.mediaElement.muted = true;
        this.mediaElement.play().then(() => {
            console.log('✅ Vídeo iniciado com sucesso');
        }).catch(error => {
            console.error('❌ Erro ao reproduzir vídeo:', error);
            // Tentar reproduzir sem som
            this.mediaElement.muted = true;
            this.mediaElement.play().catch(() => {
                console.error('❌ Falha total na reprodução, pulando para próxima mídia');
                this.playNextMedia();
            });
        });
    }

    playImage(media) {
        console.log('Exibindo imagem:', media.url);
        // Para imagens, ocultar vídeo e criar elemento img
        this.mediaElement.style.display = 'none';
        
        const imgElement = document.createElement('img');
        imgElement.src = media.url;
        imgElement.style.maxWidth = '100%';
        imgElement.style.maxHeight = '100%';
        imgElement.style.objectFit = 'contain';
        
        // Limpar conteúdo anterior e adicionar imagem
        const playerContent = document.getElementById('playerContent');
        const existingImg = playerContent.querySelector('img');
        if (existingImg) {
            existingImg.remove();
        }
        
        playerContent.appendChild(imgElement);
        
        // Timer em milissegundos
        const duration = media.duration * 1000;
        console.log(`Imagem será exibida por ${duration}ms`);
        setTimeout(() => {
            this.playNextMedia();
        }, duration);
    }

    playMedia(index) {
        if (index >= this.playlist.length) {
            index = 0; // Reiniciar playlist
        }

        this.currentMediaIndex = index;
        const media = this.playlist[index];
        
        console.log(`Reproduzindo mídia ${index + 1}/${this.playlist.length}: ${media.name}`);

        // CORREÇÃO: Comparar com tipos em maiúsculas conforme retornado pela API
        if (media.type === 'VIDEO' || media.url.match(/\.(mp4|webm|ogg)$/i)) {
            this.playVideo(media);
        } else if (media.type === 'PHOTO' || media.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            this.playImage(media);
        } else {
            // Tipo desconhecido, pular para próxima mídia
            console.log(`Tipo de mídia desconhecido: ${media.type}`);
            this.playNextMedia();
        }
    }

    playNextMedia() {
        this.currentMediaIndex++;
        this.playMedia(this.currentMediaIndex);
    }

    // Exibir chave para cadastro no admin
    showKeyForRegistration() {
        this.hideLoading();
        this.keyRegistrationContainer.classList.remove('hidden');
        this.playerContainer.classList.add('hidden');
        
        // Atualizar interface para mostrar a chave gerada
        const keyRegistrationBox = document.getElementById('keyRegistrationBox');
        keyRegistrationBox.innerHTML = `
            <h2>Dispositivo não cadastrado</h2>
            <p>Este dispositivo ainda não foi cadastrado no sistema.</p>
            <p><strong>Chave do dispositivo:</strong></p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 8px;">${this.deviceKey}</span>
            </div>
            <p style="font-size: 14px; color: #666;">
                Cadastre esta chave no painel administrativo para ativar este dispositivo.
            </p>
            <button id="refreshBtn" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.3s;
            ">Verificar novamente</button>
        `;
        
        // Adicionar event listener para o botão de refresh
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => {
            this.checkDeviceRegistration();
        });
        
        refreshBtn.addEventListener('mouseenter', () => {
            refreshBtn.style.background = '#5a6fd8';
        });
        
        refreshBtn.addEventListener('mouseleave', () => {
            refreshBtn.style.background = '#667eea';
        });
    }

    // Métodos de controle de interface
    showLoading() {
        console.log('Mostrando loading...');
        this.loadingContainer.classList.remove('hidden');
        this.playerContainer.classList.add('hidden');
        this.keyRegistrationContainer.classList.add('hidden');
    }

    hideLoading() {
        console.log('Ocultando loading...');
        this.loadingContainer.classList.add('hidden');
    }

    showPlayer() {
        console.log('📺 MOSTRANDO PLAYER - OCULTANDO OUTRAS DIVS');
        
        // Forçar ocultação de todas as outras divs com múltiplos métodos
        this.loadingContainer.classList.add('hidden');
        this.loadingContainer.style.display = 'none';
        
        this.keyRegistrationContainer.classList.add('hidden');
        this.keyRegistrationContainer.style.display = 'none';
        
        // Mostrar apenas o player
        this.playerContainer.classList.remove('hidden');
        this.playerContainer.style.display = 'block';
        
        console.log('✅ Estado das divs após showPlayer():');
        console.log('   - Loading oculto (class):', this.loadingContainer.classList.contains('hidden'));
        console.log('   - Loading oculto (style):', this.loadingContainer.style.display);
        console.log('   - Key registration oculto (class):', this.keyRegistrationContainer.classList.contains('hidden'));
        console.log('   - Key registration oculto (style):', this.keyRegistrationContainer.style.display);
        console.log('   - Player visível (class):', !this.playerContainer.classList.contains('hidden'));
        console.log('   - Player visível (style):', this.playerContainer.style.display);
        
        // Verificação adicional após 100ms
        setTimeout(() => {
            console.log('🔍 VERIFICAÇÃO FINAL após 100ms:');
            console.log('   - Key registration ainda visível?', !this.keyRegistrationContainer.classList.contains('hidden'));
            console.log('   - Player ainda visível?', !this.playerContainer.classList.contains('hidden'));
        }, 100);
    }
}

// Função para configurar layout baseado no formato do dispositivo
function configureDeviceLayout(deviceFormat) {
  const body = document.body;
  
  console.log(`🖥️ Configurando layout para formato: ${deviceFormat}`);
  
  // Remove classes anteriores
  body.classList.remove('device-vertical', 'device-horizontal');
  
  if (deviceFormat === 'VERTICAL') {
    // Layout vertical: mídias "em pé"
    body.classList.add('device-vertical');
    console.log('📱 Layout configurado para VERTICAL (mídias em pé)');
  } else {
    // Layout horizontal: mídias "deitadas" (padrão)
    body.classList.add('device-horizontal');
    console.log('🖥️ Layout configurado para HORIZONTAL (mídias deitadas)');
  }
  
  // Armazenar formato do dispositivo para uso posterior
  window.deviceFormat = deviceFormat;
}

// Inicializar quando a página carregar
 document.addEventListener('DOMContentLoaded', () => {
     new VixMediaDisplay();
 });