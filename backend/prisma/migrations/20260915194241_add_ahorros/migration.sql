-- CreateEnum
CREATE TYPE "TipoCuota" AS ENUM ('SEMANAL', 'MENSUAL', 'ANUAL');

-- CreateTable
CREATE TABLE "ahorros" (
    "id" TEXT NOT NULL,
    "metaAhorro" DECIMAL(12,2) NOT NULL,
    "tipoCuota" "TipoCuota" NOT NULL,
    "montoCuota" DECIMAL(12,2) NOT NULL,
    "ahorroActual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ahorros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ahorros_userId_key" ON "ahorros"("userId");

-- AddForeignKey
ALTER TABLE "ahorros" ADD CONSTRAINT "ahorros_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
