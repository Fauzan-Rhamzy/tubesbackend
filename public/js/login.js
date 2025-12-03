document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!email || !password) {
        msg.textContent = "Pastikan Email dan Password terisi!";
        return;
    }

    try {
        // Kirim data ke ke server.js
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

            // Menyimpan info user (username, role, email, userId)
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);
            localStorage.setItem("email", email);

            // Pindah halaman
            if (data.role === 'admin') {
                window.location.href = "/admin_page";
            } else {
                window.location.href = "/dashboard";
            }
        } else {
            // Login Gagal passwrod salah atau user tidak ada 
            msg.textContent = data.message;
            msg.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        msg.textContent = "Gagal terhubung ke server";
    }
});