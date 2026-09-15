-- CreateTable
CREATE TABLE "presupuestos_impuestos" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_impuestos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_impuestos_userId_key" ON "presupuestos_impuestos"("userId");

-- AddForeignKey
ALTER TABLE "presupuestos_impuestos" ADD CONSTRAINT "presupuestos_impuestos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
