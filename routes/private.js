import express from "express"; // Importa o Express para criar rotas e gerenciar requisições HTTP
import prisma from "../lib/prisma.js"; // Importa o PrismaClient para interagir com o banco de dados
import bcrypt from "bcrypt"; // Importa o bcrypt para criptografar senhas
import jwt from "jsonwebtoken"; // Importa o jsonwebtoken para gerar tokens de autenticação
import nodemailer from "nodemailer";

// Middleware de autenticação
// Blacklist de tokens para logout (declarada no topo para ser acessível)
const tokenBlacklist = new Set();

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de acesso requerido" });
  }

  // Verifica se o token está na blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: "Token foi invalidado (logout)" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err) {
        console.error("Erro na verificação do token:", err);
        return res.status(403).json({ error: "Token inválido" });
      }
      req.user = user;
      next();
    }
  );
}

const router = express.Router(); // Cria uma instância do Router do Express para definir rotas
const JWT_SECRET = process.env.JWT_SECRET; //Puxa o segredo do JWT do ambiente no arquivo .env

// Função para atualizar títulos vencidos
async function updateOverdueTitles(userId = null) {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
    
    const whereCondition = {
      status: 'PENDING',
      dueDate: {
        lt: currentDate
      }
    };
    
    // Se userId for fornecido, filtrar apenas por esse usuário
    if (userId) {
      whereCondition.userId = parseInt(userId);
    }
    
    await prisma.financialTitle.updateMany({
      where: whereCondition,
      data: {
        status: 'OVERDUE'
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar títulos vencidos:", error);
  }
}

//Configuração SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "admin@altersoft.dev.br",
    pass: "q6djW62qQVyG",
  },
});

//===============================================================================
// Funcao para enviar notificacao slack para novo usuário cadastrado
//_______________________________________________________________________
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
//===============================================================================

//INICIO DE TODAS AS ROTAS 
// Rota de teste para listar usuarios
router.get('/usuarios',  async (req, res) => { // Rota para listar usuários

    let usuarios = [] // Array para armazenar os usuários

    if (req.query) {
        usuarios = await prisma.user.findMany({
            where: {
                id: req.query.id,
                email: req.query.email,
                name: req.query.name
            }  
        })
        res.status(200).json(usuarios);
    } else {
        usuarios = await prisma.user.findMany()
        console.log(usuarios); // Exibe os usuários no console
    }

    //const showUsers = await prisma.user.findMany() 
    res.status(200).json(usuarios); // Retorna o array de usuários como JSON
});
//Rota para cadastrar um client

router.post("/client", authenticateToken, async (req, res) => {
  try {
    const client = req.body;
    const userId = req.user.id; // Obtém o ID do usuário logado do token
    
    const clientDB = await prisma.clients.create({
      data: {
        name: client.name,
        cpfCNPJ: client.cpfCNPJ,
        email: client.email,
        adress: client.adress,
        phone: client.phone,
        password: client.password,
        users: {
          connect: { id: userId } // Conecta o cliente ao usuário logado
        }
      },
    });
    res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
    });
    console.log("Cliente cadastrado:", clientDB);
  } catch (err) {
    console.error("Erro ao cadastrar cliente:", err);
    res.status(500).json({ error: "Erro ao cadastrar cliente" });
  }
});

//rota para listar os clientes
router.get("/client", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Corrigir: usar .id em vez de .userId

    const clients = await prisma.clients.findMany({
      where: {
        users: {
          some: {
            id: userId // Filtra apenas clientes associados ao usuário logado
          }
        }
      }
    });
    res.status(200).json(clients);
  } catch (err) {
    console.error("Erro ao listar clientes:", err);
    res.status(500).json({ error: "Erro ao listar clientes" });
  }
});

// Rota para obter um cliente específico pelo ID
router.get("/client/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Corrigir: usar .id em vez de .userId

    const clientExists = await prisma.clients.findFirst({
      where: {
        id: Number(id),
        users: {
          some: {
            id: userId // Verifica se o cliente pertence ao usuário logado
          }
        }
      }
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    res.status(200).json(clientExists);
  } catch (err) {
    console.error("Erro ao buscar cliente:", err);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

// Rota para atualizar um cliente
router.put("/client/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    const userId = req.user.id; // Corrigir: usar .id em vez de .userId
    
    // Verificar se o cliente existe e pertence ao usuário logado
    const clientExists = await prisma.clients.findFirst({
      where: {
        id: Number(id),
        users: {
          some: {
            id: userId // Verifica se o cliente pertence ao usuário logado
          }
        }
      }
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    // Preparar dados para atualização
    const updateData = {};
    
    // Adicionar apenas os campos fornecidos
    if (clientData.name !== undefined) updateData.name = clientData.name;
    if (clientData.cpfCNPJ !== undefined) updateData.cpfCNPJ = clientData.cpfCNPJ;
    if (clientData.email !== undefined) updateData.email = clientData.email;
    if (clientData.adress !== undefined) updateData.adress = clientData.adress;
    if (clientData.phone !== undefined) updateData.phone = clientData.phone;
    if (clientData.password !== undefined) updateData.password = clientData.password;
    
    // Atualizar o cliente
    const updatedClient = await prisma.clients.update({
      where: { id: Number(id) },
      data: updateData,
    });
    
    console.log("Cliente atualizado:", updatedClient);
    res.status(200).json({ message: "Cliente atualizado com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar cliente:", err);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// Rota para excluir um cliente
router.delete("/client/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // Obtém o ID do usuário logado do token
    
    // Verificar se o cliente existe e pertence ao usuário logado
    const clientExists = await prisma.clients.findFirst({
      where: {
        id: Number(id),
        users: {
          some: {
            id: userId // Verifica se o cliente pertence ao usuário logado
          }
        }
      }
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    // Excluir o cliente
    await prisma.clients.delete({
      where: { id: Number(id) },
    });
    
    console.log("Cliente excluído:", id);
    res.status(200).json({ message: "Cliente excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir cliente:", err);
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

// ==================== ROTAS DE CAMPANHAS ====================

// Rota para criar uma nova campanha
router.post("/campaign", authenticateToken, async (req, res) => {
  try {
    const { name, description, startDate, endDate, clientId, value, paymentMethod, dueDate, paymentStatus } = req.body;
    const userId = req.user.userId;
    
    // Verificar se o cliente pertence ao usuário logado
    const clientExists = await prisma.clients.findFirst({
      where: {
        id: Number(clientId),
        users: {
          some: {
            id: userId
          }
        }
      }
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    // Validar datas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: "Data de início deve ser anterior à data de fim" });
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        startDate: start,
        endDate: end,
        clientId: Number(clientId),
        value: value ? parseFloat(value) : null,
        paymentMethod: paymentMethod || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentStatus: paymentStatus || 'PENDENTE'
      }
    });
    
    res.status(201).json({
      message: "Campanha criada com sucesso!",
      campaign
    });
  } catch (err) {
    console.error("Erro ao criar campanha:", err);
    res.status(500).json({ error: "Erro ao criar campanha" });
  }
});

// Rota para listar campanhas de um cliente
router.get("/campaign/client/:clientId", authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.userId;
    
    // Verificar se o cliente pertence ao usuário logado
    const clientExists = await prisma.clients.findFirst({
      where: {
        id: Number(clientId),
        users: {
          some: {
            id: userId
          }
        }
      }
    });
    
    if (!clientExists) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        clientId: Number(clientId)
      },
      include: {
        campaignValues: true
      },
      orderBy: {
        dateCreated: 'desc'
      }
    });
    
    res.status(200).json(campaigns);
  } catch (err) {
    console.error("Erro ao listar campanhas:", err);
    res.status(500).json({ error: "Erro ao listar campanhas" });
  }
});

// Rota para obter uma campanha específica
router.get("/campaign/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: Number(id),
        client: {
          users: {
            some: {
              id: userId
            }
          }
        }
      },
      include: {
        client: true,
        campaignValues: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: "Campanha não encontrada" });
    }
    
    res.status(200).json(campaign);
  } catch (err) {
    console.error("Erro ao buscar campanha:", err);
    res.status(500).json({ error: "Erro ao buscar campanha" });
  }
});

// Rota para atualizar uma campanha
router.put("/campaign/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, active, value, paymentMethod, dueDate, paymentStatus } = req.body;
    const userId = req.user.userId;
    
    // Verificar se a campanha pertence ao usuário logado
    const campaignExists = await prisma.campaign.findFirst({
      where: {
        id: Number(id),
        client: {
          users: {
            some: {
              id: userId
            }
          }
        }
      }
    });
    
    if (!campaignExists) {
      return res.status(404).json({ error: "Campanha não encontrada" });
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (active !== undefined) updateData.active = active;
    if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    
    // Validar datas se fornecidas
    if (updateData.startDate && updateData.endDate && updateData.startDate >= updateData.endDate) {
      return res.status(400).json({ error: "Data de início deve ser anterior à data de fim" });
    }
    
    const updatedCampaign = await prisma.campaign.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.status(200).json({
      message: "Campanha atualizada com sucesso!",
      campaign: updatedCampaign
    });
  } catch (err) {
    console.error("Erro ao atualizar campanha:", err);
    res.status(500).json({ error: "Erro ao atualizar campanha" });
  }
});

// Rota para excluir uma campanha
router.delete("/campaign/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se a campanha pertence ao usuário logado
    const campaignExists = await prisma.campaign.findFirst({
      where: {
        id: Number(id),
        client: {
          users: {
            some: {
              id: userId
            }
          }
        }
      }
    });
    
    if (!campaignExists) {
      return res.status(404).json({ error: "Campanha não encontrada" });
    }
    
    await prisma.campaign.delete({
      where: { id: Number(id) }
    });
    
    res.status(200).json({ message: "Campanha excluída com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir campanha:", err);
    res.status(500).json({ error: "Erro ao excluir campanha" });
  }
});

// ==================== ROTAS DE VALORES DE CAMPANHAS ====================

// Rota para adicionar valor a uma campanha
router.post("/campaign-value", authenticateToken, async (req, res) => {
  try {
    const { description, value, type, campaignId, date } = req.body;
    const userId = req.user.id;
    
    // Verificar se a campanha pertence ao usuário logado
    const campaignExists = await prisma.campaign.findFirst({
      where: {
        id: Number(campaignId),
        client: {
          users: {
            some: {
              id: userId
            }
          }
        }
      }
    });
    
    if (!campaignExists) {
      return res.status(404).json({ error: "Campanha não encontrada" });
    }
    
    // Validar tipo
    if (!['ENTRADA', 'SAIDA'].includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser ENTRADA ou SAIDA" });
    }
    
    const campaignValue = await prisma.campaignValue.create({
      data: {
        description,
        value: parseFloat(value),
        type,
        campaignId: Number(campaignId),
        date: date ? new Date(date) : new Date()
      }
    });
    
    res.status(201).json({
      message: "Valor adicionado com sucesso!",
      campaignValue
    });
  } catch (err) {
    console.error("Erro ao adicionar valor:", err);
    res.status(500).json({ error: "Erro ao adicionar valor" });
  }
});

