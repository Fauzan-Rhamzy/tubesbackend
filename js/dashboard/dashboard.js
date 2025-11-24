document.addEventListener("DOMContentLoaded", () => {    
    const dashboardDate = document.querySelector(".dashboardDate");
    if (dashboardDate) {
        const today = new Date().toISOString().split("T")[0];
        dashboardDate.setAttribute("min", today);
        dashboardDate.setAttribute("value", today);
    }
});
