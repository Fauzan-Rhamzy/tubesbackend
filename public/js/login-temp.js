document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // ambil input
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    try {
        // kirim request login
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // tunggu response
        const data = await response.json();

        // cek respon server
        if (response.ok) {
            
            // redirect halaman sesuai role
            if (data.role === 'admin') {
                window.location.href = "/admin";
            } else {
                window.location.href = "/dashboard";
            }
        } else {
            msg.textContent = data.message;
            msg.style.color = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan pada server.");
    }
});