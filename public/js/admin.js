document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.booking-table tbody');

    const fetchData = async () => {
        try {
            const [bookingsRes, usersRes, roomsRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/users'),
                fetch('/api/rooms')
            ]);

            const bookings = await bookingsRes.json();
            const users = await usersRes.json();
            const rooms = await roomsRes.json();

            const usersMap = new Map(users.map(user => [user.id, user.username]));
            const roomsMap = new Map(rooms.map(room => [room.id, room.name]));

            tableBody.innerHTML = '';

            bookings.forEach(booking => {
                const row = document.createElement('tr');
                let statusClass = '';
                let statusText = '';

                if (booking.status === 'confirmed') {
                    statusClass = 'status-approved';
                    statusText = 'Approved';
                } else if (booking.status === 'pending') {
                    statusClass = 'status-pending';
                    statusText = 'Pending';
                } else if (booking.status === 'rejected') {
                    statusClass = 'status-rejected';
                    statusText = 'Rejected';
                } else if (booking.status === 'canceled') {
                    statusClass = 'status-canceled';
                    statusText = 'Canceled';
                }

                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${usersMap.get(booking.user_id) || 'Unknown User'}</td>
                    <td>${roomsMap.get(booking.room_id) || 'Unknown Room'}</td>
                    <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td>${booking.booking_time}</td>
                    <td>${booking.purpose}</td>
                    <td class="status"><span class="${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-approve" data-id="${booking.id}" ${booking.status !== 'pending' ? 'disabled' : ''}>Approve</button>
                            <button class="btn btn-reject" data-id="${booking.id}" ${booking.status !== 'pending' ? 'disabled' : ''}>Reject</button>
                            <button class="btn btn-cancel" data-id="${booking.id}" ${booking.status === 'canceled' || booking.status === 'rejected' ? 'disabled' : ''}>Cancel</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = '<tr><td colspan="8">Error loading data</td></tr>';
        }
    };

    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName !== 'BUTTON') {
            return;
        }

        const id = target.dataset.id;
        let status = '';

        if (target.classList.contains('btn-approve')) {
            status = 'confirmed';
        } else if (target.classList.contains('btn-reject')) {
            status = 'rejected';
        } else if (target.classList.contains('btn-cancel')) {
            status = 'canceled';
        }

        if (status) {
            try {
                const response = await fetch(`/api/bookings/${id}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status }),
                });

                if (response.ok) {
                    fetchData();
                } else {
                    console.error('Failed to update status');
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    });

    fetchData();
});