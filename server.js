//
// importações
// 
import express from 'express'; // Importa o Express para criar o servidor web
import publicRoutes from './routes/public.js'; // Importa as rotas públicas
import privateRoutes from './routes/private.js'; // Importa as rotas privadas
import auth from './middlewares/auth.js'; // Importa o middleware de autenticação
import { PrismaClient } from '@prisma/client'; // Importa o PrismaClient para interagir com o banco de dados

const app = express(); // Cria uma instância do Express

app.use(express.json()); // Middleware para analisar o corpo das requisições como JSON
app.use('/', publicRoutes); // Usa as rotas públicas definidas em public.js
app.use('/', auth, privateRoutes); // Usa as rotas privadas definidas em private.js E passa pelo auth antes

app.get('/usuarios', async (req, res) => { // Rota para listar usuários
    try {
        const usuarios = await prisma.user.findMany(); // Busca todos os usuários no banco de dados
        res.status(200).json(usuarios); // Retorna o array de usuários como JSON
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.use(express.static('public')); // pasta com arquivos "públicos"

app.listen(4000, () => { // Inicia o servidor na porta 4000
    console.log('Server is running on http://localhost:4000');
});

