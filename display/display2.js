document.addEventListener('DOMContentLoaded', () => {
  const videoContainer = document.getElementById('videoContainer');
  const extraContainer = document.getElementById('extraContainer');
  const keyDisplay = document.getElementById('keyDisplay');
  const offlineDisplay = document.getElementById('offlineDisplay');
  const generatedKey = document.getElementById('generatedKey');
  const instruction = document.getElementById('instruction');
  const videoPlayer = document.getElementById('videoPlayer');
  const megaSenaPanel = document.getElementById('megaSenaPanel');
  const megaSenaDate = document.getElementById('megaSenaDate');
  const megaSenaNumbers = document.getElementById('megaSenaNumbers');
  const megaSenaResult = document.getElementById('megaSenaResult');
  const bottomBar = document.getElementById('bottomBar');
  const mainContainer = document.getElementById('mainContainer');
  const bottomLogo = document.getElementById('bottomLogo');

  let deviceKey = localStorage.getItem('deviceKey');
  if (!deviceKey) {
    deviceKey = generateUniqueKey();
    localStorage.setItem('deviceKey', deviceKey);
  }

  // Variáveis de estado persistente
  let mediaList = JSON.parse(localStorage.getItem('cachedMediaList')) || [];
  let currentMediaIndex = parseInt(localStorage.getItem('currentMediaIndex')) || 0;
  let currentTimeout = null;
  let isDeviceValidated = localStorage.getItem('isDeviceValidated') === 'true';
  let showLottery = localStorage.getItem('showLottery') === 'true';
  let lotteryFrequency = parseInt(localStorage.getItem('lotteryFrequency')) || 2;
  let mediaCounter = parseInt(localStorage.getItem('mediaCounter')) || 0;
  let currentContentType = 'media';
  let megaSenaInfo = JSON.parse(localStorage.getItem('megaSenaInfo')) || null;
  let consecutiveFailures = 0;
  let isSystemOnline = true;
  const MAX_CONSECUTIVE_FAILURES = 3;
  let userLogo = localStorage.getItem('userLogo') || '../public/img/logo.png';

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

  function generateUniqueKey() {
    const characters = 'ABCDEF0123456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  }

  function renderKeyBoxes(key) {
    generatedKey.innerHTML = key
      .split('')
      .map((char) => `<div class="key-box">${char}</div>`)
      .join('');
  }

  // Função para mostrar/ocultar a barra inferior
  // Função para mostrar/ocultar a barra inferior
  function toggleBottomBar(show) {
    if (show && isDeviceValidated) {
      bottomBar.classList.add('show');
      mainContainer.classList.add('with-bottom-bar');
      videoContainer.classList.add('with-bottom-bar');
      // Sempre aplicar a logo (do cliente ou padrão)
      bottomLogo.src = userLogo;
      console.log('🖼️ Logo aplicada na barra inferior:', userLogo);
    } else {
      bottomBar.classList.remove('show');
      mainContainer.classList.remove('with-bottom-bar');
      videoContainer.classList.remove('with-bottom-bar');
    }
  }

  function showOfflineScreen() {
    console.log('🔴 Sistema offline - exibindo mensagem de sistema offline');
    resetDisplay();
    if (offlineDisplay) {
      offlineDisplay.style.display = 'flex';
    }
    isSystemOnline = false;
    toggleBottomBar(false); // Ocultar barra inferior quando offline
    
    // Para todos os timeouts e intervalos ativos
    if (currentTimeout) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
    videoPlayer.pause();
  }

  function hideOfflineScreen() {
    console.log('🟢 Sistema online - ocultando tela de sistema offline');
    if (offlineDisplay) {
      offlineDisplay.style.display = 'none';
    }
    isSystemOnline = true;
    consecutiveFailures = 0;
  }

  function resetDisplay() {
    if (videoContainer) videoContainer.style.display = 'none';
    if (keyDisplay) keyDisplay.style.display = 'none';
    if (extraContainer) extraContainer.style.display = 'none';
    if (offlineDisplay) offlineDisplay.style.display = 'none';
    if (instruction) instruction.textContent = '';
    if (megaSenaPanel) megaSenaPanel.style.display = 'none';
    toggleBottomBar(false);
  }

  // Função para salvar estado no localStorage
  function saveState() {
    localStorage.setItem('cachedMediaList', JSON.stringify(mediaList));
    localStorage.setItem('currentMediaIndex', currentMediaIndex.toString());
    localStorage.setItem('isDeviceValidated', isDeviceValidated.toString());
    localStorage.setItem('showLottery', showLottery.toString());
    localStorage.setItem('lotteryFrequency', lotteryFrequency.toString());
    localStorage.setItem('mediaCounter', mediaCounter.toString());
    if (megaSenaInfo) {
      localStorage.setItem('megaSenaInfo', JSON.stringify(megaSenaInfo));
    }
    if (userLogo) {
      localStorage.setItem('userLogo', userLogo);
    }
  }

  // Função para buscar dados da Mega-Sena
  async function fetchMegaSenaData() {
    try {
      const response = await fetch(buildDisplayApiUrl(DISPLAY_CONFIG.API_ENDPOINTS.LOTTERY_MEGA_SENA));
      if (!response.ok) {
        throw new Error(`Erro na API da Mega-Sena: ${response.status}`);
      }
      const data = await response.json();
      megaSenaInfo = data;
      localStorage.setItem('megaSenaInfo', JSON.stringify(megaSenaInfo));
      console.log('🎰 Dados da Mega-Sena atualizados:', megaSenaInfo);
    } catch (error) {
      console.error('❌ Erro ao buscar dados da Mega-Sena:', error);
    }
  }

  function showMegaSenaPanel() {
    if (!megaSenaInfo) {
      console.warn('⚠️ Dados da Mega-Sena não disponíveis');
      playNextMedia();
      return;
    }

    console.log('🎰 Exibindo painel da Mega-Sena');
    resetDisplay();
    
    megaSenaDate.textContent = `Concurso ${megaSenaInfo.concurso} - ${megaSenaInfo.data}`;
    
    megaSenaNumbers.innerHTML = megaSenaInfo.numeros
      .map(num => `<div style="background: white; color: #FF8C00; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2em; font-weight: bold;">${num}</div>`)
      .join('');
    
    if (megaSenaInfo.ganhadores > 0) {
      megaSenaResult.textContent = `${megaSenaInfo.ganhadores} ganhador(es) - Prêmio: R$ ${megaSenaInfo.premio}`;
    } else {
      megaSenaResult.textContent = `Acumulou! Próximo sorteio: R$ ${megaSenaInfo.proximoPremio}`;
    }
    
    megaSenaPanel.style.display = 'flex';
    toggleBottomBar(true); // Mostrar barra inferior durante Mega-Sena
    
    currentTimeout = setTimeout(() => {
      console.log('⏰ Tempo de exibição da Mega-Sena atingido.');
      currentTimeout = null;
      playNextMedia();
    }, 15000);
  }

  function playNextMedia() {
    if (!isSystemOnline) {
      console.log('🔴 Sistema offline - não reproduzindo mídia');
      return;
    }
  
    if (!isDeviceValidated) {
      console.log('⚠️ Dispositivo não validado - exibindo tela de cadastro');
      resetDisplay();
      renderKeyBoxes(deviceKey);
      keyDisplay.style.display = 'block';
      //instruction.textContent = 'Digite esta chave no painel administrativo para cadastrar este dispositivo.';
      return;
    }
  
    if (mediaList.length === 0) {
      console.log('📭 Nenhuma mídia disponível para reprodução.');
      resetDisplay();
      keyDisplay.style.display = 'block';
      instruction.textContent = 'Dispositivo cadastrado, mas nenhuma mídia disponível.';
      return;
    }

    mediaCounter++;
    localStorage.setItem('mediaCounter', mediaCounter.toString());

    if (showLottery && mediaCounter % lotteryFrequency === 0 && megaSenaInfo) {
      currentContentType = 'megaSena';
      showMegaSenaPanel();
      return;
    }

    currentContentType = 'media';

    const transitionToNextMedia = () => {
      resetDisplay();
      
      // Mostrar barra inferior durante reprodução de mídia
      toggleBottomBar(true);
      
      megaSenaPanel.style.display = 'none';

      if (currentContentType === 'megaSena') {
        showMegaSenaPanel();
      } else {
        const currentMedia = mediaList[currentMediaIndex];
        console.log('🎥 Exibindo mídia:', currentMedia);

        if (currentMedia.type === 'VIDEO') {
          videoPlayer.src = currentMedia.url;
          videoPlayer.style.display = 'block';
          videoContainer.style.display = 'block';
          
          setTimeout(() => {
            videoPlayer.play()
              .then(() => console.log('🎬 Vídeo iniciado com sucesso.'))
              .catch((err) => {
                console.error('❌ Erro ao reproduzir vídeo:', err);
                setTimeout(playNextMedia, 1000);
              });

            if (currentMedia.duration) {
              const durationMs = currentMedia.duration * 1000;
              console.log(`⏱️ Tempo de exibição do vídeo definido para: ${currentMedia.duration}s`);
              currentTimeout = setTimeout(() => {
                console.log('⏰ Tempo de exibição do vídeo atingido.');
                currentTimeout = null;
                playNextMedia();
              }, durationMs);
            }

            videoPlayer.onended = () => {
              console.log('🎬 Vídeo terminou naturalmente.');
              if (currentTimeout) {
                clearTimeout(currentTimeout);
                currentTimeout = null;
              }
              playNextMedia();
            };
          }, 100);
        } else if (currentMedia.type === 'PHOTO') {
          videoContainer.style.backgroundImage = `url(${currentMedia.url})`;
          videoContainer.style.backgroundSize = 'cover';
          videoContainer.style.backgroundPosition = 'center';
          videoContainer.style.display = 'block';

          const displayTimeMs = currentMedia.displayTime * 1000 || 10000;
          console.log(`📷 Exibindo foto por: ${displayTimeMs / 1000}s`);
          currentTimeout = setTimeout(() => {
            console.log('⏰ Tempo de exibição da foto atingido.');
            currentTimeout = null;
            playNextMedia();
          }, displayTimeMs);
        }

        currentMediaIndex = (currentMediaIndex + 1) % mediaList.length;
        localStorage.setItem('currentMediaIndex', currentMediaIndex.toString());
      }
    };

    transitionToNextMedia();
  }

  async function checkDeviceKey() {
    try {
      const response = await fetch(buildDisplayApiUrl(DISPLAY_CONFIG.API_ENDPOINTS.DEVICE_BY_KEY, deviceKey), {
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });
  
      // Se chegou até aqui, a conexão está funcionando
      consecutiveFailures = 0;
      
      // Se estava offline e agora conseguiu conectar, volta ao normal
      if (!isSystemOnline) {
        hideOfflineScreen();
      }
  
      if (response.status === 404) {
        console.warn('⚠️ Dispositivo não encontrado.');
        // Dispositivo não encontrado - mostrar tela de cadastro
        isDeviceValidated = false;
        localStorage.setItem('isDeviceValidated', 'false');
        resetDisplay();
        renderKeyBoxes(deviceKey);
        keyDisplay.style.display = 'block';
        //instruction.textContent = 'Digite esta chave no painel administrativo para cadastrar este dispositivo.';
        return;
      }
  
      if (!response.ok) {
        throw new Error(`Erro na API: Código ${response.status}`);
      }
  
      const data = await response.json();
      console.log('📥 Resposta da API:', data);
      
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
      
      // Marca como validado e salva no localStorage
      isDeviceValidated = true;
      localStorage.setItem('isDeviceValidated', 'true');
      
      // Mover a função updateBottomLogo para fora da checkDeviceKey (após a linha 50)
      function updateBottomLogo(avatarUrl) {
        const bottomLogo = document.getElementById('bottomLogo');
        if (bottomLogo && avatarUrl && avatarUrl !== '../public/img/logo.png') {
          bottomLogo.src = `${avatarUrl}?t=${Date.now()}`;
          // Preservar a imagem original e centralizá-la
          bottomLogo.style.borderRadius = '0';
          bottomLogo.style.width = 'auto';
          bottomLogo.style.height = '60px';
          bottomLogo.style.maxWidth = '100%';
          bottomLogo.style.objectFit = 'contain';
          bottomLogo.style.display = 'block';
          bottomLogo.style.margin = '0 auto';
          bottomLogo.style.border = 'none';
          bottomLogo.style.boxShadow = 'none';
          console.log('🖼️ Logo do cliente aplicada:', avatarUrl);
        } else if (bottomLogo) {
          // Se não há avatarUrl válida, usar logo padrão
          bottomLogo.src = '../public/img/logo.png';
          console.log('🖼️ Usando logo padrão na barra inferior');
        }
      }
      
      // Atualizar a função toggleBottomBar
      function toggleBottomBar(show) {
        if (show && isDeviceValidated) {
          bottomBar.classList.add('show');
          mainContainer.classList.add('with-bottom-bar');
          videoContainer.classList.add('with-bottom-bar');
          // Usar a função updateBottomLogo
          updateBottomLogo(userLogo);
        } else {
          bottomBar.classList.remove('show');
          mainContainer.classList.remove('with-bottom-bar');
          videoContainer.classList.remove('with-bottom-bar');
        }
      }

      if (data.user && data.user.picture) {
        userLogo = data.user.picture;
        localStorage.setItem('userLogo', userLogo);
        console.log('💾 Logo do usuário encontrada e salva:', userLogo);
        
        // Atualizar imediatamente se a barra estiver visível
        if (bottomBar.classList.contains('show')) {
          updateBottomLogo(userLogo);
        }
      } else {
        // Se não tem logo do usuário, usar a padrão
        userLogo = '../public/img/logo.png';
        localStorage.setItem('userLogo', userLogo);
        console.log('💾 Usando logo padrão');
        
        // Atualizar imediatamente se a barra estiver visível
        if (bottomBar.classList.contains('show')) {
          updateBottomLogo(null);
        }
      }
      
      // REMOVER esta linha que está causando confusão (linha ~349):
      // console.log('⚠️ Logo do usuário não encontrada na resposta da API');
  
      if (data.panel && data.panel.medias.length > 0) {
        const newMediaList = data.panel.medias.map((media) => ({
          id: media.id,
          name: media.name,
          type: media.type,
          url: media.url,
          duration: media.duration,
          displayTime: media.displayTime
        }));
  
        const hasMediaListChanged = JSON.stringify(newMediaList) !== JSON.stringify(mediaList);
        
        if (hasMediaListChanged) {
          console.log('📋 Lista de mídias atualizada:', newMediaList);
          mediaList = newMediaList;
          currentMediaIndex = 0;
          saveState();
        }
  
        showLottery = data.panel.showLottery || false;
        lotteryFrequency = data.panel.lotteryFrequency || 2;
        localStorage.setItem('showLottery', showLottery.toString());
        localStorage.setItem('lotteryFrequency', lotteryFrequency.toString());
  
        if (showLottery && !megaSenaInfo) {
          await fetchMegaSenaData();
        }
  
        if (mediaList.length > 0 && !currentTimeout) {
          playNextMedia();
        }
      } else {
        console.log('📭 Nenhuma mídia encontrada no painel.');
        resetDisplay();
      }
    } catch (error) {
      consecutiveFailures++;
      console.error(`❌ Erro ao verificar chave do dispositivo (tentativa ${consecutiveFailures}):`, error);
      
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && isSystemOnline) {
        showOfflineScreen();
      }
    }
  }

  // Inicialização
  console.log('🚀 Iniciando sistema de display...');
  console.log('🔑 Chave do dispositivo:', deviceKey);
  console.log('🖼️ Logo carregada do localStorage:', userLogo);
  
  // Se o dispositivo não foi validado anteriormente, mostra a tela de cadastro
  if (!isDeviceValidated) {
    resetDisplay();
    renderKeyBoxes(deviceKey);
    keyDisplay.style.display = 'block';
    instruction.textContent = 'Digite esta chave no painel administrativo para cadastrar este dispositivo.';
  }
  
  // Verificação inicial
  checkDeviceKey();
  
  // Verificação periódica a cada 30 segundos
  setInterval(checkDeviceKey, 30000);
  
  // Atualização da Mega-Sena a cada hora
  if (showLottery) {
    setInterval(fetchMegaSenaData, 3600000);
  }
});