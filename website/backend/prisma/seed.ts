import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});
async function main() {
  console.log("🌱 Memulai proses seed...");

  // ==========================================
  // 1. KATEGORI SAMPAH
  // ==========================================

  const plastik = await prisma.kategoriSampah.upsert({
    where: {
      idKategori: 1,
    },
    update: {},
    create: {
      idKategori: 1,
      nama: "Plastik",
    },
  });

  const kertas = await prisma.kategoriSampah.upsert({
    where: {
      idKategori: 2,
    },
    update: {},
    create: {
      idKategori: 2,
      nama: "Kertas",
    },
  });

  const logam = await prisma.kategoriSampah.upsert({
    where: {
      idKategori: 3,
    },
    update: {},
    create: {
      idKategori: 3,
      nama: "Logam",
    },
  });

  const kaca = await prisma.kategoriSampah.upsert({
    where: {
      idKategori: 4,
    },
    update: {},
    create: {
      idKategori: 4,
      nama: "Kaca",
    },
  });

  // ==========================================
  // 2. JENIS SAMPAH
  // ==========================================

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 1,
    },
    update: {},
    create: {
      idJenis: 1,
      idKategori: plastik.idKategori,
      nama: "Botol Plastik",
      hargaPerKG: 5000,
    },
  });

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 2,
    },
    update: {},
    create: {
      idJenis: 2,
      idKategori: plastik.idKategori,
      nama: "Gelas Plastik",
      hargaPerKG: 3500,
    },
  });

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 3,
    },
    update: {},
    create: {
      idJenis: 3,
      idKategori: kertas.idKategori,
      nama: "Kardus",
      hargaPerKG: 3000,
    },
  });

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 4,
    },
    update: {},
    create: {
      idJenis: 4,
      idKategori: kertas.idKategori,
      nama: "Kertas HVS",
      hargaPerKG: 2500,
    },
  });

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 5,
    },
    update: {},
    create: {
      idJenis: 5,
      idKategori: logam.idKategori,
      nama: "Kaleng Aluminium",
      hargaPerKG: 10000,
    },
  });

  await prisma.jenisSampah.upsert({
    where: {
      idJenis: 6,
    },
    update: {},
    create: {
      idJenis: 6,
      idKategori: kaca.idKategori,
      nama: "Botol Kaca",
      hargaPerKG: 2000,
    },
  });

  // ==========================================
  // 3. NASABAH
  // ==========================================

  await prisma.nasabah.upsert({
    where: {
      idNasabah: 1,
    },
    update: {},
    create: {
      idNasabah: 1,
      noKK: "3273010101010001",
      nama: "Budi Santoso",
      saldo: 0,
    },
  });

  await prisma.nasabah.upsert({
    where: {
      idNasabah: 2,
    },
    update: {},
    create: {
      idNasabah: 2,
      noKK: "3273010101010002",
      nama: "Siti Aminah",
      saldo: 0,
    },
  });

  await prisma.nasabah.upsert({
    where: {
      idNasabah: 3,
    },
    update: {},
    create: {
      idNasabah: 3,
      noKK: "3273010101010003",
      nama: "Ahmad Fauzi",
      saldo: 0,
    },
  });

  console.log("✅ Seed berhasil!");
}

main()
  .catch((error) => {
    console.error("❌ Seed gagal:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });