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

    let isValid = true;

    isValid &= validateInput(bookingDate);
    isValid &= validateInput(duration);
    isValid &= validateInput(purpose);

    isValid = Boolean(isValid);

    if (!isValid) {
        // Tampilkan popup gagal
        document.getElementById("unsuccessPopup").style.display = "flex";

        // Tombol OK untuk menutup popup gagal
        document.getElementById("unsuccessOkBtn").onclick = function () {
            document.getElementById("unsuccessPopup").style.display = "none";
        };

        return;
    }

    // Menampilkan pop up
    document.getElementById("successPopup").style.display = "flex";

    // pindah halaman ke history.html
    document.getElementById("popupOkBtn").onclick = function () {
        window.location.href = "history.html";
    };

}

function setupLiveValidation() {
    const inputs = [
        "bookingDate",
        "duration",
        "purpose"
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

    const cancelBtn = document.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "dashboard.html";
        });
    }

});
