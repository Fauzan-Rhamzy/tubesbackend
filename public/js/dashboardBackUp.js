
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".room-option-card");
    const bookingBtn = document.getElementById("bookingButton");
    let selectedRoomId = null;

    // Event listener untuk setiap card
    cards.forEach(card => {
        card.addEventListener("click", () => {
            // Hapus active dari semua card
            cards.forEach(c => c.classList.remove("active"));

            // Tambahkan active ke card yang diklik
            card.classList.add("active");

            //Meyimpan roomID yang dipilih
            selectedRoomId = card.getAttribute("data-room-id");

            // Enable booking button
            bookingBtn.classList.remove("disabled");
            bookingBtn.disabled = false;
        });
    });

    // Ketika tombol booking diklik
    bookingBtn.addEventListener("click", () => {
        if (!bookingBtn.disabled) {
            window.location.href = "/booking?id=" + selectedRoomId
        }
    });
}); 