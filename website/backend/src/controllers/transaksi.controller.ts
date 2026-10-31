import { Request, Response } from "express";

import {
getAllTransaksi,
getTransaksiById,
createTransaksi,
} from "../services/transaksi.service";

function hasMaxDecimals(value: number, maxDecimals: number) {
const text = value.toString();

if (!text.includes(".")) {
return true;
}

return text.split(".")[1].length <= maxDecimals;
}

// =========================
// HELPER: FORMAT JSON
// =========================
function formatDataKeJSON(
transaksi: any,
device_id = "ESP32S3-KINASIH-01",
id_lokal?: number
) {
let extractedIdLokal = id_lokal;

if (!extractedIdLokal && transaksi.requestId) {
const splitReq = transaksi.requestId.split("-");
extractedIdLokal = Number(splitReq[splitReq.length - 1]);
}

const d = new Date(
transaksi.tanggal ||
transaksi.createdAt ||
new Date()
);

const pad = (n: number) =>
n < 10 ? "0" + n : n;

const formattedDate =
"${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} " +
"${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}";

return {
device_id,
id_lokal: extractedIdLokal || 0,
id_nasabah: transaksi.idNasabah,
no_kk: transaksi.nasabah?.noKK || "",
nama: transaksi.nasabah?.nama || "",
tanggal_waktu: formattedDate,
total_berat: Number(transaksi.totalBerat) || 0,
total_nilai: Number(transaksi.totalNilai) || 0,

items: (transaksi.detailTransaksi || []).map(
  (item: any) => ({
    id_jenis: item.idJenis,
    nama_jenis:
      item.jenisSampah?.namaJenis ||
      item.jenisSampah?.nama ||
      "",
    berat_kg: Number(item.beratKg) || 0,
    harga_per_kg: Number(item.hargaPerKG) || 0,
    subtotal: Number(item.subTotal) || 0,
  })
),

};
}

// =========================
// GET SEMUA TRANSAKSI
// =========================
export async function getTransaksi(
req: Request,
res: Response
) {
try {
const apiKey = req.header("X-API-KEY");

if (apiKey !== "kinasih_secret_device_key_2026") {
  return res.status(401).json({
    success: false,
    message: "Akses ditolak: API Key salah!",
  });
}

const data = await getAllTransaksi();

const formattedData = data.map(
  (item: any) => formatDataKeJSON(item)
);

return res.status(200).json({
  success: true,
  data: formattedData,
});

} catch (error) {
console.error("ERROR ASLI:", error);

return res.status(500).json({
  success: false,
  message: "Gagal mengambil data transaksi",
});

}
}

// =========================
// GET DETAIL TRANSAKSI
// =========================
export async function getTransaksiDetail(
req: Request,
res: Response
) {
try {
const apiKey = req.header("X-API-KEY");

if (apiKey !== "kinasih_secret_device_key_2026") {
  return res.status(401).json({
    success: false,
    message: "Akses ditolak: API Key salah!",
  });
}

const id = Number(req.params.id);

if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({
    success: false,
    message: "ID transaksi tidak valid",
  });
}

const data = await getTransaksiById(id);

if (!data) {
  return res.status(404).json({
    success: false,
    message: "Transaksi tidak ditemukan",
  });
}

return res.status(200).json({
  success: true,
  data: formatDataKeJSON(data),
});

} catch (error) {
console.error("ERROR ASLI:", error);

return res.status(500).json({
  success: false,
  message: "Gagal mengambil detail transaksi",
});

}
}

