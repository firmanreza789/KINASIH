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

export async function getTransaksi(_req: Request, res: Response) {
  try {
    const data = await getAllTransaksi();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data transaksi",
    });
  }
}

export async function getTransaksiDetail(
  req: Request,
  res: Response
) {
  try {
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
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail transaksi",
    });
  }
}

export async function createTransaksiController(
  req: Request,
  res: Response
) {
  try {
    const {
      idNasabah,
      requestId,
      detail,
    } = req.body;

    // =========================
    // VALIDASI FIELD UTAMA
    // =========================

    if (
      idNasabah === undefined ||
      requestId === undefined ||
      detail === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "idNasabah, requestId, dan detail wajib diisi",
      });
    }

    // =========================
    // VALIDASI REQUEST ID
    // =========================

    if (
      typeof requestId !== "string" ||
      requestId.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "requestId harus berupa teks dan tidak boleh kosong",
      });
    }

    const requestIdClean = requestId.trim();

    // =========================
    // VALIDASI ID NASABAH
    // =========================

    const nasabahId = Number(idNasabah);

    if (
      !Number.isInteger(nasabahId) ||
      nasabahId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "idNasabah harus berupa bilangan bulat positif",
      });
    }

    // =========================
    // VALIDASI DETAIL
    // =========================

    if (
      !Array.isArray(detail) ||
      detail.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "detail transaksi wajib berupa array dan tidak boleh kosong",
      });
    }

    // =========================
    // VALIDASI SETIAP DETAIL
    // =========================

    const detailValidated: {
      idJenis: number;
      beratKg: number;
    }[] = [];

    for (const item of detail) {
      // Pastikan item benar-benar object
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Format detail transaksi tidak valid",
        });
      }

      const jenisId = Number(item.idJenis);
      const berat = Number(item.beratKg);

      // =========================
      // VALIDASI ID JENIS
      // =========================

      if (
        !Number.isInteger(jenisId) ||
        jenisId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "idJenis harus berupa bilangan bulat positif",
        });
      }

      // =========================
      // VALIDASI BERAT
      // =========================

      if (
        !Number.isFinite(berat) ||
        berat <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "beratKg harus berupa angka lebih dari 0",
        });
      }

      // Maksimal 3 angka di belakang koma
      if (!hasMaxDecimals(berat, 3)) {
        return res.status(400).json({
          success: false,
          message:
            "beratKg maksimal 3 angka di belakang koma",
        });
      }

      detailValidated.push({
        idJenis: jenisId,
        beratKg: berat,
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
    // BUAT TRANSAKSI
    // =========================
const result = await createTransaksi(
  nasabahId,
  requestIdClean,
  detailValidated
);

if (result.alreadyExists) {
  return res.status(200).json({
    success: true,
    message: "Request transaksi sudah pernah diproses",
    data: result.transaksi,
  });
}

return res.status(201).json({
  success: true,
  message: "Transaksi berhasil dibuat",
  data: result.transaksi,
});
  } catch (error) {
    console.error("ERROR ASLI:", error);

    if (error instanceof Error) {
      if (
        error.message === "NASABAH_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Nasabah tidak ditemukan",
        });
      }

      if (
        error.message === "DETAIL_KOSONG"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Detail transaksi tidak boleh kosong",
        });
      }

      if (
        error.message === "JENIS_SAMPAH_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Jenis sampah tidak ditemukan",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Gagal membuat transaksi",
    });
  }
}