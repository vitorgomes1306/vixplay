-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientsId" INTEGER;

-- CreateTable
CREATE TABLE "Clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cpfCNPJ" TEXT,
    "email" TEXT NOT NULL,
    "adress" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,
    "picture" TEXT,

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientsId_fkey" FOREIGN KEY ("clientsId") REFERENCES "Clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
