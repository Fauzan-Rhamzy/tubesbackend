function showError(e) { const t = e.parentElement.querySelector(".error-message"); t && t.classList.add("show"), e.classList.add("error") } function hideError(e) { const t = e.parentElement.querySelector(".error-message"); t && t.classList.remove("show"), e.classList.remove("error") } function validateInput(e) { return e.value.trim() ? (hideError(e), !0) : (showError(e), !1) } async function handleSubmit(e) { e.preventDefault(); const t = document.getElementById("roomId"), n = document.getElementById("bookingDate"), o = document.getElementById("duration"), s = document.getElementById("purpose"); let c = !0; if (c = validateInput(n) && c, c = validateInput(o) && c, c = validateInput(s) && c, c) try { const e = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId: t.value, bookingDate: n.value, bookingTime: o.value, purpose: s.value }) }); await e.json(); if (e.ok) { const e = document.getElementById("successPopup"); e.classList.add("show"), document.getElementById("popupOkBtn").onclick = function () { e.classList.remove("show"), window.location.href = "/history" } } else { const e = document.getElementById("unsuccessPopup"); e && (e.classList.add("show"), document.getElementById("unsuccessOkBtn").onclick = function () { e.classList.remove("show") }) } } catch (e) { const t = document.getElementById("unsuccessPopup"); t && (t.classList.add("show"), document.getElementById("unsuccessOkBtn").onclick = function () { t.classList.remove("show") }) } else { const e = document.getElementById("unsuccessPopup"); e && (e.classList.add("show"), document.getElementById("unsuccessOkBtn").onclick = function () { e.classList.remove("show") }) } } function setupLiveValidation() { ["bookingDate", "duration", "purpose"].forEach((e => { const t = document.getElementById(e); t && (t.addEventListener("input", (() => validateInput(t))), t.addEventListener("change", (() => validateInput(t)))) })) } function handleDateChange() { const e = document.getElementById("bookingDate"), t = document.getElementById("roomId"); if (e && t) { const t = e.value, n = new URL(window.location.href); n.searchParams.set("date", t), window.location.href = n.toString() } } document.addEventListener("DOMContentLoaded", (() => { const e = document.querySelector(".btn-submit"); e && e.addEventListener("click", handleSubmit), setupLiveValidation(); const t = document.getElementById("bookingDate"); if (t) { const e = (new Date).toISOString().split("T")[0]; t.setAttribute("min", e); const n = new URLSearchParams(window.location.search).get("date"); t.value = n || e, t.addEventListener("change", handleDateChange) } const n = document.querySelector(".btn-cancel"); n && n.addEventListener("click", (() => { window.location.href = "/dashboard" })) }));
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

// // Handler Submit
// async function handleSubmit(event) {
//     event.preventDefault();

//     const roomId = document.getElementById('roomId');
//     const bookingDate = document.getElementById('bookingDate');
//     const duration = document.getElementById('duration');
//     const purpose = document.getElementById('purpose');

//     let isValid = true;
//     isValid = validateInput(bookingDate) && isValid;
//     isValid = validateInput(duration) && isValid;
//     isValid = validateInput(purpose) && isValid;

//     if (!isValid) {
//         const unsuccessPopup = document.getElementById("unsuccessPopup");
//         if (unsuccessPopup) {
//             unsuccessPopup.classList.add('show');
//             document.getElementById("unsuccessOkBtn").onclick = function () {
//                 unsuccessPopup.classList.remove('show');
//             };
//         }
//         return;
//     }

//     //Mengirim ke server
//     try {
//         const response = await fetch('/api/bookings', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 roomId: roomId.value,
//                 bookingDate: bookingDate.value,
//                 bookingTime: duration.value,
//                 purpose: purpose.value
//             })
//         });

//         const data = await response.json();

//         if (response.ok) {
//             const successPopup = document.getElementById("successPopup");
//             successPopup.classList.add('show');
//             document.getElementById("popupOkBtn").onclick = function () {
//                 successPopup.classList.remove('show');
//                 window.location.href = "/history"
//             };
//         } else {
//             const unsuccessPopup = document.getElementById("unsuccessPopup");
//             if (unsuccessPopup) {
//                 unsuccessPopup.classList.add('show');
//                 document.getElementById("unsuccessOkBtn").onclick = function () {
//                     unsuccessPopup.classList.remove('show');
//                 };
//             }
//         }
//     } catch (err) {
//         const unsuccessPopup = document.getElementById("unsuccessPopup");
//         if (unsuccessPopup) {
//             unsuccessPopup.classList.add('show');
//             document.getElementById("unsuccessOkBtn").onclick = function () {
//                 unsuccessPopup.classList.remove('show');
//             };
//         }
//     }
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

// // Fungsi untuk reload halaman dengan tanggal baru
// function handleDateChange() {
//     const bookingDate = document.getElementById("bookingDate");
//     const roomId = document.getElementById("roomId");

//     if (bookingDate && roomId) {
//         const selectedDate = bookingDate.value;
//         const currentUrl = new URL(window.location.href);
//         currentUrl.searchParams.set('date', selectedDate);

//         // Reload halaman dengan query parameter date
//         window.location.href = currentUrl.toString();
//     }
// }

// document.addEventListener("DOMContentLoaded", () => {
//     const submitBtn = document.querySelector(".btn-submit");
//     if (submitBtn) {
//         submitBtn.addEventListener("click", handleSubmit);
//     }

//     setupLiveValidation();

//     const bookingDate = document.getElementById("bookingDate");
//     if (bookingDate) {
//         const today = new Date().toISOString().split("T")[0];
//         bookingDate.setAttribute("min", today);

//         // Set value dari query parameter atau gunakan today
//         const urlParams = new URLSearchParams(window.location.search);
//         const dateParam = urlParams.get('date');
//         bookingDate.value = dateParam || today;

//         // Tambahkan event listener untuk reload ketika tanggal berubah
//         bookingDate.addEventListener("change", handleDateChange);
//     }

//     const cancelBtn = document.querySelector(".btn-cancel");
//     if (cancelBtn) {
//         cancelBtn.addEventListener("click", () => {
//             window.location.href = "/dashboard";
//         });
//     }
// });