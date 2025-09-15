import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Rota pública para verificar se dispositivo está cadastrado
router.get('/device/check/:deviceKey', async (req, res) => {
    try {
        const { deviceKey } = req.params;
        
        console.log('🔍 Verificando dispositivo com chave:', deviceKey);
        
        // Buscar dispositivo pela chave
        const device = await prisma.device.findFirst({
            where: {
                deviceKey: deviceKey
            },
            include: {
                Panel: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        if (device) {
            console.log('✅ Dispositivo encontrado:', device);
            res.json({
                registered: true,
                deviceId: device.id,
                deviceName: device.name,
                panelId: device.panelId,
                panelName: device.Panel?.name || 'Painel'
            });
        } else {
            console.log('❌ Dispositivo não encontrado');
            res.json({
                registered: false
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar dispositivo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ✅ Rota pública para buscar mídias de um painel
router.get('/painel/:id/midias', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🔍 Buscando mídias do painel:', id);
        
        // Verificar se o painel existe
        const painelExiste = await prisma.panel.findFirst({
            where: { id: parseInt(id) }
        });
        
        console.log('📋 Painel existe?', painelExiste ? 'SIM' : 'NÃO');
        
        if (!painelExiste) {
            return res.status(404).json({ error: 'Painel não encontrado' });
        }
        
        // Buscar todas as relações PanelMedia para este painel
        const panelMedias = await prisma.panelMedia.findMany({
            where: {
                panelId: parseInt(id)
            },
            include: {
                Media: true,
                Panel: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        console.log('📋 Total de PanelMedias encontrados:', panelMedias.length);
        
        if (panelMedias.length === 0) {
            console.log('❌ Nenhuma mídia encontrada para o painel');
            
            return res.json({
                panelId: parseInt(id),
                panelName: painelExiste.name || 'Painel',
                midias: []
            });
        }
        
        // Mapear as mídias
        const midias = panelMedias.map((pm, index) => {
            console.log(`📋 Processando mídia ${index + 1}:`, pm.Media);
            return {
                id: pm.Media.id,
                title: pm.Media.title,
                url: pm.Media.url,
                type: pm.Media.type,
                duration: pm.Media.type === 'PHOTO' ? 10000 : null,
                order: index + 1
            };
        });
        
        console.log('✅ Mídias processadas:', midias.length);
        
        const resposta = {
            panelId: panelMedias[0].Panel.id,
            panelName: panelMedias[0].Panel.name,
            midias: midias
        };
        
        console.log('📤 Enviando resposta:', JSON.stringify(resposta, null, 2));
        res.json(resposta);
        
    } catch (error) {
        console.error('❌ Erro ao buscar mídias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ✅ Rota pública para buscar mídias diretamente por deviceKey
router.get('/device/:deviceKey/midias', async (req, res) => {
    try {
        const { deviceKey } = req.params;
        
        console.log('🔍 Buscando mídias para dispositivo:', deviceKey);
        
        // Buscar dispositivo
        const device = await prisma.device.findFirst({
            where: {
                deviceKey: deviceKey
            },
            include: {
                Panel: true
            }
        });
        
        if (!device) {
            console.log('❌ Dispositivo não encontrado');
            return res.status(404).json({ error: 'Dispositivo não encontrado' });
        }
        
        console.log('✅ Dispositivo encontrado:', device.name);
        
        // Buscar mídias do painel
        const panelMedias = await prisma.panelMedia.findMany({
            where: {
                panelId: device.panelId
            },
            include: {
                Media: true
            }
        });
        
        const midias = panelMedias.map((pm, index) => ({
            id: pm.Media.id,
            title: pm.Media.title,
            url: pm.Media.url,
            type: pm.Media.type,
            duration: pm.Media.type === 'PHOTO' ? 10000 : null,
            order: index + 1
        }));
        
        console.log('✅ Mídias encontradas:', midias.length);
        
        res.json({
            deviceId: device.id,
            deviceName: device.name,
            panelId: device.Panel.id,
            panelName: device.Panel.name,
            midias: midias
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar mídias por deviceKey:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
