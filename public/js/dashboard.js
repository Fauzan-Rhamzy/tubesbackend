document.addEventListener("DOMContentLoaded", () => {
    // Load ruangan dari database
    loadRooms();

    // Set tombol booking disabled di awal
    disableBookingButton();

    initUserDisplay();

    const bookingButton = document.querySelector(".bookingButton");

    bookingButton.addEventListener("click", handleBooking);
});

function handleBooking() {
    window.location.href = "/booking";
}

// Fungsi untuk disable tombol booking
function disableBookingButton() {
    const bookingButton = document.querySelector('.bookingButton');
    bookingButton.classList.add('disabled');
}

// Fungsi untuk enable tombol booking
function enableBookingButton() {
    const bookingButton = document.querySelector('.bookingButton');
    bookingButton.classList.remove('disabled');
}

//Melakukan load ruangan dari database 
async function loadRooms() {
    try {
        // Fetch data dari server.js
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
            container.innerHTML = 'Unable to load room data';
        }
    }
}

// menampilkan data ruangan ke HTML
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
            roomCards.forEach(c => c.classList.remove("active"));
            this.classList.add("active");

            // Simpan ID ruangan yang dipilih
            const roomId = this.getAttribute('data-room-id');
            localStorage.setItem('selectedRoomId', roomId);

            // Enable tombol booking setelah ruangan dipilih
            enableBookingButton();
        });
    });
}