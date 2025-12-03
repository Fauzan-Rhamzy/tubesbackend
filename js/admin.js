async function loadBookings() {
    const res = await fetch("http://localhost:3000/api/bookings");
    const data = await res.json();
    const tbody = document.getElementById("adminBookingTableBody");

    tbody.innerHTML = "";

    data.forEach(item => {
        let statusClass = {
            pending: "status-pending",
            waiting: "status-pending",
            approved: "status-approved",
            rejected: "status-rejected",
            cancelled_by_user: "status-canceled"
        }[item.status];

        tbody.innerHTML += `
            <tr>
                <td>${item.id}</td>
                <td>${item.username}</td>
                <td>${item.room_name}</td>
                <td>${item.booking_date.split("T")[0]}</td>
                <td>${item.booking_time}</td>
                <td>${item.purpose}</td>
                <td><span class="${statusClass}">${item.status}</span></td>

                <td>
                    <button class="btn btn-approve" onclick="approve(${item.id})" ${item.status === "approved" ? "disabled" : ""}>Approve</button>
                    <button class="btn btn-reject" onclick="reject(${item.id})" ${item.status === "rejected" ? "disabled" : ""}>Reject</button>
                    <button class="btn btn-cancel" onclick="cancel(${item.id})" ${item.status === "cancelled_by_user" || item.status === "rejected" ? "disabled" : ""}>Cancel</button>
                </td>
            </tr>
        `;
    });
}

async function approve(id) {
    await fetch(`http://localhost:3000/api/bookings/approve/${id}`, { method: "PATCH" });
    loadBookings();
}

async function reject(id) {
    await fetch(`http://localhost:3000/api/bookings/reject/${id}`, { method: "PATCH" });
    loadBookings();
}

async function cancel(id) {
    await fetch(`http://localhost:3000/api/bookings/cancel/${id}`, { method: "PATCH" });
    loadBookings();
}

document.addEventListener("DOMContentLoaded", loadBookings);
