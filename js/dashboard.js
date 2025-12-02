document.addEventListener("DOMContentLoaded", () => {
    // Load ruangan dari database
    loadRooms();
});


//Load data ruangan dari databse 
async function loadRooms() {
    try {
        // Fetch data dari Node.js API (ini di set di server.js)
        const response = await fetch('http://localhost:3000/api/rooms');
        const rooms = await response.json();

        // Menampilkan ruangan ke halaman
        displayRooms(rooms);

        // Setup click handler setelah ruangan di-render
        setupRoomSelection();
    } catch (error) {
        console.error('Error loading rooms:', error);
        // Tampilkan pesan error
        const container = document.querySelector('.room-options-container');
        if (container) {
            container.innerHTML = '<p style="color: red;">Gagal memuat data ruangan</p>';
        }
    }
}

/**
 * Fungsi untuk menampilkan ruangan ke HTML
 */
function displayRooms(rooms) {
    const container = document.querySelector('.room-options-container');

    if (!container) return;

    container.innerHTML = '';

    // Menampilkan setiap ruangan
    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-option-card';
        card.setAttribute('data-room-id', room.id);

        card.innerHTML = `
            <h3>${room.name}</h3>
            <img src="${room.image_path}" alt="${room.name}">
            <p>Kapasitas: ${room.capacity} orang</p>
        `;

        container.appendChild(card);
    });
}

/**
 * Setup click handler untuk pemilihan ruangan
 */
function setupRoomSelection() {
    const roomCards = document.querySelectorAll(".room-option-card");

    roomCards.forEach(card => {
        card.addEventListener('click', function () {
            // Hapus active dari semua card
            roomCards.forEach(c => c.classList.remove("active"));

            // Tambahkan active ke card yang diklik
            this.classList.add("active");

            // Simpan ID ruangan yang dipilih (opsional)
            const roomId = this.getAttribute('data-room-id');
            localStorage.setItem('selectedRoomId', roomId);
        });
    });
}