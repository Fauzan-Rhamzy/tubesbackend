
async function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    const userId = localStorage.getItem("userId");
    if (!userId) {
        list.innerHTML = "<p>Anda belum login</p>";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/bookings/user/${userId}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            list.innerHTML = "<p>Tidak ada data booking.</p>";
            return;
        }

        data.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("history-card");

            let statusClass = {
                approved: "status-approved",
                waiting: "status-waiting",
                pending: "status-waiting",
                rejected: "status-rejected",
                cancelled_by_user: "status-rejected"
            }[item.status];

            let showCancel = (item.status === "waiting" || item.status === "approved");

            card.innerHTML = `
                <div class="history-card-content">
                    <div>
                        <div class="room-name">${item.room_name}</div>
                        <div class="detail">Tanggal: ${item.booking_date}</div>
                        <div class="detail">Waktu: ${item.booking_time}</div>
                        <div class="detail">Tujuan: ${item.purpose}</div>

                        <div style="margin-top:12px;">
                            <span class="status ${statusClass}">
                                ${item.status.toUpperCase()}
                            </span>

                            ${showCancel ? `
                                <button class="btn-cancel-booking" data-id="${item.id}">
                                    Batalkan Booking
                                </button>
                            ` : ""}
                        </div>
                    </div>

                    <img class="history-image" src="${item.image_path}" alt="Room Image">
                </div>
            `;

            list.appendChild(card);
        });

        document.querySelectorAll(".btn-cancel-booking").forEach(btn => {
            btn.addEventListener("click", () => {
                cancelBooking(parseInt(btn.dataset.id));
            });
        });

    } catch (error) {
        console.error("Error fetching history:", error);
        list.innerHTML = "<p>Error mengambil data history.</p>";
    }
}


