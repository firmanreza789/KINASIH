import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
// HELPER FORMAT JSON
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
    transaksi.tanggal || transaksi.createdAt || new Date()
  );

  const pad = (n: number) => (n < 10 ? "0" + n : n);

  const formattedDate =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return {
    device_id,
    id_lokal: extractedIdLokal || 0,
    id_nasabah: transaksi.idNasabah,
    no_kk: transaksi.nasabah?.noKK || "",
    nama: transaksi.nasabah?.nama || "",
    tanggal_waktu: formattedDate,
    total_berat: Number(transaksi.totalBerat) || 0,
    total_nilai: Number(transaksi.totalNilai) || 0,
    items: (transaksi.detailTransaksi || []).map((item: any) => ({
      id_jenis: item.idJenis,
      nama_jenis:
        item.jenisSampah?.namaJenis ||
        item.jenisSampah?.nama ||
        "",
      berat_kg: Number(item.beratKg) || 0,
      harga_per_kg: Number(item.hargaPerKG) || 0,
      subtotal: Number(item.subTotal) || 0,
    })),
  };
}

// =========================
// GET SEMUA TRANSAKSI
// =========================
export async function getTransaksi(req: Request, res: Response) {
  try {
    const apiKey = req.header("X-API-KEY");

    if (apiKey !== "kinasih_secret_device_key_2026") {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak: API Key salah!",
      });
    }

    const data = await getAllTransaksi();

    const formattedData = data.map((item: any) =>
      formatDataKeJSON(item)
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
// CREATE TRANSAKSI
// NASABAH DICARI BERDASARKAN NO. KK
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

    // id_nasabah dari ESP32 tidak digunakan sebagai patokan
    const {
      device_id,
      id_lokal,
      no_kk,
      items,
    } = req.body;

    // =========================
    // VALIDASI DATA WAJIB
    // =========================
    if (
      device_id === undefined ||
      id_lokal === undefined ||
      no_kk === undefined ||
      items === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "device_id, id_lokal, no_kk, dan items wajib diisi",
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

    // =========================
    // CARI NASABAH DI DATABASE
    // BERDASARKAN NO KK
    // =========================
    const noKK = String(no_kk).trim();

    if (!noKK) {
      return res.status(400).json({
        success: false,
        message: "No. KK tidak boleh kosong",
      });
    }

    const nasabah = await prisma.nasabah.findFirst({
      where: {
        noKK: noKK,
      },
    });

    if (!nasabah) {
      return res.status(404).json({
        success: false,
        message:
          "Nasabah dengan No. KK tersebut tidak ditemukan",
      });
    }

    // ID NASABAH SELALU DIAMBIL DARI DATABASE
    const nasabahId = nasabah.idNasabah;

    console.log(
      `Nasabah ditemukan: ID ${nasabahId} - ${nasabah.nama}`
    );

    // =========================
    // VALIDASI ITEMS
    // =========================
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "items transaksi wajib berupa array dan tidak boleh kosong",
      });
    }

    const detailValidated: {
      idJenis: number;
      beratKg: number;
    }[] = [];

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

      detailValidated.push({
        idJenis: jenisId,
        beratKg: berat,
      });
    }

    // =========================
    // CEK DUPLIKAT JENIS SAMPAH
    // =========================
    const jenisIds = detailValidated.map(
      (item) => item.idJenis
    );

    const uniqueJenisIds = new Set(jenisIds);

    if (uniqueJenisIds.size !== jenisIds.length) {
      return res.status(400).json({
        success: false,
        message:
          "Jenis sampah yang sama tidak boleh muncul lebih dari sekali",
      });
    }

    // =========================
    // BUAT REQUEST ID
    // =========================
    const requestIdClean =
      `${device_id.trim()}-${lokalId}`;

    // =========================
    // SIMPAN TRANSAKSI
    // =========================
    const result = await createTransaksi(
      nasabahId,
      requestIdClean,
      detailValidated
    );

    const formattedResponse = formatDataKeJSON(
      result.transaksi,
      device_id.trim(),
      lokalId
    );

    if (result.alreadyExists) {
      return res.status(200).json(formattedResponse);
    }

    return res.status(201).json(formattedResponse);

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
          message: "Detail transaksi tidak boleh kosong",
        });
      }

      if (error.message === "JENIS_SAMPAH_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Jenis sampah tidak ditemukan",
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
