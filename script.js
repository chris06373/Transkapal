
const STORAGE_KEY = "seatrans_bookings";

const ships = [
    {
        name: "KM Express Bahari",
        type: "Kapal Cepat",
        capacity: 100,
        price: 150000
    },
    {
        name: "KM Nusantara Jaya",
        type: "Kapal Penumpang",
        capacity: 500,
        price: 100000
    },
    {
        name: "KMP Samudra Ferry",
        type: "Kapal Ferry",
        capacity: 800,
        price: 200000
    }
];

// Tarif dasar rute (simulasi)
const routes = {
    "Jakarta-Surabaya": 250000,
    "Surabaya-Jakarta": 250000,
    "Jakarta-Batam": 350000,
    "Batam-Jakarta": 350000,
    "Surabaya-Bali": 180000,
    "Bali-Surabaya": 180000,
    "Bali-Lombok": 120000,
    "Lombok-Bali": 120000,
    "Surabaya-Makassar": 400000,
    "Makassar-Surabaya": 400000,
    "Makassar-Bali": 300000,
    "Bali-Makassar": 300000,
    "Batam-Surabaya": 500000,
    "Surabaya-Batam": 500000,
    "Jakarta-Makassar": 600000,
    "Makassar-Jakarta": 600000,
    "Jakarta-Bali": 350000,
    "Bali-Jakarta": 350000,
    "Batam-Makassar": 550000,
    "Makassar-Batam": 550000,
    "Batam-Bali": 450000,
    "Bali-Batam": 450000,
    "Batam-Lombok": 400000,
    "Lombok-Batam": 400000,
    "Surabaya-Lombok": 220000,
    "Lombok-Surabaya": 220000,
    "Jakarta-Lombok": 400000,
    "Lombok-Jakarta": 400000,
    "Makassar-Lombok": 250000,
    "Lombok-Makassar": 250000
};

let bookings = loadBookings();

const $ = id => document.getElementById(id);

const rupiah = value =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(value);

function loadBookings() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveBookings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// TANGGAL
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

$("current-date").textContent =
    new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

$("tanggal").min = today.toISOString().split("T")[0];

// ARMADA
function renderFleet() {
    $("fleet-list").innerHTML = ships.map(ship => `
        <div class="fleet-item">
            <div class="fleet-info">
                <div class="ship-icon">🚢</div>
                <div>
                    <h4>${ship.name}</h4>
                    <p>${ship.type} · ${ship.capacity} Kapasitas</p>
                </div>
            </div>
            <span class="fleet-status">Tersedia</span>
        </div>
    `).join("");
}

// DROPDOWN KAPAL
function renderShips() {
    const type = $("jenis-kapal").value;

    $("nama-kapal").innerHTML =
        '<option value="">Pilih kapal</option>';

    ships
        .filter(ship => ship.type === type)
        .forEach(ship => {
            const option = document.createElement("option");
            option.value = ship.name;
            option.textContent = ship.name;
            $("nama-kapal").appendChild(option);
        });

    updatePrice();
}

// HITUNG TARIF
function getPrice() {
    const asal = $("asal").value;
    const tujuan = $("tujuan").value;
    const shipName = $("nama-kapal").value;

    if (!asal || !tujuan || !shipName || asal === tujuan) {
        return 0;
    }

    const ship = ships.find(s => s.name === shipName);
    const routePrice = routes[`${asal}-${tujuan}`];

    if (!ship || !routePrice) return 0;

    // Tarif disesuaikan berdasarkan tipe kapal
    let multiplier = 1;

    if (ship.type === "Kapal Cepat") multiplier = 1.5;
    if (ship.type === "Kapal Penumpang") multiplier = 1;
    if (ship.type === "Kapal Ferry") multiplier = 1.2;

    return Math.round(routePrice * multiplier);
}

