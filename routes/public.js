import express from 'express';
import { PrismaClient } from '@prisma/client';
import RSSParser from 'rss-parser';
import axios from 'axios';
import cron from 'node-cron';

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

//configurações do smtp para envio de emails
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "admin@altersoft.dev.br",
    pass: "q6djW62qQVyG",
  },
});


const prisma = new PrismaClient();
const rssParser = new RSSParser();
const router = express.Router();

// ✅ ADICIONAR esta função antes das rotas
function enviarNotificacaoSlackUsuario(user) {
  const texto = `🙋🏻‍♂️ *Novo usuário cadastrado!* \nNome: ${user.name}\nEmail: ${
    user.email
  }\nData: ${new Date().toLocaleString()}`;

  console.log(`Enviando notificação Slack: ${texto}`);

  fetch(
    "https://hooks.slack.com/services/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",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: texto }),
    }
  ).catch((err) => console.error("Erro ao enviar notificação Slack:", err));
}

// Rota para cadastrar um novo usuário
router.post("/cadastro", async (req, res) => {
  try {
    // Caso faça sucesso, executa o bloco try
    const user = req.body; // Pega os dados do usuário do corpo da requisição
    const salt = await bcrypt.genSalt(10); // Gera um salt para criptografia da senha com 10 rounds de complexidade
    const hashePassword = await bcrypt.hash(user.password, salt); // Criptografa a senha do usuário
    const userDB = await prisma.user.create({
      // Cria um novo usuário no banco de dados usando Prisma
      data: {
        // Dados do usuário a serem inseridos no banco de dados
        name: user.name, // Nome do usuário
        email: user.email, /// Email do usuário
        password: hashePassword, // Usa a senha criptografada
      },
    });

    // Gera o link com ID do usuário
    const activationLink = `http://45.172.160.51:4000/public/ativar/${userDB.id}`;

    enviarNotificacaoSlackUsuario(user);

    // Envia o e-mail
    await transporter.sendMail({
      from: '"Vix Midia" <admin@altersoft.dev.br>',
      to: user.email,
      subject: "Confirme seu cadastro",
      html: `
        <h3>Olá ${user.name}!</h3>
        <p>Clique no link abaixo para ativar sua conta:</p>
        <a href="${activationLink}">Ativar minha conta</a>
      `,
    });

    console.log("Usuário cadastrado com sucesso:", userDB);
    res
      .status(201)
      .json({
        message: "Usuário criado! Verifique seu e-mail para ativar a conta.",
      });
  } catch (err) {
    // Caso ocorra um erro, executa o bloco catch
    console.error("Erro ao cadastrar usuário:", err); // Exibe o erro no console
    res.status(500).json({ error: "Erro ao cadastrar usuário" }); // Retorna um erro com status 500 (Internal Server Error)
  }
});

