-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('SUELDO_FIJO', 'SUELDO_EXTRA', 'SUELDO_VARIADO');

-- CreateEnum
CREATE TYPE "CategoriaIngreso" AS ENUM ('SALARIO', 'SERVICIOS', 'VENTAS', 'OTROS_INGRESOS');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TARJETA', 'EFECTIVO', 'TRANSFERENCIA', 'CHEQUE');

-- CreateEnum
CREATE TYPE "EstadoIngreso" AS ENUM ('PAGADO', 'PENDIENTE', 'PARCIAL');

-- CreateEnum
CREATE TYPE "CuentaDestino" AS ENUM ('AHORROS', 'PAGOS', 'GASTOS_PERSONALES', 'INVERSIONES', 'CONSUMO_PERSONAL', 'CUENTAS_BANCARIAS', 'OTROS');

-- CreateTable
CREATE TABLE "ingresos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoIngreso" NOT NULL,
    "categoria" "CategoriaIngreso",
    "descripcion" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "estado" "EstadoIngreso",
    "cuentaDestino" "CuentaDestino" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
