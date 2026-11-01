import { Request, Response } from "express";

import {
  getAllPenarikan,
  getPenarikanById,
  createPenarikan,
} from "../services/penarikan.service";

import {
  selectNasabahToken,
  pollStatusPenarikan,
  approvePenarikanToken,
} from "../services/penarikan-token.service";

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


// =====================================================
// 1. ESP32 MEMILIH NASABAH DAN MEMBUAT SESI TOKEN
// =====================================================

export async function selectNasabahTokenController(
  req: Request,
  res: Response
) {
  try {
    const { device_id, id_nasabah, token } = req.body;

    if (!device_id || !id_nasabah || !token) {
      return res.status(400).json({
        success: false,
        message: "device_id, id_nasabah, dan token wajib diisi",
      });
    }

    const nasabahId = Number(id_nasabah);

    if (!Number.isInteger(nasabahId) || nasabahId <= 0) {
      return res.status(400).json({
        success: false,
        message: "id_nasabah tidak valid",
      });
    }

    const data = await selectNasabahToken({
      device_id: String(device_id),
      id_nasabah: nasabahId,
      token: String(token),
    });

    return res.status(201).json({
      success: true,
      message: "Permintaan penarikan berhasil dikirim",
      status: data.status,
      expires_in: 60,
    });
  } catch (error) {
    console.error("SELECT NASABAH TOKEN ERROR:", error);

    if (error instanceof Error) {
      if (error.message === "TOKEN_TIDAK_VALID") {
        return res.status(400).json({
          success: false,
          message: "Token harus terdiri dari 6 digit",
        });
      }

      if (error.message === "NASABAH_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Nasabah tidak ditemukan",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Gagal membuat sesi penarikan",
    });
  }
}

// =====================================================
// 2. ESP32 MEMERIKSA STATUS PENARIKAN
// =====================================================

export async function pollStatusPenarikanController(
  req: Request,
  res: Response
) {
  try {
    const { device_id, id_nasabah, token } = req.query;

    if (!device_id || !id_nasabah || !token) {
      return res.status(400).json({
        success: false,
        message: "device_id, id_nasabah, dan token wajib diisi",
      });
    }

    const nasabahId = Number(id_nasabah);

    if (!Number.isInteger(nasabahId) || nasabahId <= 0) {
      return res.status(400).json({
        success: false,
        message: "id_nasabah tidak valid",
      });
    }

    const data = await pollStatusPenarikan({
      device_id: String(device_id),
      id_nasabah: nasabahId,
      token: String(token),
    });

    return res.status(data.status === "EXPIRED" ? 410 : 200).json(data);
  } catch (error) {
    console.error("POLL STATUS ERROR:", error);

    if (
      error instanceof Error &&
      error.message === "SESI_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        status: "NOT_FOUND",
        message: "Sesi penarikan tidak ditemukan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal memeriksa status penarikan",
    });
  }
}

// =====================================================
// 3. FRONTEND MENYETUJUI PENARIKAN
// =====================================================

export async function approvePenarikanTokenController(
  req: Request,
  res: Response
) {
  try {
    const {
      device_id,
      id_nasabah,
      token,
      jumlah_penarikan,
      keterangan,
    } = req.body;

    if (
      !device_id ||
      !id_nasabah ||
      !token ||
      jumlah_penarikan === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "device_id, id_nasabah, token, dan jumlah_penarikan wajib diisi",
      });
    }

    const nasabahId = Number(id_nasabah);
    const jumlah = Number(jumlah_penarikan);

    if (!Number.isInteger(nasabahId) || nasabahId <= 0) {
      return res.status(400).json({
        success: false,
        message: "id_nasabah tidak valid",
      });
    }

    if (
      !Number.isFinite(jumlah) ||
      jumlah <= 0 ||
      !hasMaxDecimals(jumlah, 2)
    ) {
      return res.status(400).json({
        success: false,
        message: "Jumlah penarikan tidak valid",
      });
    }

    const data = await approvePenarikanToken({
      device_id: String(device_id),
      id_nasabah: nasabahId,
      token: String(token),
      jumlah_penarikan: jumlah,
      keterangan:
        typeof keterangan === "string" ? keterangan : undefined,
    });

    return res.status(200).json({
      ...data,
      message: "Penarikan berhasil disetujui",
    });
  } catch (error) {
    console.error("APPROVE PENARIKAN ERROR:", error);

    if (error instanceof Error) {
      if (error.message === "NASABAH_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Nasabah tidak ditemukan",
        });
      }

      if (error.message === "SALDO_TIDAK_CUKUP") {
        return res.status(400).json({
          success: false,
          message: "Saldo tidak mencukupi",
        });
      }

      if (
        error.message === "SESI_TIDAK_VALID_ATAU_KEDALUWARSA"
      ) {
        return res.status(410).json({
          success: false,
          message: "Token tidak valid atau sesi telah kedaluwarsa",
        });
      }

      if (error.message === "JUMLAH_PENARIKAN_TIDAK_VALID") {
        return res.status(400).json({
          success: false,
          message: "Jumlah penarikan tidak valid",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Gagal menyetujui penarikan",
    });
  }
}