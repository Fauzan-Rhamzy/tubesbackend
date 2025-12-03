document.addEventListener("DOMContentLoaded", async () => {
    // 1. Setup UI Logout (dari auth.js)
    if (typeof initUserDisplay === 'function') {
        initUserDisplay();
    }

    // 2. Ambil data booking (sekalian cek apakah user = admin)
    fetchAdminBookings();
    
    // 3. Setup Event Listener untuk tombol di dalam tabel (Event Delegation)
    setupTableActions();
});

// Fungsi mengambil data dari server
async function fetchAdminBookings() {
    try {
        const response = await fetch('/api/bookings');

        // Jika tidak login atau bukan admin (biasanya server redirect, tapi kita handle juga disini)
        if (response.status === 401 || response.status === 403 || response.redirected) {
            alert('Akses ditolak. Silakan login sebagai Admin.');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) throw new Error("Gagal mengambil data");

        const bookings = await response.json();
        renderAdminBookings(bookings);
        
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.booking-table tbody').innerHTML = '<tr><td colspan="8" style="text-align:center;">Gagal memuat data.</td></tr>';
    }
}

// Fungsi menampilkan data ke tabel HTML
function renderAdminBookings(bookings) {
    const tableBody = document.querySelector('.booking-table tbody');
    tableBody.innerHTML = ''; // Bersihkan tabel

    if (bookings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Belum ada data booking.</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        const row = document.createElement('tr');
        
        let statusClass = '';
        let statusText = booking.status;

        // Styling status
        switch (booking.status) {
            case 'confirmed':
                statusClass = 'status-approved';
                statusText = 'Approved';
                break;
            case 'pending':
                statusClass = 'status-pending';
                statusText = 'Pending';
                break;
            case 'rejected':
                statusClass = 'status-rejected';
                statusText = 'Rejected';
                break;
            case 'canceled':
                statusClass = 'status-canceled';
                statusText = 'Canceled';
                break;
        }

        // Format tanggal
        const date = new Date(booking.booking_date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Tombol aksi (hanya aktif jika status pending)
        const isPending = booking.status === 'pending';
        const isActive = booking.status === 'pending' || booking.status === 'confirmed';

        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.username || 'Unknown'}</td>
            <td>${booking.room_name || 'Unknown Room'}</td>
            <td>${date}</td>
            <td>${booking.booking_time}</td>
            <td>${booking.purpose}</td>
            <td class="status"><span class="${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-approve" data-id="${booking.id}" ${!isPending ? 'disabled' : ''}>Approve</button>
                    <button class="btn btn-reject" data-id="${booking.id}" ${!isPending ? 'disabled' : ''}>Reject</button>
                    <button class="btn btn-cancel" data-id="${booking.id}" ${!isActive ? 'disabled' : ''}>Cancel</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Setup logika tombol (Approve/Reject/Cancel)
function setupTableActions() {
    const tableBody = document.querySelector('.booking-table tbody');

    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName !== 'BUTTON') return;

        const id = target.dataset.id;
        let newStatus = '';
        let confirmMsg = '';

        if (target.classList.contains('btn-approve')) {
            newStatus = 'confirmed';
            confirmMsg = 'Setujui booking ini?';
        } else if (target.classList.contains('btn-reject')) {
            newStatus = 'rejected';
            confirmMsg = 'Tolak booking ini?';
        } else if (target.classList.contains('btn-cancel')) {
            newStatus = 'canceled';
            confirmMsg = 'Batalkan booking ini secara paksa?';
        }

        if (newStatus && confirm(confirmMsg)) {
            try {
                const response = await fetch(`/api/bookings/${id}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (response.ok) {
                    alert('Status berhasil diperbarui!');
                    fetchAdminBookings(); // Refresh data tabel
                } else {
                    alert('Gagal memperbarui status.');
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('Terjadi kesalahan koneksi.');
            }
        }
    });
}