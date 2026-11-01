import { Router } from "express";

import {
  getPenarikan,
  getPenarikanDetail,
  createPenarikanController,
  selectNasabahTokenController,
  pollStatusPenarikanController,
  approvePenarikanTokenController,
} from "../controllers/penarikan.controller";

const router = Router();

// ========================================
// PENARIKAN TOKEN KINASIH
// ========================================

router.post("/select-nasabah", selectNasabahTokenController);
router.get("/poll-status", pollStatusPenarikanController);
router.post("/approve", approvePenarikanTokenController);

// ========================================
// PENARIKAN LAMA
// ========================================

router.get("/", getPenarikan);
router.post("/", createPenarikanController);
router.get("/:id", getPenarikanDetail);

export default router;