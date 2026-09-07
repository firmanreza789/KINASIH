import { prisma } from "../lib/prisma";

export async function getAllNasabah() {
  return prisma.nasabah.findMany({
    orderBy: {
      idNasabah: "asc",
    },
  });
}

export async function getNasabahById(id: number) {
  return prisma.nasabah.findUnique({
    where: {
      idNasabah: id,
    },
  });
}

export async function createNasabah(
  noKK: string,
  nama: string
) {
  return prisma.nasabah.create({
    data: {
      noKK,
      nama,
    },
  });
}