// Rota para ativar a conta do usuário
router.get("/ativar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).send(`
        <html>
          <body style="text-align: center; font-family: sans-serif; padding-top: 50px;">
            <h2 style="color: red;">Usuário não encontrado ❌</h2>
            <p>O link de ativação é inválido ou o usuário não existe mais.</p>
          </body>
        </html>
      `);
    }

    if (user.active) {
      return res.send(`
        <html>
          <body style="text-align: center; font-family: sans-serif; padding-top: 50px;">
            <h2 style="color: green;">Sua conta já está ativada ✅</h2>
            <p>Você já pode fazer login normalmente.</p>
            <a href="http://45.172.160.51" style="display:inline-block; margin-top:15px; padding:10px 20px; background-color:#007bff; color:white; border-radius:5px; text-decoration:none;">Ir para o login</a>
          </body>
        </html>
      `);
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: { Active: true },
    });

    res.send(`
      <!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Conta ativada</title>

    <!-- Bootstrap CSS CDN -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-0EvHe/X+R7Yk8vLWW5nXkE9Am7GRTKmvzBPlNGEG8A6I8r+N3FdEHoWcVNUFjJEK"
      crossorigin="anonymous"
    />

    <style>
      body {
        background-color: #f4f4f4;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }

      .card {
        max-width: 400px;
        width: 90%;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .btn-custom {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        transition: background-color 0.3s ease;
      }

      .btn-custom:hover {
        background-color: #0056b3;
      }
    </style>
  </head>

  <body>
    <div class="card">
      <h2 class="text-success">Conta ativada com sucesso! ✅</h2>
      <p class="mt-3">Agora você pode fazer login e aproveitar o sistema.</p>
      <a href="http://45.172.160.51" class="btn btn-custom mt-3">Ir para o login</a>
    </div>

    <!-- Bootstrap JS (opcional) -->
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-J9UhdUQYzGzZ4M7oIDpO3y0UOowGoRWlZzL0b6GpB3E0xq5TcXe2JfwhN4LJkTgG"
      crossorigin="anonymous"
    ></script>
  </body>
</html>

    `);
  } catch (err) {
    console.error("Erro ao ativar usuário:", err);
    res.status(500).send(`
      <html>
        <body style="text-align: center; font-family: sans-serif; padding-top: 50px;">
          <h2 style="color: red;">Erro interno do servidor</h2>
          <p>Tente novamente mais tarde ou entre em contato com o suporte.</p>
        </body>
      </html>
    `);
  }
});

//===============================================================================

// Rota para login de usuário

router.post("/login", async (req, res) => {
  try {
    const userInfo = req.body; // Obtém as informações do usuário do corpo da requisição}
    const user = await prisma.user.findUnique({
      // Busca o usuário no banco de dados pelo email
      where: {
        // Define o filtro para buscar o usuário pelo email
        email: userInfo.email, // Busca o usuário pelo email
        Active: true, //Verifica se o usuário está ativo
      },
    });
    // Se o usuário não for encontrado, retorna erro 404
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    const isMatch = await bcrypt.compare(userInfo.password, user.password); // Compara a senha fornecida com a senha criptografada no banco de dados
    if (!isMatch) {
      return res.status(400).json({ message: "Sua senha está incorreta" }); // Se as senhas não coincidirem, retorna erro 401
    }

    // gera o token
    const token = jwt.sign({ 
      id: user.id, 
      isAdmin: user.isAdmin 
    }, JWT_SECRET, {
      expiresIn: "307 days",
    }); // Gera um token JWT com o ID do usuário e isAdmin, define a expiração para 307 dias

    // Retorna mensagem de sucesso

    res.status(200).json({
      token, // JWT token
      name: user.name,
      email: user.email,
      message: "Usuário encontrado",
    }); // Retorna o token com status 200
    console.log("Usuário autenticado com sucesso:", user);

    // Caso ocorra um erro, executa o bloco catch
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

//====================================================================================================================
// Rota pública para buscar mídias de um painel específico (Rota usada no endpont do APP Display da Vix Midia)
//====================================================================================================================
router.get('/device/:deviceKey', async (req, res) => {
  const { deviceKey } = req.params;

  try {
    // Busca dispositivo pelo `deviceKey`
    const device = await prisma.device.findUnique({
      where: { deviceKey },
      include: { 
        panel: {
          include: {
            user: {
              
            }
          }
        }
      },
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

    // Busca diretamente as mídias relacionadas ao painel do dispositivo
    const medias = await prisma.medias.findMany({
      where: {
        panelId: device.panel.id
      }
    });

    // Retorna o dispositivo, usuário, painel e as mídias
    return res.status(200).json({
      message: medias.length > 0
        ? 'Dispositivo, usuário, painel e mídias encontrados com sucesso.'
        : 'Dispositivo, usuário e painel encontrados, mas sem mídias associadas.',
      device: {
        id: device.id,
        name: device.name,
        deviceKey: device.deviceKey,
        format: device.format,
        panelId: device.panelId,
        type: device.type,
        status: device.status,
        statusDevice: device.statusDevice,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        geoLocation: device.geoLocation,
        showClientInfo: device.showClientInfo
      },
      user: {
        id: device.panel.user.id,
        name: device.panel.user.name,
        picture: device.panel.user.picture
      },
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