// Edit js/login.js
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value; // Pastikan id di html 'password'
    const msg = document.getElementById("msg");

    if (!email || !password) {
        msg.textContent = "Pastikan Email dan Password terisi!";
        return;
    }

    try {
        // Kirim data ke Node.js (Server Manual kita)
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login Berhasil
            console.log("Login sukses:", data);

            // Menyimpan info user (username, role, email)
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", email);

            // Pindah halaman
            if (data.role === 'admin') {
                window.location.href = "./admin_page.html";
            } else {
                window.location.href = "./dashboard.html";
            }
        } else {
            // Login Gagal (Password salah / User tak ada)
            msg.textContent = data.message;
            msg.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        msg.textContent = "Gagal terhubung ke server";
    }
});