import express from "express";
import cors from "cors";

import kategoriSampahRoutes from "./routes/kategori-sampah.routes";
import jenisSampahRoutes from "./routes/jenis-sampah.routes";
import nasabahRoutes from "./routes/nasabah.routes";
import transaksiRoutes from "./routes/transaksi.routes";
import penarikanRoutes from "./routes/penarikan.routes";
import syncLogRoutes from "./routes/sync-log.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/kategori-sampah", kategoriSampahRoutes);
app.use("/api/jenis-sampah", jenisSampahRoutes);
app.use("/api/nasabah", nasabahRoutes);
app.use("/api/transaksi", transaksiRoutes);
app.use("/api/penarikan", penarikanRoutes);
app.use("/api/sync-log", syncLogRoutes);

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "KINASIH API is running",
    });
});

export default app;