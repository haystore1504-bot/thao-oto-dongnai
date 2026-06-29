document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".testimonial-slider");
  if (!slider) return;

  const slides = slider.querySelectorAll(".testimonial-slide");
  const dots = document.querySelectorAll(".testimonial-dot");
  if (slides.length < 2) return;

  const interval = Number(slider.dataset.interval) || 5000;
  let current = 0;
  let timer;

  function showSlide(index) {
    slides[current].classList.remove("active");
    dots[current] && dots[current].classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    dots[current] && dots[current].classList.add("active");
  }

  function next() {
    showSlide((current + 1) % slides.length);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, interval);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.index));
      resetTimer();
    });
  });

  resetTimer();
});
