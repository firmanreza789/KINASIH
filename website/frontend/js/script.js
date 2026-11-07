// config api & key backend
const API_URL = "https://kinasih-backend.vercel.app";
const API_KEY = "kinasih_secret_device_key_2026";

// elemen form export laporan
const tanggalMulai = document.getElementById("tanggalMulai");
const tanggalAkhir = document.getElementById("tanggalAkhir");
const btnExport = document.getElementById("btnExport");
const errorTanggal = document.getElementById("errorTanggal");
const errorMulai = document.getElementById("errorMulai");
const errorAkhir = document.getElementById("errorAkhir");
const status = document.getElementById("status");

// elemen cek saldo
const noKK = document.getElementById("noKK");
const btnCekSaldo = document.getElementById("btnCekSaldo");
const errorKK = document.getElementById("errorKK");
const saldoResult = document.getElementById("saldoResult");

// elemen penarikan saldo
const tarikNoKK = document.getElementById("tarikNoKK");
const tarikToken = document.getElementById("tarikToken");
const tarikNominal = document.getElementById("tarikNominal");
const btnTarikSaldo = document.getElementById("btnTarikSaldo");
const errorTarikKK = document.getElementById("errorTarikKK");
const errorTarikToken = document.getElementById("errorTarikToken");
const errorTarikNominal = document.getElementById("errorTarikNominal");
const tarikResult = document.getElementById("tarikResult");

// elemen modal tentang pengembang (eclipse team)
const btnBukaPengembang = document.getElementById("btnBukaPengembang");
const elModalPengembang = document.getElementById("modalTentangPengembang");

// fungsi bantu format rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(angka || 0);
};

// fungsi bantu format tanggal lokal
const getLocalDateString = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// pembersih pesan error otomatis saat user mulai mengetik / memilih tanggal
const resetErrorTanggal = () => {
    errorMulai.style.display = "none";
    errorAkhir.style.display = "none";
    errorTanggal.style.display = "none";
    status.innerHTML = "";
    tanggalMulai.classList.remove("input-error");
    tanggalAkhir.classList.remove("input-error");
};
if (tanggalMulai) {
    tanggalMulai.addEventListener("input", resetErrorTanggal);
    tanggalMulai.addEventListener("change", resetErrorTanggal);
}
if (tanggalAkhir) {
    tanggalAkhir.addEventListener("input", resetErrorTanggal);
    tanggalAkhir.addEventListener("change", resetErrorTanggal);
}

if (noKK) {
    noKK.addEventListener("input", function () {
        errorKK.style.display = "none";
        noKK.classList.remove("input-error");
        saldoResult.style.display = "none";
        saldoResult.innerHTML = "";
    });
}

if (tarikNoKK) {
    tarikNoKK.addEventListener("input", function () {
        errorTarikKK.style.display = "none";
        tarikNoKK.classList.remove("input-error");
        tarikResult.style.display = "none";
        tarikResult.innerHTML = "";
    });
}
if (tarikToken) {
    tarikToken.addEventListener("input", function () {
        errorTarikToken.style.display = "none";
        tarikToken.classList.remove("input-error");
        tarikResult.style.display = "none";
        tarikResult.innerHTML = "";
    });
}
if (tarikNominal) {
    tarikNominal.addEventListener("input", function () {
        errorTarikNominal.style.display = "none";
        tarikNominal.classList.remove("input-error");
        tarikResult.style.display = "none";
        tarikResult.innerHTML = "";
    });
}


