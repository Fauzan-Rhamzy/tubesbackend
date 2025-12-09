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

// Handler Submit
async function handleSubmit(event) {
    event.preventDefault();

    const roomId = document.getElementById('roomId');
    const bookingDate = document.getElementById('bookingDate');
    const duration = document.getElementById('duration');
    const purpose = document.getElementById('purpose');

    let isValid = true;
    isValid = validateInput(bookingDate) && isValid;
    isValid = validateInput(duration) && isValid;
    isValid = validateInput(purpose) && isValid;

    if (!isValid) {
        const unsuccessPopup = document.getElementById("unsuccessPopup");
        if (unsuccessPopup) {
            unsuccessPopup.classList.add('show');
            document.getElementById("unsuccessOkBtn").onclick = function () {
                unsuccessPopup.classList.remove('show');
            };
        }
        return;
    }

    //Mengirim ke server
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: roomId.value,
                bookingDate: bookingDate.value,
                bookingTime: duration.value,
                purpose: purpose.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            const successPopup = document.getElementById("successPopup");
            successPopup.classList.add('show');
            document.getElementById("popupOkBtn").onclick = function () {
                successPopup.classList.remove('show');
                window.location.href = "/history"
            };
        } else {
            const unsuccessPopup = document.getElementById("unsuccessPopup");
            if (unsuccessPopup) {
                unsuccessPopup.classList.add('show');
                document.getElementById("unsuccessOkBtn").onclick = function () {
                    unsuccessPopup.classList.remove('show');
                };
            }
        }
    } catch (err) {
        const unsuccessPopup = document.getElementById("unsuccessPopup");
        if (unsuccessPopup) {
            unsuccessPopup.classList.add('show');
            document.getElementById("unsuccessOkBtn").onclick = function () {
                unsuccessPopup.classList.remove('show');
            };
        }
    }
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

document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector(".btn-submit");
    if (submitBtn) {
        submitBtn.addEventListener("click", handleSubmit);
    }

    setupLiveValidation();

    const bookingDate = document.getElementById("bookingDate");
    if (bookingDate) {
        const today = new Date().toISOString().split("T")[0];
        bookingDate.setAttribute("min", today);
        bookingDate.value = today;
    }

    const cancelBtn = document.querySelector(".btn-cancel");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }
});