// ==========================================
// KINASIH - EXPORT EXCEL DAN CEK SALDO
// ==========================================

// Ambil elemen HTML
const tanggalMulai = document.getElementById("tanggalMulai");
const tanggalAkhir = document.getElementById("tanggalAkhir");
const btnExport = document.getElementById("btnExport");
const errorTanggal = document.getElementById("errorTanggal");
const errorMulai = document.getElementById("errorMulai");
const errorAkhir = document.getElementById("errorAkhir");
const status = document.getElementById("status");

// Elemen cek saldo
const noKK = document.getElementById("noKK");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const errorKK = document.getElementById("errorKK");
const saldoResult = document.getElementById("saldoResult");

// URL backend
const API_URL = "https://kinasih-backend.vercel.app";
const API_KEY = "kinasih_secret_device_key_2026";

// ==========================================
// EXPORT TRANSAKSI KE EXCEL
// ==========================================

btnExport.addEventListener("click", async function () {
    const mulai = tanggalMulai.value;
    const akhir = tanggalAkhir.value;

    let valid = true;

    // Validasi tanggal mulai
    if (!mulai) {
        errorMulai.style.display = "block";
        tanggalMulai.classList.add("input-error");
        valid = false;
    } else {
        errorMulai.style.display = "none";
        tanggalMulai.classList.remove("input-error");
    }

    // Validasi tanggal akhir
    if (!akhir) {
        errorAkhir.style.display = "block";
        tanggalAkhir.classList.add("input-error");
        valid = false;
    } else {
        errorAkhir.style.display = "none";
        tanggalAkhir.classList.remove("input-error");
    }

    if (!valid) return;

    // Pastikan tanggal mulai tidak melewati tanggal akhir
    if (mulai > akhir) {
        errorTanggal.style.display = "block";
        tanggalMulai.classList.add("input-error");
        tanggalAkhir.classList.add("input-error");
        return;
    }

    errorTanggal.style.display = "none";
    tanggalMulai.classList.remove("input-error");
    tanggalAkhir.classList.remove("input-error");

    status.className = "status-message status-loading";
    status.textContent = "⏳ Menyiapkan laporan...";
    btnExport.disabled = true;

    try {
        // Ambil data transaksi dari backend
        const response = await fetch(`${API_URL}/api/transaksi`, {
            method: "GET",
            headers: {
                "X-API-KEY": API_KEY,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Gagal mengambil data transaksi"
            );
        }

        // Pastikan data transaksi berbentuk array
        const semuaTransaksi = Array.isArray(result.data)
            ? result.data
            : [];

        // Filter transaksi berdasarkan tanggal
        const transaksi = semuaTransaksi.filter(function (item) {
            if (!item || !item.tanggal_waktu) {
                return false;
            }

            // Ambil tanggal dengan format YYYY-MM-DD
            const tanggal = String(item.tanggal_waktu).slice(0, 10);

            return tanggal >= mulai && tanggal <= akhir;
        });

        // Log untuk pemeriksaan di Console browser
        console.log(
            "Total transaksi dari API:",
            semuaTransaksi.length
        );

        console.log(
            "Transaksi sesuai periode:",
            transaksi.length
        );

        console.log(
            "Data transaksi sesuai periode:",
            transaksi
        );

        // Siapkan baris laporan Excel
        const dataLaporan = [];

        transaksi.forEach(function (item) {
            const items = Array.isArray(item.items)
                ? item.items
                : [];

            items.forEach(function (detail) {
                dataLaporan.push({
                    No: dataLaporan.length + 1,

                    Tanggal: String(item.tanggal_waktu).slice(0, 10),

                    "No KK": item.no_kk || "",

                    "Nama Nasabah": item.nama || "",

                    "Jenis Sampah": detail.nama_jenis || "",

                    "Berat (Kg)": Number(detail.berat_kg) || 0,

                    "Harga/Kg": Number(detail.harga_per_kg) || 0,

                    Subtotal: Number(detail.subtotal) || 0
                });
            });
        });

        // Periksa apakah ada transaksi pada periode tersebut
        if (dataLaporan.length === 0) {
            status.className = "status-message status-error";

            status.textContent =
                "⚠ Tidak ada detail transaksi pada periode tersebut. Periksa tanggal dan Console browser.";

            return;
        }

        // Pastikan library XLSX sudah dimuat
        if (typeof XLSX === "undefined") {
            throw new Error(
                "Library XLSX belum dimuat pada halaman HTML"
            );
        }

        // Buat worksheet dan workbook
        const worksheet = XLSX.utils.json_to_sheet(dataLaporan);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Laporan"
        );

        // Atur lebar kolom Excel
        worksheet["!cols"] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 20 },
            { wch: 22 },
            { wch: 20 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 }
        ];

        // Format harga dan subtotal menjadi Rupiah
        const range = XLSX.utils.decode_range(
            worksheet["!ref"]
        );

        for (let row = 1; row <= range.e.r; row++) {
            const hargaCell =
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 6
                    })
                ];

            const subtotalCell =
                worksheet[
                    XLSX.utils.encode_cell({
                        r: row,
                        c: 7
                    })
                ];

            if (hargaCell) {
                hargaCell.z = '"Rp" #,##0';
            }

            if (subtotalCell) {
                subtotalCell.z = '"Rp" #,##0';
            }
        }

        // Download file Excel
        const namaFile =
            `Laporan_KINASIH_${mulai}_${akhir}.xlsx`;

        XLSX.writeFile(workbook, namaFile);

        status.className = "status-message status-success";

        status.textContent =
            `✓ Laporan berhasil diexport (${dataLaporan.length} baris detail transaksi).`;

    } catch (error) {
        console.error("Export error:", error);

        status.className = "status-message status-error";

        status.textContent =
            `⚠ Gagal mengambil data transaksi. (${error.message})`;

    } finally {
        btnExport.disabled = false;
    }
});

// ==========================================
// CEK SALDO NASABAH
// ==========================================

// Bagian ini baru melakukan validasi.
// Belum mengambil saldo karena endpoint cek saldo
// belum tersedia pada kode backend yang diberikan.

btnCekSaldo.addEventListener("click", async function () {
    const nomorKK = noKK.value.trim();

    if (!nomorKK) {
        errorKK.textContent = "⚠ Wajib diisi";
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    if (!/^\d{16}$/.test(nomorKK)) {
        errorKK.textContent =
            "⚠ Nomor KK harus 16 digit";

        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    errorKK.style.display = "none";
    noKK.classList.remove("input-error");

    saldoResult.style.display = "block";

    saldoResult.textContent =
        "Fitur cek saldo belum terhubung ke endpoint backend.";
});
