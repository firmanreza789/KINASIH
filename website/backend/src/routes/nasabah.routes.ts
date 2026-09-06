import { Router } from "express";

import {
  getNasabah,
  getNasabahDetail,
  createNasabahController,
} from "../controllers/nasabah.controller";

const router = Router();

router.get("/", getNasabah);
router.get("/:id", getNasabahDetail);
router.post("/", createNasabahController);

export default router;