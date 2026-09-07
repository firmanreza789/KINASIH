import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { createSyncLogInternal } from "./sync-log.service";

export async function getAllTransaksi() {
  return prisma.transaksi.findMany({
    orderBy: {
      tanggal: "desc",
    },
    include: {
      nasabah: {
        select: {
          idNasabah: true,
          noKK: true,
          nama: true,
          saldo: true,
        },
      },
      detailTransaksi: {
        include: {
          jenisSampah: {
            include: {
              kategoriSampah: true,
            },
          },
        },
      },
    },
  });
}

export async function getTransaksiById(id: number) {
  return prisma.transaksi.findUnique({
    where: {
      idTransaksi: id,
    },
    include: {
      nasabah: {
        select: {
          idNasabah: true,
          noKK: true,
          nama: true,
          saldo: true,
        },
      },
      detailTransaksi: {
        include: {
          jenisSampah: {
            include: {
              kategoriSampah: true,
            },
          },
        },
      },
    },
  });
}

export async function createTransaksi(
  idNasabah: number,
  requestId: string,
  detail: { idJenis: number; beratKg: number }[]
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // =====================================================
      // 1. CEK APAKAH requestId SUDAH PERNAH DIPROSES
      // =====================================================

      const transaksiExisting = await tx.transaksi.findUnique({
        where: {
          requestId,
        },
        include: {
          nasabah: {
            select: {
              idNasabah: true,
              noKK: true,
              nama: true,
              saldo: true,
            },
          },
          detailTransaksi: {
            include: {
              jenisSampah: {
                include: {
                  kategoriSampah: true,
                },
              },
            },
          },
        },
      });

      if (transaksiExisting) {
        return {
          transaksi: transaksiExisting,
          alreadyExists: true,
        };
      }

      // =====================================================
      // 2. CEK NASABAH
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
      // 3. CEK DETAIL
      // =====================================================

      if (detail.length === 0) {
        throw new Error("DETAIL_KOSONG");
      }

      // =====================================================
      // 4. CEK JENIS SAMPAH
      // =====================================================

      const jenisIds = detail.map(
        (item) => item.idJenis
      );

      const jenisSampah = await tx.jenisSampah.findMany({
        where: {
          idJenis: {
            in: jenisIds,
          },
        },
      });

      if (jenisSampah.length !== jenisIds.length) {
        throw new Error("JENIS_SAMPAH_NOT_FOUND");
      }

      // =====================================================
      // 5. HITUNG DETAIL TRANSAKSI
      // =====================================================

      const detailData = detail.map((item) => {
        const jenis = jenisSampah.find(
          (data) => data.idJenis === item.idJenis
        );

        if (!jenis) {
          throw new Error("JENIS_SAMPAH_NOT_FOUND");
        }

        const beratKg = new Prisma.Decimal(
          String(item.beratKg)
        );

        const subTotal = beratKg
          .mul(jenis.hargaPerKG)
          .toDecimalPlaces(2);

        return {
          idJenis: item.idJenis,
          beratKg,
          hargaPerKG: jenis.hargaPerKG,
          subTotal,
        };
      });

      // =====================================================
      // 6. HITUNG TOTAL BERAT
      // =====================================================

      const totalBerat = detailData.reduce(
        (total, item) =>
          total.add(item.beratKg),
        new Prisma.Decimal(0)
      );

      // =====================================================
      // 7. HITUNG TOTAL NILAI
      // =====================================================

      const totalNilai = detailData.reduce(
        (total, item) =>
          total.add(item.subTotal),
        new Prisma.Decimal(0)
      );

      // =====================================================
      // 8. BUAT TRANSAKSI
      // =====================================================

      const transaksi = await tx.transaksi.create({
        data: {
          idNasabah,
          requestId,
          totalBerat,
          totalNilai,
          detailTransaksi: {
            create: detailData,
          },
        },
        include: {
          nasabah: {
            select: {
              idNasabah: true,
              noKK: true,
              nama: true,
              saldo: true,
            },
          },
          detailTransaksi: {
            include: {
              jenisSampah: {
                include: {
                  kategoriSampah: true,
                },
              },
            },
          },
        },
      });

      // =====================================================
      // 9. UPDATE SALDO NASABAH
      // =====================================================

      const nasabahTerbaru = await tx.nasabah.update({
        where: {
          idNasabah,
        },
        data: {
          saldo: {
            increment: totalNilai,
          },
        },
      });

      // =====================================================
      // 10. BUAT SYNC LOG
      // =====================================================

      await createSyncLogInternal(
        tx,
        "TRANSAKSI",
        transaksi.idTransaksi,
        "CREATE",
        "SUCCESS",
        `Transaksi berhasil dibuat untuk nasabah ${idNasabah}`
      );

      // =====================================================
      // 11. KEMBALIKAN TRANSAKSI BARU
      // =====================================================

      return {
        transaksi: {
          ...transaksi,
          nasabah: nasabahTerbaru,
        },
        alreadyExists: false,
      };
    });
  } catch (error) {
    // =======================================================
    // 12. HANDLE RACE CONDITION
    // =======================================================

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const transaksiExisting =
        await prisma.transaksi.findUnique({
          where: {
            requestId,
          },
          include: {
            nasabah: {
              select: {
                idNasabah: true,
                noKK: true,
                nama: true,
                saldo: true,
              },
            },
            detailTransaksi: {
              include: {
                jenisSampah: {
                  include: {
                    kategoriSampah: true,
                  },
                },
              },
            },
          },
        });

      if (transaksiExisting) {
        return {
          transaksi: transaksiExisting,
          alreadyExists: true,
        };
      }
    }

    throw error;
  }
}