document.addEventListener("DOMContentLoaded", () => {
    // Load ruangan dari database
    loadRooms();

    // Set tombol booking disabled di awal
    disableBookingButton();

    const bookingButton = document.querySelector(".bookingButton");

    bookingButton.addEventListener("click", handleBooking);
});

// Fungsi untuk disable tombol booking
function disableBookingButton() {
    const bookingButton = document.querySelector('.bookingButton');
    if (bookingButton) {
        bookingButton.classList.add('disabled');
        bookingButton.style.pointerEvents = 'none';
        bookingButton.style.cursor = 'not-allowed';
    }
}

function handleBooking(event) {
    // event.preventDefault();
    window.location.href = "bookingDetail.html";
}

// Fungsi untuk enable tombol booking
function enableBookingButton() {
    const bookingButton = document.querySelector('.bookingButton');
    if (bookingButton) {
        bookingButton.classList.remove('disabled');
        bookingButton.style.pointerEvents = 'auto';
        bookingButton.style.opacity = '1';
        bookingButton.style.cursor = 'pointer';
    }
}

//Load data ruangan dari database 
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
        // Menampilkan pesan error
        const container = document.querySelector('.room-options-container');
        if (container) {
            container.innerHTML = '<p style="color: red;">Unable to load room data</p>';
        }
    }
}

// Fungsi untuk menampilkan ruangan ke HTML

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
            <p>Capacity: ${room.capacity} persons</p>
        `;

        container.appendChild(card);
    });
}

// Setup click handler untuk pemilihan ruangan
function setupRoomSelection() {
    const roomCards = document.querySelectorAll(".room-option-card");

    roomCards.forEach(card => {
        card.addEventListener('click', function () {
            // Hapus active dari semua card
            roomCards.forEach(c => c.classList.remove("active"));

            // Tambahkan active ke card yang diklik
            this.classList.add("active");

            // Simpan ID ruangan yang dipilih
            const roomId = this.getAttribute('data-room-id');
            localStorage.setItem('selectedRoomId', roomId);

            // Enable tombol booking setelah ruangan dipilih
            enableBookingButton();
        });
    });
}