// Rota para listar valores de uma campanha
router.get("/campaign-value/campaign/:campaignId", authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;
    
    // Verificar se a campanha pertence ao usuário logado
    const campaignExists = await prisma.campaign.findFirst({
      where: {
        id: Number(campaignId),
        client: {
          users: {
            some: {
              id: userId
            }
          }
        }
      }
    });
    
    if (!campaignExists) {
      return res.status(404).json({ error: "Campanha não encontrada" });
    }
    
    const campaignValues = await prisma.campaignValue.findMany({
      where: {
        campaignId: Number(campaignId)
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    res.status(200).json(campaignValues);
  } catch (err) {
    console.error("Erro ao listar valores:", err);
    res.status(500).json({ error: "Erro ao listar valores" });
  }
});

// Rota para atualizar um valor de campanha
router.put("/campaign-value/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, value, type, date } = req.body;
    const userId = req.user.id;
    
    // Verificar se o valor pertence ao usuário logado
    const valueExists = await prisma.campaignValue.findFirst({
      where: {
        id: Number(id),
        campaign: {
          client: {
            users: {
              some: {
                id: userId
              }
            }
          }
        }
      }
    });
    
    if (!valueExists) {
      return res.status(404).json({ error: "Valor não encontrado" });
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (type !== undefined) {
      if (!['ENTRADA', 'SAIDA'].includes(type)) {
        return res.status(400).json({ error: "Tipo deve ser ENTRADA ou SAIDA" });
      }
      updateData.type = type;
    }
    if (date !== undefined) updateData.date = new Date(date);
    
    const updatedValue = await prisma.campaignValue.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    res.status(200).json({
      message: "Valor atualizado com sucesso!",
      campaignValue: updatedValue
    });
  } catch (err) {
    console.error("Erro ao atualizar valor:", err);
    res.status(500).json({ error: "Erro ao atualizar valor" });
  }
});

// Rota para excluir um valor de campanha
router.delete("/campaign-value/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o valor pertence ao usuário logado
    const valueExists = await prisma.campaignValue.findFirst({
      where: {
        id: Number(id),
        campaign: {
          client: {
            users: {
              some: {
                id: userId
              }
            }
          }
        }
      }
    });
    
    if (!valueExists) {
      return res.status(404).json({ error: "Valor não encontrado" });
    }
    
    await prisma.campaignValue.delete({
      where: { id: Number(id) }
    });
    
    res.status(200).json({ message: "Valor excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir valor:", err);
    res.status(500).json({ error: "Erro ao excluir valor" });
  }
});



// Rota para cadastrar um novo usuário WiFi
router.post("/cadastrowifi", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      cpf,
      phoneNumber,
      birthDate,
      profilePicture,
    } = req.body; //

    // Validações obrigatórias
    if (!name || !email || !password || !cpf || !birthDate) {
      //
      return res.status(400).json({
        error:
          'Os campos "name", "email", "password", "cpf" e "birthDate" são obrigatórios!',
      });
    }

    // Verificar duplicidade de email ou CPF
    const existingUser = await prisma.wifiUsers.findFirst({
      where: {
        OR: [{ email: email }, { cpf: cpf }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Já existe um usuário com este email ou CPF!",
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário no banco
    const newUserWifi = await prisma.wifiUsers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        phoneNumber,
        birthDate: new Date(birthDate),
        profilePicture,
      },
    });

    res.status(201).json({
      message: "Usuário WiFi criado com sucesso!",
      user: newUserWifi,
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário WiFi:", error);

    // Verificar erros de duplicidade
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Email ou CPF já está sendo usado!" });
    }

    res.status(500).json({ error: "Erro interno no servidor." });
  }
});



//_______________________________________________________________________

// ======================================================================
//ROTA DEFINITIVA PARA CADASTRAR UM NOVO PAINEL ========================
// ======================================================================

// Rota para cadastrar um novo painel
router.post("/painel", authenticateToken, async (req, res) => {
  try {
    console.log("=== CRIANDO PAINEL ===");
    console.log("📥 Dados recebidos:", req.body);
    console.log("👤 Usuário:", req.user);

    const {
      name,
      description,
      type,
      active,
      showWeather,
      weatherFrequency,
      showNews,
      newsFrequency,
      showLottery,
      lotteryFrequency,
      showCoins,
      coinsFrequency,
      showCustomScreen,
      customScreenFrequency,
      customScreenContent,
      createdAt,
      updatedAt,
    } = req.body;

    // Validação
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nome do painel é obrigatório" });
    }

    // Preparar dados para criação
    const panelData = {
      name: name.trim(),
      userId: req.user.id,
      description: description || "",
      type: type || "FULL_SCREEN",
      showWeather: showWeather || false,
      showNews: showNews || false,
      showLottery: showLottery || false,
      showCoins: showCoins || false,
      showCustomScreen: showCustomScreen || false,
    };

    // Adicionar frequências apenas se as opções estiverem habilitadas
    if (showWeather) {
      panelData.weatherFrequency = weatherFrequency ? parseInt(weatherFrequency) : 10;
    }
    if (showNews) {
      panelData.newsFrequency = newsFrequency ? parseInt(newsFrequency) : 10;
    }
    if (showLottery) {
      panelData.lotteryFrequency = lotteryFrequency ? parseInt(lotteryFrequency) : 10;
    }
    if (showCoins) {
      panelData.coinsFrequency = coinsFrequency ? parseInt(coinsFrequency) : 10;
    }
    if (showCustomScreen) {
      panelData.customScreenFrequency = customScreenFrequency ? parseInt(customScreenFrequency) : 2;
      panelData.customScreenContent = customScreenContent || "";
    }

    // Criar painel
    const painel = await prisma.panel.create({
      data: panelData,
    });

    console.log("✅ Painel criado:", painel);
    res.status(201).json(painel);
  } catch (error) {
    console.error("❌ Erro ao criar painel:", error);
    res.status(500).json({ error: "Erro ao criar painel: " + error.message });
  }
});

// Rota para buscar um painel específico por ID
router.get("/painel/:id", authenticateToken, async (req, res) => {
  try {
    const panelId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log("=== BUSCANDO PAINEL ===");
    console.log("🆔 Panel ID:", panelId);
    console.log("👤 User ID:", userId);

    // Buscar o painel verificando se pertence ao usuário
    const painel = await prisma.panel.findFirst({
      where: {
        id: panelId,
        userId: userId,
      },
    });

    if (!painel) {
      return res.status(404).json({ error: "Painel não encontrado ou não pertence ao usuário." });
    }

    console.log("✅ Painel encontrado:", painel);
    res.json(painel);
  } catch (error) {
    console.error("❌ Erro ao buscar painel:", error);
    res.status(500).json({ error: "Erro ao buscar painel: " + error.message });
  }
});

//===========================================================================
// ROTA DEFINITIVA PARA EDIÇÃO BÁSICA DE UM PAINEL (nome e descrição)
//===========================================================================

router.put("/painel/:id", authenticateToken, async (req, res) => {
  const panelId = parseInt(req.params.id);
  const { 
    name, 
    description, 
    type, 
    active,
    showWeather, 
    showNews, 
    showLottery, 
    showCoins, 
    showCustomScreen,
    weatherFrequency,
    newsFrequency,
    lotteryFrequency,
    coinsFrequency,
    customScreenFrequency,
    customScreenContent,
    createdAt,
    updatedAt,
  } = req.body;

  try {
    console.log("=== EDITANDO PAINEL ===");
    console.log("📥 Dados recebidos:", req.body);
    console.log("👤 Usuário:", req.user);
    console.log("🆔 Panel ID:", panelId);

    // Validação
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nome do painel é obrigatório" });
    }

    // Verifica se o painel existe e pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: panelId,
        userId: req.user.id,
      },
    });

    if (!panel) {
      return res
        .status(404)
        .json({ error: "Painel não encontrado ou não pertence ao usuário." });
    }

    // Preparar dados para atualização
    const updateData = {
      name: name.trim(),
      description: description || "",
      type: type || "FULL_SCREEN",
      active: active !== undefined ? active : true,
      showWeather: showWeather || false,
      showNews: showNews || false,
      showLottery: showLottery || false,
      showCoins: showCoins || false,
      showCustomScreen: showCustomScreen || false,
    };

    // Adicionar campos de frequência apenas se as opções estiverem habilitadas
    if (showWeather) {
      updateData.weatherFrequency = weatherFrequency ? parseInt(weatherFrequency) : 10;
    }
    if (showNews) {
      updateData.newsFrequency = newsFrequency ? parseInt(newsFrequency) : 10;
    }
    if (showLottery) {
      updateData.lotteryFrequency = lotteryFrequency ? parseInt(lotteryFrequency) : 10;
    }
    if (showCoins) {
      updateData.coinsFrequency = coinsFrequency ? parseInt(coinsFrequency) : 10;
    }
    if (showCustomScreen) {
      updateData.customScreenFrequency = customScreenFrequency ? parseInt(customScreenFrequency) : 2;
      updateData.customScreenContent = customScreenContent || "";
    }

    // Atualiza o painel
    const updatedPanel = await prisma.panel.update({
      where: { id: panelId },
      data: updateData,
    });

    console.log("✅ Painel atualizado:", updatedPanel);
    res.json(updatedPanel);
  } catch (error) {
    console.error("❌ Erro ao atualizar painel:", error);
    res.status(500).json({ error: "Erro ao atualizar painel: " + error.message });
  }
});

//===========================================================================
// ROTA DEFINITIVA PARA EDIÇÃO DE CONFIGURAÇÕES DE UM PAINEL
//===========================================================================

router.put("/painel/:panelId/config", authenticateToken, async (req, res) => {
  const panelId = parseInt(req.params.panelId);

  // Recebe as configurações do corpo da requisição
  const {
    name,
    description,
    type,
    active,
    showWeather,
    weatherFrequency,
    showNews,
    newsFrequency,
    showLottery,
    lotteryFrequency,
    showCoins,
    coinsFrequency,
    showCustomScreen,
    customScreenFrequency,
    customScreenContent,
  } = req.body;

  try {
    console.log("=== ATUALIZANDO CONFIGURAÇÃO DO PAINEL ===");
    console.log("📥 Configurações recebidas:", req.body);

    // Verifica se o painel existe e pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: panelId,
        userId: req.user.id,
      },
    });

    if (!panel) {
      return res
        .status(404)
        .json({ error: "Painel não encontrado ou não pertence ao usuário." });
    }

    // Atualiza o painel com as novas configurações
    const updatedPanel = await prisma.panel.update({
      where: { id: panelId },
      data: {
        name: name?.trim() || panel.name,
        description: description || panel.description || "",
        type: type || panel.type || "FULL_SCREEN",
        showWeather:
          showWeather !== undefined ? showWeather : panel.showWeather,
        weatherFrequency: weatherFrequency
          ? parseInt(weatherFrequency)
          : panel.weatherFrequency,
        showNews: showNews !== undefined ? showNews : panel.showNews,
        newsFrequency: newsFrequency
          ? parseInt(newsFrequency)
          : panel.newsFrequency,
        showLottery:
          showLottery !== undefined ? showLottery : panel.showLottery,
        lotteryFrequency: lotteryFrequency
          ? parseInt(lotteryFrequency)
          : panel.lotteryFrequency,
        showCoins: showCoins !== undefined ? showCoins : panel.showCoins,
        coinsFrequency: coinsFrequency
          ? parseInt(coinsFrequency)
          : panel.coinsFrequency,
        showCustomScreen:
          showCustomScreen !== undefined
            ? showCustomScreen
            : panel.showCustomScreen,
        customScreenFrequency: customScreenFrequency
          ? parseInt(customScreenFrequency)
          : panel.customScreenFrequency,
        customScreenContent:
          customScreenContent || panel.customScreenContent || "",
      },
    });

    console.log("✅ Configuração do painel atualizada!");
    res.status(200).json(updatedPanel);
  } catch (error) {
    console.error("❌ Erro ao atualizar o painel:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar configurações do painel." });
  }
});
//_______________________________________________________________________

