import { Router } from "express";

import {
  getJenisSampah,
  getJenisSampahDetail,
  createJenisSampahController,
} from "../controllers/jenis-sampah.controller";

const router = Router();

router.get("/", getJenisSampah);
router.get("/:id", getJenisSampahDetail);
router.post("/", createJenisSampahController);

export default router;