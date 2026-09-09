-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoGasto" AS ENUM ('PAGADO', 'POR_PAGAR', 'DEBIENDO_A_OTRO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('EMPRESA', 'PERSONAL', 'TRABAJO', 'OTRO');

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "estado" "EstadoGasto" NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
