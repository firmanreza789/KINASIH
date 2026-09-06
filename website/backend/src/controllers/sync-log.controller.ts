import { Request, Response } from "express";

import {
  getAllSyncLog,
  getSyncLogById,
  createSyncLog,
} from "../services/sync-log.service";

export async function getSyncLog(
  _req: Request,
  res: Response
) {
  try {
    const data = await getAllSyncLog();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data sync log",
    });
  }
}

export async function getSyncLogDetail(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID sync log tidak valid",
      });
    }

    const data = await getSyncLogById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Sync log tidak ditemukan",
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
      message: "Gagal mengambil detail sync log",
    });
  }
}

export async function createSyncLogController(
  req: Request,
  res: Response
) {
  try {
    const {
      tipeData,
      idData,
      aksi,
      status,
      keterangan,
    } = req.body;

    // ========================================
    // 1. VALIDASI FIELD WAJIB
    // ========================================

    if (
      tipeData === undefined ||
      idData === undefined ||
      aksi === undefined ||
      status === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "tipeData, idData, aksi, dan status wajib diisi",
      });
    }

    // ========================================
    // 2. VALIDASI TIPE DATA
    // ========================================

    if (
      typeof tipeData !== "string" ||
      tipeData.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "tipeData harus berupa teks dan tidak boleh kosong",
      });
    }

    // ========================================
    // 3. VALIDASI ID DATA
    // ========================================

    const dataId = Number(idData);

    if (!Number.isInteger(dataId) || dataId <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "idData harus berupa bilangan bulat positif",
      });
    }

    // ========================================
    // 4. VALIDASI AKSI
    // ========================================

    if (
      typeof aksi !== "string" ||
      aksi.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "aksi harus berupa teks dan tidak boleh kosong",
      });
    }

    // ========================================
    // 5. VALIDASI STATUS
    // ========================================

    if (
      typeof status !== "string" ||
      status.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "status harus berupa teks dan tidak boleh kosong",
      });
    }

    // ========================================
    // 6. VALIDASI KETERANGAN
    // ========================================

    if (
      keterangan !== undefined &&
      keterangan !== null &&
      typeof keterangan !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "keterangan harus berupa teks",
      });
    }

    // ========================================
    // 7. BUAT SYNC LOG
    // ========================================

    const data = await createSyncLog(
      tipeData.trim(),
      dataId,
      aksi.trim(),
      status.trim(),
      keterangan?.trim()
    );

    // ========================================
    // 8. RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,
      message: "Sync log berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal membuat sync log",
    });
  }
}