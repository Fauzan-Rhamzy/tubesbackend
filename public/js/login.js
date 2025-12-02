document.getElementById("loginForm").addEventListener("submit", function(e){
    e.preventDefault();

    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    if (!email || !pass) {
        const msg = document.getElementById("msg");
        msg.textContent = "Pastikan Email dan Password terisi!";
    } else {
        console.log("Email:", email);
        console.log("Password:", pass);
        window.location.href = "./dashboard";

    }

});