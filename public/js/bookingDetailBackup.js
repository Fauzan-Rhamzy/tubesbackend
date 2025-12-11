function showError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) errorMessage.classList.add('show');
    inputElement.classList.add('error');
}

function hideError(inputElement) {
    const errorMessage = inputElement.parentElement.querySelector('.error-message');
    if (errorMessage) errorMessage.classList.remove('show');
    inputElement.classList.remove('error');
}

function validateInput(inputElement) {
    if (!inputElement.value.trim()) {
        showError(inputElement);
        return false;
    }
    hideError(inputElement);
    return true;
}

function setupLiveValidation() {
    const inputs = ["bookingDate", "duration", "purpose"];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;
        element.addEventListener("input", () => validateInput(element));
        element.addEventListener("change", () => validateInput(element));
    });
}

function handleDateChange() {
    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const selectedDate = bookingDate.value;

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('date', selectedDate);

        window.location.href = currentUrl.toString();
    }
}

// Function untuk submit booking
function handleBookingSubmit(event) {
    event.preventDefault();

    const bookingDate = document.getElementById("bookingDate");
    const duration = document.getElementById("duration");
    const purpose = document.getElementById("purpose");

    let isValid = true;
    isValid = validateInput(bookingDate) && isValid;
    isValid = validateInput(duration) && isValid;
    isValid = validateInput(purpose) && isValid;

    if (!isValid) {
        const unsuccessPopup = document.getElementById("unsuccessPopup");
        if (unsuccessPopup) {
            unsuccessPopup.style.display = "flex";
        }
        return;
    }

    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
        successPopup.style.display = "flex";
    }
}

document.addEventListener("DOMContentLoaded", () => {

    setupLiveValidation();

    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const today = new Date().toISOString().split("T")[0];
        bookingDate.setAttribute("min", today);

        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        bookingDate.value = dateParam || today;

        bookingDate.addEventListener("change", handleDateChange);
    }

    const cancelBtn = document.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }

    const submitBtn = document.querySelector(".btn-submit");
    if (submitBtn) {
        submitBtn.addEventListener("click", handleBookingSubmit);
    }

    const popupOkBtn = document.getElementById("popupOkBtn");
    if (popupOkBtn) {
        popupOkBtn.addEventListener("click", () => {
            const form = document.getElementById("bookingForm");
            if (form) {
                form.submit();
            }
        });
    }

    const unsuccessOkBtn = document.getElementById("unsuccessOkBtn");
    if (unsuccessOkBtn) {
        unsuccessOkBtn.addEventListener("click", () => {
            const unsuccessPopup = document.getElementById("unsuccessPopup");
            if (unsuccessPopup) {
                unsuccessPopup.style.display = "none";
            }
        });
    }
});