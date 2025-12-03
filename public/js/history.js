document.addEventListener("DOMContentLoaded", () => {
    if (typeof initUserDisplay === 'function') {
        initUserDisplay();
    }
    fetchUserBookings();
});

async function fetchUserBookings() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Sesi anda telah berakhir, silakan login kembali.');
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch(`/api/bookings/user/${userId}`);
        
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

function renderHistory(bookings) {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    if (bookings.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">Belum ada riwayat booking.</p>';
        return;
    }

    bookings.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("history-card");

        let statusClass = "";
        let statusLabel = item.status;

        switch(item.status) {
            case 'confirmed':
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

        const showCancel = (item.status === 'pending' || item.status === 'confirmed');

        const dateObj = new Date(item.booking_date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        let timeLabel = item.booking_time;

        card.innerHTML = `
            <div class="history-card-content">
                <div>
                    <div class="room-name">${item.room_name || 'Nama Ruangan Tidak Ditemukan'}</div>
                    <div class="detail">Tanggal: ${formattedDate}</div>
                    <div class="detail">Waktu: ${timeLabel}</div>
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
                     src="${item.image_path ? item.image_path : '../images/ruang-a/meetingroom-1.jpg'}" 
                     alt="${item.room_name}"
                     onerror="this.src='../images/ruang-a/meetingroom-1.jpg'"> 
            </div>
        `;

        list.appendChild(card);
    });
}