-- CreateTable
CREATE TABLE "gastos_planeados" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "tipoCuota" "TipoCuota" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_planeados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gastos_planeados_userId_key" ON "gastos_planeados"("userId");

-- AddForeignKey
ALTER TABLE "gastos_planeados" ADD CONSTRAINT "gastos_planeados_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
