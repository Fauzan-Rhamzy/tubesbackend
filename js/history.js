const bookingHistory = [
    {
        id: 1,
        room: "Meeting Room A",
        date: "21/11/2025",
        time: "08:00 - 11:00",
        purpose: "Rapat Proyek",
        status: "approved"
    },
    {
        id: 2,
        room: "Meeting Room B",
        date: "22/11/2025",
        time: "08:00 - 11:00",
        purpose: "Rapat Proyek",
        status: "waiting"
    },
    {
        id: 3,
        room: "Meeting Room C",
        date: "23/11/2025",
        time: "08:00 - 11:00",
        purpose: "Rapat Proyek",
        status: "rejected"
    }
];

// Render history saat halaman load
document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
});

//cancel Booking
function cancelBooking(id) {
    const confirmCancel = confirm("Yakin ingin membatalkan booking?");
    if (!confirmCancel) return;

    const index = bookingHistory.findIndex(item => item.id === id);
    if (index !== -1) {
        bookingHistory[index].status = "cancelled_by_user";
        alert("Booking berhasil dibatalkan!");
        renderHistory();
    }
}

//list Booking
function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    bookingHistory.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("history-card");

        let statusClass = {
            approved: "status-approved",
            waiting: "status-waiting",
            rejected: "status-rejected",
            cancelled_by_user: "status-rejected"
        }[item.status];

        let showCancel = (item.status === "waiting" || item.status === "approved");

        card.innerHTML = `
            <div class="history-card-content">
                <div>
                    <div class="room-name">${item.room}</div>
                    <div class="detail">Tanggal: ${item.date}</div>
                    <div class="detail">Waktu: ${item.time}</div>
                    <div class="detail">Tujuan: ${item.purpose}</div>

                    <div style="margin-top:12px;">
                        <span class="status ${statusClass}">
                            ${item.status.toUpperCase().replace("_BY_USER", "")}
                        </span>

                        ${showCancel ? `
                            <button class="btn-cancel-booking" data-id="${item.id}">
                                Batalkan Booking
                            </button>
                        ` : ""}
                    </div>
                </div>

                <img class="history-image" src="../images/ruang a/meetingroom-1.jpg" alt="Room Image">
            </div>
        `;

        list.appendChild(card);
    });

    document.querySelectorAll(".btn-cancel-booking").forEach(btn => {
        btn.addEventListener("click", () => {
            cancelBooking(parseInt(btn.dataset.id));
        });
    });
}