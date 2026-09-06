import { Request, Response } from "express";
import {
  getAllNasabah,
  getNasabahById,
  createNasabah,
} from "../services/nasabah.service";

export async function getNasabah(_req: Request, res: Response) {
  try {
    const data = await getAllNasabah();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data nasabah",
    });
  }
}

export async function getNasabahDetail(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID nasabah tidak valid",
      });
    }

    const data = await getNasabahById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Nasabah tidak ditemukan",
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
      message: "Gagal mengambil detail nasabah",
    });
  }
}

export async function createNasabahController(
  req: Request,
  res: Response
) {
  try {
    const { noKK, nama } = req.body;

    if (!noKK || !nama) {
      return res.status(400).json({
        success: false,
        message: "noKK dan nama wajib diisi",
      });
    }

    if (typeof noKK !== "string" || typeof nama !== "string") {
      return res.status(400).json({
        success: false,
        message: "noKK dan nama harus berupa teks",
      });
    }

    const noKKTrimmed = noKK.trim();
    const namaTrimmed = nama.trim();

    if (!noKKTrimmed || !namaTrimmed) {
      return res.status(400).json({
        success: false,
        message: "noKK dan nama tidak boleh kosong",
      });
    }

    const data = await createNasabah(
      noKKTrimmed,
      namaTrimmed
    );

    return res.status(201).json({
      success: true,
      message: "Nasabah berhasil dibuat",
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal membuat nasabah",
    });
  }
}