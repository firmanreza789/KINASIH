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

// Tombol export
btnExport.addEventListener("click", async function () {

    const mulai = tanggalMulai.value;
    const akhir = tanggalAkhir.value;
    let valid = true;

    // Cek tanggal mulai
    if (!mulai) {
        errorMulai.style.display = "block";
        tanggalMulai.classList.add("input-error");
        valid = false;
    } else {
        errorMulai.style.display = "none";
        tanggalMulai.classList.remove("input-error");
    }

    // Cek tanggal akhir
    if (!akhir) {
        errorAkhir.style.display = "block";
        tanggalAkhir.classList.add("input-error");
        valid = false;
    } else {
        errorAkhir.style.display = "none";
        tanggalAkhir.classList.remove("input-error");
    }

    // Hentikan proses kalau tanggal belum lengkap
    if (!valid) {
        return;
    }

    // Cek urutan tanggal
    if (mulai > akhir) {
        errorTanggal.style.display = "block";
        tanggalMulai.classList.add("input-error");
        tanggalAkhir.classList.add("input-error");
        return;
    }

    errorTanggal.style.display = "none";
    tanggalMulai.classList.remove("input-error");
    tanggalAkhir.classList.remove("input-error");

    // Tampilkan loading
    status.className = "status-message status-loading";
    status.textContent = "⏳ Menyiapkan laporan...";
    btnExport.disabled = true;

    try {

        // Ambil data dari backend
        const response = await fetch(`${API_URL}/api/transaksi`);
        const result = await response.json();

        // Cek response
        if (!response.ok || !result.success) {
            throw new Error("Gagal mengambil data transaksi");
        }

        // Filter berdasarkan tanggal
        const transaksi = result.data.filter(function (item) {

            const tanggal = item.tanggal.substring(0, 10);

            return tanggal >= mulai && tanggal <= akhir;
        });

        // Buat data Excel
        const dataLaporan = [];

        transaksi.forEach(function (item) {

            item.detailTransaksi.forEach(function (detail) {

                dataLaporan.push({
                No: dataLaporan.length + 1,
                Tanggal: new Date(item.tanggal).toLocaleDateString("id-ID"),
                "No KK": item.nasabah.noKK,
                "Nama Nasabah": item.nasabah.nama,
                Kategori: detail.jenisSampah.kategoriSampah.nama,
                "Jenis Sampah": detail.jenisSampah.nama,
                "Berat (Kg)": Number(detail.beratKg),
                "Harga/Kg": Number(detail.hargaPerKG),
                Subtotal: Number(detail.subTotal)
            });

            });

        });

        // Cek kalau tidak ada data
        if (dataLaporan.length === 0) {
            status.className = "status-message status-error";
            status.textContent = "⚠ Tidak ada transaksi pada periode tersebut.";
            return;
        }

        // Buat sheet
        const worksheet = XLSX.utils.json_to_sheet(dataLaporan);

        // Buat workbook
        const workbook = XLSX.utils.book_new();

        // Tambahkan sheet
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

        // Atur lebar kolom
        worksheet["!cols"] = [
            { wch: 5 },   // No
            { wch: 15 },  // Tanggal
            { wch: 20 },  // No KK
            { wch: 22 },  // Nama Nasabah
            { wch: 15 },  // Kategori
            { wch: 20 },  // Jenis Sampah
            { wch: 12 },  // Berat
            { wch: 15 },  // Harga/Kg 
            { wch: 15 }   // Subtotal
        ];

        // Format harga dan subtotal menjadi Rupiah
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        for (let row = 1; row <= range.e.r; row++) {

            const hargaCell = worksheet[XLSX.utils.encode_cell({
                r: row,
                c: 7
            })];

            const subtotalCell = worksheet[XLSX.utils.encode_cell({
                r: row,
                c: 8
            })];

            if (hargaCell) {
                hargaCell.z = '"Rp" #,##0';
            }

            if (subtotalCell) {
                subtotalCell.z = '"Rp" #,##0';
            }
        }

        // Nama file
        const namaFile = `Laporan_KINASIH_${mulai}_${akhir}.xlsx`;

        // Download Excel
        XLSX.writeFile(workbook, namaFile);

        // Tampilkan status
        status.className = "status-message status-success";
        status.textContent = "✓ Laporan berhasil diexport.";

    } catch (error) {

        // Tampilkan error
        console.error(error);

        status.className = "status-message status-error";
        status.textContent = "⚠ Gagal mengambil data transaksi.";

    } finally {

        // Aktifkan tombol kembali
        btnExport.disabled = false;
    }

});


// Tombol cek saldo
btnCekSaldo.addEventListener("click", async function () {

    const nomorKK = noKK.value.trim();

    // Cek nomor KK
    if (!nomorKK) {
        errorKK.textContent = "⚠ Wajib diisi";
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    // Cek nomor KK harus 16 digit
    if (!/^\d{16}$/.test(nomorKK)) {
        errorKK.textContent = "⚠ Nomor KK harus 16 digit";
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        return;
    }

    errorKK.style.display = "none";
    noKK.classList.remove("input-error");

    // Tampilkan loading
    saldoResult.style.display = "block";
    saldoResult.textContent = "⏳ Mengecek saldo...";

    btnCekSaldo.disabled = true;

    try {

        // Proses ambil saldo dari backend nanti di sini

    } catch (error) {

        // Tampilkan error
        console.error(error);

        saldoResult.textContent = "⚠ Gagal mengambil data saldo.";

    } finally {

        // Aktifkan tombol kembali
        btnCekSaldo.disabled = false;
    }

});
