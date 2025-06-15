import jwt from 'jsonwebtoken'; // Importa o jsonwebtoken para gerar tokens de autenticação

const JWT_SECRET = process.env.JWT_SECRET; // Puxa o segredo do JWT do ambiente no arquivo .env
const auth = (req, res, next) => { // Middleware de autenticação
const token = req.headers.authorization; // Pega o token do cabeçalho da requisição

    if (!token) { // Se o token não for fornecido
        return res.status(401).json({ message: 'Acesso negado' }); // Retorna uma resposta com status 401 (Unauthorized)
    }

    try { // Tenta verificar o token
        
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET); // Verifica o token e extrai o ID do usuário
        req.userId = decoded.id // Armazena o ID do usuário na requisição
        console.log(decoded); // Exibe o ID do usuário no console

    } catch (err) { // Se ocorrer um erro ao verificar o token
        return res.status(401).json({ message: 'Token inválido' }); // Retorna uma resposta com status 401 (Unauthorized)
    }
    next(); // Passa para o próximo middleware ou rota
}

export default auth // Exporta o middleware de autenticação