// 1. export laporan ke excel
btnExport.addEventListener("click", async function () {
    const mulai = tanggalMulai.value;
    const akhir = tanggalAkhir.value;
    let valid = true;

    // validasi tanggal
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

    if (!valid) {
        status.innerHTML = "";
        return;
    }

    if (mulai > akhir) {
        errorTanggal.style.display = "block";
        tanggalMulai.classList.add("input-error");
        tanggalAkhir.classList.add("input-error");
        status.innerHTML = "";
        return;
    }

    errorTanggal.style.display = "none";
    tanggalMulai.classList.remove("input-error");
    tanggalAkhir.classList.remove("input-error");

    status.className = "status-message status-loading";
    status.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Menyiapkan laporan...`;
    btnExport.disabled = true;

    try {
        // ambil data timbangan sampah
        const resTransaksi = await fetch(`${API_URL}/api/transaksi`, {
            method: 'GET',
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const resultTransaksi = await resTransaksi.json();

        if (!resTransaksi.ok || !resultTransaksi.success) {
            throw new Error(resultTransaksi.message || "Gagal mengambil data transaksi");
        }

        // ambil data penarikan kas
        let dataPenarikan = [];
        try {
            const resPenarikan = await fetch(`${API_URL}/api/penarikan`, {
                headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
            });
            if (resPenarikan.ok) {
                const jsonPenarikan = await resPenarikan.json();
                dataPenarikan = Array.isArray(jsonPenarikan) ? jsonPenarikan : (jsonPenarikan.data || []);
            }
        } catch (e) {
            console.warn("data penarikan kosong / belum ada");
        }

        // ambil data nasabah buat cek sisa saldo terbaru
        let dataNasabah = [];
        try {
            const resNasabah = await fetch(`${API_URL}/api/nasabah`);
            if (resNasabah.ok) {
                const jsonNasabah = await resNasabah.json();
                dataNasabah = jsonNasabah.data || [];
            }
        } catch (e) {
            console.warn("gagal load nasabah");
        }

        // filter transaksi sesuai tanggal yang dipilih
        const transaksiFilter = resultTransaksi.data.filter(function (item) {
            const tgl = getLocalDateString(item.tanggal_waktu || item.tanggal);
            return tgl >= mulai && tgl <= akhir;
        });

        if (transaksiFilter.length === 0) {
            status.className = "status-message status-error";
            status.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Tidak ada transaksi pada periode tersebut.`;
            return;
        }

        // kumpulin total uang ditarik per no kk sesuai periode tanggal
        const mapPenarikanKK = {};
        dataPenarikan.forEach(function (p) {
            const tglP = getLocalDateString(p.tanggal || p.created_at || p.tanggal_penarikan || p.createdAt);
            if (tglP && (tglP < mulai || tglP > akhir)) {
                return;
            }

            const noKKP = p.no_kk || p.noKK || p.nasabah?.noKK || p.nasabah?.no_kk;
            const jumlahP = Number(p.jumlahPenarikan || p.jumlah_penarikan || p.jumlah || 0);
            if (noKKP) {
                mapPenarikanKK[noKKP] = (mapPenarikanKK[noKKP] || 0) + jumlahP;
            }
        });

        // kelompokkan data berdasarkan no kk biar orang yang sama ngumpul jadi satu
        const grupNasabah = {};

        transaksiFilter.forEach(function (trx) {
            const noKKItem = trx.no_kk || trx.noKK || "-";
            const namaItem = trx.nama || trx.nasabahNama || "-";
            const tglRaw = trx.tanggal_waktu || trx.tanggal;
            const tglObj = new Date(tglRaw);

            if (!grupNasabah[noKKItem]) {
                grupNasabah[noKKItem] = {
                    noKK: noKKItem,
                    nama: namaItem,
                    items: []
                };
            }

            if (Array.isArray(trx.items)) {
                trx.items.forEach(function (detail) {
                    const berat = Number(detail.berat_kg || detail.berat || 0);
                    const harga = Number(detail.harga_per_kg || detail.harga || 0);
                    const setoranMasuk = Number(detail.subtotal || (berat * harga) || 0);

                    grupNasabah[noKKItem].items.push({
                        timestamp: tglObj.getTime(),
                        tanggalFormatted: tglObj.toLocaleDateString("id-ID"),
                        jenisSampah: detail.nama_jenis || detail.jenisSampah || "-",
                        berat: berat,
                        harga: harga,
                        setoranMasuk: setoranMasuk
                    });
                });
            }
        });

        // susun baris excel & hitung saldo berjalan per orang
        const dataLaporan = [];

        Object.values(grupNasabah).forEach(function (nasabah) {
            // urutkan dari tanggal lama ke baru
            nasabah.items.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });

            // cari total uang ditarik si nasabah
            let totalPenarikanNasabah = mapPenarikanKK[nasabah.noKK] || 0;

            // cari data saldo nasabah di database
            const nasabahObj = dataNasabah.find(n => String(n.noKK || n.no_kk).trim() === String(nasabah.noKK).trim());
            const saldoSaatIni = nasabahObj && nasabahObj.saldo !== undefined ? Number(nasabahObj.saldo) : null;

            // jaga-jaga kalau api penarikan backend belum jalan, hitung dari selisih saldo
            const totalSetoranSemua = nasabah.items.reduce((s, itm) => s + itm.setoranMasuk, 0);
            if (totalPenarikanNasabah === 0 && saldoSaatIni !== null) {
                if (saldoSaatIni < totalSetoranSemua) {
                    totalPenarikanNasabah = totalSetoranSemua - saldoSaatIni;
                }
            }

            // hitung saldo awal sebelum periode ini biar gak minus / 0 kalau ada penarikan besar
            let saldoAwal = 0;
            if (saldoSaatIni !== null) {
                const estimasiAwal = saldoSaatIni - totalSetoranSemua + totalPenarikanNasabah;
                saldoAwal = Math.max(0, estimasiAwal);
            }

            let sisaPenarikan = totalPenarikanNasabah;
            let saldoBerjalan = saldoAwal;

            nasabah.items.forEach(function (item, idx) {
                // potong penarikan di baris pertama
                let penarikanDiBarisIni = 0;
                if (sisaPenarikan > 0 && idx === 0) {
                    penarikanDiBarisIni = sisaPenarikan;
                    sisaPenarikan = 0;
                }

                // tambah saldo masuk, kurang uang ditarik
                saldoBerjalan = saldoBerjalan + item.setoranMasuk - penarikanDiBarisIni;

                dataLaporan.push({
                    No: dataLaporan.length + 1,
                    Tanggal: item.tanggalFormatted,
                    "No KK": nasabah.noKK,
                    "Nama Nasabah": nasabah.nama,
                    "Jenis Sampah": item.jenisSampah,
                    "Berat (Kg)": item.berat,
                    "Harga/Kg": item.harga,
                    "Setoran Masuk (Rp)": item.setoranMasuk,
                    "Penarikan Keluar (Rp)": penarikanDiBarisIni,
                    subtotal: Math.max(0, saldoBerjalan)
                });
            });
        });

        // generate ke file excel
        const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

        // setting lebar kolom biar rapi
        worksheet["!cols"] = [
            { wch: 6 },   // No
            { wch: 14 },  // Tanggal
            { wch: 22 },  // No KK
            { wch: 20 },  // Nama Nasabah
            { wch: 18 },  // Jenis Sampah
            { wch: 12 },  // Berat (Kg)
            { wch: 15 },  // Harga/Kg
            { wch: 20 },  // Setoran Masuk (Rp)
            { wch: 22 },  // Penarikan Keluar (Rp)
            { wch: 18 }   // subtotal
        ];

        // format cell uang rupiah
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let row = 1; row <= range.e.r; row++) {
            const cellHarga = worksheet[XLSX.utils.encode_cell({ r: row, c: 6 })];
            const cellMasuk = worksheet[XLSX.utils.encode_cell({ r: row, c: 7 })];
            const cellKeluar = worksheet[XLSX.utils.encode_cell({ r: row, c: 8 })];
            const cellSubtotal = worksheet[XLSX.utils.encode_cell({ r: row, c: 9 })];

            if (cellHarga && typeof cellHarga.v === "number") cellHarga.z = '"Rp" #,##0';
            if (cellMasuk && typeof cellMasuk.v === "number") cellMasuk.z = '"Rp" #,##0';
            if (cellKeluar && typeof cellKeluar.v === "number") cellKeluar.z = '"Rp" #,##0';
            if (cellSubtotal && typeof cellSubtotal.v === "number") cellSubtotal.z = '"Rp" #,##0';
        }

        const namaFile = `Laporan_KINASIH_${mulai}_${akhir}.xlsx`;
        XLSX.writeFile(workbook, namaFile);

        status.className = "status-message status-success";
        status.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Laporan berhasil diexport.`;

    } catch (error) {
        console.error(error);
        status.className = "status-message status-error";
        status.innerHTML = `<i class="bi bi-x-circle me-1"></i> Gagal export laporan. (${error.message})`;
    } finally {
        btnExport.disabled = false;
    }
});


// 2. cek saldo warga
btnCekSaldo.addEventListener("click", async function () {
    // hapus semua spasi di no kk (termasuk spasi di tengah)
    const nomorKK = noKK.value.replace(/\s+/g, "");

    if (!nomorKK) {
        errorKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Wajib diisi`;
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        saldoResult.style.display = "none";
        saldoResult.innerHTML = "";
        return;
    }

    if (!/^\d{16}$/.test(nomorKK)) {
        errorKK.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Nomor KK harus 16 digit angka`;
        errorKK.style.display = "block";
        noKK.classList.add("input-error");
        saldoResult.style.display = "none";
        saldoResult.innerHTML = "";
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
            return String(item.noKK || item.no_kk).trim() === nomorKK;
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


// 3. penarikan saldo kasir
if (btnTarikSaldo) {
    btnTarikSaldo.addEventListener("click", async function () {
        // bersihkan spasi di no kk dan token
        const noKKVal = (tarikNoKK ? tarikNoKK.value : "").replace(/\s+/g, "");
        const tokenVal = (tarikToken ? tarikToken.value : "").replace(/\s+/g, "");
        const nominalVal = Number(tarikNominal ? tarikNominal.value : 0);
        let valid = true;

        // validasi no kk
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

        // validasi token 6 digit
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

        // validasi nominal
        if (!nominalVal || nominalVal <= 0) {
            errorTarikNominal.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Masukkan nominal penarikan yang valid`;
            errorTarikNominal.style.display = "block";
            tarikNominal.classList.add("input-error");
            valid = false;
        } else {
            errorTarikNominal.style.display = "none";
            tarikNominal.classList.remove("input-error");
        }

        if (!valid) {
            // sembunyikan hasil struk lama jika form error
            tarikResult.style.display = "none";
            tarikResult.innerHTML = "";
            return;
        }

        tarikResult.style.display = "block";
        tarikResult.className = "saldo-result status-loading text-center p-3 mt-3";
        tarikResult.innerHTML = `<i class="bi bi-hourglass-split me-1"></i> Memproses persetujuan penarikan...`;
        btnTarikSaldo.disabled = true;

        try {
            // cek saldo nasabah dulu, cukup atau ngga
            const resNasabah = await fetch(`${API_URL}/api/nasabah`);
            const dataNasabah = await resNasabah.json();

            if (!resNasabah.ok || !dataNasabah.success) {
                throw new Error(dataNasabah.message || "Gagal menghubungi database nasabah");
            }

            const nasabah = dataNasabah.data.find(function (item) {
                return String(item.noKK || item.no_kk).trim() === noKKVal;
            });

            if (!nasabah) {
                throw new Error("Nomor KK tidak terdaftar dalam sistem.");
            }

            const idNasabahFix = nasabah.id_nasabah || nasabah.idNasabah || nasabah.id;
            if (!idNasabahFix) {
                throw new Error("ID nasabah tidak ditemukan pada database.");
            }

            if (nominalVal > Number(nasabah.saldo)) {
                throw new Error(`Saldo tidak mencukupi. Saldo saat ini: ${formatRupiah(nasabah.saldo)}`);
            }

            // kirim approve ke backend
            const payload = {
                device_id: "ESP32-KINASIH-01",
                id_nasabah: idNasabahFix,
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

            // tampilkan hasil penarikan sukses
            const saldoSisa = approveResult.data?.saldo_sesudah ?? (Number(nasabah.saldo) - nominalVal);

            tarikResult.className = "saldo-result status-success mt-3 p-3 border rounded bg-light text-start";
            tarikResult.innerHTML = `
                <div class="d-flex align-items-center text-success fw-bold mb-2">
                    <i class="bi bi-check-circle-fill fs-5 me-2"></i> Penarikan Berhasil Disetujui!
                </div>
                <div style="font-size: 0.9rem; color: #666;">Nama Nasabah:</div>
                <div style="font-size: 1.1rem; font-weight: bold; color: #222;">${nasabah.nama}</div>
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

            // reset input token sama nominal
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


// tentang pengembang (eclipse team) & gambar fallback
if (btnBukaPengembang && elModalPengembang) {
    const modalPengembang = new bootstrap.Modal(elModalPengembang);

    btnBukaPengembang.addEventListener("click", function (e) {
        e.preventDefault();
        modalPengembang.show();
    });
}

// ganti otomatis gambar jika file di folder assets belum tersedia
const fallbackImages = document.querySelectorAll(".img-fallback");
fallbackImages.forEach(function (img) {
    img.addEventListener("error", function () {
        const fallbackUrl = this.getAttribute("data-fallback");
        if (fallbackUrl && this.src !== fallbackUrl) {
            this.src = fallbackUrl;
        }
    });
});