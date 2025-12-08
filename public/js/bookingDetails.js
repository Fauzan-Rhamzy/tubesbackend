// // load detail ruangan yang dipilih dari dashboard
// async function loadSelectedRoom() {
//     try {
//         const selectedRoomId = localStorage.getItem('selectedRoomId');

//         if (!selectedRoomId) {
//             alert('No room selected. Redirecting to dashboard...');
//             window.location.href = '/dashboard';
//             return;
//         }

//         const response = await fetch(`/api/rooms/${selectedRoomId}`);

//         if (!response.ok) {
//             throw new Error('Failed to load room details');
//         }

//         const room = await response.json();
//         updateRoomDisplay(room);

//         const roomIdInput = document.getElementById('roomId');
//         if (roomIdInput) {
//             roomIdInput.value = room.id;
//         }

//     } catch (error) {
//         console.error('Error loading room details:', error);
//         alert('Failed to load room details');
//         window.location.href = '/dashboard';
//     }
// }

// function updateRoomDisplay(room) {
//     const roomImage = document.querySelector('.room-image img');
//     if (roomImage) {
//         roomImage.src = room.image_path ? room.image_path : '../images/ruang-a/meetingroom-1.jpg';
//         roomImage.alt = room.name;
//         roomImage.onerror = function () { this.src = '../images/ruang-a/meetingroom-1.jpg'; };
//     }

//     const roomName = document.querySelector('.room-name');
//     if (roomName) {
//         roomName.textContent = `Selected Room: ${room.name}`;
//     }

//     const roomCapacity = document.querySelector('.room-capacity');
//     if (roomCapacity) {
//         roomCapacity.textContent = `Capacity: ${room.capacity} persons`;
//     }
// }

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

// function getBookingTimeText(timeValue) {
//     const timeMap = {
//         '1': '08.00 - 11.00',
//         '2': '11.00 - 13.00',
//         '3': '13.00 - 15.00',
//         '4': '15.00 - 18.00'
//     };
//     return timeMap[timeValue] || '';
// }

// // Fungsi untuk cek apakah waktu sudah lewat
// function isTimePassed(timeValue) {
//     const now = new Date();
//     const currentHour = now.getHours();
//     const currentMinute = now.getMinutes();
//     const currentTimeInMinutes = currentHour * 60 + currentMinute;

//     // Mapping waktu mulai untuk setiap slot
//     const timeSlotStart = {
//         '1': 8 * 60,      // 08:00
//         '2': 11 * 60,     // 11:00
//         '3': 13 * 60,     // 13:00
//         '4': 15 * 60      // 15:00
//     };

//     const slotStartTime = timeSlotStart[timeValue];

//     // Lewat jika sudah lebih besar dari waktu slot
//     return currentTimeInMinutes >= slotStartTime;
// }

// function isToday(dateString) {
//     const selectedDate = new Date(dateString);
//     const today = new Date();

//     return selectedDate.getDate() === today.getDate() &&
//         selectedDate.getMonth() === today.getMonth() &&
//         selectedDate.getFullYear() === today.getFullYear();
// }

// // Cek ketersediaan waktu booking
// async function checkAvailability(roomId, date) {
//     try {
//         const response = await fetch(`/api/bookings/availability/${roomId}/${date}`);
//         if (!response.ok) throw new Error('Failed to check availability');
//         const data = await response.json();
//         return data.bookedTimes || [];
//     } catch (error) {
//         console.error('Error checking availability:', error);
//         return [];
//     }
// }

// async function updateTimeSlotAvailability() {
//     const roomId = document.getElementById('roomId').value;
//     const bookingDate = document.getElementById('bookingDate').value;
//     const durationSelect = document.getElementById('duration');

//     if (!bookingDate) {
//         resetTimeSlots(durationSelect);
//         return;
//     }

//     // tanggal hari ini
//     const isTodaySelected = isToday(bookingDate);

