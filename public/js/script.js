// Fungsi untuk load detail ruangan yang dipilih dari dashboard
async function loadSelectedRoom() {
    try {
        // Ambil ID ruangan dari localStorage
        const selectedRoomId = localStorage.getItem('selectedRoomId');

        if (!selectedRoomId) {
            alert('No room selected. Redirecting to dashboard...');
            window.location.href = '/dashboard';
            return;
        }

        // Fetch detail ruangan dari API
        const response = await fetch(`http://localhost:3000/api/rooms/${selectedRoomId}`);

        if (!response.ok) {
            throw new Error('Failed to load room details');
        }

        const room = await response.json();

        // Update data ruangan
        updateRoomDisplay(room);

        // Set roomId ke hidden input
        const roomIdInput = document.getElementById('roomId');
        if (roomIdInput) {
            roomIdInput.value = room.id;
        }

    } catch (error) {
        console.error('Error loading room details:', error);
        alert('Failed to load room details');
        window.location.href = '/dashboard';
    }
}

// Fungsi untuk update tampilan ruangan di halaman booking detail
function updateRoomDisplay(room) {
    // Update gambar ruangan
    const roomImage = document.querySelector('.room-image img');
    if (roomImage) {
        roomImage.src = room.image_path;
        roomImage.alt = room.name;
    }

    // Update nama ruangan
    const roomName = document.querySelector('.room-name');
    if (roomName) {
        roomName.textContent = `Selected Room: ${room.name}`;
    }

    // Update kapasitas ruangan
    const roomCapacity = document.querySelector('.room-capacity');
    if (roomCapacity) {
        roomCapacity.textContent = `Capacity: ${room.capacity} persons`;
    }
}

// Fungsi untuk menampilkan error
function showError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.classList.add('show');
    }
    inputElement.classList.add('error');
}

// Fungsi untuk menyembunyikan error
function hideError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
    inputElement.classList.remove('error');
}

// Fungsi validasi input kosong
function validateInput(inputElement) {
    if (!inputElement.value.trim()) {
        showError(inputElement);
        return false;
    }
    hideError(inputElement);
    return true;
}

// Fungsi untuk konversi value ke text waktu
function getBookingTimeText(timeValue) {
    const timeMap = {
        '1': '08.00 - 11.00',
        '2': '11.00 - 13.00',
        '3': '13.00 - 15.00',
        '4': '15.00 - 18.00'
    };
    return timeMap[timeValue] || '';
}

// Cek ketersediaan waktu booking dari server
// HANYA booking dengan status 'pending' atau 'approved' yang dianggap "booked"
async function checkAvailability(roomId, date) {
    try {
        const response = await fetch(`http://localhost:3000/api/bookings/availability/${roomId}/${date}`);

        if (!response.ok) {
            throw new Error('Failed to check availability');
        }

        const data = await response.json();

        // Server sekarang sudah filter status != 'rejected'
        // Tapi kita bisa double-check di sini juga kalau perlu
        return data.bookedTimes || [];

    } catch (error) {
        console.error('Error checking availability:', error);
        return [];
    }
}

// Update dropdown waktu berdasarkan ketersediaan
async function updateTimeSlotAvailability() {
    const roomId = document.getElementById('roomId').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const durationSelect = document.getElementById('duration');

    // Jika tanggal belum dipilih, reset semua option
    if (!bookingDate) {
        const options = durationSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value) {
                option.disabled = false;
                const originalText = getBookingTimeText(option.value);
                if (originalText) {
                    option.textContent = originalText;
                }
                option.style.color = '';
                option.style.backgroundColor = '';
            }
        });
        return;
    }

    console.log('Checking availability for room:', roomId, 'date:', bookingDate);

    // Cek waktu yang sudah dibooking dari database
    // Hanya yang status != 'rejected' dan != 'cancelled'
    const bookedTimes = await checkAvailability(roomId, bookingDate);

    console.log('Booked times (active only):', bookedTimes);

    // Update semua option di dropdown
    const options = durationSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value) {
            const timeText = getBookingTimeText(option.value);

            // Cek apakah waktu ini sudah dibooking (status aktif)
            if (bookedTimes.includes(timeText)) {
                option.disabled = true;
                option.textContent = `${timeText} (Already Booked)`;
                console.log('Disabling time slot:', timeText);
            } else {
                option.disabled = false;
                option.textContent = timeText;
            }
        }
    });

    // Reset pilihan jika yang dipilih sudah dibooking
    if (durationSelect.value) {
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        if (selectedOption.disabled) {
            durationSelect.value = '';
            alert('The time you selected is already booked. Please choose another time.');
        }
    }
}

