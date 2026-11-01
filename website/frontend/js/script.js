// ====================================================================
// KONFIGURASI API & ELEMEN DASAR
// ====================================================================
const API_URL = "https://kinasih-backend.vercel.app";
const API_KEY = "kinasih_secret_device_key_2026";

// Elemen Export Laporan
const tanggalMulai = document.getElementById("tanggalMulai");
const tanggalAkhir = document.getElementById("tanggalAkhir");
const btnExport = document.getElementById("btnExport");
const errorTanggal = document.getElementById("errorTanggal");
const errorMulai = document.getElementById("errorMulai");
const errorAkhir = document.getElementById("errorAkhir");
const status = document.getElementById("status");

// Elemen Cek Saldo
const noKK = document.getElementById("noKK");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const errorKK = document.getElementById("errorKK");
const saldoResult = document.getElementById("saldoResult");

// Elemen Penarikan Saldo (Card Utama)
const tarikNoKK = document.getElementById("tarikNoKK");
const tarikToken = document.getElementById("tarikToken");
const tarikNominal = document.getElementById("tarikNominal");
const btnTarikSaldo = document.getElementById("btnTarikSaldo");
const errorTarikKK = document.getElementById("errorTarikKK");
const errorTarikToken = document.getElementById("errorTarikToken");
const errorTarikNominal = document.getElementById("errorTarikNominal");
const tarikResult = document.getElementById("tarikResult");

// Helper Format Mata Uang Rupiah (Contoh: Rp 150.000)
const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(angka || 0);
};


// ====================================================================
// 1. FITUR EXPORT LAPORAN KE EXCEL
// ====================================================================
btnExport.addEventListener("click", async function () {
    const mulai = tanggalMulai.value;
    const akhir = tanggalAkhir.value;
    let valid = true;

    if (!mulai) {
        errorMulai.style.display = "block";
        tanggalMulai.classList.add("input-error");
        valid = false;
    } else {
        errorMulai.style.display = "none";
        tanggalMulai.classList.remove("input-error");
    }

    if (!akhir) {
        errorAkhir.style.display = "block";
        tanggalAkhir.classList.add("input-error");
        valid = false;
    } else {
        errorAkhir.style.display = "none";
        tanggalAkhir.classList.remove("input-error");
    }

    if (!valid) return;

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
    status.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Menyiapkan laporan...`;
    btnExport.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/transaksi`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengambil data transaksi");
        }

        const transaksi = result.data.filter(function (item) {
            const tanggal = (item.tanggal_waktu || "").substring(0, 10);
            return tanggal >= mulai && tanggal <= akhir;
        });

        const dataLaporan = [];

        transaksi.forEach(function (item) {
            if (Array.isArray(item.items)) {
                item.items.forEach(function (detail) {
                    dataLaporan.push({
                        No: dataLaporan.length + 1,
                        Tanggal: new Date(item.tanggal_waktu).toLocaleDateString("id-ID"),
                        "No KK": item.no_kk,                
                        "Nama Nasabah": item.nama,          
                        "Jenis Sampah": detail.nama_jenis,  
                        "Berat (Kg)": Number(detail.berat_kg), 
                        "Harga/Kg": Number(detail.harga_per_kg), 
                        Subtotal: Number(detail.subtotal)   
                    });
                });
            }
        });

        if (dataLaporan.length === 0) {
            status.className = "status-message status-error";
            status.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Tidak ada transaksi pada periode tersebut.`;
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

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

        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        for (let row = 1; row <= range.e.r; row++) {
            const hargaCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })];
            const subtotalCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })];

            if (hargaCell) hargaCell.z = '"Rp" #,##0';
            if (subtotalCell) subtotalCell.z = '"Rp" #,##0';
        }

        const namaFile = `Laporan_KINASIH_${mulai}_${akhir}.xlsx`;
        XLSX.writeFile(workbook, namaFile);

        status.className = "status-message status-success";
        status.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Laporan berhasil diexport.`;

    } catch (error) {
        console.error(error);
        status.className = "status-message status-error";
        status.innerHTML = `<i class="bi bi-x-circle me-1"></i> Gagal mengambil data transaksi. (${error.message})`;
    } finally {
        btnExport.disabled = false;
    }
});


