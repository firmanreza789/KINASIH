/*
  Warnings:

  - A unique constraint covering the columns `[nama]` on the table `kategori_sampah` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "kategori_sampah_nama_key" ON "kategori_sampah"("nama");
