import express from 'express'; // Importa o Express para criar rotas e gerenciar requisições HTTP
import prisma from '../lib/prisma.js'; // Importa o PrismaClient para interagir com o banco de dados
import bcrypt from 'bcrypt'; // Importa o bcrypt para criptografar senhas
import jwt from 'jsonwebtoken'; // Importa o jsonwebtoken para gerar tokens de autenticação

const router = express.Router(); // Cria uma instância do Router do Express para definir rotas

const JWT_SECRET = process.env.JWT_SECRET; //Puxa o segredo do JWT do ambiente no arquivo .env

//rota de cadastro

router.post('/cadastro', async (req, res) => { // Rota para cadastrar um novo usuário
  try { // Caso faça sucesso, executa o bloco try
    const user = req.body // Pega os dados do usuário do corpo da requisição
    const salt = await bcrypt.genSalt(10); // Gera um salt para criptografia da senha com 10 rounds de complexidade
    const hashePassword = await bcrypt.hash(user.password, salt); // Criptografa a senha do usuário

    const userDB = await prisma.user.create({ // Cria um novo usuário no banco de dados usando Prisma
      data: { // Dados do usuário a serem inseridos no banco de dados
        name: user.name, // Nome do usuário
        email: user.email, /// Email do usuário
        password: hashePassword, // Usa a senha criptografada
      }
    });
    res.status(201).json(userDB); // Retorna o usuário criado com status 201 (Created)
  } catch (err) { // Caso ocorra um erro, executa o bloco catch
    console.error('Erro ao cadastrar usuário:', err); // Exibe o erro no console
    res.status(500).json({ error: 'Erro ao cadastrar usuário' }); // Retorna um erro com status 500 (Internal Server Error)
  }
})
//_______________________________________________________________________

// Rota para login de usuário

router.post('/login', async (req, res) => {
  try {
    const userInfo = req.body; // Obtém as informações do usuário do corpo da requisição}
    const user = await prisma.user.findUnique({ // Busca o usuário no banco de dados pelo email
      where: { // Define o filtro para buscar o usuário pelo email
        email: userInfo.email, // Busca o usuário pelo email
      }
    })
   // Se o usuário não for encontrado, retorna erro 404
    if (!user) { 
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    // Compara a senha fornecida com a senha criptografada no banco de dados
    const isMatch = await bcrypt.compare(userInfo.password, user.password); // Compara a senha fornecida com a senha criptografada no banco de dados  
    if (!isMatch) {

      // Se as senhas não coincidirem, retorna erro 401
return res.status(400).json({ message: 'Sua senha está incorreta' }) 
    }

// gera o token

const token = jwt.sign({ id: user.id}, JWT_SECRET, {expiresIn: '7 days'}); // Gera um token JWT com o ID do usuário e define a expiração para 7 dias

// Retorna mensagem de sucesso

    res.status(200).json(token)({ message: 'Usuário encontrado' });  // Retorna o token com status 200
  
  // Caso ocorra um erro, executa o bloco catch
  } catch (err) { 
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
})

//_______________________________________________________________________

router.post('/addpanel', async (req, res) => { // Rota para cadastrar um novo painel
  try { // Caso faça sucesso, executa o bloco try
    const painel = req.body //
    const painelDB = await prisma.painel.create({ // Cria um novo painel no banco de dados usando Prisma
      data: { // Dados do painel a serem inseridos no banco de dados
      name: painel.name, // Nome do painel
      user_id: painel.user_id // ID do usuário logado
      }
    });
    res.status(201).json(painelDB); // Retorna o painel criado com status 201 (Created)
  } catch (err) { // Caso ocorra um erro, executa o bloco catch
    console.error('Erro ao cadastrar painel:', err); // Exibe o erro no console
    res.status(500).json({ error: 'Erro ao cadastrar painel' }); // Retorna um erro com status 500 (Internal Server Error)
  }
    }
)

  
//_______________________________________________________________________

export default router; // Exporta as rotas definidas para serem usadas em outros arquivos
//_______________________________________________________________________