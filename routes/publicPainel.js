import express from 'express';
import { PrismaClient } from '@prisma/client';
import RSSParser from 'rss-parser';
import axios from 'axios';
import cron from 'node-cron';

const prisma = new PrismaClient();
const rssParser = new RSSParser();
const router = express.Router();

// Rota pública para buscar mídias de um painel específico
router.get('/device/:deviceKey', async (req, res) => {
  const { deviceKey } = req.params;

  try {
    // Busca dispositivo pelo `deviceKey`
    const device = await prisma.device.findUnique({
      where: { deviceKey },
      include: { panel: true }, // Inclui detalhes do painel associado
    });

    if (!device) {
      // Caso o dispositivo não seja encontrado, retorna mensagem de erro
      console.log(`❌ Dispositivo com a chave ${deviceKey} não encontrado.`);
      return res.status(404).json({ error: 'Dispositivo não encontrado.' });
    }

    // Atualiza o statusDevice para "Online"
    await prisma.device.update({
      where: { deviceKey },
      data: { statusDevice: true }, // Marca o dispositivo como Online no banco
    });

    console.log(`✅ Dispositivo "${device.name}" (Key: ${device.deviceKey}) está ONLINE.`);

    // Busca todas as mídias associadas ao painel do dispositivo
    const medias = await prisma.media.findMany({
      where: { panelId: device.panel.id }, // Busca mídias relacionadas ao painel
      select: { id: true, url: true, type: true, title: true, duration: true },
    });

    // Retorna o painel e as mídias deste dispositivo
    return res.status(200).json({
      message: medias.length > 0
        ? 'Painel e mídias encontrados com sucesso.'
        : 'Painel encontrado, mas sem mídias associadas.',
      panel: {
        id: device.panel.id,
        name: device.panel.name,
        medias, // Array de mídias
        showWeather: device.panel.showWeather,
        showNews: device.panel.showNews,
        showLottery: device.panel.showLottery,
        showCustomScreen: device.panel.showCustomScreen, // Novo campo
        weatherFrequency: device.panel.weatherFrequency,
        newsFrequency: device.panel.newsFrequency,
        lotteryFrequency: device.panel.lotteryFrequency,
        // megaSenaFrequency: device.panel.megaSenaFrequency, // Novo campo
        customScreenFrequency: device.panel.customScreenFrequency, // Novo campo
        customScreenContent: device.panel.customScreenContent || '', // Conteúdo editável
      },
    });
  } catch (error) {
    console.error('❌ Erro ao processar requisição para a deviceKey:', deviceKey, error);

    // Em caso de erro, atualiza o status do dispositivo como Offline (opcional)
    await prisma.device.update({
      where: { deviceKey },
      data: { statusDevice: false },
    });

    return res.status(500).json({ error: 'Erro ao buscar o dispositivo.' });
  }
});

// Rota pública para buscar RSS feeds com imagens de destaque
router.get('/rss/fetch', async (req, res) => {
  const { urls, limit = 10 } = req.query;

  if (!urls) {
    return res.status(400).json({ error: 'É necessário informar uma ou mais URLs de feeds RSS.' });
  }

  try {
    const feedUrls = urls.split(',').map((url) => url.trim());
    const allArticles = [];

    for (const url of feedUrls) {
      console.log(`🔍 Tentando buscar feed RSS: ${url}`);
      const feed = await rssParser.parseURL(url);

      const articles = feed.items.slice(0, limit).map((item) => ({
        title: item.title,
        description: item.contentSnippet || item.description,
        image: extractImageFromRSS(item),
        link: item.link,
        publishedAt: item.isoDate || item.pubDate,
      }));

      console.log(`✅ Processado feed: ${url} com ${articles.length} artigos.`);
      allArticles.push(...articles);
    }

    if (allArticles.length > 0) {
      return res.status(200).json(allArticles);
    }

    return res.status(500).json({ error: 'Não foi possível processar nenhum feed RSS das URLs fornecidas.' });
  } catch (err) {
    console.error('❌ Erro geral ao processar feeds RSS:', err.message);
    res.status(500).json({ error: 'Erro interno ao buscar ou processar os feeds RSS.' });
  }
});

// Função para extrair imagens diretamente do RSS
function extractImageFromRSS(item) {
  if (item.enclosure && item.enclosure.url) {
    console.log('✅ Imagem extraída de "enclosure.url":', item.enclosure.url);
    return item.enclosure.url;
  }

  if (item['media:thumbnail'] && item['media:thumbnail'].url) {
    console.log('✅ Imagem extraída de "media:thumbnail":', item['media:thumbnail'].url);
    return item['media:thumbnail'].url;
  }

  console.log('❌ Nenhuma imagem encontrada neste item. Usando imagem padrão.');
  return 'https://via.placeholder.com/1920x1080?text=Sem+Imagem'; // Imagem padrão
}

