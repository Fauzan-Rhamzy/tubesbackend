document.addEventListener("DOMContentLoaded", () => {
    // 1. Tampilkan nama user & setup logout (dari auth.js)
    if (typeof initUserDisplay === 'function') {
        initUserDisplay();
    }

    // 2. Ambil data history dari server
    fetchUserBookings();
});

// Fungsi untuk mengambil data booking user dari server (Secure via Cookie)
async function fetchUserBookings() {
    try {
        const response = await fetch('/api/my-bookings');
        
        if (response.status === 401) {
            alert('Sesi anda telah berakhir, silakan login kembali.');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('Gagal mengambil data booking');
        }

        const bookings = await response.json();
        renderHistory(bookings);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById("historyList").innerHTML = '<p style="text-align:center; color:red;">Gagal memuat riwayat booking.</p>';
    }
}

// Fungsi untuk membatalkan booking
async function cancelBooking(id) {
    const confirmCancel = confirm("Yakin ingin membatalkan booking?");
    if (!confirmCancel) return;

    try {
        const response = await fetch(`/api/bookings/${id}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'canceled' })
        });

        if (response.ok) {
            alert("Booking berhasil dibatalkan!");
            // Refresh data setelah update berhasil
            fetchUserBookings();
        } else {
            const result = await response.json();
            alert(result.message || "Gagal membatalkan booking");
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert("Terjadi kesalahan saat menghubungi server");
    }
}

// Fungsi render HTML
function renderHistory(bookings) {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (bookings.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">Belum ada riwayat booking.</p>';
        return;
    }

    // Sorting: Status 'pending' ditaruh paling atas, sisanya urut tanggal terbaru
    bookings.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.booking_date) - new Date(a.booking_date);
    });

    bookings.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("history-card");

        let statusClass = "";
        let statusLabel = item.status;

        // Mapping status DB ke Class CSS
        switch(item.status) {
            case 'confirmed': // Sesuai database kamu: 'confirmed'
                statusClass = "status-approved";
                statusLabel = "Approved";
                break;
            case 'pending':
                statusClass = "status-waiting";
                statusLabel = "Pending";
                break;
            case 'rejected':
                statusClass = "status-rejected";
                statusLabel = "Rejected";
                break;
            case 'canceled':
                statusClass = "status-rejected"; 
                statusLabel = "Canceled";
                break;
            default:
                statusClass = "status-waiting";
                statusLabel = item.status;
        }

        // Tombol cancel hanya muncul jika status masih 'pending' atau 'confirmed'
        const showCancel = (item.status === 'pending' || item.status === 'confirmed');

        // Format tanggal
        const dateObj = new Date(item.booking_date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Gambar default jika image_path kosong
        const imagePath = item.image_path ? item.image_path : '../images/ruang-a/meetingroom-1.jpg';

        card.innerHTML = `
            <div class="history-card-content">
                <div>
                    <div class="room-name">${item.room_name || 'Nama Ruangan Tidak Ditemukan'}</div>
                    <div class="detail">Tanggal: ${formattedDate}</div>
                    <div class="detail">Waktu: ${item.booking_time}</div>
                    <div class="detail">Tujuan: ${item.purpose}</div>

                    <div style="margin-top:12px;">
                        <span class="status ${statusClass}">
                            ${statusLabel}
                        </span>

                        ${showCancel ? `
                            <button class="btn-cancel-booking" onclick="cancelBooking(${item.id})">
                                Batalkan Booking
                            </button>
                        ` : ""}
                    </div>
                </div>

                <img class="history-image" 
                     src="${imagePath}" 
                     alt="${item.room_name}"
                     onerror="this.src='../images/ruang-a/meetingroom-1.jpg'"> 
            </div>
        `;

        list.appendChild(card);
    });
}