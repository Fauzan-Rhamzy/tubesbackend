// public/js/auth.js

function loadUsername() {
    // Ambil nama untuk tampilan saja. 
    // (Pastikan di login.js kamu menyimpan 'username' ke localStorage jika ingin nama muncul)
    const username = localStorage.getItem("username") || "User";
    const usernameDisplay = document.getElementById("usernameDisplay");

    if (usernameDisplay) {
        usernameDisplay.textContent = "Hi, " + username + "!";
    }
}

function setupLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        // Ubah jadi async karena kita mau request ke server
        logoutButton.addEventListener("click", async function (e) {
            e.preventDefault();

            try {
                // [PENTING] Minta server menghapus Cookie HTTP-Only
                const response = await fetch('/api/logout', {
                    method: 'POST'
                });

                if (response.ok) {
                    // Hapus data sisa di localStorage (hanya data tampilan)
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

// Export module untuk kebutuhan testing/node (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadUsername,
        setupLogout,
        initUserDisplay
    };
}