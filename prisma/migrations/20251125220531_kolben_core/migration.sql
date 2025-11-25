/*
  Warnings:

  - You are about to drop the column `actualizadoEn` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `clave` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `creadoEn` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `usuario` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `actualizadoEn` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `creadoEn` on the `Pedido` table. All the data in the column will be lost.
  - The `estado` column on the `Pedido` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `codigo` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `estadoProd` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `eta` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `sucursalA` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `sucursalB` on the `PedidoItem` table. All the data in the column will be lost.
  - You are about to drop the column `sucursalC` on the `PedidoItem` table. All the data in the column will be lost.
  - The `tipo` column on the `PedidoItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `claveHash` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productoId` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('DISPONIBLE', 'BAJO_STOCK', 'AGOTADO', 'RESERVA');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('MAESTRO_FRENOS', 'MAESTRO_CLUTCH', 'AUXILIAR_FRENOS', 'AUXILIAR_CLUTCH', 'PASTILLAS_FRENO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'PREPARANDO', 'ENVIADO');

-- CreateEnum
CREATE TYPE "TipoLinea" AS ENUM ('NORMAL', 'RESERVA');

-- DropIndex
DROP INDEX "Cliente_usuario_key";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "actualizadoEn",
DROP COLUMN "clave",
DROP COLUMN "creadoEn",
DROP COLUMN "usuario",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "claveHash" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "sucursalA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sucursalB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sucursalC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "actualizadoEn",
DROP COLUMN "creadoEn",
ADD COLUMN     "comentario" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dispositivoOrigen" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "PedidoItem" DROP COLUMN "codigo",
DROP COLUMN "descripcion",
DROP COLUMN "estadoProd",
DROP COLUMN "eta",
DROP COLUMN "sucursalA",
DROP COLUMN "sucursalB",
DROP COLUMN "sucursalC",
ADD COLUMN     "cantidadA" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidadB" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cantidadC" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estadoTexto" TEXT,
ADD COLUMN     "etaTexto" TEXT,
ADD COLUMN     "productoId" INTEGER NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoLinea" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoProducto" NOT NULL,
    "estado" "EstadoProducto" NOT NULL DEFAULT 'DISPONIBLE',
    "eta" TEXT,
    "precio" DOUBLE PRECISION,
    "imagenes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_sku_key" ON "Producto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
