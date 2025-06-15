
import { PrismaClient } from '@prisma/client'; // Importa o PrismaClient para interagir com o banco de dados

const prisma = new PrismaClient(); // Cria uma instância do PrismaClient para acessar o banco de dados

export default prisma; // Exporta a instância do PrismaClient para ser usada em outros arquivos