// Rota para leitura das midias no CRUD de midias
router.get("/panel/:panelId/midias", authenticateToken, async (req, res) => {
  try {
    const panelId = parseInt(req.params.panelId);

    const midias = await prisma.medias.findMany({
      where: {
        panelId: panelId // Filtrar diretamente pelo panelId
      },
      orderBy: { createdAt: "asc" }, // Ordena por data de criação
    });

    res.status(200).json(midias);
  } catch (error) {
    console.error("❌ Erro ao carregar mídias:", error);
    res.status(500).json({
      error:
        "Erro ao carregar mídias: " + (error.message || "Erro desconhecido"),
    });
  }
});

// Rota para buscar mídias de um painel específico
router.get("/panel/:id/midias", authenticateToken, async (req, res) => {
  try {
    const panelId = parseInt(req.params.id);

    console.log("=== BUSCA DE MÍDIAS ===");
    console.log("Panel ID:", panelId);

    // Validar se o painel existe e pertence ao usuário
    const painel = await prisma.panel.findFirst({
      where: {
        id: panelId,
        userId: req.user.id,
      },
    });

    if (!painel) {
      return res
        .status(404)
        .json({ error: "Painel não encontrado ou não pertence ao usuário" });
    }

    // Buscar todas as mídias associadas ao painel
    const midias = await prisma.medias.findMany({
      where: {
        panelId: panelId, // ✅ Filtrar pelo panelId diretamente
      },
      orderBy: {
        id: "desc", // Ordenar por ID em ordem decrescente
      },
    });

    console.log("✅ Mídias encontradas:", midias);
    res.status(200).json(midias);
  } catch (error) {
    console.error("❌ Erro ao buscar mídias do painel:", error);
    res.status(500).json({ error: `Erro ao buscar mídias: ${error.message}` });
  }
});

//_______________________________________________________________________

// =======================================================================
// ROTA FINAL PARA LISTAR PAINEIS TANTO NO FRONT COMO NO BACKEND
//========================================================================
router.get("/paineis", async (req, res) => {
  try {
    // Pega o token do header Authorization
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    const userId = decoded.id;

    // Busca os painéis do usuário
    const paineis = await prisma.panel.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        active: true,
        description: true,
        showLottery: true,
        lotteryFrequency: true,
        showCoins: true,
        coinsFrequency: true,
        showCustomScreen: true,
        customScreenFrequency: true,
        customScreenContent: true,
        type: true,
        showNews: true,
        newsFrequency: true,
        showWeather: true,
        weatherFrequency: true,
        createdAt: true,
        updatedAt: true,
      },

    });

    res.status(200).json(paineis);
  } catch (err) {
    console.error("Erro ao buscar painéis:", err);

    // Se for erro de token inválido
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    res.status(500).json({ error: "Erro ao buscar painéis" });
  }
});

import auth from "../middlewares/auth.js";

// Rota para atualizar paineis
router.put("/device/:id", authenticateToken, async (req, res) => {
  const { id } = req.params; // ID do dispositivo enviado via URL
  const { name, panelId, type, status, local, sendNotification, showClientInfo } = req.body; // Dados enviados para atualização
  const userId = req.userId; // ID do usuário autenticado (obtido no middleware)
  const format = req.body.format || "Horizontal"; // Formato do dispositivo, padrão é 'Horizontal'
  const geoLocation = req.body.geoLocation || null; // Localização geográfica, padrão é null

  try {
    console.log("🚀 ROTA PUT EXECUTADA");
    console.log("=== ATUALIZANDO DISPOSITIVO ===");
    console.log("📥 ID:", id);
    console.log("📥 User ID final:", userId);
    console.log("📥 Dados recebidos:", { name, panelId, type, status, local });

    // Busca o dispositivo verificando se ele pertence a um painel associado ao usuário
    const device = await prisma.device.findFirst({
      where: {
        id: parseInt(id), // Verifica o ID do dispositivo
        panel: {
          // Relacionamento com "panel"
          userId: userId, // Confirma se o painel pertence ao usuário
        },
      },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
            showLottery: true,
            lotteryFrequency: true,
          },
        },
      },
    });

    // Se o dispositivo não for encontrado, retorne erro
    if (!device) {
      return res
        .status(404)
        .json({
          error:
            "Dispositivo não encontrado ou você não tem permissão para editá-lo.",
        });
    }

    // Atualiza o dispositivo com os novos dados
    const deviceAtualizado = await prisma.device.update({
      where: {
        id: parseInt(id), // Atualiza pelo ID do dispositivo
      },
      data: {
        name: name || device.name,
        type: type || device.type,
        status: status || device.status,
        panelId: panelId || device.panelId,
        format: format || device.format,
        geoLocation: geoLocation || device.geoLocation,
        sendNotification: sendNotification !== undefined ? sendNotification : device.sendNotification,
        showClientInfo: showClientInfo !== undefined ? showClientInfo : device.showClientInfo,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Dispositivo atualizado com sucesso:", deviceAtualizado);
    return res.status(200).json(deviceAtualizado);
  } catch (error) {
    console.error("❌ Erro ao atualizar dispositivo:", error);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar dispositivo: " + error.message });
  }
});

