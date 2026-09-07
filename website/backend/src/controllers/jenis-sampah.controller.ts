import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

import {
  getAllJenisSampah,
  getJenisSampahById,
  createJenisSampah,
} from "../services/jenis-sampah.service";

export async function getJenisSampah(
  _req: Request,
  res: Response
) {
  try {
    const data = await getAllJenisSampah();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data jenis sampah",
    });
  }
}

export async function getJenisSampahDetail(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID jenis sampah tidak valid",
      });
    }

    const data = await getJenisSampahById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Jenis sampah tidak ditemukan",
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
      message: "Gagal mengambil detail jenis sampah",
    });
  }
}

export async function createJenisSampahController(
  req: Request,
  res: Response
) {
  try {
    const { idKategori, nama, hargaPerKG } = req.body;

    if (!idKategori || !nama || hargaPerKG === undefined) {
      return res.status(400).json({
        success: false,
        message: "idKategori, nama, dan hargaPerKG wajib diisi",
      });
    }

    if (typeof nama !== "string") {
      return res.status(400).json({
        success: false,
        message: "Nama jenis sampah harus berupa teks",
      });
    }

    const kategoriId = Number(idKategori);
    const harga = Number(hargaPerKG);

    if (isNaN(kategoriId) || isNaN(harga)) {
      return res.status(400).json({
        success: false,
        message: "idKategori dan hargaPerKG harus berupa angka",
      });
    }

    if (harga < 0) {
      return res.status(400).json({
        success: false,
        message: "hargaPerKG tidak boleh negatif",
      });
    }

    const data = await createJenisSampah(
      kategoriId,
      nama.trim(),
      harga
    );

    return res.status(201).json({
      success: true,
      message: "Jenis sampah berhasil dibuat",
      data,
    });
   } catch (error) {
    console.error("ERROR ASLI:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return res.status(404).json({
        success: false,
        message: "Kategori sampah tidak ditemukan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal membuat jenis sampah",
    });
  }
}