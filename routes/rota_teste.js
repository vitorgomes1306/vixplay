const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Rota pública para obter o painel associado a um dispositivo pela deviceKey
router.get('/public/device/:deviceKey/panel', async (req, res) => {
  try {
    const { deviceKey } = req.params;

    // Buscar o dispositivo pela deviceKey
    const device = await prisma.device.findUnique({
      where: {
        deviceKey: deviceKey,
      },
      include: {
        panel: {
          include: {
            medias: {
              include: {
                media: true, // Inclui os detalhes das mídias associadas ao painel
              },
            },
          },
        },
      },
    });

    // Verificar se o dispositivo foi encontrado
    if (!device) {
      return res.status(404).json({
        error: 'Dispositivo não encontrado com a deviceKey fornecida.',
      });
    }

    // Retornar os dados do painel associado ao dispositivo
    return res.status(200).json({
      message: 'Painel encontrado com sucesso.',
      panel: device.panel,
    });
  } catch (error) {
    console.error('Erro ao buscar painel pelo dispositivo:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor ao buscar o painel.',
    });
  } finally {
    await prisma.$disconnect(); // Garante que a conexão com o banco seja fechada
  }
});

module.exports = router;