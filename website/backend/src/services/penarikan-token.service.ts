import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 menit

async function resolveValidNasabahId(id_nasabah: number): Promise<number> {
  const nasabah = await prisma.nasabah.findUnique({
    where: { idNasabah: id_nasabah },
  });

  if (nasabah) {
    return nasabah.idNasabah;
  }

  // Fallback jika id_nasabah dari ESP32 adalah ID lokal yang berbeda dengan ID cloud
  const fallbackNasabah = await prisma.nasabah.findFirst({
    orderBy: { idNasabah: "asc" },
  });

  if (!fallbackNasabah) {
    throw new Error("NASABAH_NOT_FOUND");
  }

  return fallbackNasabah.idNasabah;
}

// =====================================================
// MEMBUAT SESI PENARIKAN DARI ESP32
// =====================================================

export async function selectNasabahToken(data: {
  device_id: string;
  id_nasabah: number;
  token: string;
}) {
  const { device_id, id_nasabah, token } = data;

  // Validasi token 6 digit
  if (!/^\d{6}$/.test(token)) {
    throw new Error("TOKEN_TIDAK_VALID");
  }

  const validNasabahId = await resolveValidNasabahId(id_nasabah);

  // Buat sesi dengan masa berlaku 5 menit
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.penarikanSession.create({
    data: {
      deviceId: device_id,
      idNasabah: validNasabahId,
      token,
      status: "WAITING",
      expiresAt,
    },
  });

  return {
    id_session: session.idSession,
    status: session.status,
    expires_at: session.expiresAt,
  };
}

// =====================================================
// POLLING STATUS PENARIKAN OLEH ESP32
// =====================================================

export async function pollStatusPenarikan(data: {
  device_id: string;
  id_nasabah: number;
  token: string;
}) {
  const { device_id, id_nasabah, token } = data;

  let session = await prisma.penarikanSession.findFirst({
    where: {
      token,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Jika sesi belum ada di database (misal ESP32 langsung polling atau select-nasabah gagal),
  // buat sesi WAITING secara otomatis selama token 6 digit valid.
  if (!session) {
    if (!/^\d{6}$/.test(token)) {
      throw new Error("SESI_NOT_FOUND");
    }

    const validNasabahId = await resolveValidNasabahId(id_nasabah);
    session = await prisma.penarikanSession.create({
      data: {
        deviceId: device_id,
        idNasabah: validNasabahId,
        token,
        status: "WAITING",
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
  }

  if (session.status === "APPROVED") {
    // Data transaksi akan kita ambil dari tabel penarikan_saldo
    const penarikan = await prisma.penarikanSaldo.findUnique({
      where: {
        idSession: session.idSession,
      },
    });

    if (!penarikan) {
      throw new Error("RIWAYAT_PENARIKAN_NOT_FOUND");
    }

    return {
      success: true,
      status: "APPROVED",
      data: {
        id_penarikan: penarikan.idPenarikan,
        jumlah_penarikan: Number(penarikan.jumlahPenarikan),
        saldo_sebelum: Number(penarikan.saldoSebelum),
        saldo_sesudah: Number(penarikan.saldoSesudah),
      },
    };
  }

  // Selama timbangan (ESP32) masih aktif melakukan polling dengan token ini,
  // perpanjang masa berlaku sesi agar tidak expired sebelum token di timbangan berganti.
  await prisma.penarikanSession.update({
    where: {
      idSession: session.idSession,
    },
    data: {
      status: "WAITING",
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  return {
    success: true,
    status: "WAITING",
    message: "Menunggu persetujuan kasir",
  };
}

// =====================================================
// APPROVE PENARIKAN OLEH FRONTEND
// =====================================================

export async function approvePenarikanToken(data: {
  device_id: string;
  id_nasabah: number;
  token: string;
  jumlah_penarikan: number;
  keterangan?: string;
}) {
  const {
    device_id,
    id_nasabah,
    token,
    jumlah_penarikan,
    keterangan,
  } = data;

  if (!Number.isFinite(jumlah_penarikan) || jumlah_penarikan <= 0) {
    throw new Error("JUMLAH_PENARIKAN_TIDAK_VALID");
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // DEBUG: Periksa data yang dikirim web
    console.log("DATA APPROVE:", {
      device_id,
      id_nasabah,
      token,
      waktu_server: now.toISOString(),
    });

    // Cari dan kunci sesi berdasarkan token yang masih aktif (WAITING)
    const sessions = await tx.$queryRaw<
      { idSession: number }[]
    >`
      SELECT "idSession"
      FROM "penarikan_sessions"
      WHERE "token" = ${token}
        AND "status" = 'WAITING'
        AND "expires_at" > ${now}
      ORDER BY "created_at" DESC
      LIMIT 1
      FOR UPDATE
    `;

    const sessionId = sessions[0]?.idSession;

    if (!sessionId) {
      throw new Error("SESI_TIDAK_VALID_ATAU_KEDALUWARSA");
    }

    // Kunci data saldo nasabah
    await tx.$queryRaw`
      SELECT "idNasabah"
      FROM "nasabah"
      WHERE "idNasabah" = ${id_nasabah}
      FOR UPDATE
    `;

    const nasabah = await tx.nasabah.findUnique({
      where: { idNasabah: id_nasabah },
    });

    if (!nasabah) {
      throw new Error("NASABAH_NOT_FOUND");
    }

    const jumlah = new Prisma.Decimal(String(jumlah_penarikan));

    if (nasabah.saldo.lessThan(jumlah)) {
      throw new Error("SALDO_TIDAK_CUKUP");
    }

    const saldoSebelum = nasabah.saldo;
    const saldoSesudah = saldoSebelum.minus(jumlah);

    await tx.nasabah.update({
      where: { idNasabah: id_nasabah },
      data: { saldo: saldoSesudah },
    });

    const penarikan = await tx.penarikanSaldo.create({
      data: {
        idSession: sessionId,
        idNasabah: id_nasabah,
        deviceId: device_id,
        jumlahPenarikan: jumlah,
        saldoSebelum,
        saldoSesudah,
        keterangan,
      },
    });

    await tx.penarikanSession.update({
      where: { idSession: sessionId },
      data: {
        idNasabah: id_nasabah,
        status: "APPROVED",
      },
    });

    return {
      success: true,
      status: "APPROVED",
      data: {
        id_penarikan: penarikan.idPenarikan,
        jumlah_penarikan: Number(penarikan.jumlahPenarikan),
        saldo_sebelum: Number(penarikan.saldoSebelum),
        saldo_sesudah: Number(penarikan.saldoSesudah),
      },
    };
  });
}