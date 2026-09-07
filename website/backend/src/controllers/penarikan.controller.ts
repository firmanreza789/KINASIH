import { Request, Response } from "express";

import {
  getAllPenarikan,
  getPenarikanById,
  createPenarikan,
} from "../services/penarikan.service";

function hasMaxDecimals(value: number, maxDecimals: number) {
  const text = value.toString();

  if (!text.includes(".")) {
    return true;
  }

  return text.split(".")[1].length <= maxDecimals;
}

export async function getPenarikan(
  _req: Request,
  res: Response
) {
  try {
    const data = await getAllPenarikan();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data penarikan",
    });
  }
}

export async function getPenarikanDetail(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    // Validasi ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID penarikan tidak valid",
      });
    }

    const data = await getPenarikanById(id);

    // Data tidak ditemukan
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Penarikan tidak ditemukan",
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
      message: "Gagal mengambil detail penarikan",
    });
  }
}

export async function createPenarikanController(
  req: Request,
  res: Response
) {
  try {
    const { idNasabah, jumlahPenarikan } = req.body;

    // ========================================
    // 1. VALIDASI FIELD WAJIB
    // ========================================

    if (
      idNasabah === undefined ||
      jumlahPenarikan === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "idNasabah dan jumlahPenarikan wajib diisi",
      });
    }

    // ========================================
    // 2. VALIDASI ID NASABAH
    // ========================================

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

    // ========================================
    // 3. KONVERSI JUMLAH PENARIKAN
    // ========================================

    const jumlah = Number(jumlahPenarikan);

    // ========================================
    // 4. VALIDASI JUMLAH PENARIKAN
    // ========================================

    if (
      !Number.isFinite(jumlah) ||
      jumlah <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "jumlahPenarikan harus berupa angka lebih dari 0",
      });
    }

    // ========================================
    // 5. VALIDASI MAKSIMAL 2 DESIMAL
    // ========================================

    if (!hasMaxDecimals(jumlah, 2)) {
      return res.status(400).json({
        success: false,
        message:
          "jumlahPenarikan maksimal 2 angka di belakang koma",
      });
    }

    // ========================================
    // 6. BUAT PENARIKAN
    // ========================================

    const data = await createPenarikan(
      nasabahId,
      jumlah
    );

    // ========================================
    // 7. RESPONSE BERHASIL
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Penarikan berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    // ========================================
    // 8. NASABAH TIDAK DITEMUKAN
    // ========================================

    if (error instanceof Error) {
      if (error.message === "NASABAH_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Nasabah tidak ditemukan",
        });
      }

      // ======================================
      // 9. SALDO TIDAK MENCUKUPI
      // ======================================

      if (error.message === "SALDO_TIDAK_CUKUP") {
        return res.status(400).json({
          success: false,
          message: "Saldo tidak mencukupi",
        });
      }
    }

    // ========================================
    // 10. ERROR SERVER
    // ========================================

    return res.status(500).json({
      success: false,
      message: "Gagal membuat penarikan",
    });
  }
}