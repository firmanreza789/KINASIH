import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import {
  getAllKategoriSampah,
  getKategoriSampahById,
  createKategoriSampah,

} from "../services/kategori-sampah.service";

export async function getKategoriSampah(
  _req: Request,
  res: Response
) {
  try {
    const data = await getAllKategoriSampah();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("ERROR ASLI:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori sampah",
    });
  }
}

export async function getKategoriSampahDetail(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    const data = await getKategoriSampahById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Kategori sampah tidak ditemukan",
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
      message: "Gagal mengambil data kategori sampah",
    });
  }
}


export async function createKategoriSampahController(
  req: Request,
  res: Response
) {
  try {
    const { nama } = req.body;

    if (!nama || typeof nama !== "string") {
      return res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi",
      });
    }

    const data = await createKategoriSampah(nama.trim());

    return res.status(201).json({
      success: true,
      message: "Kategori sampah berhasil dibuat",
      data,
    });
  } catch (error) {
  console.error("ERROR ASLI:", error);

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "Nama kategori sampah sudah digunakan",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Gagal membuat kategori sampah",
  });
}
}