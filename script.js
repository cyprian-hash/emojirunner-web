/* Emoji Runner — Marketing Site Scripts
   Inspired by jumpalien.com: canvas starfield, scroll-reveal,
   sprite cycling, parallax mouse effects. */

(function () {
  "use strict";

  // ===== Dynamic Year =====
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Canvas Starfield (matching jumpalien.com) =====
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 7000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.4,
          speed: Math.random() * 0.3 + 0.05,
          opacity: Math.random() * 0.8 + 0.2,
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        const flicker =
          Math.sin(Date.now() * 0.001 * star.speed + star.x) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * flicker})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener("resize", resize);
  }

  // ===== Hamburger Menu =====
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !isOpen);
      navLinks.classList.toggle("open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("open");
        document.body.classList.remove("menu-open");
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        hamburger.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("open");
        document.body.classList.remove("menu-open");
      }
    });
  }

  // ===== Scroll Reveal =====
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // ===== Hero Character Sprite Cycling =====
  const heroSprite = document.getElementById("heroSprite");
  if (heroSprite) {
    const heroImg = heroSprite.querySelector("img");
    const sprites = [
      "/assets/character-1.png",
      "/assets/character-2.png",
      "/assets/character-3.png",
      "/assets/character-4.png",
      "/assets/character-3.png",
      "/assets/character-2.png",
    ];
    let frame = 0;
    sprites.forEach((s) => { const i = new Image(); i.src = s; });
    setInterval(() => {
      frame = (frame + 1) % sprites.length;
      heroImg.src = sprites[frame];
    }, 200);
  }

  // ===== Character Gallery Animation =====
  const charAnim = document.getElementById("charAnim");
  if (charAnim) {
    const frames = [
      "/assets/character-1.png",
      "/assets/character-2.png",
      "/assets/character-3.png",
      "/assets/character-4.png",
      "/assets/character-3.png",
      "/assets/character-2.png",
    ];
    let f = 0;
    setInterval(() => {
      f = (f + 1) % frames.length;
      charAnim.src = frames[f];
    }, 180);
  }
})();
