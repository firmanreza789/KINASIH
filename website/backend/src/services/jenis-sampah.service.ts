import { prisma } from "../lib/prisma";

export async function getAllJenisSampah() {
  return prisma.jenisSampah.findMany({
    orderBy: {
      idJenis: "asc",
    },
    include: {
      kategoriSampah: true,
    },
  });
}

export async function getJenisSampahById(id: number) {
  return prisma.jenisSampah.findUnique({
    where: {
      idJenis: id,
    },
    include: {
      kategoriSampah: true,
    },
  });
}

export async function createJenisSampah(
  idKategori: number,
  nama: string,
  hargaPerKG: number
) {
  return prisma.jenisSampah.create({
    data: {
      idKategori,
      nama,
      hargaPerKG,
    },
    include: {
      kategoriSampah: true,
    },
  });
}