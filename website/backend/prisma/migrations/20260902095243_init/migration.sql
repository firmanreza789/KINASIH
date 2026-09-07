-- CreateTable
CREATE TABLE "kategori_sampah" (
    "idKategori" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "kategori_sampah_pkey" PRIMARY KEY ("idKategori")
);

-- CreateTable
CREATE TABLE "jenis_sampah" (
    "idJenis" SERIAL NOT NULL,
    "idKategori" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "hargaPerKG" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "jenis_sampah_pkey" PRIMARY KEY ("idJenis")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "idNasabah" SERIAL NOT NULL,
    "noKK" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "saldo" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("idNasabah")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "idTransaksi" SERIAL NOT NULL,
    "idNasabah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBerat" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "totalNilai" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("idTransaksi")
);

-- CreateTable
CREATE TABLE "detail_transaksi" (
    "idDetail" SERIAL NOT NULL,
    "idTransaksi" INTEGER NOT NULL,
    "idJenis" INTEGER NOT NULL,
    "beratKg" DECIMAL(14,3) NOT NULL,
    "hargaPerKG" DECIMAL(14,2) NOT NULL,
    "subTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "detail_transaksi_pkey" PRIMARY KEY ("idDetail")
);

-- CreateTable
CREATE TABLE "penarikan" (
    "idPenarikan" SERIAL NOT NULL,
    "idNasabah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahPenarikan" DECIMAL(14,2) NOT NULL,
    "saldoSebelum" DECIMAL(14,2) NOT NULL,
    "saldoSesudah" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "penarikan_pkey" PRIMARY KEY ("idPenarikan")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "idSync" SERIAL NOT NULL,
    "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipeData" TEXT NOT NULL,
    "idData" INTEGER NOT NULL,
    "aksi" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("idSync")
);

-- CreateIndex
CREATE INDEX "jenis_sampah_idKategori_idx" ON "jenis_sampah"("idKategori");

-- CreateIndex
CREATE INDEX "nasabah_noKK_idx" ON "nasabah"("noKK");

-- CreateIndex
CREATE INDEX "transaksi_idNasabah_idx" ON "transaksi"("idNasabah");

-- CreateIndex
CREATE INDEX "transaksi_tanggal_idx" ON "transaksi"("tanggal");

-- CreateIndex
CREATE INDEX "detail_transaksi_idTransaksi_idx" ON "detail_transaksi"("idTransaksi");

-- CreateIndex
CREATE INDEX "detail_transaksi_idJenis_idx" ON "detail_transaksi"("idJenis");

-- CreateIndex
CREATE INDEX "penarikan_idNasabah_idx" ON "penarikan"("idNasabah");

-- CreateIndex
CREATE INDEX "penarikan_tanggal_idx" ON "penarikan"("tanggal");

-- CreateIndex
CREATE INDEX "sync_log_tipeData_idData_idx" ON "sync_log"("tipeData", "idData");

-- CreateIndex
CREATE INDEX "sync_log_waktu_idx" ON "sync_log"("waktu");

-- AddForeignKey
ALTER TABLE "jenis_sampah" ADD CONSTRAINT "jenis_sampah_idKategori_fkey" FOREIGN KEY ("idKategori") REFERENCES "kategori_sampah"("idKategori") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_idNasabah_fkey" FOREIGN KEY ("idNasabah") REFERENCES "nasabah"("idNasabah") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_idTransaksi_fkey" FOREIGN KEY ("idTransaksi") REFERENCES "transaksi"("idTransaksi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_idJenis_fkey" FOREIGN KEY ("idJenis") REFERENCES "jenis_sampah"("idJenis") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penarikan" ADD CONSTRAINT "penarikan_idNasabah_fkey" FOREIGN KEY ("idNasabah") REFERENCES "nasabah"("idNasabah") ON DELETE RESTRICT ON UPDATE CASCADE;
