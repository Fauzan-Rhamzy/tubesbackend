// public/js/auth.js

function loadUsername() {
    // Ambil nama dari localstorage (ongoing)
    const username = localStorage.getItem("username") || "User";
    const usernameDisplay = document.getElementById("usernameDisplay");

    if (usernameDisplay) {
        usernameDisplay.textContent = "Hi, " + username + "!";
    }
}

function setupLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", async function (e) {
            e.preventDefault();

            try {
                const response = await fetch('/api/logout', {
                    method: 'POST'
                });

                if (response.ok) {
                    // Hapus data sisa di localStorage
                    localStorage.removeItem("username");
                    localStorage.removeItem("selectedRoomId");
                    localStorage.removeItem("userId"); // Jaga-jaga jika masih ada
                    
                    // Redirect ke halaman login
                    window.location.href = "/login";
                } else {
                    console.error("Gagal logout di sisi server");
                    window.location.href = "/login";
                }
            } catch (error) {
                console.error("Error saat logout:", error);
                window.location.href = "/login"; // Tetap redirect biar user tidak terjebak
            }
        });
    }
}

function initUserDisplay() {
    loadUsername();
    setupLogout();
}