// ====================================================================
// 2. FITUR CEK SALDO WARGA
// ====================================================================
btnCekSaldo.addEventListener("click", async function () {
    const nomorKK = noKK.value.trim();

    if (!nomorKK) {
        errorKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Wajib diisi`;
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    if (!/^\d{16}$/.test(nomorKK)) {
        errorKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Nomor KK harus 16 digit angka`;
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    errorKK.style.display = "none";
    noKK.classList.remove("input-error");

    saldoResult.style.display = "block";
    saldoResult.className = "saldo-result status-loading text-center p-3";
    saldoResult.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Mengecek saldo...`;
    btnCekSaldo.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/nasabah`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal menghubungi server");
        }

        const nasabah = result.data.find(function (item) {
            return String(item.noKK).trim() === nomorKK;
        });

        if (!nasabah) {
            saldoResult.className = "saldo-result status-error text-danger mt-3 text-center";
            saldoResult.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Nomor KK tidak terdaftar dalam sistem.`;
        } else {
            saldoResult.className = "saldo-result status-success mt-3 p-3 border rounded bg-light text-start";
            saldoResult.innerHTML = `
                <div style="font-size: 0.9rem; color: #666;">Nama Nasabah:</div>
                <div style="font-size: 1.15rem; font-weight: bold; color: #222;">${nasabah.nama}</div>
                <hr style="margin: 8px 0;">
                <div style="font-size: 0.9rem; color: #666;">Total Saldo Tabungan:</div>
                <div style="font-size: 1.35rem; font-weight: bold; color: #1D553E;">
                    ${formatRupiah(nasabah.saldo)}
                </div>
            `;
        }
    } catch (error) {
        console.error(error);
        saldoResult.className = "saldo-result status-error text-danger mt-3 text-center";
        saldoResult.innerHTML = `<i class="bi bi-x-circle me-1"></i> Gagal mengambil data saldo. (${error.message})`;
    } finally {
        btnCekSaldo.disabled = false;
    }
});


// ====================================================================
// 3. FITUR PENARIKAN SALDO KASIR (CARD UTAMA)
// ====================================================================
if (btnTarikSaldo) {
    btnTarikSaldo.addEventListener("click", async function () {
        const noKKVal = (tarikNoKK ? tarikNoKK.value : "").trim();
        const tokenVal = (tarikToken ? tarikToken.value : "").trim();
        const nominalVal = Number(tarikNominal ? tarikNominal.value : 0);
        let valid = true;

        // 1. Validasi Nomor KK (16 digit angka)
        if (!noKKVal) {
            errorTarikKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Wajib diisi`;
            errorTarikKK.style.display = "block";
            tarikNoKK.classList.add("input-error");
            valid = false;
        } else if (!/^\d{16}$/.test(noKKVal)) {
            errorTarikKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Nomor KK harus 16 digit angka`;
            errorTarikKK.style.display = "block";
            tarikNoKK.classList.add("input-error");
            valid = false;
        } else {
            errorTarikKK.style.display = "none";
            tarikNoKK.classList.remove("input-error");
        }

        // 2. Validasi Token (6 digit angka dari timbangan)
        if (!tokenVal) {
            errorTarikToken.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Wajib diisi token`;
            errorTarikToken.style.display = "block";
            tarikToken.classList.add("input-error");
            valid = false;
        } else if (!/^\d{6}$/.test(tokenVal)) {
            errorTarikToken.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Token harus 6 digit angka`;
            errorTarikToken.style.display = "block";
            tarikToken.classList.add("input-error");
            valid = false;
        } else {
            errorTarikToken.style.display = "none";
            tarikToken.classList.remove("input-error");
        }

        // 3. Validasi Nominal Penarikan
        if (!nominalVal || nominalVal <= 0) {
            errorTarikNominal.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Masukkan nominal penarikan yang valid`;
            errorTarikNominal.style.display = "block";
            tarikNominal.classList.add("input-error");
            valid = false;
        } else {
            errorTarikNominal.style.display = "none";
            tarikNominal.classList.remove("input-error");
        }

        if (!valid) return;

        tarikResult.style.display = "block";
        tarikResult.className = "saldo-result status-loading text-center p-3 mt-3";
        tarikResult.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Memproses persetujuan penarikan...`;
        btnTarikSaldo.disabled = true;

        try {
            // A. Cek data nasabah ke database
            const resNasabah = await fetch(`${API_URL}/api/nasabah`);
            const dataNasabah = await resNasabah.json();

            if (!resNasabah.ok || !dataNasabah.success) {
                throw new Error(dataNasabah.message || "Gagal menghubungi database nasabah");
            }

            const nasabah = dataNasabah.data.find(function (item) {
                return String(item.noKK).trim() === noKKVal;
            });

            if (!nasabah) {
                throw new Error("Nomor KK tidak terdaftar dalam sistem.");
            }

            if (nominalVal > Number(nasabah.saldo)) {
                throw new Error(`Saldo tidak mencukupi. Saldo saat ini: ${formatRupiah(nasabah.saldo)}`);
            }

            // B. Kirim persetujuan penarikan ke backend
            const payload = {
                device_id: "ESP32-KINASIH-01",
                id_nasabah: nasabah.idNasabah,
                token: tokenVal,
                jumlah_penarikan: nominalVal,
                keterangan: "Penarikan tunai pos"
            };

            const approveRes = await fetch(`${API_URL}/api/penarikan/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const approveResult = await approveRes.json();

            if (!approveRes.ok || !approveResult.success) {
                throw new Error(approveResult.message || "Gagal memproses penarikan saldo");
            }

            // C. Tampilkan bukti penarikan berhasil
            const saldoSisa = approveResult.data?.saldo_sesudah ?? (nasabah.saldo - nominalVal);

            tarikResult.className = "saldo-result status-success mt-3 p-3 border rounded bg-light text-start";
            tarikResult.innerHTML = `
                <div class="d-flex align-items-center text-success fw-bold mb-2">
                    <i class="bi bi-check-circle-fill fs-5 me-2"></i> Penarikan Berhasil Disetujui!
                </div>
                <div style="font-size: 0.9rem; color: #666;">Nama Nasabah:</div>
                <div style="font-size: 1.15rem; font-weight: bold; color: #222;">${nasabah.nama}</div>
                <hr style="margin: 8px 0;">
                <div class="d-flex justify-content-between mb-1">
                    <span style="font-size: 0.9rem; color: #666;">Nominal Ditarik:</span>
                    <span class="fw-bold text-danger">${formatRupiah(nominalVal)}</span>
                </div>
                <div class="d-flex justify-content-between">
                    <span style="font-size: 0.9rem; color: #666;">Sisa Saldo:</span>
                    <span class="fw-bold text-success">${formatRupiah(saldoSisa)}</span>
                </div>
            `;

            // Reset field token dan nominal
            tarikToken.value = "";
            tarikNominal.value = "";

        } catch (error) {
            console.error(error);
            tarikResult.className = "saldo-result status-error text-danger mt-3 text-center";
            tarikResult.innerHTML = `<i class="bi bi-x-circle me-1"></i> ${error.message}`;
        } finally {
            btnTarikSaldo.disabled = false;
        }
    });
}