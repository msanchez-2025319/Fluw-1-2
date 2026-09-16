-- CreateTable
CREATE TABLE "fondos_emergencia" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "tipoCuota" "TipoCuota" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fondos_emergencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fondos_emergencia_userId_key" ON "fondos_emergencia"("userId");

-- AddForeignKey
ALTER TABLE "fondos_emergencia" ADD CONSTRAINT "fondos_emergencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