// Rota pública para previsão do tempo
router.get('/weather', async (req, res) => {
  const { city, unit = 'metric' } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'É necessário informar a cidade (city).' });
  }

  const WEATHER_API_KEY = process.env.API_OpenWeather;

  if (!WEATHER_API_KEY) {
    return res.status(500).json({ error: 'Chave de API do OpenWeather não configurada.' });
  }

  try {
    console.log(`🔍 Buscando previsão do tempo para: ${city}`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${WEATHER_API_KEY}`
    );

    const data = response.data;

    const weatherData = {
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    };

    res.status(200).json(weatherData);
  } catch (err) {
    console.error('❌ Erro ao buscar previsão do tempo:', err.message);
    res.status(500).json({ error: 'Erro ao buscar previsão do tempo.' });
  }
});

// Verifica a cada 30 segundos se o dispositivo está online
// Tarefa agendada para rodar a cada 30 segundos
cron.schedule('*/30 * * * * *', async () => {
  console.log('⏳ Verificando dispositivos inativos a cada 30 segundos...');

  const agora = new Date();
  const limiteInatividade = new Date(agora.getTime() - 30 * 1000); // 30 segundos atrás

  try {
    // Busca os dispositivos que ficaram inativos
    const dispositivosInativos = await prisma.device.findMany({
      where: {
        statusDevice: true, // Dispositivos atualmente Online
        updatedAt: {
          lt: limiteInatividade, // Última interação antes do limite
        },
      },
      select: {
        id: true,
        name: true,
        deviceKey: true,
        updatedAt: true,
      },
    });

    // Se nenhum dispositivo ficou inativo, aborta a execução
    if (dispositivosInativos.length === 0) {
      console.log('✅ Nenhum dispositivo ficou offline.');
      return;
    }

    // Lista os dispositivos que ficarão offline no console
    dispositivosInativos.forEach((device) => {
      console.log(`🔴 Dispositivo Offline: [ID: ${device.id}] ${device.name} (Chave: ${device.deviceKey}) - Última interação: ${device.updatedAt}`);
    });

    // Atualiza os dispositivos marcando como Offline
    await prisma.device.updateMany({
      where: {
        id: { in: dispositivosInativos.map((device) => device.id) },
      },
      data: {
        statusDevice: false, // Define como Offline
      },
    });

    console.log(`🔧 ${dispositivosInativos.length} dispositivo(s) marcado(s) como Offline.`);

    // (Opcional) Integração com o Slack ou outro serviço: enviar notificação
    // Aqui você pode chamar a função para notificar cada dispositivo offline
    // Exemplo:
    dispositivosInativos.forEach((device) => {
      enviarNotificacaoSlack(device);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar ou atualizar dispositivos Offline:', error);
  }
});

// Função para enviar notificação ao Slack (exemplo)
function enviarNotificacaoSlack(device) {
  const nomeDispositivo = device.name || 'Sem Nome';
  const texto = `🔴 *Dispositivo Offline*: ${nomeDispositivo} (Chave: ${device.deviceKey})\nÚltima interação: ${new Date(device.updatedAt).toLocaleString()}`;
  
  console.log(`Integrando com Slack: ${texto}`);
  fetch('https://hooks.slack.com/services/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', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto,
    }),
  }).catch((err) => console.error('Erro ao enviar notificação Slack:', err));
}

// Rota pública para sorteio da Mega-Sena
router.get('/lottery/mega-sena', async (req, res) => {
  try {
    const response = await fetch('https://api.guidi.dev.br/loteria/megasena/ultimo');
    if (!response.ok) throw new Error(`Erro ao buscar dados da Mega-Sena: Status ${response.status}`);

    const dataMegaSena = await response.json();
    console.log('📊 Resposta completa da API Mega-Sena:', dataMegaSena); // Log para depuração

    // Extrai numeroDeGanhadores e valorPremio da faixa de 6 acertos (primeira entrada de listaRateioPremio)
    const faixaPrincipal = dataMegaSena.listaRateioPremio?.[0] || {};
    const numeroDeGanhadores = faixaPrincipal.numeroDeGanhadores !== undefined ? faixaPrincipal.numeroDeGanhadores : 'N/A';
    const valorPremio = faixaPrincipal.valorPremio !== undefined ? faixaPrincipal.valorPremio : 'N/A';

    res.status(200).json({
      jogo: 'Mega-Sena',
      dezenasSorteadasOrdemSorteio: dataMegaSena.dezenasSorteadasOrdemSorteio || [],
      dataApuracao: dataMegaSena.dataApuracao || 'N/A',
      valorPremio: valorPremio, // Mapeado de listaRateioPremio[0].valorPremio
      dataProximoConcurso: dataMegaSena.dataProximoConcurso || 'N/A',
      acumulado: dataMegaSena.acumulado !== undefined ? dataMegaSena.acumulado : false,
      numeroDeGanhadores: numeroDeGanhadores, // Mapeado de listaRateioPremio[0].numeroDeGanhadores
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados da Mega-Sena:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da Mega-Sena.' });
  }
});

// Rota para salvar conteudo editavel
router.post('/panel/:panelId/custom-screen', async (req, res) => {
  const { panelId } = req.params;
  const { content } = req.body; // Conteúdo editável (HTML ou JSON)

  try {
    const updatedPanel = await prisma.panel.update({
      where: { id: parseInt(panelId) },
      data: { customScreenContent: content },
    });
    res.status(200).json({ message: 'Conteúdo da tela editável salvo com sucesso.', panel: updatedPanel });
  } catch (error) {
    console.error('❌ Erro ao salvar conteúdo da tela editável:', error);
    res.status(500).json({ error: 'Erro ao salvar conteúdo da tela editável.' });
  }
});

export default router;