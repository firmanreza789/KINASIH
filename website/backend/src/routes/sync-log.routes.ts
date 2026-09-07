import { Router } from "express";

import {
  getSyncLog,
  getSyncLogDetail,
  createSyncLogController,
} from "../controllers/sync-log.controller";

const router = Router();

router.get("/", getSyncLog);
router.post("/", createSyncLogController);
router.get("/:id", getSyncLogDetail);

export default router;