// =========================
// POST TRANSAKSI DARI ESP32
// =========================
export async function createTransaksiController(
req: Request,
res: Response
) {
try {
const apiKey = req.header("X-API-KEY");

if (apiKey !== "kinasih_secret_device_key_2026") {
  return res.status(401).json({
    success: false,
    message: "Akses ditolak: API Key salah!",
  });
}

// Ambil data langsung dari ESP32
const {
  device_id,
  id_lokal,
  id_nasabah,
  total_berat,
  total_nilai,
  items,
} = req.body;

// =========================
// VALIDASI FIELD UTAMA
// =========================

if (
  device_id === undefined ||
  id_lokal === undefined ||
  id_nasabah === undefined ||
  total_berat === undefined ||
  total_nilai === undefined ||
  items === undefined
) {
  return res.status(400).json({
    success: false,
    message:
      "device_id, id_lokal, id_nasabah, total_berat, total_nilai, dan items wajib diisi",
  });
}

if (
  typeof device_id !== "string" ||
  device_id.trim() === ""
) {
  return res.status(400).json({
    success: false,
    message:
      "device_id harus berupa teks dan tidak boleh kosong",
  });
}

// =========================
// VALIDASI ID LOKAL
// =========================

const lokalId = Number(id_lokal);

if (
  !Number.isInteger(lokalId) ||
  lokalId <= 0
) {
  return res.status(400).json({
    success: false,
    message:
      "id_lokal harus berupa bilangan bulat positif",
  });
}

// Request ID untuk mencegah transaksi duplikat
const requestIdClean =
  `${device_id.trim()}-${lokalId}`;

// =========================
// VALIDASI NASABAH
// =========================

const nasabahId = Number(id_nasabah);

if (
  !Number.isInteger(nasabahId) ||
  nasabahId <= 0
) {
  return res.status(400).json({
    success: false,
    message:
      "id_nasabah harus berupa bilangan bulat positif",
  });
}

// =========================
// VALIDASI TOTAL DARI ESP32
// =========================

const totalBerat = Number(total_berat);
const totalNilai = Number(total_nilai);

if (
  !Number.isFinite(totalBerat) ||
  totalBerat <= 0
) {
  return res.status(400).json({
    success: false,
    message:
      "total_berat harus berupa angka lebih dari 0",
  });
}

if (
  !Number.isFinite(totalNilai) ||
  totalNilai < 0
) {
  return res.status(400).json({
    success: false,
    message:
      "total_nilai tidak valid",
  });
}

// =========================
// VALIDASI ITEMS
// =========================

if (
  !Array.isArray(items) ||
  items.length === 0
) {
  return res.status(400).json({
    success: false,
    message:
      "items transaksi wajib berupa array dan tidak boleh kosong",
  });
}

// Data yang akan dikirim ke service
const detailValidated: {
  idJenis: number;
  beratKg: number;
  hargaPerKG: number;
  subTotal: number;
}[] = [];

// =========================
// VALIDASI SETIAP ITEM
// =========================

for (const item of items) {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Format items transaksi tidak valid",
    });
  }

  const jenisId = Number(item.id_jenis);
  const berat = Number(item.berat_kg);
  const harga = Number(item.harga_per_kg);
  const subtotal = Number(item.subtotal);

  // Validasi ID jenis
  if (
    !Number.isInteger(jenisId) ||
    jenisId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "id_jenis harus berupa bilangan bulat positif",
    });
  }

  // Validasi berat
  if (
    !Number.isFinite(berat) ||
    berat <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "berat_kg harus berupa angka lebih dari 0",
    });
  }

  if (!hasMaxDecimals(berat, 3)) {
    return res.status(400).json({
      success: false,
      message:
        "berat_kg maksimal 3 angka di belakang koma",
    });
  }

  // Validasi harga dari ESP32
  if (
    !Number.isFinite(harga) ||
    harga < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "harga_per_kg tidak valid",
    });
  }

  // Validasi subtotal dari ESP32
  if (
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "subtotal tidak valid",
    });
  }

  // Simpan data langsung dari ESP32
  detailValidated.push({
    idJenis: jenisId,
    beratKg: berat,
    hargaPerKG: harga,
    subTotal: subtotal,
  });
}

// =========================
// CEK DUPLIKASI JENIS
// =========================

const jenisIds = detailValidated.map(
  (item) => item.idJenis
);

const uniqueJenisIds = new Set(jenisIds);

if (
  uniqueJenisIds.size !== jenisIds.length
) {
  return res.status(400).json({
    success: false,
    message:
      "Jenis sampah yang sama tidak boleh muncul lebih dari sekali",
  });
}

// =========================
// SIMPAN TRANSAKSI
// Semua harga dan total
// berasal dari ESP32
// =========================

const result = await createTransaksi(
  nasabahId,
  requestIdClean,
  totalBerat,
  totalNilai,
  detailValidated
);

const formattedResponse =
  formatDataKeJSON(
    result.transaksi,
    device_id.trim(),
    lokalId
  );

if (result.alreadyExists) {
  return res.status(200).json({
    success: true,
    message:
      "Request transaksi sudah pernah diproses",
    data: formattedResponse,
  });
}

return res.status(201).json({
  success: true,
  message:
    "Transaksi berhasil dibuat",
  data: formattedResponse,
});

} catch (error) {
console.error("ERROR ASLI:", error);

if (error instanceof Error) {
  if (error.message === "NASABAH_NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: "Nasabah tidak ditemukan",
    });
  }

  if (error.message === "DETAIL_KOSONG") {
    return res.status(400).json({
      success: false,
      message:
        "Detail transaksi tidak boleh kosong",
    });
  }
}

return res.status(500).json({
  success: false,
  message: "Gagal membuat transaksi",
  error:
    error instanceof Error
      ? error.message
      : String(error),
});

}
}
