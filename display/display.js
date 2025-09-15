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

  function showOfflineScreen() {
    console.log('🔴 Sistema offline - exibindo mensagem de sistema offline');
    resetDisplay();
    if (offlineDisplay) {
      offlineDisplay.style.display = 'flex';
    }
    isSystemOnline = false;
    
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
  }

  // Função para buscar dados da Mega-Sena
  async function fetchMegaSenaData() {
    try {
      const response = await fetch(buildDisplayApiUrl(DISPLAY_CONFIG.API_ENDPOINTS.LOTTERY_MEGA_SENA));
      if (!response.ok) throw new Error('Erro ao buscar resultados da Mega-Sena: Status ' + response.status);
      const data = await response.json();
      megaSenaInfo = data;
      localStorage.setItem('megaSenaInfo', JSON.stringify(megaSenaInfo));
      console.log('🎰 Dados da Mega-Sena atualizados:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados da Mega-Sena:', error);
      // Mantém dados em cache se houver erro
      return megaSenaInfo;
    }
  }

  function showMegaSenaPanel() {
    if (!megaSenaInfo) {
      console.warn('⚠️ Dados da Mega-Sena não disponíveis no momento.');
      megaSenaDate.innerHTML = '<p>Dados indisponíveis no momento.</p>';
      megaSenaNumbers.innerHTML = '';
      megaSenaResult.innerHTML = '';
    } else {
      megaSenaDate.innerHTML = `<strong>Data do Sorteio:</strong> ${megaSenaInfo.dataApuracao || 'N/A'}`;
      megaSenaNumbers.innerHTML = megaSenaInfo.dezenasSorteadasOrdemSorteio
        .map(numero => `<div class="megaSenaBall">${numero}</div>`)
        .join('');

      if (megaSenaInfo.numeroDeGanhadores > 0) {
        const valorFormatado = megaSenaInfo.valorPremio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        megaSenaResult.innerHTML = `
          <p><strong>Ganhadores (6 acertos):</strong> ${megaSenaInfo.numeroDeGanhadores}</p>
          <p><strong>Prêmio:</strong> ${valorFormatado}</p>
        `;
      } else {
        megaSenaResult.innerHTML = `<p style="color: #FFD700; font-size: 2em;"><strong>Prêmio Acumulado!</strong></p>`;
      }

      if (megaSenaInfo.dataProximoConcurso) {
        megaSenaResult.innerHTML += `<p><strong>Próximo Sorteio:</strong> ${megaSenaInfo.dataProximoConcurso}</p>`;
      }
    }

    megaSenaPanel.style.display = 'flex';
    videoContainer.style.display = 'none';

    const displayTimeMs = 10000;
    console.log(`🎰 Exibindo painel de resultados da Mega-Sena por: ${displayTimeMs / 1000}s`);
    currentTimeout = setTimeout(() => {
      console.log('⏰ Tempo de exibição do painel de Mega-Sena atingido.');
      currentTimeout = null;
      playNextMedia();
    }, displayTimeMs);
  }

  function playNextMedia() {
    // Se o sistema está offline e não há mídias em cache, mostra tela offline
    if (!isSystemOnline && mediaList.length === 0) {
      showOfflineScreen();
      return;
    }

    // Limpa qualquer temporizador anterior
    if (currentTimeout) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
    videoPlayer.onended = null;

    if (mediaList.length === 0) {
      console.warn('⚠️ A lista de mídias está vazia.');
      if (isDeviceValidated) {
        // Se o dispositivo estava validado mas não há mídias, mostra offline
        showOfflineScreen();
      } else {
        // Se nunca foi validado, mostra tela de chave
        renderKeyBoxes(deviceKey);
        keyDisplay.style.display = 'block';
      }
      return;
    }

    // Determina o tipo de conteúdo (continua funcionando mesmo offline)
    if (isDeviceValidated && showLottery) {
      mediaCounter++;
      if (mediaCounter % lotteryFrequency === 0) {
        currentContentType = 'megaSena';
      } else {
        currentContentType = 'media';
      }
      saveState(); // Salva o contador
    } else {
      currentContentType = 'media';
    }

    console.log(`🔄 Tipo de conteúdo atual: ${currentContentType}, Contador de mídias: ${mediaCounter}`);

    const transitionToNextMedia = () => {
      videoPlayer.pause();
      videoPlayer.style.display = 'none';
      videoPlayer.src = '';
      videoContainer.style.backgroundImage = '';
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
        // Só mostra tela de chave se nunca foi validado
        if (!isDeviceValidated) {
          resetDisplay();
          renderKeyBoxes(deviceKey);
          keyDisplay.style.display = 'block';
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Erro na API: Código ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Resposta da API:', data);
      
      // Marca como validado e salva no localStorage
      isDeviceValidated = true;
      localStorage.setItem('isDeviceValidated', 'true');

      if (data.panel && data.panel.medias.length > 0) {
        const newMediaList = data.panel.medias.map((media) => ({
          url: media.url,
          type: media.type,
          displayTime: media.type === 'PHOTO' ? 10 : null,
          duration: media.type === 'VIDEO' ? media.duration : null,
        }));

        // Atualiza lista de mídias e salva no cache
        if (JSON.stringify(newMediaList) !== JSON.stringify(mediaList)) {
          mediaList = newMediaList;
          currentMediaIndex = 0;
          saveState();
        }

        // Configurações da Mega-Sena
        showLottery = data.panel.showLottery || false;
        lotteryFrequency = data.panel.lotteryFrequency || 2;
        saveState();

        // Busca dados da Mega-Sena se configurado
        if (showLottery) {
          fetchMegaSenaData();
        }

        // Se não estava reproduzindo, inicia
        if (videoContainer.style.display !== 'block' && megaSenaPanel.style.display !== 'flex') {
          resetDisplay();
          playNextMedia();
        }
      } else {
        console.warn('⚠️ Nenhuma mídia disponível para este dispositivo.');
        if (mediaList.length === 0) {
          resetDisplay();
          keyDisplay.style.display = 'block';
          instruction.textContent = 'Nenhuma mídia disponível para este dispositivo.';
        }
      }
    } catch (error) {
      console.error('❌ Erro ao consultar API:', error);
      consecutiveFailures++;
      
      // Se houve muitas falhas consecutivas E o dispositivo nunca foi validado, mostra chave
      // Se o dispositivo já foi validado, continua reproduzindo ou mostra offline
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        if (isDeviceValidated && mediaList.length > 0) {
          // Dispositivo validado com mídias em cache - continua reproduzindo
          console.log('🔄 Dispositivo validado, continuando reprodução offline');
          if (videoContainer.style.display !== 'block' && megaSenaPanel.style.display !== 'flex') {
            playNextMedia();
          }
        } else if (isDeviceValidated && mediaList.length === 0) {
          // Dispositivo validado mas sem mídias - mostra offline
          showOfflineScreen();
        } else {
          // Dispositivo nunca foi validado - mostra chave
          resetDisplay();
          renderKeyBoxes(deviceKey);
          keyDisplay.style.display = 'block';
          instruction.textContent = 'Sistema indisponível no momento. Contate o suporte (vixmidia@altersoft.net.br).';
        }
      }
    }
  }

  // Monitora eventos de rede
  window.addEventListener('online', () => {
    console.log('🌐 Navegador detectou conexão online');
    setTimeout(checkDeviceKey, 2000);
  });

  window.addEventListener('offline', () => {
    console.log('🌐 Navegador detectou perda de conexão');
    if (isDeviceValidated && mediaList.length > 0) {
      // Continua reproduzindo se já tem mídias
      console.log('🔄 Continuando reprodução offline');
    } else {
      showOfflineScreen();
    }
  });

  function startPeriodicCheck() {
    // Se já tem mídias em cache e dispositivo validado, inicia reprodução imediatamente
    if (isDeviceValidated && mediaList.length > 0) {
      playNextMedia();
    }
    
    checkDeviceKey();
    
    setInterval(() => {
      checkDeviceKey();
    }, 30000);
    
    setInterval(() => {
      if (isDeviceValidated && showLottery && isSystemOnline) {
        fetchMegaSenaData();
      }
    }, 300000);
  }

  startPeriodicCheck();
});