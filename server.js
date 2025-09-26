import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import path from 'path'; // Adicionar esta importação

import publicRoutes from './routes/public.js';
import privateRoutes from './routes/private.js';
import auth from './middlewares/auth.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta vix-midia
app.use('/vix-midia', express.static(path.join(process.cwd(), 'vix-midia')));

// Adicionar esta linha para servir arquivos estáticos
app.use('/public', express.static('public'));

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Montar rotas públicas (Não requerem autenticação)
app.use('/public', publicRoutes);          // Rotas públicas principais

// Montar rotas privadas (requere autenticação, protegido pelo middleware `auth`)
app.use('/private', auth, privateRoutes);     // Rotas privadas (protegidas)

// Middleware 404 deve vir DEPOIS de todas as rotas
// app.use((req, res) => {
//   console.log(`❌ 404 - Rota não encontrada: ${req.method} ${req.path}`);
//   res.status(404).json({ error: 'Rota não encontrada' });
// });

// Função para verificar títulos vencidos há mais de 3 dias e bloquear usuários
async function checkOverdueUsersAndBlock() {
  try {
    console.log('🔍 Iniciando verificação de usuários com títulos vencidos há mais de 3 dias...');
    
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
        user: true
      }
    });
    
    if (overdueFinancialTitles.length === 0) {
      console.log('✅ Nenhum usuário encontrado com títulos vencidos há mais de 3 dias.');
      return;
    }
    
    // Obter IDs únicos dos usuários com títulos vencidos
    const userIdsToBlock = [...new Set(overdueFinancialTitles.map(title => title.userId))];
    
    // Bloquear usuários
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
    
    console.log(`🔒 ${blockedUsers.count} usuários foram bloqueados por títulos vencidos há mais de 3 dias.`);
    console.log(`📊 Total de títulos vencidos encontrados: ${overdueFinancialTitles.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários com títulos vencidos:', error);
  }
}

// Agendar verificação diária às 10:00
cron.schedule('0 10 * * *', () => {
  console.log('⏰ Executando verificação automática de títulos vencidos às 10:00...');
  checkOverdueUsersAndBlock();
}, {
  timezone: 'America/Sao_Paulo'
});

console.log('📅 Agendamento configurado: Verificação de títulos vencidos todos os dias às 10:00');


// Inicia o servidor
const PORT = process.env.PORT || 4000; // Porta no arquivo .env ou 4000 como padrão
app.listen(PORT, () => console.log(`✅ Servidor VixMIDIA rodando na porta ${PORT}`));