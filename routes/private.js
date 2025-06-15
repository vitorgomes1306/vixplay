import express from 'express'; // Importa o Express para criar rotas e gerenciar requisições
import prisma from '../lib/prisma.js'; // Importa o PrismaClient para interagir com o banco de dados
const router = express.Router(); // Cria uma instância do Router do Express para definir rotas

router.get('/listar-usuarios', async (req, res) => { // Rota para listar usuários
    try {
        const user = await prisma.user.findMany({ omit: { password: true } }); // Busca todos os usuários no banco de dados
        res.status(200).json({ message: 'Usuários listados com sucesso', user }); // Retorna o array de usuários como JSON
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
}); // Fecha a rota

export default router; // Exporta o router para ser usado em outros arquivos