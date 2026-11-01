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
                <div style="font-size: 1.35rem; font-weight: bold; color: #2e7d32;">
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
// 3. FITUR PENARIKAN SALDO KASIR VIA TOKEN (PAK BABAN)
// ====================================================================
let activeSession = null;
let countdownInterval = null;

// Elemen Toast & Modal Penarikan
const toastEl = document.getElementById("toastPenarikan");
const modalProsesEl = document.getElementById("modalProsesPenarikan");
const toastBootstrap = toastEl ? bootstrap.Toast.getOrCreateInstance(toastEl) : null;
const modalProses = modalProsesEl ? new bootstrap.Modal(modalProsesEl) : null;

// A. Polling Cek Permintaan Penarikan dari ESP32 (Tiap 3 Detik)
async function pollPendingWithdrawal() {
    try {
        const res = await fetch(`${API_URL}/api/penarikan/active-session`);
        const json = await res.json();

        if (json.success && json.data && json.data.status === "WAITING") {
            // Jika ada permintaan penarikan baru yang belum diproses
            if (!activeSession || activeSession.id_nasabah !== json.data.id_nasabah) {
                activeSession = json.data;
                const toastMsg = document.getElementById("toastNotifMsg");
                if (toastMsg) {
                    toastMsg.textContent = `Mau tarik saldo? ${activeSession.nama} meminta penarikan.`;
                }
                if (toastBootstrap) {
                    toastBootstrap.show();
                }
            }
        } else {
            activeSession = null;
        }
    } catch (err) {
        // Abaikan error saat backend belum selesai dideploy
    }
}
setInterval(pollPendingWithdrawal, 3000);

// B. Buka Modal Saat Tombol "Proses" di Toast Diklik
const btnBukaModalTarik = document.getElementById("btnBukaModalTarik");
if (btnBukaModalTarik) {
    btnBukaModalTarik.addEventListener("click", () => {
        if (!activeSession) return;

        document.getElementById("tarikNamaNasabah").textContent = activeSession.nama;
        document.getElementById("tarikNoKK").textContent = activeSession.no_kk;
        document.getElementById("tarikSaldoTersedia").textContent = formatRupiah(activeSession.saldo);
        document.getElementById("inputJumlahPenarikan").max = activeSession.saldo;
        document.getElementById("inputJumlahPenarikan").value = "";
        document.getElementById("inputTokenPenarikan").value = "";
        document.getElementById("errorTarik").style.display = "none";
        document.getElementById("btnSubmitTarik").disabled = false;

        // Mulai Timer 60 Detik
        startCountdown(activeSession.expires_in || 60);

        if (toastBootstrap) toastBootstrap.hide();
        if (modalProses) modalProses.show();
    });
}

// C. Timer Hitung Mundur Token (60 Detik)
function startCountdown(seconds) {
    clearInterval(countdownInterval);
    let sisa = seconds;
    const badge = document.getElementById("countdownToken");

    countdownInterval = setInterval(() => {
        sisa--;
        if (badge) badge.textContent = `${sisa}s`;

        if (sisa <= 0) {
            clearInterval(countdownInterval);
            if (badge) badge.textContent = "EXPIRED";
            const errEl = document.getElementById("errorTarik");
            if (errEl) {
                errEl.innerHTML = `<i class="bi bi-clock-history me-1"></i> Sesi penarikan telah kedaluwarsa. Silakan ulangi pemilihan nasabah di layar timbangan.`;
                errEl.style.display = "block";
            }
            const submitBtn = document.getElementById("btnSubmitTarik");
            if (submitBtn) submitBtn.disabled = true;
        }
    }, 1000);
}

// D. Tombol Pintas Nominal
const btnQuick50 = document.getElementById("btnQuick50");
const btnQuick100 = document.getElementById("btnQuick100");
const btnTarikSemua = document.getElementById("btnTarikSemua");

if (btnQuick50) {
    btnQuick50.addEventListener("click", () => {
        document.getElementById("inputJumlahPenarikan").value = 50000;
    });
}
if (btnQuick100) {
    btnQuick100.addEventListener("click", () => {
        document.getElementById("inputJumlahPenarikan").value = 100000;
    });
}
if (btnTarikSemua) {
    btnTarikSemua.addEventListener("click", () => {
        if (activeSession) {
            document.getElementById("inputJumlahPenarikan").value = activeSession.saldo;
        }
    });
}

// E. Proses Submit Persetujuan Penarikan
const formPenarikan = document.getElementById("formPenarikan");
if (formPenarikan) {
    formPenarikan.addEventListener("submit", async function (e) {
        e.preventDefault();
        const token = document.getElementById("inputTokenPenarikan").value.trim();
        const jumlah = Number(document.getElementById("inputJumlahPenarikan").value);
        const keterangan = document.getElementById("inputKeteranganPenarikan").value.trim();
        const errorEl = document.getElementById("errorTarik");
        const submitBtn = document.getElementById("btnSubmitTarik");

        if (token.length !== 6) {
            errorEl.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Token harus terdiri dari 6 digit angka.`;
            errorEl.style.display = "block";
            return;
        }

        if (jumlah <= 0 || jumlah > Number(activeSession.saldo)) {
            errorEl.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i> Nominal tidak valid atau melebihi saldo nasabah.`;
            errorEl.style.display = "block";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Memproses...`;

        try {
            const payload = {
                device_id: activeSession.device_id,
                id_nasabah: activeSession.id_nasabah,
                token: token,
                jumlah_penarikan: jumlah,
                keterangan: keterangan || "Penarikan tunai"
            };

            const res = await fetch(`${API_URL}/api/penarikan/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Gagal menyetujui penarikan");
            }

            clearInterval(countdownInterval);
            alert(`Pencairan Berhasil Disetujui!\nJumlah Ditarik: ${formatRupiah(jumlah)}\nSisa Saldo: ${formatRupiah(result.data.saldo_sesudah)}`);
            
            if (modalProses) modalProses.hide();
            activeSession = null;

        } catch (err) {
            errorEl.innerHTML = `<i class="bi bi-x-circle me-1"></i> ${err.message}`;
            errorEl.style.display = "block";
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Setujui & Cairkan Saldo`;
        }
    });
}