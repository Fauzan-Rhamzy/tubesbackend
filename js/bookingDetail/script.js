function showError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.display = 'block';
    }
    inputElement.classList.add('error');
}

function hideError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    inputElement.classList.remove('error');
}

// Fungsi validasi input kosong
function validateInput(inputElement) {
    if (!inputElement.value.trim()) {
        showError(inputElement);
        return false;
    }
    hideError(inputElement);
    return true;
}

function handleSubmit(event) {
    event.preventDefault();

    const bookingDate = document.getElementById('bookingDate');
    const duration = document.getElementById('duration');
    const purpose = document.getElementById('purpose');
    const email = document.getElementById('email');
    const contactPhone = document.getElementById('contactPhone');

    let isValid = true;

    isValid &= validateInput(bookingDate);
    isValid &= validateInput(duration);
    isValid &= validateInput(purpose);
    isValid &= validateInput(email);
    isValid &= validateInput(contactPhone);

    isValid = Boolean(isValid);

    if (!isValid) {
        alert("Silakan lengkapi semua data yang wajib diisi.");
        return;
    }

    alert("Booking berhasil! Data siap dikirim ke server.");
    location.reload();
}

function setupLiveValidation() {
    const inputs = [
        "bookingDate",
        "duration",
        "purpose",
        "email",
        "contactPhone"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);

        if (!element) return;

        element.addEventListener("input", () => validateInput(element));

        element.addEventListener("change", () => validateInput(element));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector(".btn-submit");

    if (submitBtn) submitBtn.addEventListener("click", handleSubmit);

    setupLiveValidation();

    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const today = new Date().toISOString().split("T")[0];
        bookingDate.setAttribute("min", today);
    }
});
