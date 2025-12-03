function loadUsername() {
    const username = localStorage.getItem("username") || "User";
    const usernameDisplay = document.getElementById("usernameDisplay");

    if (usernameDisplay) {
        usernameDisplay.textContent = "Hi, " + username + "!";
    }
}

function setupLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (e) {
            e.preventDefault();

            // Hapus semua data user dari localStorage
            localStorage.removeItem("username");
            localStorage.removeItem("userId");
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            localStorage.removeItem("selectedRoomId");

            // Redirect ke login
            window.location.href = "/login";
        });
    }
}

function initUserDisplay() {
    loadUsername();
    setupLogout();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadUsername,
        setupLogout,
        initUserDisplay
    };
}