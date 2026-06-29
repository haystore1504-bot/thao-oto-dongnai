document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".hero-carousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".hero-slide");
  if (slides.length < 2) return;

  const interval = Number(carousel.dataset.interval) || 3000;
  let current = 0;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, interval);
});