// Rota para excluir painel
router.delete("/painel/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("=== DELETE PAINEL ===");
    console.log("ID do painel:", id);
    console.log("User ID:", userId);

    // Verificar se o painel existe e pertence ao usuário
    const painelExistente = await prisma.panel.findFirst({
      where: {
        id: parseInt(id),
        userId: userId,
      },
    });

    if (!painelExistente) {
      return res
        .status(404)
        .json({ message: "Painel não encontrado ou sem permissão" });
    }

    // Excluir o painel
    await prisma.panel.delete({
      where: {
        id: parseInt(id),
      },
    });

    console.log("✅ Painel excluído com sucesso");

    res.json({ message: "Painel excluído com sucesso", id: parseInt(id) });
  } catch (error) {
    console.error("❌ Erro ao excluir painel:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

// rota para upload de arquivos com o multer

import multer from "multer";
import path, { format } from "path";
import fs from "fs";

// Configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./public/uploads"; // Caminho para pasta pública

    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": "IMAGE",
    "image/jpg": "IMAGE",
    "image/png": "IMAGE",
    "image/gif": "IMAGE",
    "video/mp4": "VIDEO",
    "video/avi": "VIDEO",
    "video/mov": "VIDEO",
    "video/wmv": "VIDEO",
    "audio/mp3": "AUDIO",
    "audio/wav": "AUDIO",
    "audio/ogg": "AUDIO",
    "application/pdf": "DOCUMENT",
    "application/msword": "DOCUMENT",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCUMENT",
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Rota para upload de arquivos de mídias globais (apenas retorna URL)
router.post("/upload-global-media", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    console.log("Arquivo recebido para mídia global:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    }

    // Mapeamento de mimetypes para MediaType enum do Prisma
    const mimeToMediaType = {
      "image/jpeg": "PHOTO",
      "image/jpg": "PHOTO",
      "image/png": "PHOTO",
      "image/gif": "PHOTO",
      "video/mp4": "VIDEO",
      "video/avi": "VIDEO",
      "video/mov": "VIDEO",
      "video/wmv": "VIDEO",
    };

    const type = mimeToMediaType[req.file.mimetype];
    if (!type) {
      return res
        .status(400)
        .json({ error: "O tipo de arquivo enviado não é suportado." });
    }

    // Gerar URL pública do arquivo
    const relativeFilePath = `/uploads/${req.file.filename}`;
    const publicUrl = `${process.env.BASE_URL || 'http://localhost:4000'}${relativeFilePath}`;

    console.log("URL pública gerada para mídia global:", publicUrl);

    // Retorna apenas a URL do arquivo
    return res.status(200).json({
      message: "Upload realizado com sucesso!",
      url: publicUrl,
      type: type,
      filename: req.file.filename
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload de mídia global:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do arquivo." });
  }
});

// Rota para upload e criação de mídia
router.post("/uploadmidia", upload.single("file"), async (req, res) => {
  try {
    console.log("Arquivo recebido:", req.file);
    console.log("Dados recebidos no body:", req.body);

    const { title, panelId, duration } = req.body;

    // Validação dos campos obrigatórios
    if (!title) {
      return res.status(400).json({ error: 'O campo "title" é obrigatório.' });
    }
    if (!panelId) {
      return res
        .status(400)
        .json({ error: 'O campo "panelId" é obrigatório.' });
    }
    if (!duration || isNaN(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ error: "A duração deve ser um número válido maior que 0." });
    }

    // Mapeamento de mimetypes para MediaType enum do Prisma
    const mimeToMediaType = {
      "image/jpeg": "PHOTO",
      "image/jpg": "PHOTO",
      "image/png": "PHOTO",
      "image/gif": "PHOTO",
      "video/mp4": "VIDEO",
      "video/avi": "VIDEO",
      "video/mov": "VIDEO",
      "video/wmv": "VIDEO",
      "audio/mp3": "AUDIO",
      "audio/wav": "AUDIO",
      "audio/ogg": "AUDIO",
      "application/pdf": "DOCUMENT",
      "application/msword": "DOCUMENT",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCUMENT",
    };

    const type = mimeToMediaType[req.file.mimetype];
    if (!type) {
      return res
        .status(400)
        .json({ error: "O tipo de arquivo enviado não é suportado." });
    }

    console.log("Tipo de mídia mapeado:", type);

    // Corrige o caminho guardado na URL
    const relativeFilePath = `/uploads/${req.file.filename}`;
    const publicUrl = `${process.env.BASE_URL || 'http://localhost:4000'}${relativeFilePath}`;

    console.log("URL pública gerada:", publicUrl);

    // Salvar no banco de dados
    const media = await prisma.medias.create({
      data: {
        title: title || null,
        url: publicUrl, // Salva no banco a URL pública final
        type: type, // Tipo traduzido para o enum do Prisma
        duration: parseInt(duration, 10),
        panelId: parseInt(panelId, 10)
      },
    });

    console.log("✅ Mídia criada com sucesso:", media);

    // Retorna uma resposta de sucesso
    return res.status(201).json({
      message: "Mídia criada com sucesso!",
      media,
    });
  } catch (error) {
    console.error("❌ Erro ao processar a requisição:", error);
    return res.status(500).json({ error: "Erro ao criar mídia." });
  }
});

// REMOVA as duas rotas /addmidia existentes e substitua por esta:
router.post("/addmidia", authenticateToken, async (req, res) => {
  try {
    console.log("=== CRIANDO MÍDIA POR URL ===");
    console.log("Dados recebidos:", req.body);

    // Desestrutura os campos do corpo da requisição
    const { title, url, type, panelId, duration } = req.body;

    // Verifica se os campos obrigatórios estão presentes
    if (!url || !type || !panelId) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios ausentes (url, type, panelId)." });
    }

    // Prepara os dados para criação no banco de dados
    const midiaData = {
      title: title || "Sem título",
      url: url,
      type: type?.toUpperCase() === "IMAGE" ? "PHOTO" : type?.toUpperCase(), // Converte "image" para o formato do Prisma
      duration: duration || null, // Usa duração enviada, ou `null` caso não esteja presente
      panelId: parseInt(panelId, 10),
    };

    console.log("Dados tratados para criação:", midiaData);

    // Adiciona a mídia ao banco de dados
    const novaMidia = await prisma.medias.create({
      data: midiaData,
    });

    console.log("✅ Mídia criada com sucesso:", novaMidia);
    res.status(201).json(novaMidia);
  } catch (error) {
    console.error("❌ Erro ao criar mídia por URL:", error.message);
    res.status(500).json({ error: "Erro ao criar mídia: " + error.message });
  }
});

// Rota para buscar uma mídia específica
router.get("/midia/:id", authenticateToken, async (req, res) => {
  try {
    const midiaId = parseInt(req.params.id);

    if (isNaN(midiaId)) {
      return res.status(400).json({ error: "ID da mídia inválido" });
    }

    console.log("Buscando mídia:", midiaId);

    // Inclui o campo `duration` ao carregar os dados da mídia
    const midia = await prisma.medias.findUnique({
      where: { id: midiaId },
      select: {
        id: true,
        title: true,
        url: true,
        type: true,
        duration: true, // ← Inclua o campo duration aqui!
        panelId: true,
      },
    });

    if (!midia) {
      return res.status(404).json({ error: "Mídia não encontrada" });
    }

    console.log("Mídia encontrada:", midia);
    res.status(200).json(midia); // Envia o campo duration ao frontend
  } catch (err) {
    console.error("Erro ao buscar mídia:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para editar uma mídia
router.put("/midia/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, url, type, duration } = req.body;

  try {
    console.log("Atualizando mídia:", id);

    const updatedMidia = await prisma.medias.update({
      where: { id: parseInt(id) },
      data: {
        title: title || undefined,
        url: url || undefined,
        type: type?.toUpperCase() || undefined,
        duration: duration || undefined, // Atualiza duration se informado
      },
    });

    console.log("✅ Mídia atualizada:", updatedMidia);
    res.status(200).json(updatedMidia);
  } catch (error) {
    console.error("❌ Erro ao atualizar mídia:", error);
    res.status(500).json({
      error:
        "Erro ao atualizar mídia: " + (error.message || "Erro desconhecido"),
    });
  }
});

// Rota para excluir uma mídia
router.delete("/midia/:id", authenticateToken, async (req, res) => {
  try {
    const midiaId = parseInt(req.params.id);

    if (isNaN(midiaId)) {
      return res.status(400).json({ error: "ID da mídia inválido" });
    }

    console.log("Excluindo mídia:", midiaId);

    // Verificar se a mídia existe
    const midiaExistente = await prisma.medias.findUnique({
      where: { id: midiaId },
      include: {
        PanelMedias: true, // Corrigido: relacionamento correto
        panel: true, // Relacionamento direto com painel
      },
    });

    if (!midiaExistente) {
      return res.status(404).json({ error: "Mídia não encontrada" });
    }

    console.log("Mídia encontrada para exclusão:", midiaExistente);

    // Se for um arquivo local, tentar excluir o arquivo físico
    if (
      midiaExistente.url &&
      midiaExistente.url.includes("/vix-midia/uploads/")
    ) {
      try {
        const fs = await import("fs");
        const path = await import("path");

        const filename = midiaExistente.url.split("/").pop();
        const filePath = `/var/www/html/vix-midia/uploads/${filename}`;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("📁 Arquivo físico removido:", filePath);
        }
      } catch (fileErr) {
        console.error("⚠️ Erro ao remover arquivo físico:", fileErr);
        // Continua mesmo se não conseguir remover o arquivo
      }
    }

    // Primeiro, remover as associações com painéis (tabela intermediária PanelMedias)
    await prisma.panelMedia.deleteMany({
      where: { mediaId: midiaId },
    });

    console.log("🔗 Associações com painéis removidas.");

    // Depois, remover a mídia
    await prisma.medias.delete({
      where: { id: midiaId },
    });

    console.log("✅ Mídia excluída com sucesso:", midiaId);
    res.json({ message: "Mídia excluída com sucesso" });
  } catch (err) {
    console.error("❌ Erro ao excluir mídia:", err);
    res.status(500).json({ error: "Erro ao excluir mídia: " + err.message });
  }
});

// ========== ROTAS DE DISPOSITIVOS ==========

// Listar dispositivos do usuário
router.get("/devices", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const devices = await prisma.device.findMany({
      where: {
        panel: {
          userId: userId,
        },
      },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log(
      `Dispositivos encontrados para usuário ${userId}:`,
      devices.length
    );

    // Formatar os dispositivos para responder ao frontend
    const devicesFormatted = devices.map((device) => ({
      id: device.id,
      name: device.name,
      deviceKey: device.deviceKey,
      type: device.type,
      status: device.status,
      statusDevice: device.statusDevice,
      format: device.format, // Formato do dispositivo: Horizontal ou Vertical
      createdAt: device.createdAt, // Data de criação
      updatedAt: device.updatedAt, // Última atualização
      panelId: device.panelId,
      geoLocation: device.geoLocation, // Localização geográfica
      panel: device.panel,
    }));

    res.json(devicesFormatted);
  } catch (error) {
    console.error("Erro ao buscar dispositivos:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// Buscar dispositivo específico
// Rota GET /device/:id removida - duplicada na linha 2131

// ===== ROTA POST /device ATUALIZADA =====

router.post("/device", authenticateToken, async (req, res) => {
  try {
    // 🔍 LOGS PARA DEBUG
    console.log("=== CRIANDO DISPOSITIVO ===");
    console.log("📥 req.body completo:", JSON.stringify(req.body, null, 2));
    console.log("🔑 deviceKey recebida:", req.body.deviceKey);
    console.log("📝 name recebido:", req.body.name);
    console.log("📺 panelId recebido:", req.body.panelId);
    console.log("🏷️ type recebido:", req.body.type);
    // console.log('📍 local recebido:', req.body.local); // ✅ NOVO LOG

    const { name, deviceKey, panelId, type, format, geoLocation, sendNotification, showClientInfo } = req.body;

    // 🔍 VERIFICAR SE A DESESTRUTURAÇÃO FUNCIONOU
    console.log("🔍 Após desestruturação:");
    console.log("- name:", name);
    console.log("- deviceKey:", deviceKey);
    console.log("- panelId:", panelId);
    console.log("- type:", type);
    // console.log('- local:', local); // ✅ NOVO LOG

    // Validações
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ error: "Nome do dispositivo é obrigatório" });
    }

    if (!deviceKey || !deviceKey.trim()) {
      return res
        .status(400)
        .json({ error: "Chave do dispositivo é obrigatória" });
    }

    if (deviceKey.length !== 6) {
      return res
        .status(400)
        .json({
          error: "Chave do dispositivo deve ter exatamente 8 caracteres",
        });
    }

    if (!panelId) {
      return res.status(400).json({ error: "ID do painel é obrigatório" });
    }

    // Verificar se o painel existe e pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: parseInt(panelId),
        userId: req.user.id,
      },
    });

    if (!panel) {
      return res
        .status(404)
        .json({ error: "Painel não encontrado ou não pertence ao usuário" });
    }

    // Verificar se a deviceKey já existe
    const existingDevice = await prisma.device.findFirst({
      where: {
        deviceKey: deviceKey.trim().toUpperCase(),
      },
    });

    if (existingDevice) {
      return res
        .status(400)
        .json({
          error: "Esta chave já está sendo usada por outro dispositivo",
        });
    }

    // 🔍 LOG ANTES DE CRIAR
    const dadosParaCriar = {
      name: name.trim(),
      deviceKey: deviceKey.trim().toUpperCase(),
      panelId: parseInt(panelId),
      type: type || "TV",
      status: "Ativo",
      format: format || "Horizontal",
      geoLocation: geoLocation || null,
      sendNotification: sendNotification !== undefined ? sendNotification : false,
      showClientInfo: showClientInfo !== undefined ? showClientInfo : false
    };

    console.log(
      "💾 DADOS PARA CRIAR NO BANCO:",
      JSON.stringify(dadosParaCriar, null, 2)
    );

    // Criar o dispositivo usando Prisma
    const novoDispositivo = await prisma.device.create({
      data: dadosParaCriar,
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 🔍 LOG APÓS CRIAR
    console.log(
      "✅ DISPOSITIVO CRIADO:",
      JSON.stringify(novoDispositivo, null, 2)
    );

    res.status(201).json(novoDispositivo);
  } catch (error) {
    console.error("❌ ERRO AO CRIAR DISPOSITIVO:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Chave do dispositivo já existe" });
    }

    res
      .status(500)
      .json({ error: "Erro interno do servidor: " + error.message });
  }
});

// ===== ROTA PUT /device/:id CORRIGIDA =====
router.put("/device/:id", auth, async (req, res) => {
  console.log("🚀 ROTA PUT EXECUTADA");

  try {
    const { id } = req.params;
    const { name, panelId, type, status, local, sendNotification, showClientInfo } = req.body;
    const userId = req.userId;

    console.log("=== ATUALIZANDO DISPOSITIVO ===");
    console.log("📥 ID:", id);
    console.log("📥 User ID final:", userId);
    console.log("📥 Dados recebidos:", { name, panelId, type, status, local });

    // STEP 1: Verificando se dispositivo existe
    const deviceExistente = await prisma.device.findFirst({
      where: {
        id: parseInt(id),
        Panel: {
          userId: userId,
        },
      },
    });

    if (!deviceExistente) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    // STEP 2: Verificando painel se fornecido
    if (panelId) {
      const painelExiste = await prisma.panel.findFirst({
        where: {
          id: parseInt(panelId),
          userId: userId,
        },
      });

      if (!painelExiste) {
        return res.status(400).json({ error: "Painel não encontrado" });
      }
    }

    // ✅ STEP 3: Preparando dados para atualização
    console.log("🔍 STEP 3: Preparando dados para atualização...");
    const dadosAtualizacao = {
      name: name?.trim(),
      type: type,
      status: status,
      sendNotification: sendNotification !== undefined ? sendNotification : deviceExistente.sendNotification,
      showClientInfo: showClientInfo !== undefined ? showClientInfo : deviceExistente.showClientInfo,
    };

    // Se panelId foi fornecido, usar a relação Panel
    if (panelId) {
      dadosAtualizacao.Panel = {
        connect: {
          id: parseInt(panelId),
        },
      };
    }

    console.log("📋 Dados para atualização:", dadosAtualizacao);

    // STEP 4: Executando atualização
    console.log("🔍 STEP 4: Executando atualização no banco...");
    const deviceAtualizado = await prisma.device.update({
      where: {
        id: parseInt(id),
      },
      data: dadosAtualizacao,
      include: {
        panel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    console.log(
      "✅ STEP 4 CONCLUÍDO: Device atualizado no banco:",
      deviceAtualizado
    );

    // STEP 5: Formatando resposta
    const deviceFormatado = {
      id: deviceAtualizado.id,
      name: deviceAtualizado.name,
      deviceKey: deviceAtualizado.deviceKey,
      type: deviceAtualizado.type,
      status: deviceAtualizado.status,
      panelId: deviceAtualizado.panelId,
      panel: deviceAtualizado.Panel,
    };

    console.log("✅ RESPOSTA ENVIADA COM SUCESSO!");
    res.json(deviceFormatado);
  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR DISPOSITIVO:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// ===== ROTA GET /device/:id (para buscar um dispositivo específico) =====

router.get("/device/:id", authenticateToken, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);

    console.log("=== BUSCANDO DISPOSITIVO ===");
    console.log("📥 ID:", deviceId);

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        panel: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    // Verificar se o dispositivo pertence a um painel do usuário
    if (device.panel.userId !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    console.log("✅ DISPOSITIVO ENCONTRADO:", JSON.stringify(device, null, 2));

    res.json(device);
  } catch (error) {
    console.error("❌ ERRO AO BUSCAR DISPOSITIVO:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor: " + error.message });
  }
});


// Excluir dispositivo
router.delete("/device/:id", authenticateToken, async (req, res) => {
  try {
    console.log("=== ROTA DELETE /device/:id CHAMADA ===");
    console.log("📥 Parâmetros recebidos:", req.params);
    console.log("👤 Usuário autenticado:", req.user?.id);
    
    const deviceId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log("🔍 Buscando dispositivo ID:", deviceId, "para usuário:", userId);

    // Verificar se o dispositivo pertence ao usuário
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        panel: {
          userId: userId,
        },
      },
    });

    console.log("📋 Dispositivo encontrado:", device ? "SIM" : "NÃO");

    if (!device) {
      console.log("❌ Dispositivo não encontrado ou não pertence ao usuário");
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    console.log("🗑️ Excluindo dispositivo ID:", deviceId);
    await prisma.device.delete({
      where: { id: deviceId },
    });

    console.log("✅ Dispositivo excluído com sucesso:", deviceId);
    res.json({ message: "Dispositivo excluído com sucesso" });
  } catch (error) {
    console.error("❌ ERRO ao excluir dispositivo:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// Buscar dispositivo por chave (para TVs se conectarem)
router.get("/device/key/:deviceKey", async (req, res) => {
  try {
    const { deviceKey } = req.params;

    const device = await prisma.device.findUnique({
      where: {
        deviceKey: deviceKey,
      },
      include: {
        panel: {
          include: {
            medias: {
              include: {
                media: true,
              },
            },
          },
        },
      },
    });

    if (!device) {
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    // Atualizar status para "Online" quando acessado
    await prisma.device.update({
      where: { id: device.id },
      data: { status: "Online" },
    });

    res.json(device);
  } catch (error) {
    console.error("Erro ao buscar dispositivo por chave:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// Função para gerar chave única do dispositivo
function generateDeviceKey() {
  const chars = "ABCDEF0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Rota para verificar se dispositivo está cadastrado
// ✅ Rota para verificar se dispositivo está cadastrado
// ✅ Rota para buscar mídias de um painel (VERSÃO FINAL CORRIGIDA)
// ✅ Rota para buscar mídias de um painel (CORRIGIDA COM MAIÚSCULAS)
router.get("/painel/:id/midias", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Buscando mídias do painel:", id);
    console.log("🔍 Tipo do ID:", typeof id, "Valor:", id);
    console.log("🔍 ID convertido:", parseInt(id));

    // ✅ Primeiro, verificar se o painel existe
    const painelExiste = await prisma.panel.findFirst({
      where: { id: parseInt(id) },
    });

    console.log("📋 Painel existe?", painelExiste ? "SIM" : "NÃO");
    if (painelExiste) {
      console.log("📋 Dados do painel:", painelExiste);
    }

    // ✅ Buscar todas as relações PanelMedias para este painel - CORRIGIDO
    console.log("🔍 Buscando relações PanelMedias...");
    const panelMedias = await prisma.panelMedia.findMany({
      where: {
        panelId: parseInt(id),
      },
      include: {
        media: true, // ✅ Relacionamento com medias
        panel: {
          // ✅ Relacionamento com panel
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("📋 Total de PanelMedias encontrados:", panelMedias.length);
    console.log("📋 PanelMedias RAW:", JSON.stringify(panelMedias, null, 2));

    if (panelMedias.length === 0) {
      console.log("❌ Nenhuma mídia encontrada para o painel");

      return res.json({
        panelId: parseInt(id),
        panelName: painelExiste?.name || "Painel",
        midias: [],
      });
    }

    // ✅ Mapear as mídias - CORRIGIDO
    const midias = panelMedias.map((pm, index) => {
      console.log(`📋 Processando mídia ${index + 1}:`, pm.media); // ✅ Relacionamento com medias
      return {
        id: pm.media.id, // ✅ Relacionamento com medias
        title: pm.media.title, // ✅ Relacionamento com medias
        url: pm.media.url, // ✅ Relacionamento com medias
        type: pm.media.type, // ✅ Relacionamento com medias
        duration: pm.media.type === "PHOTO" ? 10000 : null,
        order: index + 1,
      };
    });

    console.log("✅ Mídias processadas:", midias.length);
    console.log("📋 Mídias finais:", JSON.stringify(midias, null, 2));

    const resposta = {
      panelId: panelMedias[0].panel.id, // ✅ Relacionamento com panel
      panelName: panelMedias[0].panel.name, // ✅ Relacionamento com panel
      midias: midias,
    };

    console.log("📤 Enviando resposta:", JSON.stringify(resposta, null, 2));
    res.json(resposta);
  } catch (error) {
    console.error("❌ Erro ao buscar mídias:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 🔧 ROTA TEMPORÁRIA PARA DEBUG - CORRIGIDA
router.get("/debug/painel/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔧 DEBUG: Verificando painel", id);

    // Verificar painel
    const painel = await prisma.panel.findFirst({
      where: { id: parseInt(id) },
    });

    // Verificar todas as mídias
    const todasMidias = await prisma.medias.findMany();

    // Verificar todas as relações PanelMedias - ✅ CORRIGIDO
    const todasRelacoes = await prisma.panelMedia.findMany({
      include: {
        media: true, // ✅ Relacionamento com medias
        panel: true, // ✅ Relacionamento com panel
      },
    });

    // Verificar relações específicas deste painel - ✅ CORRIGIDO
    const relacoesPainel = await prisma.panelMedia.findMany({
      where: { panelId: parseInt(id) },
      include: {
        media: true, // ✅ Relacionamento com medias
        panel: true, // ✅ Relacionamento com panel
      },
    });

    res.json({
      painel: painel,
      totalMidias: todasMidias.length,
      midias: todasMidias,
      totalRelacoes: todasRelacoes.length,
      todasRelacoes: todasRelacoes,
      relacoesDoPainel: relacoesPainel,
    });
  } catch (error) {
    console.error("❌ Erro no debug:", error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar configurações do painel de um usuário
router.get("/painel/:panelId/config", authenticateToken, async (req, res) => {
  const panelId = parseInt(req.params.panelId);

  try {
    console.log("=== BUSCANDO CONFIGURAÇÕES DO PAINEL ===");
    const panel = await prisma.panel.findFirst({
      where: {
        id: panelId,
        userId: req.user.id, // Garante que o painel pertence ao usuário autenticado
      },
      select: {
        id: true,
        name: true,
        title: true,
        type: true,
        layout: true,
        rssEnabled: true,
        rssConfig: true,
        weatherEnabled: true,
        weatherConfig: true,
        medias: {
          select: {
            id: true,
            title: true,
            url: true,
            type: true,
          },
        },
      },
    });

    if (!panel) {
      return res.status(404).json({ error: "Painel não encontrado." });
    }

    console.log("✅ Configurações do painel recuperadas:", panel);
    res.status(200).json(panel);
  } catch (error) {
    console.error("❌ Erro ao buscar configurações do painel:", error);
    res.status(500).json({ error: "Erro ao buscar configurações do painel." });
  }
});

//Rota para processar URLs de feeds RSS imediatamente ou com as configurações salvas no painel
router.get("/rss/fetch", authenticateToken, async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ error: "É necessário informar uma URL do feed RSS." });
  }

  try {
    console.log("=== PROCESSANDO RSS ===");
    const feed = await rssParser.parseURL(url);

    const articles = feed.items.map((item) => ({
      title: item.title,
      description: item.contentSnippet || item.description,
      link: item.link,
      publishedAt: item.isoDate || item.pubDate,
    }));

    res.json(articles);
  } catch (error) {
    console.error("❌ Erro ao processar RSS:", error);
    res.status(500).json({ error: "Não foi possível processar o feed RSS." });
  }
});

// Rota para trazer todas as midias relacionadas ao usuário autenticado
router.get("/medias", authenticateToken, async (req, res) => {
  try {
    console.log("=== BUSCANDO TODAS AS MIDIAS ===");
    const userId = req.user.id; // Obtém o ID do usuário do token autenticado

    const medias = await prisma.medias.findMany({
      where: {
        panel: {
          // <--- Acesso a relação 'panel' da Mídia
          userId: userId, // <--- Filtra os painéis pelo 'userId' do usuário logado
        },
      },
      select: {
        // Seleciona apenas os campos que você deseja retornar
        id: true,
        title: true,
        url: true,
        type: true,
        duration: true,
        createdAt: true,
        updatedAt: true,
        panel: {
          // Opcional: Incluir detalhes do painel
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("✅ Todas as midias recuperadas:", medias);
    res.status(200).json(medias);
  } catch (error) {
    console.error("❌ Erro ao buscar todas as midias:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao buscar mídias." });
  }
});

router.get("/custom-screens", authenticateToken, async (req, res) => {
  try {
    const customScreens = await prisma.customScreen.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(customScreens);
  } catch (error) {
    console.error("❌ Erro ao listar telas personalizadas:", error);
    res.status(500).json({ error: "Erro ao listar telas personalizadas." });
  }
});

// Rota para criar uma nova tela personalizada
router.post("/custom-screens", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Título da tela personalizada é obrigatório" });
    }
    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "Conteúdo da tela personalizada é obrigatório" });
    }

    const customScreen = await prisma.customScreen.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        userId: req.user.id,
      },
    });

    console.log("✅ Tela personalizada criada:", customScreen);
    res.status(201).json(customScreen);
  } catch (error) {
    console.error("❌ Erro ao criar tela personalizada:", error);
    res
      .status(500)
      .json({ error: "Erro ao criar tela personalizada: " + error.message });
  }
});

// Rota para atualizar uma tela personalizada
router.put("/custom-screens/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Título da tela personalizada é obrigatório" });
    }
    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "Conteúdo da tela personalizada é obrigatório" });
    }

    const customScreen = await prisma.customScreen.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!customScreen) {
      return res
        .status(404)
        .json({
          error:
            "Tela personalizada não encontrada ou não pertence ao usuário.",
        });
    }

    const updatedCustomScreen = await prisma.customScreen.update({
      where: { id: parseInt(id) },
      data: { title: title.trim(), content: content.trim() },
    });

    console.log("✅ Tela personalizada atualizada:", updatedCustomScreen);
    res.status(200).json(updatedCustomScreen);
  } catch (error) {
    console.error("❌ Erro ao atualizar tela personalizada:", error);
    res
      .status(500)
      .json({
        error: "Erro ao atualizar tela personalizada: " + error.message,
      });
  }
});

