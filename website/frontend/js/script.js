// Ambil elemen HTML
const tanggalMulai = document.getElementById("tanggalMulai");
const tanggalAkhir = document.getElementById("tanggalAkhir");
const btnExport = document.getElementById("btnExport");
const errorTanggal = document.getElementById("errorTanggal");
const errorMulai = document.getElementById("errorMulai");
const errorAkhir = document.getElementById("errorAkhir");
const status = document.getElementById("status");

// Ambil elemen cek saldo
const noKK = document.getElementById("noKK");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const errorKK = document.getElementById("errorKK");
const saldoResult = document.getElementById("saldoResult");

// URL backend
const API_URL = "https://kinasih-backend.vercel.app";
// API KEY DARI KETUA
const API_KEY = "kinasih_secret_device_key_2026";

// Tombol export
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
    status.textContent = "⏳ Menyiapkan laporan...";
    btnExport.disabled = true;

    try {
        // MENGIRIM REQUEST DENGAN API KEY
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
            const tanggal = item.tanggal_waktu.substring(0, 10);
            return tanggal >= mulai && tanggal <= akhir;
        });

        console.log("Semua transaksi:", result.data);
console.log("Periode:", mulai, "sampai", akhir);
console.log("Transaksi setelah filter:", transaksi);

        const dataLaporan = [];

        transaksi.forEach(function (item) {
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
        });

        if (dataLaporan.length === 0) {
            status.className = "status-message status-error";
            status.textContent = "⚠ Tidak ada transaksi pada periode tersebut.";
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
        status.textContent = "✓ Laporan berhasil diexport.";

    } catch (error) {
        console.error(error);
        status.className = "status-message status-error";
        status.textContent = `⚠ Gagal mengambil data transaksi. (${error.message})`;
    } finally {
        btnExport.disabled = false;
    }
});

// Tombol cek saldo
btnCekSaldo.addEventListener("click", async function () {
    const nomorKK = noKK.value.trim();

    if (!nomorKK) {
        errorKK.textContent = "⚠ Wajib diisi";
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    if (!/^\d{16}$/.test(nomorKK)) {
        errorKK.textContent = "⚠ Nomor KK harus 16 digit";
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    errorKK.style.display = "none";
    noKK.classList.remove("input-error");

    saldoResult.style.display = "block";
    saldoResult.textContent = "⏳ Mengecek saldo...";
    btnCekSaldo.disabled = true;

    try {
        // Contoh jika API cek saldo juga pakai API Key
        /*
        const response = await fetch(`${API_URL}/api/nasabah/saldo?no_kk=${nomorKK}`, {
            headers: { 'X-API-KEY': API_KEY }
        });
        */
    } catch (error) {
        console.error(error);
        saldoResult.textContent = "⚠ Gagal mengambil data saldo.";
    } finally {
        btnCekSaldo.disabled = false;
    }
});
