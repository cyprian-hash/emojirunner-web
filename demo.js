/* Emoji Runner — Interactive Playable Demo
   A canvas-based mini-game embedded in the website gameplay section.
   Inspired by jumpalien.com's InteractiveDemo component. */

(function () {
  "use strict";

  const container = document.getElementById("demo-container");
  const canvas = document.getElementById("demo-canvas");
  if (!canvas || !container) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ===== State =====
  let width, height, groundY;
  let isPlaying = false;
  let gameOver = false;
  let isPaused = false;
  let score = 0;
  let mode = "running"; // "running" | "flying"
  let flightTimer = 0;
  let scrollX = 0;
  let isHolding = false;
  let animId;

  // ===== Load Assets =====
  const charImgs = [];
  for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `/assets/character-${i}.png`;
    charImgs.push(img);
  }
  const rocketImg = new Image();
  rocketImg.src = "/assets/rocket.png";
  const diamondImg = new Image();
  diamondImg.src = "/assets/diamond.png";

  // ===== Game Objects =====
  const player = { x: 80, y: 0, vy: 0, w: 36, h: 40, canDouble: true, frame: 0 };
  let stars = [], obstacles = [], rockets = [], particles = [], bgStars = [], clouds = [];

  // ===== Init =====
  function resize() {
    const rect = container.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
    groundY = height - 38;
    initBgStars();
    resetGame();
  }

  function initBgStars() {
    bgStars = [];
    for (let i = 0; i < 30; i++) {
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
      });
    }
  }

  function resetGame() {
    player.x = 80;
    player.y = groundY - player.h;
    player.vy = 0;
    player.canDouble = true;
    player.frame = 0;
    score = 0;
    mode = "running";
    flightTimer = 0;
    scrollX = 0;
    gameOver = false;
    isPaused = false;
    isPlaying = false;
    isHolding = false;
    stars = [];
    obstacles = [];
    rockets = [];
    particles = [];
    clouds = [];

    // Seed clouds
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: i * 240 + Math.random() * 80,
        y: 25 + Math.random() * 35,
        w: 50 + Math.random() * 40,
        h: 4 + Math.random() * 3,
        speed: 0.15 + Math.random() * 0.15,
      });
    }

    // Seed obstacles and collectibles
    for (let i = 0; i < 4; i++) {
      const x = 320 + i * 260;
      stars.push({ x, y: groundY - 55 - Math.random() * 70, collected: false, pulse: Math.random() * 6 });
      if (i > 0) {
        obstacles.push({ x: x + 100, y: groundY - 12, size: 14 + Math.random() * 6, angle: Math.random() * Math.PI, rot: (Math.random() - 0.5) * 0.04 });
      }
    }
    rockets.push({ x: 480, y: groundY - 65, pulse: 0 });
    updateHUD();
  }

  // ===== HUD =====
  const scoreEl = document.getElementById("demo-score");
  const flyEl = document.getElementById("demo-fly");
  const overlayEl = document.getElementById("demo-overlay");
  const gameOverEl = document.getElementById("demo-gameover");

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (flyEl) {
      flyEl.style.display = mode === "flying" ? "flex" : "none";
      flyEl.querySelector("span:last-child").textContent = flightTimer.toFixed(1) + "s";
    }
    if (overlayEl) overlayEl.style.display = (!isPlaying && !gameOver) ? "flex" : "none";
    if (gameOverEl) gameOverEl.style.display = gameOver ? "flex" : "none";
  }

  // ===== Physics =====
  function update() {
    if (gameOver || isPaused || !isPlaying) return;
    const scrollSpeed = mode === "flying" ? 4.2 : 2.5;
    scrollX += scrollSpeed;

    // Bg stars
    bgStars.forEach(s => {
      s.x -= s.speed * scrollSpeed * 0.25;
      if (s.x < 0) s.x = width;
    });

    // Clouds
    clouds.forEach(c => {
      c.x -= c.speed * scrollSpeed * 0.3;
      if (c.x < -c.w) { c.x = width + Math.random() * 50; c.y = 25 + Math.random() * 35; }
    });

    // Spawn
    const last = stars[stars.length - 1];
    if (!last || last.x < width + 100) {
      const sx = width + 200 + Math.random() * 100;
      stars.push({ x: sx, y: groundY - 45 - Math.random() * 90, collected: false, pulse: Math.random() * 6 });
      if (Math.random() < 0.65) {
        const isSky = mode === "flying" && Math.random() < 0.5;
        obstacles.push({ x: sx + 120, y: isSky ? groundY - 70 - Math.random() * 70 : groundY - 12, size: 13 + Math.random() * 7, angle: Math.random() * Math.PI, rot: (Math.random() - 0.5) * 0.04 });
      }
      if (mode === "running" && Math.random() < 0.14 && rockets.length === 0) {
        rockets.push({ x: sx + 70, y: groundY - 55 - Math.random() * 40, pulse: 0 });
      }
    }

    // Player physics
    if (mode === "running") {
      player.vy += 0.22;
      player.y += player.vy;
      if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.canDouble = true;
      }
    } else {
      if (isHolding) {
        player.vy -= 0.35;
        if (Math.random() < 0.7) {
          particles.push({
            x: player.x - 10, y: player.y + player.h / 2,
            vx: -scrollSpeed * 0.3 - 1.5 - Math.random(), vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 4 + 2, color: "rgba(255,110,0,0.8)", alpha: 1, life: 22,
          });
        }
      } else {
        player.vy += 0.18;
      }
      player.vy = Math.max(-4.5, Math.min(4.5, player.vy));
      player.y += player.vy;
      if (player.y < 10) { player.y = 10; player.vy = 0; }
      if (player.y + player.h > groundY) { player.y = groundY - player.h; player.vy = 0; }

      flightTimer -= 1 / 60;
      if (flightTimer <= 0) {
        mode = "running";
        player.vy = -1.5;
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: player.x, y: player.y + player.h / 2,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 5 + 2, color: "rgba(255,255,255,0.4)", alpha: 0.8, life: 25,
          });
        }
      }
    }

    // Move objects
    stars.forEach(s => s.x -= scrollSpeed);
    obstacles.forEach(a => { a.x -= scrollSpeed; a.angle += a.rot; });
    rockets.forEach(r => r.x -= scrollSpeed);

    // Particles
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.alpha -= 1 / p.life; });
    particles = particles.filter(p => p.alpha > 0);

    // Collisions: diamonds
    stars.forEach(s => {
      if (!s.collected) {
        const dx = s.x - (player.x + player.w / 2), dy = s.y - (player.y + player.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
          s.collected = true;
          score += 15;
          for (let i = 0; i < 7; i++) {
            particles.push({
              x: s.x, y: s.y,
              vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
              size: Math.random() * 2.5 + 1, color: "#5ECFFF", alpha: 1, life: 16,
            });
          }
        }
      }
    });

    // Collisions: rockets
    rockets.forEach((r, i) => {
      const dx = r.x - (player.x + player.w / 2), dy = r.y - (player.y + player.h / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 28) {
        mode = "flying";
        flightTimer = 6;
        player.y = r.y;
        rockets.splice(i, 1);
        for (let j = 0; j < 12; j++) {
          particles.push({
            x: player.x, y: player.y + player.h / 2,
            vx: (Math.random() - 0.5) * 4 - 2, vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 2, color: "#FBBF24", alpha: 1, life: 22,
          });
        }
      }
    });

    // Collisions: obstacles
    obstacles.forEach(a => {
      const dx = a.x - (player.x + player.w / 2), dy = a.y - (player.y + player.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.size + 12) {
        if (mode === "flying") {
          a.x = -200;
          score += 25;
          for (let i = 0; i < 12; i++) {
            particles.push({
              x: a.x + scrollSpeed, y: a.y,
              vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              size: Math.random() * 3 + 1.5, color: "#8b7e74", alpha: 1, life: 28,
            });
          }
        } else {
          triggerCrash();
        }
      }
    });

    // Cleanup
    stars = stars.filter(s => s.x > -80 && !s.collected);
    obstacles = obstacles.filter(a => a.x > -80);
    rockets = rockets.filter(r => r.x > -80);

    // Animate frame
    player.frame += 0.12;

    updateHUD();
  }

  function triggerCrash() {
    gameOver = true;
    isHolding = false;
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: player.x + player.w / 2, y: player.y + player.h / 2,
        vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 5 + 2, color: i % 2 === 0 ? "#f44336" : "#FBBF24", alpha: 1, life: 35,
      });
    }
    updateHUD();
  }

  // ===== Draw =====
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#050d1a");
    grad.addColorStop(0.5, "#0a1e38");
    grad.addColorStop(1, "#0f3055");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Background stars
    ctx.fillStyle = "#fff";
    bgStars.forEach((s, i) => {
      const fl = Math.sin(Date.now() * 0.003 + i) * 0.3 + 0.7;
      ctx.globalAlpha = fl;
      if (i % 5 === 0) {
        // Diamond sparkle
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - s.size * 2.5);
        ctx.quadraticCurveTo(s.x, s.y, s.x + s.size * 2.5, s.y);
        ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + s.size * 2.5);
        ctx.quadraticCurveTo(s.x, s.y, s.x - s.size * 2.5, s.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    });
    ctx.globalAlpha = 1;

    // Clouds
    ctx.fillStyle = "rgba(20,60,100,0.25)";
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.roundRect(c.x, c.y, c.w, c.h, c.h / 2);
      ctx.fill();
    });

    // Ground surface
    ctx.fillStyle = "#b8c0cc";
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, groundY);
    for (let x = 0; x <= width; x += 12) {
      ctx.lineTo(x, groundY - 4 * Math.sin(x * 0.015 - scrollX * 0.012));
    }
    ctx.lineTo(width, height - 18);
    ctx.lineTo(0, height - 18);
    ctx.closePath();
    ctx.fill();

    // Bottom space band
    ctx.fillStyle = "#050b14";
    ctx.fillRect(0, height - 18, width, 18);

    // Diamonds (stars)
    stars.forEach(s => {
      if (s.collected) return;
      s.pulse += 0.06;
      const sc = 1 + 0.1 * Math.sin(s.pulse);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(sc, sc);
      if (diamondImg.complete && diamondImg.naturalWidth) {
        ctx.drawImage(diamondImg, -12, -12, 24, 24);
      } else {
        ctx.fillStyle = "#5ECFFF";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
      }
      // Glow
      ctx.shadowColor = "rgba(94,207,255,0.5)";
      ctx.shadowBlur = 12;
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Rockets
    rockets.forEach(r => {
      r.pulse += 0.06;
      const yOff = 3 * Math.sin(r.pulse);
      ctx.save();
      ctx.translate(r.x, r.y + yOff);
      if (rocketImg.complete && rocketImg.naturalWidth) {
        ctx.drawImage(rocketImg, -18, -18, 36, 36);
      } else {
        ctx.fillStyle = "#FBBF24";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      // Shield glow
      const glow = 22 + 2 * Math.sin(Date.now() * 0.008);
      const sg = ctx.createRadialGradient(0, 0, 8, 0, 0, glow);
      sg.addColorStop(0, "rgba(251,191,36,0.2)");
      sg.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, glow, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Obstacles (asteroids)
    obstacles.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = "#7a6e64";
      ctx.strokeStyle = "#1a130e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const r = a.size + Math.sin(ang * 3 + a.size) * 2;
        ctx.lineTo(r * Math.cos(ang), r * Math.sin(ang));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Craters
      ctx.fillStyle = "#5c524b";
      ctx.beginPath();
      ctx.arc(-a.size / 3, -a.size / 4, a.size / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    if (!gameOver) {
      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);

      if (mode === "running") {
        const fi = Math.floor(player.frame) % charImgs.length;
        const img = charImgs[fi];
        const bob = Math.sin(Date.now() * 0.018) * 1.5;
        if (img.complete && img.naturalWidth) {
          ctx.drawImage(img, -player.w / 2, -player.h / 2 + bob, player.w, player.h);
        } else {
          ctx.fillStyle = "#FBBF24";
          ctx.beginPath();
          ctx.arc(0, bob, player.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Flying mode: draw rocket + shield
        const tilt = player.vy * 0.06;
        ctx.rotate(tilt);
        if (rocketImg.complete && rocketImg.naturalWidth) {
          ctx.drawImage(rocketImg, -22, -18, 44, 36);
        }
        const glow = 26 + 2 * Math.sin(Date.now() * 0.008);
        const sg = ctx.createRadialGradient(0, 0, 12, 0, 0, glow);
        sg.addColorStop(0, "rgba(94,207,255,0.2)");
        sg.addColorStop(1, "rgba(94,207,255,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(0, 0, glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(94,207,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, glow - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ===== Loop =====
  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // ===== Controls =====
  function handleStart(e) {
    if (e) e.preventDefault();
    if (gameOver) return;
    if (!isPlaying) {
      isPlaying = true;
      updateHUD();
    }
    isHolding = true;

    if (mode === "running") {
      if (player.y + player.h >= groundY - 1) {
        player.vy = -5.2;
        player.canDouble = true;
      } else if (player.canDouble) {
        player.vy = -4.5;
        player.canDouble = false;
      }
    }
  }

  function handleEnd(e) {
    if (e) e.preventDefault();
    isHolding = false;
  }

  canvas.addEventListener("mousedown", handleStart);
  canvas.addEventListener("mouseup", handleEnd);
  canvas.addEventListener("mouseleave", handleEnd);
  canvas.addEventListener("touchstart", handleStart, { passive: false });
  canvas.addEventListener("touchend", handleEnd, { passive: false });

  // Retry button
  const retryBtn = document.getElementById("demo-retry");
  if (retryBtn) {
    retryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetGame();
      isPlaying = true;
      updateHUD();
    });
  }

  // ===== Boot =====
  resize();
  loop();
  window.addEventListener("resize", resize);
})();