// Rota para excluir uma tela personalizada
router.delete("/custom-screens/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const customScreen = await prisma.customScreen.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!customScreen) {
      return res
        .status(404)
        .json({
          error:
            "Tela personalizada não encontrada ou não pertence ao usuário.",
        });
    }

    await prisma.customScreen.delete({
      where: { id: parseInt(id) },
    });

    console.log("✅ Tela personalizada excluída:", id);
    res
      .status(200)
      .json({ message: "Tela personalizada excluída com sucesso." });
  } catch (error) {
    console.error("❌ Erro ao excluir tela personalizada:", error);
    res
      .status(500)
      .json({ error: "Erro ao excluir tela personalizada: " + error.message });
  }
});

// Exporta as rotas definidas para serem usadas em outros arquivos
// Rota para buscar perfil do usuário autenticado
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        Active: true,
        dateCreated: true,
        picture: true  // Adicionar este campo
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ===== ROTAS DE ADMINISTRAÇÃO =====

// Middleware para verificar se o usuário é admin
function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta funcionalidade." });
  }
  next();
}

// Rota para listar todos os usuários (apenas admin)
router.get("/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        panels: {
          include: {
            devices: true,
            Media: true,
            medias: true,
            _count: {
              select: {
                devices: true,
                Media: true,
                medias: true
              }
            }
          }
        },
        clients: true,
        CustomScreen: true,
        _count: {
          select: {
            panels: true,
            clients: true,
            CustomScreen: true
          }
        }
      },
      orderBy: {
        dateCreated: 'desc'
      }
    });

    // Calcular estatísticas para cada usuário
    const usersWithStats = users.map(user => {
      const totalDevices = user.panels.reduce((acc, panel) => acc + panel._count.devices, 0);
      const totalMedias = user.panels.reduce((acc, panel) => acc + (panel._count.Media || 0) + (panel._count.medias || 0), 0);
      const onlineDevices = user.panels.reduce((acc, panel) => 
        acc + panel.devices.filter(device => device.statusDevice === true).length, 0
      );
      
      // Coletar todas as mídias do usuário
      const allMedias = user.panels.reduce((acc, panel) => {
        const panelMedias = panel.Media || [];
        const panelMediasOld = panel.medias || [];
        return [...acc, ...panelMedias, ...panelMediasOld];
      }, []);

      return {
        ...user,
        allMedias: allMedias,
        stats: {
          totalPanels: user._count.panels,
          totalDevices,
          onlineDevices,
          totalMedias,
          totalClients: user._count.clients,
          totalCustomScreens: user._count.CustomScreen
        }
      };
    });

    res.json(usersWithStats);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar dados detalhados de um usuário específico (apenas admin)
