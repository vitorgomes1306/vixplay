-- CreateTable
CREATE TABLE "painel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layoutTelaCheia" BOOLEAN NOT NULL DEFAULT true,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "painel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "painel_id_key" ON "painel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "painel_user_id_key" ON "painel"("user_id");