function updatePrice() {
    const price = getPrice();
    const jumlah = Math.max(1, Number($("jumlah").value) || 1);

    $("harga-satuan").textContent = rupiah(price);
    $("harga-total").textContent = rupiah(price * jumlah);
}

// KODE TIKET
function generateCode() {
    return "ST-" + Date.now().toString().slice(-8);
}

// PEMESANAN
$("booking-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const nama = $("nama").value.trim();
    const identitas = $("identitas").value.trim();
    const telepon = $("telepon").value.trim();
    const kapal = $("nama-kapal").value;
    const jenisKapal = $("jenis-kapal").value;
    const asal = $("asal").value;
    const tujuan = $("tujuan").value;
    const tanggal = $("tanggal").value;
    const jumlah = Number($("jumlah").value);

    const price = getPrice();
    const ship = ships.find(s => s.name === kapal);

    if (!nama || !identitas || !telepon || !kapal ||
        !asal || !tujuan || !tanggal || !jumlah) {
        return showFeedback("Lengkapi semua data pemesanan.", "error");
    }

    if (identitas.length < 5) {
        return showFeedback("Nomor identitas tidak valid.", "error");
    }

    if (!/^[0-9+\-\s]{8,16}$/.test(telepon)) {
        return showFeedback("Nomor HP tidak valid.", "error");
    }

    if (asal === tujuan) {
        return showFeedback("Pelabuhan asal dan tujuan tidak boleh sama.", "error");
    }

    if (tanggal < today.toISOString().split("T")[0]) {
        return showFeedback("Tanggal keberangkatan tidak boleh di masa lalu.", "error");
    }

    if (!price) {
        return showFeedback("Rute perjalanan belum memiliki tarif.", "error");
    }

    if (jumlah < 1 || jumlah > 10) {
        return showFeedback("Jumlah penumpang maksimal 10 orang.", "error");
    }

    if (!ship || jumlah > ship.capacity) {
        return showFeedback("Kapasitas kapal tidak mencukupi.", "error");
    }

    // Hitung kapasitas berdasarkan perjalanan dan tanggal
    const bookedSeats = bookings
        .filter(b =>
            b.kapal === kapal &&
            b.tanggal === tanggal &&
            b.status !== "CANCELLED"
        )
        .reduce((sum, b) => sum + b.jumlah, 0);

    if (bookedSeats + jumlah > ship.capacity) {
        return showFeedback("Kapasitas kapal pada tanggal tersebut tidak mencukupi.", "error");
    }

    const booking = {
        kode: generateCode(),
        nama,
        identitas,
        telepon,
        kapal,
        jenisKapal,
        asal,
        tujuan,
        tanggal,
        jumlah,
        harga: price,
        total: price * jumlah,
        status: "BOOKED",
        createdAt: new Date().toISOString()
    };

    bookings.unshift(booking);

    saveBookings();
    renderAll();

    $("booking-form").reset();
    $("tanggal").value = "";
    $("jumlah").value = 1;
    $("nama-kapal").innerHTML = '<option value="">Pilih kapal</option>';

    updatePrice();

    showFeedback(
        `Pemesanan berhasil! Kode tiket: ${booking.kode}`,
        "success"
    );
});

// CHECK-IN DAN PEMBATALAN
function checkIn(kode) {
    const booking = bookings.find(b => b.kode === kode);

    if (!booking || booking.status !== "BOOKED") return;

    if (!confirm(`Konfirmasi check-in tiket ${kode}?`)) return;

    booking.status = "CHECKED";
    booking.checkInAt = new Date().toISOString();

    saveBookings();
    renderAll();
}

function cancelBooking(kode) {
    const booking = bookings.find(b => b.kode === kode);

    if (!booking || booking.status !== "BOOKED") return;

    if (!confirm(`Batalkan pemesanan ${kode}?`)) return;

    booking.status = "CANCELLED";

    saveBookings();
    renderAll();
}