// Fungsi untuk submit booking ke server
async function submitBooking(bookingData) {
    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (!response.ok) {
            // Handle conflict (sudah dibooking dengan status aktif)
            if (response.status === 409) {
                throw new Error('This room has already been booked for the selected date and time. Please choose another time slot.');
            }
            throw new Error(result.message || 'Failed to create booking');
        }

        return { success: true, data: result };

    } catch (error) {
        console.error('Error submitting booking:', error);
        return { success: false, error: error.message };
    }
}

// Handler untuk submit form
async function handleSubmit(event) {
    event.preventDefault();

    const bookingDate = document.getElementById('bookingDate');
    const duration = document.getElementById('duration');
    const purpose = document.getElementById('purpose');
    const roomId = document.getElementById('roomId');

    let isValid = true;

    // Validasi semua input
    isValid = validateInput(bookingDate) && isValid;
    isValid = validateInput(duration) && isValid;
    isValid = validateInput(purpose) && isValid;

    if (!isValid) {
        // Tampilkan popup gagal
        const unsuccessPopup = document.getElementById("unsuccessPopup");
        unsuccessPopup.classList.add('show');

        // Tombol OK untuk menutup popup gagal
        document.getElementById("unsuccessOkBtn").onclick = function () {
            unsuccessPopup.classList.remove('show');
        };

        return;
    }

    // Cek apakah waktu yang dipilih sudah dibooking
    const selectedOption = duration.options[duration.selectedIndex];
    if (selectedOption.disabled) {
        alert('The selected time is already booked. Please choose another time.');
        return;
    }

    // Ambil userId dari localStorage (disimpan saat login)
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
        return;
    }

    // Siapkan data booking
    const bookingData = {
        userId: parseInt(userId),
        roomId: parseInt(roomId.value),
        bookingDate: bookingDate.value,
        bookingTime: getBookingTimeText(duration.value),
        purpose: purpose.value.trim()
    };

    console.log('Submitting booking:', bookingData);

    // Submit booking ke server
    const result = await submitBooking(bookingData);

    if (result.success) {
        // Menampilkan pop up sukses
        const successPopup = document.getElementById("successPopup");
        successPopup.classList.add('show');

        // Pindah halaman ke history.html
        document.getElementById("popupOkBtn").onclick = function () {
            window.location.href = "/history";
        };
    } else {
        // Tampilkan error message
        alert(`Booking failed: ${result.error}`);
    }
}

// Setup validasi real-time
function setupLiveValidation() {
    const inputs = [
        "bookingDate",
        "duration",
        "purpose"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);

        if (!element) return;

        // Validasi saat input berubah
        element.addEventListener("input", () => validateInput(element));
        element.addEventListener("change", () => validateInput(element));
    });
}

// Initialize saat halaman load
document.addEventListener("DOMContentLoaded", () => {
    // Load detail ruangan yang dipilih
    loadSelectedRoom();

    // Setup submit button
    const submitBtn = document.querySelector(".btn-submit");
    if (submitBtn) {
        submitBtn.addEventListener("click", handleSubmit);
    }

    // Setup live validation
    setupLiveValidation();

    // Setup booking date dengan min date = hari ini
    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const today = new Date().toISOString().split("T")[0];
        bookingDate.setAttribute("min", today);

        // Event listener untuk cek ketersediaan saat tanggal berubah
        bookingDate.addEventListener("change", updateTimeSlotAvailability);
    }

    // Setup cancel button
    const cancelBtn = document.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }

    initUserDisplay();
});