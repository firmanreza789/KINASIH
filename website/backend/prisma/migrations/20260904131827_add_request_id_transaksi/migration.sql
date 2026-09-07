-- Tambahkan requestId sementara sebagai nullable
ALTER TABLE "transaksi"
ADD COLUMN "requestId" TEXT;

-- Isi requestId untuk transaksi lama
UPDATE "transaksi"
SET "requestId" = 'LEGACY-' || "idTransaksi"
WHERE "requestId" IS NULL;

-- Setelah semua transaksi lama memiliki requestId,
-- ubah kolom menjadi wajib
ALTER TABLE "transaksi"
ALTER COLUMN "requestId" SET NOT NULL;

-- Pastikan setiap requestId unik
CREATE UNIQUE INDEX "transaksi_requestId_key"
ON "transaksi"("requestId");