// STATUS
function getStatus(status) {
    const statuses = {
        BOOKED: ["Dipesan", "status-booked"],
        CHECKED: ["Sudah Check-In", "status-checked"],
        CANCELLED: ["Dibatalkan", "status-cancelled"]
    };

    return statuses[status] || ["Tidak Diketahui", ""];
}

// TABEL RIWAYAT
function renderBookings() {
    const search = $("search").value.toLowerCase();
    const filter = $("filter-status").value;

    const filtered = bookings.filter(b => {
        const matchSearch =
            b.nama.toLowerCase().includes(search) ||
            b.kode.toLowerCase().includes(search) ||
            b.identitas.toLowerCase().includes(search);

        const matchStatus =
            filter === "ALL" || b.status === filter;

        return matchSearch && matchStatus;
    });

    if (!filtered.length) {
        $("booking-list").innerHTML = `
            <tr>
                <td colspan="9" class="empty">
                    Tidak ada data pemesanan.
                </td>
            </tr>
        `;
        return;
    }

    $("booking-list").innerHTML = filtered.map(b => {
        const [label, className] = getStatus(b.status);

        const actions = b.status === "BOOKED" ? `
            <div class="action-group">
                <button class="btn btn-check"
                    data-action="check" data-code="${b.kode}">
                    Check-In
                </button>
                <button class="btn btn-cancel"
                    data-action="cancel" data-code="${b.kode}">
                    Batal
                </button>
            </div>
        ` : "-";

        return `
            <tr>
                <td><strong>${escapeHTML(b.kode)}</strong></td>
                <td>${escapeHTML(b.nama)}</td>
                <td>${escapeHTML(b.asal)} → ${escapeHTML(b.tujuan)}</td>
                <td>${escapeHTML(b.kapal)}</td>
                <td>${formatDate(b.tanggal)}</td>
                <td>${b.jumlah} Orang</td>
                <td>${rupiah(b.total)}</td>
                <td><span class="status ${className}">${label}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    }).join("");
}

// KEAMANAN TAMPILAN TEKS
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// DASHBOARD
function renderDashboard() {
    const activeBookings = bookings.filter(
        b => b.status !== "CANCELLED"
    );

    const totalTiket = activeBookings.length;

    const totalPenumpang = activeBookings.reduce(
        (sum, b) => sum + b.jumlah, 0
    );

    const pendapatan = activeBookings.reduce(
        (sum, b) => sum + b.total, 0
    );

    $("total-tiket").textContent = totalTiket;
    $("total-penumpang").textContent = totalPenumpang;
    $("total-kapal").textContent = ships.length;
    $("total-pendapatan").textContent = rupiah(pendapatan);
}

function renderAll() {
    renderDashboard();
    renderBookings();
}

function showFeedback(message, type) {
    const feedback = $("feedback");

    feedback.textContent = message;
    feedback.className = "feedback " + type;
}

// EVENT LISTENERS
$("jenis-kapal").addEventListener("change", renderShips);

[
    "asal",
    "tujuan",
    "nama-kapal",
    "jumlah"
].forEach(id => {
    $(id).addEventListener("change", updatePrice);
    $(id).addEventListener("input", updatePrice);
});

$("search").addEventListener("input", renderBookings);
$("filter-status").addEventListener("change", renderBookings);

$("booking-list").addEventListener("click", function(e) {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const { action, code } = button.dataset;

    if (action === "check") checkIn(code);
    if (action === "cancel") cancelBooking(code);
});

// RESET
$("reset-data").addEventListener("click", function() {
    if (!bookings.length) {
        return alert("Belum ada data untuk direset.");
    }

    if (!confirm("Hapus seluruh riwayat pemesanan?")) return;

    bookings = [];
    saveBookings();
    renderAll();

    showFeedback("Seluruh data berhasil direset.", "success");
});

// INISIALISASI
renderFleet();
renderAll();
updatePrice();