router.get("/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        panels: {
          include: {
            devices: true,
            medias: true,
            Media: true,
            _count: {
              select: {
                Media: true,
                medias: true
              }
            }
          }
        },
        clients: {
          include: {
            campaigns: true
          }
        },
        CustomScreen: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Coletar todas as mídias do usuário com informações do painel
    const allMedias = user.panels.reduce((acc, panel) => {
      const panelMedias = (panel.Media || []).map(media => ({
        ...media,
        panelName: panel.name,
        panelId: panel.id
      }));
      const panelMediasOld = (panel.medias || []).map(media => ({
        ...media,
        panelName: panel.name,
        panelId: panel.id
      }));
      return [...acc, ...panelMedias, ...panelMediasOld];
    }, []);

    // Adicionar as mídias ao objeto do usuário
    const userWithMedias = {
      ...user,
      allMedias: allMedias
    };

    res.json(userWithMedias);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para atualizar dados de um usuário específico (apenas admin)
router.put("/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, cpfCNPJ, picture, password, Active, bloqued, isAdmin } = req.body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar se o email já está sendo usado por outro usuário
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: "Este email já está sendo usado por outro usuário" });
      }
    }

    // Preparar dados para atualização
    const updateData = {
      name: name || existingUser.name,
      email: email || existingUser.email,
      cpfCNPJ: cpfCNPJ !== undefined ? cpfCNPJ : existingUser.cpfCNPJ,
      picture: picture !== undefined ? picture : existingUser.picture,
      Active: Active !== undefined ? Active : existingUser.Active,
      bloqued: bloqued !== undefined ? bloqued : existingUser.bloqued,
      isAdmin: isAdmin !== undefined ? isAdmin : existingUser.isAdmin
    };

    // Criptografar nova senha se fornecida
    if (password && password.trim()) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        cpfCNPJ: true,
        picture: true,
        Active: true,
        bloqued: true,
        isAdmin: true,
        dateCreated: true
      }
    });

    console.log(`Usuário ${userId} atualizado pelo admin ${req.user.id}`);
    res.json({ 
      message: "Usuário atualizado com sucesso", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para estatísticas gerais do sistema (apenas admin)
router.get("/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalPanels, totalDevices, totalMedias, totalClients, totalCampaigns, onlineDevices] = await Promise.all([
      prisma.user.count(),
      prisma.panel.count(),
      prisma.device.count(),
      prisma.medias.count(),
      prisma.clients.count(),
      prisma.campaign.count(),
      prisma.device.count({ where: { statusDevice: true } })
    ]);

    const activeUsers = await prisma.user.count({ where: { Active: true } });
    const adminUsers = await prisma.user.count({ where: { isAdmin: true } });
    const activePanels = await prisma.panel.count({ where: { active: true } });
    const activeCampaigns = await prisma.campaign.count({ where: { active: true } });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers
      },
      panels: {
        total: totalPanels,
        active: activePanels
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: totalDevices - onlineDevices
      },
      medias: {
        total: totalMedias
      },
      clients: {
        total: totalClients
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      }
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rotas para exclusões em massa (apenas para admins)
router.delete("/admin/bulk-delete/panels", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedPanels = await prisma.panel.deleteMany({});
    
    res.json({
      success: true,
      message: "Todos os painéis foram excluídos com sucesso",
      deletedCount: deletedPanels.count
    });
  } catch (error) {
    console.error("Erro ao excluir painéis:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir painéis"
    });
  }
});

router.delete("/admin/bulk-delete/devices", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedDevices = await prisma.device.deleteMany({});
    
    res.json({
      success: true,
      message: "Todos os dispositivos foram excluídos com sucesso",
      deletedCount: deletedDevices.count
    });
  } catch (error) {
    console.error("Erro ao excluir dispositivos:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir dispositivos"
    });
  }
});

router.delete("/admin/bulk-delete/medias", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Primeiro, buscar todas as mídias para excluir os arquivos físicos
    const medias = await prisma.medias.findMany();
    
    // Excluir arquivos físicos
    for (const media of medias) {
      if (media.filePath && fs.existsSync(media.filePath)) {
        try {
          fs.unlinkSync(media.filePath);
        } catch (fileError) {
          console.warn(`Erro ao excluir arquivo ${media.filePath}:`, fileError);
        }
      }
    }
    
    // Excluir registros do banco
    const deletedMedias = await prisma.medias.deleteMany({});
    
    res.json({
      success: true,
      message: "Todas as mídias foram excluídas com sucesso",
      deletedCount: deletedMedias.count
    });
  } catch (error) {
    console.error("Erro ao excluir mídias:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir mídias"
    });
  }
});

router.delete("/admin/bulk-delete/clients", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Primeiro excluir campanhas relacionadas
    await prisma.campaign.deleteMany({});
    await prisma.campaignValue.deleteMany({});
    
    // Depois excluir clientes
    const deletedClients = await prisma.client.deleteMany({});
    
    res.json({
      success: true,
      message: "Todos os clientes foram excluídos com sucesso",
      deletedCount: deletedClients.count
    });
  } catch (error) {
    console.error("Erro ao excluir clientes:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir clientes"
    });
  }
});

router.delete("/admin/bulk-delete/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Excluir apenas usuários não-administradores
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isAdmin: false
      }
    });
    
    res.json({
      success: true,
      message: "Todos os usuários não-administradores foram excluídos com sucesso",
      deletedCount: deletedUsers.count
    });
  } catch (error) {
    console.error("Erro ao excluir usuários:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir usuários"
    });
  }
});

// Configuração do multer para avatar do usuário
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.id;
    const uploadPath = `./public/img/${userId}`;

    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, `avatar${extension}`);
  },
});

// Filtro para tipos de imagem apenas
const avatarFileFilter = (req, file, cb) => {
  const allowedTypes = {
    "image/jpeg": true,
    "image/jpg": true,
    "image/png": true,
    "image/gif": true,
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos"), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Rota para upload de avatar do usuário
router.post("/upload-avatar", authenticateToken, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    // Construir URL pública do avatar (será servida pelo Apache)
    const avatarUrl = `/img/${userId}/${req.file.filename}`;
    
    // Atualizar o campo picture do usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { picture: avatarUrl },
    });

    console.log("✅ Avatar atualizado com sucesso:", avatarUrl);

    res.status(200).json({
      message: "Avatar atualizado com sucesso!",
      avatarUrl: avatarUrl,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        picture: updatedUser.picture,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload do avatar:", error);
    res.status(500).json({ error: "Erro ao fazer upload do avatar" });
  }
});

// Rota para excluir usuário individual (apenas para admins)
router.delete("/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Verificar se o usuário existe e não é admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ error: "Não é possível excluir usuários administradores" });
    }
    
    // Buscar todos os painéis do usuário
    const userPanels = await prisma.panel.findMany({
      where: { userId: userId },
      select: { id: true }
    });
    
    const panelIds = userPanels.map(panel => panel.id);
    
    // Buscar todas as mídias dos painéis do usuário para excluir arquivos físicos
    const userMedias = await prisma.medias.findMany({
      where: { panelId: { in: panelIds } }
    });
    
    // Excluir arquivos físicos das mídias
    for (const media of userMedias) {
      if (media.url && fs.existsSync(media.url)) {
        try {
          fs.unlinkSync(media.url);
        } catch (fileError) {
          console.warn(`Erro ao excluir arquivo ${media.url}:`, fileError);
        }
      }
    }
    
    // Excluir em cascata: primeiro PanelMedia, depois mídias, dispositivos, painéis e usuário
    if (panelIds.length > 0) {
      await prisma.panelMedia.deleteMany({ where: { panelId: { in: panelIds } } });
      await prisma.medias.deleteMany({ where: { panelId: { in: panelIds } } });
    }
    await prisma.device.deleteMany({ where: { panelId: { in: panelIds } } });
    await prisma.customScreen.deleteMany({ where: { userId: userId } });
    await prisma.panel.deleteMany({ where: { userId: userId } });
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({
      success: true,
      message: "Usuário e todos os dados relacionados foram excluídos com sucesso"
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor ao excluir usuário"
    });
  }
});

// ===== ROTAS DE TÍTULOS FINANCEIROS =====

