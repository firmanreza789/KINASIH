import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export async function getAllSyncLog() {
  return prisma.syncLog.findMany({
    orderBy: { waktu: "desc" },
  });
}

export async function getSyncLogById(id: number) {
  return prisma.syncLog.findUnique({
    where: { idSync: id },
  });
}

export async function createSyncLog(
  tipeData: string,
  idData: number,
  aksi: string,
  status: string,
  keterangan?: string
) {
  return prisma.syncLog.create({
    data: {
      tipeData,
      idData,
      aksi,
      status,
      keterangan,
    },
  });
}

/**
 * Membuat sync log di dalam transaksi Prisma.
 * Digunakan oleh service lain yang sedang menjalankan
 * prisma.$transaction().
 */
export async function createSyncLogInternal(
  tx: Prisma.TransactionClient,
  tipeData: string,
  idData: number,
  aksi: string,
  status: string,
  keterangan?: string
) {
  return tx.syncLog.create({
    data: {
      tipeData,
      idData,
      aksi,
      status,
      keterangan,
    },
  });
}