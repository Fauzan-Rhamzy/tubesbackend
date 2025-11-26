document.addEventListener('DOMContentLoaded', () => {

    // ngambil semua action button
    const actionButtons = document.querySelectorAll('.action-buttons .btn');

    // untuk setiap button ditempelin event listener
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // kalau buttonnya disabled
            if (button.disabled) {
                return;
            }

            let actionText = '';
            if (button.classList.contains('btn-approve')) {
                actionText = 'approve';
            } else if (button.classList.contains('btn-reject')) {
                actionText = 'reject';
            } else if (button.classList.contains('btn-cancel')) {
                actionText = 'cancel';
            }

            const isConfirmed = confirm(`Are you sure you want to ${actionText} this booking?`);

            if (isConfirmed) {
                const row = button.closest('tr');
                const statusCell = row.querySelector('.status');
                
                let newStatus = '';
                let newStatusClass = '';

                // update status sesuai dengan button yang ditekan
                if (actionText === 'approve') {
                    newStatus = 'Approved';
                    newStatusClass = 'status-approved';
                } else if (actionText === 'reject') {
                    newStatus = 'Rejected';
                    newStatusClass = 'status-rejected';
                } else if (actionText === 'cancel') {
                    newStatus = 'Canceled';
                    newStatusClass = 'status-canceled';
                }

                // update status
                statusCell.innerHTML = `<span class="${newStatusClass}">${newStatus}</span>`;

                // tombol yang sudah ditekan di disable
                button.disabled = true;

                alert(`Booking has been ${newStatus.toLowerCase()}.`);
            }
        });
    });

});