// Rota para listar títulos financeiros de um usuário
router.get("/admin/users/:userId/financial-titles", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Atualizar títulos vencidos antes de buscar
    await updateOverdueTitles(userId);
    
    // Buscar títulos atualizados
    const titles = await prisma.financialTitle.findMany({
      where: {
        userId: parseInt(userId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(titles);
  } catch (error) {
    console.error("Erro ao buscar títulos financeiros:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para criar um novo título financeiro
router.post("/admin/users/:userId/financial-titles", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { description, amount, dueDate } = req.body;
    
    // Validações básicas
    if (!description || !amount || !dueDate) {
      return res.status(400).json({ error: "Descrição, valor e data de vencimento são obrigatórios" });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: "O valor deve ser maior que zero" });
    }
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    const title = await prisma.financialTitle.create({
      data: {
        userId: parseInt(userId),
        description,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: 'PENDING'
      }
    });
    
    res.status(201).json({
      message: "Título financeiro criado com sucesso",
      title
    });
  } catch (error) {
    console.error("Erro ao criar título financeiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para criar títulos financeiros em massa
router.post("/admin/users/:userId/financial-titles/bulk", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { titles } = req.body;
    
    // Validações básicas
    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return res.status(400).json({ error: "Lista de títulos é obrigatória e deve conter pelo menos um item" });
    }
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    // Validar cada título
    for (const title of titles) {
      if (!title.description || !title.amount || !title.dueDate) {
        return res.status(400).json({ error: "Todos os títulos devem ter descrição, valor e data de vencimento" });
      }
      
      if (title.amount <= 0) {
        return res.status(400).json({ error: "O valor deve ser maior que zero" });
      }
    }
    
    // Criar títulos em massa usando createMany
    const titlesData = titles.map(title => ({
      userId: parseInt(userId),
      description: title.description,
      amount: parseFloat(title.amount),
      dueDate: new Date(title.dueDate),
      status: 'PENDING'
    }));
    
    const result = await prisma.financialTitle.createMany({
      data: titlesData
    });
    
    res.status(201).json({
      message: `${result.count} títulos financeiros criados com sucesso`,
      count: result.count
    });
  } catch (error) {
    console.error("Erro ao criar títulos financeiros em massa:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para gerar PIX via PagSeguro
router.post("/admin/financial-titles/:titleId/generate-pix", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { titleId } = req.params;
    
    // Atualizar títulos vencidos antes de processar
    await updateOverdueTitles();
    
    // Buscar o título financeiro
    const title = await prisma.financialTitle.findUnique({
      where: { id: parseInt(titleId) },
      include: { user: true }
    });
    
    if (!title) {
      return res.status(404).json({ error: "Título financeiro não encontrado" });
    }
    
    // Permitir gerar PIX para títulos PENDING ou OVERDUE
    if (title.status === 'PAID') {
      return res.status(400).json({ error: "Título já foi pago" });
    }
    
    if (title.status === 'CANCELLED') {
      return res.status(400).json({ error: "Não é possível gerar PIX para título cancelado" });
    }
    
    // Configuração do PagSeguro
    const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN; // Seu token de acesso
    const PAGSEGURO_EMAIL = process.env.PAGSEGURO_EMAIL; // Seu email do PagSeguro
    const IS_SANDBOX = process.env.NODE_ENV !== 'production';
    const SIMULATE_PAGSEGURO = process.env.PAGSEGURO_SIMULATE === 'true';
    const BASE_URL = IS_SANDBOX ? 'https://sandbox.api.pagseguro.com' : 'https://api.pagseguro.com';
    
    // Modo simulação para desenvolvimento (contorna limitação de whitelist)
    if (SIMULATE_PAGSEGURO) {
      console.log('Modo simulação ativado - gerando PIX fictício');
      
      // Gerar código PIX fictício mas válido
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}520400005303986540${title.amount.toFixed(2).replace('.', '')}5802BR5925SIMULACAO PAGSEGURO6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const qrCodeUrl = `https://via.placeholder.com/300x300/000000/FFFFFF?text=PIX+QR+CODE+SIMULADO`;
      const simulatedOrderId = `ORDE_SIM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Atualizar o título com os dados simulados
      const updatedTitle = await prisma.financialTitle.update({
        where: { id: parseInt(titleId) },
        data: {
          pixCode,
          pixQrCode: qrCodeUrl,
          pagseguroId: simulatedOrderId,
          pagseguroStatus: 'WAITING_PAYMENT'
        }
      });
      
      return res.json({
        message: "PIX gerado com sucesso (SIMULAÇÃO)",
        pixCode,
        qrCode: qrCodeUrl,
        title: updatedTitle,
        pagseguroOrderId: simulatedOrderId,
        simulation: true
      });
    }
    
    if (!PAGSEGURO_TOKEN) {
      return res.status(500).json({ error: "Token do PagSeguro não configurado" });
    }
    
    // Preparar dados para a API do PagSeguro
    const orderData = {
      reference_id: `TITLE_${titleId}`,
      customer: {
        name: title.user.name || 'Cliente',
        email: title.user.email,
        tax_id: '12345678909', // CPF fictício - você deve coletar o CPF real
        phones: [{
          type: 'MOBILE',
          country: '55',
          area: '11',
          number: '999999999' // Telefone fictício - você deve coletar o telefone real
        }]
      },
      items: [{
        name: title.description,
        quantity: 1,
        unit_amount: Math.round(title.amount * 100) // Valor em centavos
      }],
      qr_codes: [{
        amount: {
          value: Math.round(title.amount * 100) // Valor em centavos
        },
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      }],
      notification_urls: [
        `${req.protocol}://${req.get('host')}/webhook/pagseguro/financial-title`
      ]
    };
    
    // Fazer requisição para a API do PagSeguro usando fetch ou alternativa
    let response;
    try {
      // Tentar usar fetch nativo (Node.js 18+) ou importar node-fetch
      const fetchFunction = globalThis.fetch || (await import('node-fetch')).default;
      response = await fetchFunction(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAGSEGURO_TOKEN}`,
          'x-api-version': '4.0'
        },
        body: JSON.stringify(orderData)
      });
    } catch (fetchError) {
      console.error('Erro ao fazer requisição HTTP:', fetchError);
      return res.status(500).json({ error: "Erro de conectividade com PagSeguro" });
    }
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro na API do PagSeguro:', errorData);
      return res.status(500).json({ error: "Erro ao gerar PIX no PagSeguro" });
    }
    
    const pagseguroResponse = await response.json();
    
    // Extrair dados do PIX da resposta
    const qrCode = pagseguroResponse.qr_codes?.[0];
    if (!qrCode) {
      return res.status(500).json({ error: "Erro ao obter dados do PIX" });
    }
    
    const pixCode = qrCode.text;
    const qrCodeImageUrl = qrCode.links?.find(link => link.rel === 'QRCODE.PNG')?.href;
    
    // Atualizar o título com os dados do PIX
    const updatedTitle = await prisma.financialTitle.update({
      where: { id: parseInt(titleId) },
      data: {
        pixCode,
        pixQrCode: qrCodeImageUrl,
        pagseguroId: pagseguroResponse.id,
        pagseguroStatus: 'WAITING_PAYMENT'
      }
    });
    
    res.json({
      message: "PIX gerado com sucesso",
      pixCode,
      qrCode: qrCodeImageUrl,
      title: updatedTitle,
      pagseguroOrderId: pagseguroResponse.id
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para atualizar status do título (webhook do PagSeguro)
router.post("/webhook/pagseguro/financial-title", async (req, res) => {
  try {
    const notificationData = req.body;
    
    // Log para debug
    console.log('Webhook PagSeguro recebido:', JSON.stringify(notificationData, null, 2));
    
    // Extrair dados da notificação
    const orderId = notificationData.id || notificationData.order_id;
    const charges = notificationData.charges || [];
    
    if (!orderId) {
      console.error('ID do pedido não encontrado na notificação');
      return res.status(400).json({ error: "ID do pedido não encontrado" });
    }
    
    // Buscar o título pelo ID do PagSeguro
    const title = await prisma.financialTitle.findFirst({
      where: { pagseguroId: orderId }
    });
    
    if (!title) {
      console.error(`Título não encontrado para o ID: ${orderId}`);
      return res.status(404).json({ error: "Título não encontrado" });
    }
    
    // Determinar o status baseado nas charges
    let newStatus = 'PENDING';
    let pagseguroStatus = 'WAITING_PAYMENT';
    
    if (charges.length > 0) {
      const charge = charges[0];
      pagseguroStatus = charge.status;
      
      // Mapear status do PagSeguro para nosso sistema
      switch (charge.status) {
        case 'PAID':
        case 'AUTHORIZED':
          newStatus = 'PAID';
          break;
        case 'CANCELED':
        case 'DECLINED':
          newStatus = 'CANCELLED';
          break;
        case 'WAITING':
        case 'IN_ANALYSIS':
          newStatus = 'PENDING';
          break;
        default:
          newStatus = 'PENDING';
      }
    }
    
    // Atualizar o título
    await prisma.financialTitle.update({
      where: { id: title.id },
      data: {
        status: newStatus,
        pagseguroStatus: pagseguroStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null
      }
    });
    
    console.log(`Título ${title.id} atualizado para status: ${newStatus}`);
    
    res.json({ message: "Status atualizado com sucesso" });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para baixa manual de um título financeiro
router.post("/admin/users/:userId/financial-titles/:titleId/manual-payment", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, titleId } = req.params;
    const { paymentMethod, paymentDate, notes } = req.body;
    
    // Atualizar títulos vencidos antes de processar
    await updateOverdueTitles();
    
    // Validações básicas
    if (!paymentMethod || !paymentDate) {
      return res.status(400).json({ error: "Forma de pagamento e data são obrigatórios" });
    }
    
    // Verificar se o título existe e pertence ao usuário
    const title = await prisma.financialTitle.findFirst({
      where: {
        id: parseInt(titleId),
        userId: parseInt(userId)
      }
    });
    
    if (!title) {
      return res.status(404).json({ error: "Título financeiro não encontrado" });
    }
    
    // Permitir baixa manual para títulos PENDING, OVERDUE ou até mesmo PAID (reprocessamento)
    if (title.status === 'CANCELLED') {
      return res.status(400).json({ error: "Não é possível processar pagamento de um título cancelado" });
    }
    
    // Atualizar o título para pago
    const updatedTitle = await prisma.financialTitle.update({
      where: { id: parseInt(titleId) },
      data: {
        status: 'PAID',
        paidAt: new Date(paymentDate)
      }
    });
    
    res.json({
      message: "Baixa manual processada com sucesso",
      title: updatedTitle
    });
  } catch (error) {
    console.error("Erro ao processar baixa manual:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para cancelar um título financeiro
router.delete("/admin/financial-titles/:titleId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { titleId } = req.params;
    
    const title = await prisma.financialTitle.findUnique({
      where: { id: parseInt(titleId) }
    });
    
    if (!title) {
      return res.status(404).json({ error: "Título financeiro não encontrado" });
    }
    
    // Permitir cancelar títulos em qualquer status (PENDING, OVERDUE ou PAID)
    
    await prisma.financialTitle.update({
      where: { id: parseInt(titleId) },
      data: {
        status: 'CANCELLED'
      }
    });
    
    res.json({ message: "Título financeiro cancelado com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar título:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para atualizar títulos vencidos globalmente (pode ser chamada por cron job)
router.post("/admin/financial-titles/update-overdue", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await updateOverdueTitles();
    
    // Contar quantos títulos foram atualizados
    const overdueCount = await prisma.financialTitle.count({
      where: {
        status: 'OVERDUE'
      }
    });
    
    res.json({
      message: "Títulos vencidos atualizados com sucesso",
      overdueCount
    });
  } catch (error) {
    console.error("Erro ao atualizar títulos vencidos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para testar bloqueio de usuários com títulos vencidos há mais de 3 dias
router.post("/admin/test-block-overdue-users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 Teste manual: Verificando usuários com títulos vencidos há mais de 3 dias...');
    
    // Data atual menos 3 dias
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Buscar títulos vencidos há mais de 3 dias que ainda não foram pagos
    const overdueFinancialTitles = await prisma.financialTitle.findMany({
      where: {
        dueDate: {
          lt: threeDaysAgo
        },
        status: {
          in: ['PENDING', 'OVERDUE']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bloqued: true
          }
        }
      }
    });
    
    if (overdueFinancialTitles.length === 0) {
      return res.json({
        message: "Nenhum usuário encontrado com títulos vencidos há mais de 3 dias",
        blockedUsersCount: 0,
        overdueTitlesCount: 0,
        details: []
      });
    }
    
    // Obter IDs únicos dos usuários com títulos vencidos
    const userIdsToBlock = [...new Set(overdueFinancialTitles.map(title => title.userId))];
    
    // Bloquear usuários que ainda não estão bloqueados
    const blockedUsers = await prisma.user.updateMany({
      where: {
        id: {
          in: userIdsToBlock
        },
        bloqued: false // Só bloquear se ainda não estiver bloqueado
      },
      data: {
        bloqued: true
      }
    });
    
    // Preparar detalhes para resposta
    const userDetails = userIdsToBlock.map(userId => {
      const userTitles = overdueFinancialTitles.filter(title => title.userId === userId);
      const user = userTitles[0].user;
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        wasAlreadyBlocked: user.bloqued,
        overdueTitlesCount: userTitles.length,
        oldestDueDate: new Date(Math.min(...userTitles.map(title => new Date(title.dueDate).getTime()))).toISOString().split('T')[0]
      };
    });
    
    res.json({
      message: "Verificação de bloqueio executada com sucesso",
      blockedUsersCount: blockedUsers.count,
      overdueTitlesCount: overdueFinancialTitles.length,
      totalUsersWithOverdueTitles: userIdsToBlock.length,
      details: userDetails
    });
    
  } catch (error) {
    console.error("Erro ao testar bloqueio de usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para formulário de contato da landing page
router.post("/contact", async (req, res) => {
  try {
    const { nome, email, empresa, telefone, mensagem } = req.body;
    
    // Validação básica
    if (!nome || !email || !empresa || !telefone || !mensagem) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }
    
    // Configurar email
    const mailOptions = {
      from: 'admin@altersoft.dev.br',
      to: 'admin@altersoft.dev.br', // Email de destino
      subject: `Novo contato da Landing Page - ${empresa}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Novo Contato - VixMidia
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informações do Contato:</h3>
            
            <p><strong>Nome:</strong> ${nome}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Empresa:</strong> ${empresa}</p>
            <p><strong>Telefone:</strong> ${telefone}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
            <p style="line-height: 1.6; color: #555;">${mensagem}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 8px;">
            <p style="margin: 0; color: #0066cc; font-size: 14px;">
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      `
    };
    
    // Enviar email
    await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email de contato enviado de: ${email} (${nome})`);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de contato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor. Tente novamente mais tarde.'
    });
  }
});

// ==================== ROTAS PARA MÍDIAS GLOBAIS ====================

// Middleware para verificar se o usuário é admin
async function checkAdminUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas usuários administradores podem gerenciar mídias globais.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Listar todas as mídias globais (apenas admin)
router.get('/global-medias', authenticateToken, checkAdminUser, async (req, res) => {
  try {
    // Primeiro, desativar mídias expiradas
    const now = new Date();
    await prisma.globalMedias.updateMany({
      where: {
        dateExpire: {
          lte: now
        },
        active: true
      },
      data: {
        active: false
      }
    });
    
    const globalMedias = await prisma.globalMedias.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(globalMedias);
  } catch (error) {
    console.error('Erro ao listar mídias globais:', error);
    res.status(500).json({ error: 'Erro ao listar mídias globais' });
  }
});

// Criar nova mídia global (apenas admin)
router.post('/global-medias', authenticateToken, checkAdminUser, async (req, res) => {
  try {
    const { title, url, type, duration, description, category, active, dateExpire } = req.body;
    
    if (!title || !url || !type || !category) {
      return res.status(400).json({ 
        error: 'Título, URL, tipo e categoria são obrigatórios' 
      });
    }
    
    const globalMedia = await prisma.globalMedias.create({
      data: {
        title,
        url,
        type,
        category,
        duration: duration ? parseInt(duration) : null,
        description,
        dateExpire: dateExpire ? new Date(dateExpire) : null,
        active: active !== undefined ? active : true
      }
    });
    
    res.status(201).json(globalMedia);
  } catch (error) {
    console.error('Erro ao criar mídia global:', error);
    res.status(500).json({ error: 'Erro ao criar mídia global' });
  }
});

// Buscar mídia global por ID (apenas admin)
router.get('/global-medias/:id', authenticateToken, checkAdminUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const globalMedia = await prisma.globalMedias.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!globalMedia) {
      return res.status(404).json({ error: 'Mídia global não encontrada' });
    }
    
    res.json(globalMedia);
  } catch (error) {
    console.error('Erro ao buscar mídia global:', error);
    res.status(500).json({ error: 'Erro ao buscar mídia global' });
  }
});

