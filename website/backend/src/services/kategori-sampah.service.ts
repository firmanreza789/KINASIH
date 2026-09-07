import { prisma } from "../lib/prisma";

export async function getAllKategoriSampah() {
  return prisma.kategoriSampah.findMany({
    orderBy: {
      idKategori: "asc",
    },
  });
}

export async function getKategoriSampahById(id: number) {
  return prisma.kategoriSampah.findUnique({
    where: {
      idKategori: id,
    },
  });
}

export async function createKategoriSampah(nama: string) {
  return prisma.kategoriSampah.create({
    data: {
      nama,
    },
  });
}