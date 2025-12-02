document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    if (!email || !pass) {
        const msg = document.getElementById("msg");
        msg.textContent = "Pastikan Email dan Password terisi!";
    } else {
        console.log("Email:", email);
        console.log("Password:", pass);
        try{
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email: email, password: pass})
            });
            const data = await response.text();
            console.log(data);
        } catch (error) {
            console.error("Error during login:", error);
        }
    }
});