//     const bookedTimes = await checkAvailability(roomId, bookingDate);

//     const options = durationSelect.querySelectorAll('option');
//     options.forEach(option => {
//         if (option.value) {
//             const timeText = getBookingTimeText(option.value);
//             let isDisabled = false;
//             let disableReason = '';

//             if (bookedTimes.includes(timeText)) {
//                 isDisabled = true;
//                 disableReason = '(Already Booked)';
//             }

//             else if (isTodaySelected && isTimePassed(option.value)) {
//                 isDisabled = true;
//                 disableReason = '(Time Passed)';
//             }

//             if (isDisabled) {
//                 option.disabled = true;
//                 option.textContent = `${timeText} ${disableReason}`;
//             } else {
//                 option.disabled = false;
//                 option.textContent = timeText;
//             }
//         }
//     });
// }

// function resetTimeSlots(selectElement) {
//     const options = selectElement.querySelectorAll('option');
//     options.forEach(option => {
//         if (option.value) {
//             option.disabled = false;
//             option.textContent = getBookingTimeText(option.value);
//         }
//     });
// }

// // Fungsi Submit Booking ke Server
// async function submitBooking(bookingData) {
//     try {
//         const response = await fetch('/api/bookings', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(bookingData)
//         });

//         const result = await response.json();

//         if (!response.ok) {
//             if (response.status === 401) {
//                 alert('Sesi anda telah berakhir. Silakan login kembali.');
//                 window.location.href = '/login';
//                 return { success: false };
//             }
//             if (response.status === 409) {
//                 throw new Error('Ruangan sudah dibooking pada jam tersebut.');
//             }
//             throw new Error(result.message || 'Gagal membuat booking');
//         }

//         return { success: true, data: result };

//     } catch (error) {
//         console.error('Error submitting booking:', error);
//         return { success: false, error: error.message };
//     }
// }

// // Handler Submit
// async function handleSubmit(event) {
//     event.preventDefault();

//     const bookingDate = document.getElementById('bookingDate');
//     const duration = document.getElementById('duration');
//     const purpose = document.getElementById('purpose');
//     const roomId = document.getElementById('roomId');

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

//     const bookingData = {
//         roomId: parseInt(roomId.value),
//         bookingDate: bookingDate.value,
//         bookingTime: getBookingTimeText(duration.value),
//         purpose: purpose.value.trim()
//     };

//     const result = await submitBooking(bookingData);

//     if (result.success) {
//         const successPopup = document.getElementById("successPopup");
//         if (successPopup) {
//             successPopup.classList.add('show');
//             document.getElementById("popupOkBtn").onclick = function () {
//                 window.location.href = "/history";
//             };
//         } else {
//             window.location.href = "/history";
//         }
//     } else if (result.error) {
//         alert(`Booking Gagal: ${result.error}`);
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

// document.addEventListener("DOMContentLoaded", () => {
//     loadSelectedRoom();

//     const submitBtn = document.querySelector(".btn-submit");
//     if (submitBtn) {
//         submitBtn.addEventListener("click", handleSubmit);
//     }

//     setupLiveValidation();

//     const bookingDate = document.getElementById("bookingDate");
//     if (bookingDate) {
//         const today = new Date().toISOString().split("T")[0];
//         bookingDate.setAttribute("min", today);
//         bookingDate.addEventListener("change", updateTimeSlotAvailability);
//         bookingDate.value = today
//     }

//     const durationSelect = document.getElementById("duration");
//     if (durationSelect) {
//         if (bookingDate && bookingDate.value) {
//             updateTimeSlotAvailability();
//         }
//     }

//     const cancelBtn = document.querySelector(".btn-cancel");
//     if (cancelBtn) {
//         cancelBtn.addEventListener("click", () => {
//             window.location.href = "/dashboard";
//         });
//     }

//     if (typeof initUserDisplay === 'function') {
//         initUserDisplay();
//     }
// });