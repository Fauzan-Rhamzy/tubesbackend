/**
 * Fungsi untuk cek apakah user sudah login
 * Jika belum, redirect ke login
 */
function checkAuth() {
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId"); // Tambahkan cek userId

    if (!username || !userId) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

//load dan display username
function loadUsername() {
    const username = localStorage.getItem("username") || "User";
    const usernameDisplay = document.getElementById("usernameDisplay");

    if (usernameDisplay) {
        usernameDisplay.textContent = "Hi, " + username + "!";
    }
}

//Log out
function setupLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (e) {
            e.preventDefault();

            // Hapus semua data user dari localStorage
            localStorage.removeItem("username");
            localStorage.removeItem("userId"); // Hapus userId juga
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            localStorage.removeItem("selectedRoomId"); // Hapus selectedRoomId juga

            // Langsung redirect tanpa alert
            window.location.href = "login.html";
        });
    }
}

function initAuth() {
    // cek autentikasi 
    if (!checkAuth()) {
        return;
    }

    // Kalau sudah login, maka bisa menampilkan halaman
    document.body.style.visibility = "visible";
    // document.body.style.opacity = "1";

    // Load username
    loadUsername();

    // Setup logout button
    setupLogout();
}

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
});