// Atualizar mídia global (apenas admin)
router.put('/global-medias/:id', authenticateToken, checkAdminUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, type, duration, description, category, active, dateExpire } = req.body;
    
    const globalMedia = await prisma.globalMedias.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(type && { type }),
        ...(category && { category }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(description !== undefined && { description }),
        ...(dateExpire !== undefined && { dateExpire: dateExpire ? new Date(dateExpire) : null }),
        ...(active !== undefined && { active })
      }
    });
    
    res.json(globalMedia);
  } catch (error) {
    console.error('Erro ao atualizar mídia global:', error);
    res.status(500).json({ error: 'Erro ao atualizar mídia global' });
  }
});

// Excluir mídia global (apenas admin)
router.delete('/global-medias/:id', authenticateToken, checkAdminUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primeiro, remover todas as associações com painéis
    await prisma.panelGlobalMedias.deleteMany({
      where: { globalMediaId: parseInt(id) }
    });
    
    // Depois, excluir a mídia global
    await prisma.globalMedias.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Mídia global excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mídia global:', error);
    res.status(500).json({ error: 'Erro ao excluir mídia global' });
  }
});

// ==================== ROTAS PARA ASSOCIAÇÃO DE MÍDIAS GLOBAIS ====================

// Listar mídias globais disponíveis para associação (qualquer usuário autenticado)
router.get('/available-global-medias', authenticateToken, async (req, res) => {
  try {
    // Primeiro, desativar mídias expiradas
    const now = new Date();
    await prisma.globalMedias.updateMany({
      where: {
        dateExpire: {
          lte: now
        },
        active: true
      },
      data: {
        active: false
      }
    });
    
    const globalMedias = await prisma.globalMedias.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        url: true,
        type: true,
        category: true,
        duration: true,
        description: true,
        createdAt: true,
        dateExpire: true
      },
      orderBy: { title: 'asc' }
    });
    
    res.json(globalMedias);
  } catch (error) {
    console.error('Erro ao listar mídias globais disponíveis:', error);
    res.status(500).json({ error: 'Erro ao listar mídias globais disponíveis' });
  }
});

// Associar mídia global a um painel
router.post('/panels/:panelId/associate-global-media', authenticateToken, async (req, res) => {
  try {
    const { panelId } = req.params;
    const { globalMediaId } = req.body;
    
    // Verificar se o painel pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: parseInt(panelId),
        userId: req.user.id
      }
    });
    
    if (!panel) {
      return res.status(404).json({ error: 'Painel não encontrado ou não pertence ao usuário' });
    }
    
    // Verificar se a mídia global existe
    const globalMedia = await prisma.globalMedias.findUnique({
      where: { id: parseInt(globalMediaId) }
    });
    
    if (!globalMedia) {
      return res.status(404).json({ error: 'Mídia global não encontrada' });
    }
    
    // Verificar se a associação já existe
    const existingAssociation = await prisma.panelGlobalMedias.findUnique({
      where: {
        panelId_globalMediaId: {
          panelId: parseInt(panelId),
          globalMediaId: parseInt(globalMediaId)
        }
      }
    });
    
    if (existingAssociation) {
      return res.status(400).json({ error: 'Mídia global já está associada a este painel' });
    }
    
    // Criar a associação
    const association = await prisma.panelGlobalMedias.create({
      data: {
        panelId: parseInt(panelId),
        globalMediaId: parseInt(globalMediaId)
      }
    });
    
    res.status(201).json({ message: 'Mídia global associada com sucesso', association });
  } catch (error) {
    console.error('Erro ao associar mídia global:', error);
    res.status(500).json({ error: 'Erro ao associar mídia global' });
  }
});

// Desassociar mídia global de um painel
router.delete('/panels/:panelId/disassociate-global-media/:globalMediaId', authenticateToken, async (req, res) => {
  try {
    const { panelId, globalMediaId } = req.params;
    
    // Verificar se o painel pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: parseInt(panelId),
        userId: req.user.id
      }
    });
    
    if (!panel) {
      return res.status(404).json({ error: 'Painel não encontrado ou não pertence ao usuário' });
    }
    
    // Remover a associação
    await prisma.panelGlobalMedias.delete({
      where: {
        panelId_globalMediaId: {
          panelId: parseInt(panelId),
          globalMediaId: parseInt(globalMediaId)
        }
      }
    });
    
    res.json({ message: 'Mídia global desassociada com sucesso' });
  } catch (error) {
    console.error('Erro ao desassociar mídia global:', error);
    res.status(500).json({ error: 'Erro ao desassociar mídia global' });
  }
});

// Listar mídias globais associadas a um painel
router.get('/panels/:panelId/global-medias', authenticateToken, async (req, res) => {
  try {
    const { panelId } = req.params;
    
    // Verificar se o painel pertence ao usuário
    const panel = await prisma.panel.findFirst({
      where: {
        id: parseInt(panelId),
        userId: req.user.id
      }
    });
    
    if (!panel) {
      return res.status(404).json({ error: 'Painel não encontrado ou não pertence ao usuário' });
    }
    
    const globalMedias = await prisma.panelGlobalMedias.findMany({
      where: { panelId: parseInt(panelId) },
      include: {
        globalMedia: {
          select: {
            id: true,
            title: true,
            url: true,
            type: true,
            duration: true,
            description: true
          }
        }
      }
    });
    
    const result = globalMedias.map(item => ({
      ...item.globalMedia,
      associatedAt: item.associatedAt
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar mídias globais do painel:', error);
    res.status(500).json({ error: 'Erro ao listar mídias globais do painel' });
  }
});

// Rota para logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Adiciona o token à blacklist
      tokenBlacklist.add(token);
    }
    
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Rota para buscar painéis do usuário (versão em inglês)
router.get('/panels', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // ID do usuário obtido do middleware authenticateToken

    // Busca os painéis do usuário
    const panels = await prisma.panel.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        active: true,
        description: true,
        showLottery: true,
        lotteryFrequency: true,
        showCoins: true,
        coinsFrequency: true,
        showCustomScreen: true,
        customScreenFrequency: true,
        customScreenContent: true,
        type: true,
        showNews: true,
        newsFrequency: true,
        showWeather: true,
        weatherFrequency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(panels);
  } catch (err) {
    console.error('Erro ao buscar painéis:', err);
    res.status(500).json({ error: 'Erro ao buscar painéis' });
  }
});

export default router;
//_______________________________________________________________________
