// Fungsi untuk load detail ruangan yang dipilih dari dashboard
async function loadSelectedRoom() {
    try {
        // Ambil ID ruangan dari localStorage
        const selectedRoomId = localStorage.getItem('selectedRoomId');

        // Fetch detail ruangan dari API
        const response = await fetch(`http://localhost:3000/api/rooms/${selectedRoomId}`);
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

    // Update status ruangan 
    const roomStatus = document.querySelector('.room-status p');
    if (roomStatus) {
        roomStatus.textContent = 'Available';
    }
}

function showError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.display = 'block';
    }
    inputElement.classList.add('error');
}

function hideError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
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

function getBookingTimeText(timeValue) {
    const timeMap = {
        '1': '08.00 - 11.00',
        '2': '11.00 - 13.00',
        '3': '13.00 - 15.00',
        '4': '15.00 - 18.00'
    };
    return timeMap[timeValue] || '';
}

// cek ketersediaan waktu booking
async function checkAvailability(roomId, date) {
    try {
        const response = await fetch(`http://localhost:3000/api/bookings/availability/${roomId}/${date}`);
        const data = await response.json();

        return data.bookedTimes || [];
    } catch (error) {
        console.error('Error checking availability:', error);
        return [];
    }
}

// update dropdown waktu berdasarkan ketersediaan
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
                // Reset ke text asli
                const originalText = getBookingTimeText(option.value);
                if (originalText) {
                    option.textContent = originalText;
                }
            }
        });
        return;
    }

    console.log('Checking availability for room:', roomId, 'date:', bookingDate);

    // Cek waktu yang sudah dibooking dari database
    const bookedTimes = await checkAvailability(roomId, bookingDate);

    console.log('Booked times:', bookedTimes);

    // Update semua option di dropdown
    const options = durationSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value) {
            const timeText = getBookingTimeText(option.value);

            // Cek apakah waktu ini sudah dibooking
            if (bookedTimes.includes(timeText)) {
                option.disabled = true;
                option.textContent = `${timeText} (Already Booked)`;
                option.style.color = '#d32f2f';
                option.style.backgroundColor = '#ffebee';
                console.log('Disabling time slot:', timeText);
            } else {
                option.disabled = false;
                option.textContent = timeText;
                option.style.color = '';
                option.style.backgroundColor = '';
            }
        }
    });

    // Reset pilihan jika yang dipilih sudah dibooking
    if (durationSelect.value) {
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        if (selectedOption.disabled) {
            durationSelect.value = '';
            alert('Waktu yang Anda pilih sudah dibooking. Silakan pilih waktu lain.');
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
            throw new Error(result.message || 'Failed to create booking');
        }

        return { success: true, data: result };

    } catch (error) {
        console.error('Error submitting booking:', error);
        return { success: false, error: error.message };
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    const bookingDate = document.getElementById('bookingDate');
    const duration = document.getElementById('duration');
    const purpose = document.getElementById('purpose');
    const roomId = document.getElementById('roomId');

    var isValid = true;

    isValid &= validateInput(bookingDate);
    isValid &= validateInput(duration);
    isValid &= validateInput(purpose);

    isValid = Boolean(isValid);

    if (!isValid) {
        // Tampilkan popup gagal
        document.getElementById("unsuccessPopup").style.display = "flex";

        // Tombol OK untuk menutup popup gagal
        document.getElementById("unsuccessOkBtn").onclick = function () {
            document.getElementById("unsuccessPopup").style.display = "none";
        };

        return;
    }

    // Cek apakah waktu yang dipilih sudah dibooking
    const selectedOption = duration.options[duration.selectedIndex];
    if (selectedOption.disabled) {
        alert('Waktu yang dipilih sudah dibooking. Silakan pilih waktu lain.');
        return;
    }

    // Ambil userId dari localStorage (disimpan saat login)
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
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

    // Submit booking ke server
    const result = await submitBooking(bookingData);

    if (result.success) {
        // Menampilkan pop up sukses
        document.getElementById("successPopup").style.display = "flex";

        // pindah halaman ke history.html
        document.getElementById("popupOkBtn").onclick = function () {
            window.location.href = "/history";
        };
    } else {
        // Tampilkan error message
        alert(`Booking failed: ${result.error}`);
    }
}

function setupLiveValidation() {
    const inputs = [
        "bookingDate",
        "duration",
        "purpose"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener("input", () => validateInput(element));

        element.addEventListener("change", () => validateInput(element));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Load detail ruangan yang dipilih
    loadSelectedRoom();

    const submitBtn = document.querySelector(".btn-submit");

    if (submitBtn) submitBtn.addEventListener("click", handleSubmit);

    setupLiveValidation();

    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const today = new Date().toISOString().split("T")[0];
        bookingDate.setAttribute("min", today);

        // Event listener untuk cek jam ruangan, saat tanggal berubah 
        bookingDate.addEventListener("change", updateTimeSlotAvailability);
    }

    const cancelBtn = document.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }

    initUserDisplay();
});