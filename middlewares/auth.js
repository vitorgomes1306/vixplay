import jwt from 'jsonwebtoken'; // Importa a biblioteca jsonwebtoken
import dotenv from 'dotenv'; // Importa dotenv para carregar variáveis do arquivo .env

dotenv.config(); // Carrega as variáveis do .env

const JWT_SECRET = process.env.JWT_SECRET; // Pega a chave secreta do .env

if (!JWT_SECRET) {
    throw new Error('❌ A chave JWT_SECRET não foi configurada no arquivo .env!');
}

// Middleware de autenticação
const auth = (req, res, next) => {
    console.log(`🔒 Middleware de autenticação para a rota: ${req.path}`);
    
    // Obtém o token do cabeçalho Authorization
    const token = req.headers.authorization;

    if (!token) {
        console.error('❌ Token de autenticação não fornecido.');
        return res.status(401).json({ message: 'Acesso negado! Token de autenticação obrigatório.' });
    }

    try {
        // Remove o prefixo "Bearer " (se houver) e verifica o token
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);

        // Define o ID do usuário decodificado no objeto `req`
        req.userId = decoded.id;
        console.log(`✅ Token validado com sucesso para o usuário ID: ${decoded.id}`);
        next(); // Continua para a próxima etapa
    } catch (err) {
        console.error('❌ Erro ao verificar token:', err.message);
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};

export default auth;