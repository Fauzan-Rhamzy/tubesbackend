document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    //Ambil data dari form HTML
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        //Kirim Request ke Server
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // Cek respon dari server
        if (response.ok) {
            localStorage.setItem("username", data.username || "User"); //Local storage untuk username
            
            // Redirect halaman sesuai role
            if (data.role === 'admin') {
                window.location.href = "/admin";
            } else {
                window.location.href = "/dashboard";
            }
        } else {
            // Login Gagal (Password salah / Email tidak ada)
            alert(data.message || "Login gagal");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan pada server.");
    }
});