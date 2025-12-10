function showError(e){const t=e.parentElement.querySelector(".error-message");t&&t.classList.add("show"),e.classList.add("error")}function hideError(e){const t=e.parentElement.querySelector(".error-message");t&&t.classList.remove("show"),e.classList.remove("error")}function validateInput(e){return e.value.trim()?(hideError(e),!0):(showError(e),!1)}function setupLiveValidation(){["bookingDate","duration","purpose"].forEach((e=>{const t=document.getElementById(e);t&&(t.addEventListener("input",(()=>validateInput(t))),t.addEventListener("change",(()=>validateInput(t))))}))}function handleDateChange(){const e=document.getElementById("bookingDate");if(e){const t=e.value,n=new URL(window.location.href);n.searchParams.set("date",t),window.location.href=n.toString()}}function handleBookingSubmit(e){e.preventDefault();const t=document.getElementById("bookingDate"),n=document.getElementById("duration"),o=document.getElementById("purpose");let d=!0;if(d=validateInput(t)&&d,d=validateInput(n)&&d,d=validateInput(o)&&d,!d){const e=document.getElementById("unsuccessPopup");return void(e&&(e.style.display="flex"))}const s=document.getElementById("successPopup");s&&(s.style.display="flex")}document.addEventListener("DOMContentLoaded",(()=>{setupLiveValidation();const e=document.getElementById("bookingDate");if(e){const t=(new Date).toISOString().split("T")[0];e.setAttribute("min",t);const n=new URLSearchParams(window.location.search).get("date");e.value=n||t,e.addEventListener("change",handleDateChange)}const t=document.querySelector(".btn-cancel");t&&t.addEventListener("click",(()=>{window.location.href="/dashboard"}));const n=document.querySelector(".btn-submit");n&&n.addEventListener("click",handleBookingSubmit);const o=document.getElementById("popupOkBtn");o&&o.addEventListener("click",(()=>{const e=document.getElementById("bookingForm");e&&e.submit()}));const d=document.getElementById("unsuccessOkBtn");d&&d.addEventListener("click",(()=>{const e=document.getElementById("unsuccessPopup");e&&(e.style.display="none")}))}));
// function showError(inputElement) {
//     const errorMessage = inputElement.parentElement.querySelector('.error-message');
//     if (errorMessage) errorMessage.classList.add('show');
//     inputElement.classList.add('error');
// }

// function hideError(inputElement) {
//     const errorMessage = inputElement.parentElement.querySelector('.error-message');
//     if (errorMessage) errorMessage.classList.remove('show');
//     inputElement.classList.remove('error');
// }

// function validateInput(inputElement) {
//     if (!inputElement.value.trim()) {
//         showError(inputElement);
//         return false;
//     }
//     hideError(inputElement);
//     return true;
// }

// function setupLiveValidation() {
//     const inputs = ["bookingDate", "duration", "purpose"];
//     inputs.forEach(id => {
//         const element = document.getElementById(id);
//         if (!element) return;
//         element.addEventListener("input", () => validateInput(element));
//         element.addEventListener("change", () => validateInput(element));
//     });
// }

// function handleDateChange() {
//     const bookingDate = document.getElementById("bookingDate");
//     if (bookingDate) {
//         const selectedDate = bookingDate.value;

//         const currentUrl = new URL(window.location.href);
//         currentUrl.searchParams.set('date', selectedDate);

//         window.location.href = currentUrl.toString();
//     }
// }

// // Function untuk submit booking
// function handleBookingSubmit(event) {
//     event.preventDefault();

//     const bookingDate = document.getElementById("bookingDate");
//     const duration = document.getElementById("duration");
//     const purpose = document.getElementById("purpose");

//     let isValid = true;
//     isValid = validateInput(bookingDate) && isValid;
//     isValid = validateInput(duration) && isValid;
//     isValid = validateInput(purpose) && isValid;

//     if (!isValid) {
//         const unsuccessPopup = document.getElementById("unsuccessPopup");
//         if (unsuccessPopup) {
//             unsuccessPopup.style.display = "flex";
//         }
//         return;
//     }

//     const successPopup = document.getElementById("successPopup");
//     if (successPopup) {
//         successPopup.style.display = "flex";
//     }
// }

// document.addEventListener("DOMContentLoaded", () => {

//     setupLiveValidation();

//     const bookingDate = document.getElementById("bookingDate");
//     if (bookingDate) {
//         const today = new Date().toISOString().split("T")[0];
//         bookingDate.setAttribute("min", today);

//         const urlParams = new URLSearchParams(window.location.search);
//         const dateParam = urlParams.get('date');
//         bookingDate.value = dateParam || today;

//         bookingDate.addEventListener("change", handleDateChange);
//     }

//     const cancelBtn = document.querySelector(".btn-cancel");
//     if (cancelBtn) {
//         cancelBtn.addEventListener("click", () => {
//             window.location.href = "/dashboard";
//         });
//     }

//     const submitBtn = document.querySelector(".btn-submit");
//     if (submitBtn) {
//         submitBtn.addEventListener("click", handleBookingSubmit);
//     }

//     const popupOkBtn = document.getElementById("popupOkBtn");
//     if (popupOkBtn) {
//         popupOkBtn.addEventListener("click", () => {
//             const form = document.getElementById("bookingForm");
//             if (form) {
//                 form.submit();
//             }
//         });
//     }

//     const unsuccessOkBtn = document.getElementById("unsuccessOkBtn");
//     if (unsuccessOkBtn) {
//         unsuccessOkBtn.addEventListener("click", () => {
//             const unsuccessPopup = document.getElementById("unsuccessPopup");
//             if (unsuccessPopup) {
//                 unsuccessPopup.style.display = "none";
//             }
//         });
//     }
// });