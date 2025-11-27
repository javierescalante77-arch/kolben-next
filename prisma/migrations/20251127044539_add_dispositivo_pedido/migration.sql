/*
  Warnings:

  - You are about to drop the column `dispositivoOrigen` on the `Pedido` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "dispositivoOrigen",
ADD COLUMN     "dispositivo" TEXT;
