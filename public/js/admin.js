document.addEventListener("DOMContentLoaded", async () => {
    if (typeof initUserDisplay === 'function') {
        initUserDisplay();
    }
    
    // Setup Event Listener untuk tombol di dalam tabel (Event Delegation)
    setupTableActions();
});

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
            newStatus = 'approved';
            confirmMsg = 'Are you sure you want to approve this booking?';
        } else if (target.classList.contains('btn-reject')) {
            newStatus = 'rejected';
            confirmMsg = 'Are you sure you want to reject this booking?';
        } else if (target.classList.contains('btn-cancel')) {
            newStatus = 'canceled';
            confirmMsg = 'Are you sure you want to cancel this booking?';
        }

        if (newStatus && confirm(confirmMsg)) {
            try {
                const response = await fetch(`/api/bookings/${id}/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (response.ok) {
                    alert('Status updated successfully!');
                    location.reload(); // Refresh data tabel
                } else {
                    alert('Failed to update status.');
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('An error occurred while connecting.');
            }
        }
    });
}