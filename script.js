/* ═══════════════════════════════════════════════════════════════
   Emoji Runner — Site Scripts
   Canvas starfield, scroll-reveal, hero sprite cycling, hamburger
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ===== Canvas Starfield =====
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let rafId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(Math.floor(area / 6000), 300);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          speed: Math.random() * 0.25 + 0.04,
          baseOpacity: Math.random() * 0.7 + 0.2,
          flickerPhase: Math.random() * Math.PI * 2,
          flickerSpeed: Math.random() * 0.002 + 0.001,
        });
      }
    }

    function animate(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        // Drift downward
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = -2;
          star.x = Math.random() * canvas.width;
        }

        // Flicker effect
        const flicker = Math.sin(time * star.flickerSpeed + star.flickerPhase) * 0.3 + 0.7;
        const opacity = star.baseOpacity * flicker;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    }

    resize();
    rafId = requestAnimationFrame(animate);
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

    // Close on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("open");
        document.body.classList.remove("menu-open");
      });
    });

    // Close on Escape
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: just show everything
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

    // Preload
    sprites.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    setInterval(() => {
      frame = (frame + 1) % sprites.length;
      heroImg.src = sprites[frame];
    }, 180);
  }

  // ===== Spotlight Hover Effect for Retro Series Cards =====
  const cards = document.querySelectorAll(".series-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
})();
