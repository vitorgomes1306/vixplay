import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from '@prisma/client';
// import multer from "multer"; // Importando o Multer
const prisma = new PrismaClient();

const router = express.Router();

// ----------------------------------------------------------- //
// Rota POST - Cadastrar usuário
router.post("/cadastrowifi", async (req, res) => {
    console.log("📥 Rota /cadastrowifi chamada!");
    console.log("📥 Dados recebidos no corpo da requisição (req.body):", req.body);

    try {
        const { name, email, password, cpf, birthDate, phoneNumber } = req.body;

        // Validação dos campos obrigatórios
        if (!name || !email || !password || !cpf || !birthDate) {
            return res.status(400).json({
                error: 'Os campos "name", "email", "password", "cpf" e "birthDate" são obrigatórios!',
            });
        }

        // Verifica duplicidade do email ou CPF
        const existingUser = await prisma.wifiUsers.findFirst({
            where: { OR: [{ email }, { cpf }] },
        });

        if (existingUser) {
            return res.status(409).json({ error: "Já existe um usuário com este email ou CPF!" });
        }

        // Gera hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria novo usuário
        const newUserWifi = await prisma.wifiUsers.create({
            data: {
                name,
                email,
                password: hashedPassword,
                cpf,
                phoneNumber: phoneNumber || null, // Opcional
                birthDate: new Date(birthDate),
                active: true, // Valor padrão
                blocked: false, // Valor padrão
            },
        });

        console.log("✅ Usuário cadastrado com sucesso:", newUserWifi);
        res.status(201).json({ message: "Usuário cadastrado com sucesso!", user: newUserWifi });
    } catch (err) {
        console.error("❌ Erro no cadastro:", err);

        if (err.code === "P2002") {
            return res.status(409).json({ error: "Email ou CPF já está sendo usado!" });
        }

        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

//-----------------------------------------------------------//

// Rota GET - Listar todos os usuários da tabela WiFi
router.get("/listarwifi", async (req, res) => {
    try {
        console.log("📥 Rota /listarwifi chamada!");
        const usuarios = await prisma.wifiUsers.findMany();
        res.status(200).json(usuarios);
    } catch (err) {
        console.error("❌ Erro ao buscar usuários:", err);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});

//-----------------------------------------------------------//

// Rota DELETE - Remover usuário por ID
router.delete("/removerwifi/:id", async (req, res) => {
    console.log("📥 Rota /removerwifi chamada!");

    try {
        const { id } = req.params; // Pega o ID passado como parâmetro na URL
        console.log("📥 ID recebido para exclusão:", id);

        // Verifica se o ID existe no banco
        const usuario = await prisma.wifiUsers.findUnique({
            where: { id: parseInt(id) },
        });

        if (!usuario) {
            console.log("❌ Usuário não encontrado para exclusão");
            return res.status(404).json({ error: "Usuário não encontrado!" });
        }

        // Remove o usuário do banco
        console.log("🗑️ Removendo usuário do banco...");
        await prisma.wifiUsers.delete({
            where: { id: parseInt(id) },
        });

        console.log("✅ Usuário removido com sucesso!");
        res.status(200).json({ message: "Usuário removido com sucesso!" });
    } catch (err) {
        console.error("❌ Erro ao remover usuário:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

//-----------------------------------------------------------//

// Rota PUT - Atualizar usuário por ID
router.put("/atualizarwifi/:id", async (req, res) => {
    console.log("📥 Rota /atualizarwifi chamada!");

    try {
        const { id } = req.params; // Pega o ID passado como parâmetro na URL
        const { name, email, cpf, phoneNumber, birthDate, profilePicture } = req.body; // Pega os dados para atualização
        console.log("📥 ID recebido para atualização:", id);
        console.log("📥 Dados recebidos para atualização:", req.body);

        // Verifica se o ID existe no banco
        const usuario = await prisma.wifiUsers.findUnique({
            where: { id: parseInt(id) },
        });

        if (!usuario) {
            console.log("❌ Usuário não encontrado para atualização");
            return res.status(404).json({ error: "Usuário não encontrado!" });
        }

        // Atualiza os dados do usuário no banco
        console.log("✏️ Atualizando usuário no banco...");
        const usuarioAtualizado = await prisma.wifiUsers.update({
            where: { id: parseInt(id) },
            data: {
                name: name || usuario.name, // Atualiza apenas se o campo for enviado
                email: email || usuario.email,
                cpf: cpf || usuario.cpf,
                phoneNumber: phoneNumber || usuario.phoneNumber,
                birthDate: birthDate ? new Date(birthDate) : usuario.birthDate,
                profilePicture: profilePicture || usuario.profilePicture,
            },
        });

        console.log("✅ Usuário atualizado com sucesso!");
        res.status(200).json({
            message: "Usuário atualizado com sucesso!",
            user: usuarioAtualizado,
        });
    } catch (err) {
        console.error("❌ Erro ao atualizar usuário:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

export default router;