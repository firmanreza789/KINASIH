import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { createSyncLogInternal } from "./sync-log.service";

export async function getAllPenarikan() {
  return prisma.penarikan.findMany({
    orderBy: {
      tanggal: "desc",
    },
    include: {
      nasabah: true,
    },
  });
}

export async function getPenarikanById(id: number) {
  return prisma.penarikan.findUnique({
    where: {
      idPenarikan: id,
    },
    include: {
      nasabah: true,
    },
  });
}

export async function createPenarikan(
  idNasabah: number,
  jumlahPenarikan: number
) {
  return prisma.$transaction(async (tx) => {
    // =====================================================
    // 1. LOCK BARIS NASABAH
    // =====================================================
    // Mencegah dua penarikan bersamaan membaca saldo
    // yang sama.

    await tx.$queryRaw`
      SELECT "idNasabah"
      FROM "nasabah"
      WHERE "idNasabah" = ${idNasabah}
      FOR UPDATE
    `;

    // =====================================================
    // 2. CARI NASABAH
    // =====================================================

    const nasabah = await tx.nasabah.findUnique({
      where: {
        idNasabah,
      },
    });

    if (!nasabah) {
      throw new Error("NASABAH_NOT_FOUND");
    }

    // =====================================================
    // 3. UBAH NOMINAL MENJADI DECIMAL
    // =====================================================

    const jumlah = new Prisma.Decimal(
      String(jumlahPenarikan)
    );

    // =====================================================
    // 4. CEK SALDO
    // =====================================================

    if (nasabah.saldo.lessThan(jumlah)) {
      throw new Error("SALDO_TIDAK_CUKUP");
    }

    // =====================================================
    // 5. SALDO SEBELUM
    // =====================================================

    const saldoSebelum = nasabah.saldo;

    // =====================================================
    // 6. SALDO SESUDAH
    // =====================================================

    const saldoSesudah = saldoSebelum
      .minus(jumlah)
      .toDecimalPlaces(2);

    // =====================================================
    // 7. UPDATE SALDO
    // =====================================================

    const nasabahTerbaru = await tx.nasabah.update({
      where: {
        idNasabah,
      },
      data: {
        saldo: saldoSesudah,
      },
    });

    // =====================================================
    // 8. SIMPAN RIWAYAT PENARIKAN
    // =====================================================

    const penarikan = await tx.penarikan.create({
      data: {
        idNasabah,
        jumlahPenarikan: jumlah,
        saldoSebelum,
        saldoSesudah,
      },
      include: {
        nasabah: true,
      },
    });

    // =====================================================
    // 9. BUAT SYNC LOG
    // =====================================================

    await createSyncLogInternal(
      tx,
      "PENARIKAN",
      penarikan.idPenarikan,
      "CREATE",
      "SUCCESS",
      `Penarikan berhasil dibuat untuk nasabah ${idNasabah}`
    );

    // =====================================================
    // 10. KEMBALIKAN DATA
    // =====================================================

    return {
      ...penarikan,
      nasabah: nasabahTerbaru,
    };
  });
}