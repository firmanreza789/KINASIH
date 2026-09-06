import { Router } from "express";

import {
  getTransaksi,
  getTransaksiDetail,
  createTransaksiController,
} from "../controllers/transaksi.controller";

const router = Router();

router.get("/", getTransaksi);
router.post("/", createTransaksiController);
router.get("/:id", getTransaksiDetail);

export default router;