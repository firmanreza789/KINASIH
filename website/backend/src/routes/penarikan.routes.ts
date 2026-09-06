import { Router } from "express";

import {
  getPenarikan,
  getPenarikanDetail,
  createPenarikanController,
} from "../controllers/penarikan.controller";

const router = Router();

router.get("/", getPenarikan);
router.get("/:id", getPenarikanDetail);
router.post("/", createPenarikanController);

export default router;