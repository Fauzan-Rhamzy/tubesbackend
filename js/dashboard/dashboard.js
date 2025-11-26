document.addEventListener("DOMContentLoaded", () => {    
    const dashboardDate = document.querySelector(".dashboardDate");
    if (dashboardDate) {
        const today = new Date().toISOString().split("T")[0];
        dashboardDate.setAttribute("min", today);
        dashboardDate.setAttribute("value", today);
    }
    roomCards = document.querySelectorAll(".room-option-card")
    currentActive = document.querySelector(".room-option-card > .active")
    
    roomCards.forEach(card => {
        card.addEventListener('click', function() {          
            roomCards.forEach(card => {
                card.classList.remove("active")
            })

            this.classList.add("active");
        });
    });
});
