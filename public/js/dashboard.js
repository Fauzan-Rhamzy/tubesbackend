// public/js/dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Tampilkan nama user & setup logout
    if (typeof initUserDisplay === 'function') {
        initUserDisplay();
    }

    // 2. Cek session server (Cookie)
    try {
        const response = await fetch('/api/my-bookings'); 
        if (response.status === 401) {
            alert('Sesi habis, silakan login kembali.');
            window.location.href = '/login';
            return;
        }
    } catch (error) {
        console.error("Gagal cek sesi:", error);
    }

    // 3. Load data ruangan
    loadRooms(); 
});

async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error("Gagal mengambil data ruangan");
        
        const rooms = await response.json();
        renderRooms(rooms);
    } catch (error) {
        console.error("Error:", error);
        document.querySelector(".room-options-container").innerHTML = "<p>Gagal memuat data ruangan.</p>";
    }
}

function renderRooms(rooms) {
    const container = document.querySelector(".room-options-container");
    container.innerHTML = ""; 

    rooms.forEach(room => {
        const card = document.createElement("div");
        // PERBAIKAN: Menggunakan class 'room-option-card' sesuai CSS kamu
        card.classList.add("room-option-card"); 
        
        // Cek selection dari localStorage
        const selectedId = localStorage.getItem("selectedRoomId");
        if (selectedId && parseInt(selectedId) === room.id) {
            // PERBAIKAN: Menggunakan class 'active' sesuai CSS kamu
            card.classList.add("active"); 
            enableBookingButton(true);
        }

        card.addEventListener("click", () => {
            selectRoom(room.id);
        });

        // Pastikan path gambar benar
        const imagePath = room.image_path ? room.image_path : '../images/ruang-a/meetingroom-1.jpg';

        card.innerHTML = `
            <h3>${room.name}</h3>
            <img src="${imagePath}" alt="${room.name}" onerror="this.src='../images/ruang-a/meetingroom-1.jpg'">
            <p>Kapasitas: ${room.capacity} Orang</p>
        `;

        container.appendChild(card);
    });
}

function selectRoom(roomId) {
    localStorage.setItem("selectedRoomId", roomId);

    // Update UI: Hapus class active dari semua card, tambah ke yang dipilih
    const cards = document.querySelectorAll(".room-option-card"); // PERBAIKAN selector
    const roomsData = JSON.parse(localStorage.getItem('roomsData') || '[]'); // Opsional jika mau simpan data

    // Cara paling aman refresh tampilan agar class 'active' pindah
    // Kita panggil ulang renderRooms atau manipulasi manual DOM
    // Di sini kita reload halaman atau panggil loadRooms() lagi biar simpel
    loadRooms();
    
    // Aktifkan tombol
    enableBookingButton(true);
}

function enableBookingButton(enable) {
    const btn = document.querySelector(".bookingButton");
    if (btn) {
        if (enable) {
            btn.classList.remove("disabled");
            btn.disabled = false;
            btn.onclick = () => {
                window.location.href = "/booking";
            };
        } else {
            btn.classList.add("disabled");
            btn.disabled = true;
        }
    }
}