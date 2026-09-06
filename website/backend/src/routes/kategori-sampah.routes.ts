import { Router } from "express";
import {
  getKategoriSampah,
  getKategoriSampahDetail,
  createKategoriSampahController,

} from "../controllers/kategori-sampah.controller";

const router = Router();

router.get("/", getKategoriSampah);
router.get("/:id", getKategoriSampahDetail);
router.post("/", createKategoriSampahController);

export default router;