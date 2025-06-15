import express from 'express'; // Importa o módulo express para criar o servidor web
const app = express(); // Cria uma instância do Express

import publiRoutes from './routes/public.js' // Importa as rotas públicas do arquivo public.js

import { PrismaClient } from '@prisma/client' // Importa o PrismaClient para interagir com o banco de dados
const prisma = new PrismaClient() // Cria uma instância do PrismaClient para acessar o banco de dados

/*
Inicio do servidor Express
*/
app.use(express.json()); // Middleware para analisar o corpo das requisições como JSON


app.get('/', (req, res) => { // Rota raiz
    res.send('Hello World!'); // Responde com "Hello World!" quando a rota raiz é acessada
});
//_______________________________________________________________________

app.get('/usuarios', async (req, res) => { // Rota para listar usuários

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
        usuarios = await prisma.id.findMany()
        console.log(usuarios); // Exibe os usuários no console
    }

    //const showUsers = await prisma.user.findMany() 
    res.status(200).json(usuarios); // Retorna o array de usuários como JSON
});
//_______________________________________________________________________


app.post('/usuarios', async (req, res) => { // Rota para adicionar usuários

    await prisma.user.create({ // Cria um novo usuário no banco de dados usando Prisma
        data: {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }

    })
    //users.push(req.body); // Adiciona o usuário enviado no corpo da requisição ao array users
    //console.log(req.body); // Aqui você pode acessar o corpo da requisição com req.body
    //res.send('Pagina de add usuarios');
    res.status(201).json(req.body); // escreve usuário no banco de dados e retorna o usuário adicionado com status 201 (Created)
});
//_______________________________________________________________________

app.put('/usuarios/:id', async (req, res) => { // Rota para editar usuários
    await prisma.user.update({ // edita um novo usuário no banco de dados usando Prisma
        where: {
            id: req.params.id // id do usuário que será editado
        },
        data: {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }

    })
    //users.push(req.body); // Adiciona o usuário enviado no corpo da requisição ao array users
    //console.log(req.body); // Aqui você pode acessar o corpo da requisição com req.body
    //res.send('Pagina de add usuarios');
    res.status(201).json(req.body); // escreve usuário no banco de dados e retorna o usuário adicionado com status 201 (Created)
});
//_______________________________________________________________________

app.get('/usuarios/:id', (req, res) => { // Rota para exibir um usuário específico com base no ID fornecido na URL

    /* 
    rota com parâmetro
    req.params é um objeto que contém os parâmetros da rota
    por exemplo, se a rota for /usuarios/123, req.params.id será '123'
    id é o parâmetro que estamos capturando na rota
    req.params.id é o ID do usuário que queremos exibir
    aqui você pode buscar o usuário no banco de dados e retornar as informações
    para este exemplo, vamos apenas retornar o ID do usuário
    */

    const { id } = req.params;
    res.send(`Pagina de usuario con ID: ${id}`);
})

//_______________________________________________________________________

app.delete('/usuarios/:id', async (req, res) => { // Rota para deletar um usuário específico com base no ID fornecido na URL

    await prisma.user.delete({ // deleta um usuário no banco de dados usando Prisma
        where: {
            id: req.params.id // id do usuário que será deletado
        }
    })
    res.status(201).json({ message: `Usuário com ID ${req.params.id} deletado com sucesso!` }); // retorna uma mensagem de sucesso
})

//_______________________________________________________________________

app.listen(3000, () => { // Inicia o servidor na porta 3000
    console.log('Server is running on http://localhost:3000');
});