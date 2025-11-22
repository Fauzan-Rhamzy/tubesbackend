var slideIndex = 0;
var slideTimer;

// Inisialisasi slideshow
function initSlideshow() {
    const slides = document.getElementsByClassName("slide");
    if (slides.length > 0) {
        showSlides();
    }
}

// Tampilkan slide
function showSlides() {
    var i;
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");

    // Jika tidak ada slide, hentikan
    if (slides.length === 0) return;

    // Sembunyikan semua slide
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    // Hapus class active dari semua dots
    for (i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active-dot");
    }

    // Increment slide index
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }

    // Tampilkan slide saat ini
    slides[slideIndex - 1].style.display = "block";

    // Tambah class active ke dot saat ini
    if (dots.length > 0) {
        dots[slideIndex - 1].classList.add("active-dot");
    }

    // Lanjutkan ke slide berikutnya setelah 3 detik
    slideTimer = setTimeout(showSlides, 3000);
}

// Tampilkan slide tertentu (ketika user klik dot)
function currentSlide(n) {
    clearTimeout(slideTimer);
    slideIndex = n - 1;
    showSlides();
}

// Inisialisasi ketika DOM sudah siap
document.addEventListener("DOMContentLoaded", initSlideshow);