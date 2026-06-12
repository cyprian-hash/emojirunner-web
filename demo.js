/* ═══════════════════════════════════════════════════════════════
   Emoji Runner — Interactive Playable Demo
   Canvas mini-game inside the iPhone landscape frame.
   Uses actual game assets: character sprites, background.png,
   diamond.png, rocket.png.
   ═══════════════════════════════════════════════════════════════ */

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
  let lastTime = 0;

  // ===== Load Assets =====
  const charImgs = [];
  for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `/assets/emoji_runner_${i}.png`;
    charImgs.push(img);
  }

  const bgImg = new Image();
  bgImg.src = "/assets/background.png";

  const rocketImg = new Image();
  rocketImg.src = "/assets/rocket.png";

  const diamondImg = new Image();
  diamondImg.src = "/assets/diamond.png";

  // ===== Game Objects =====
  const player = {
    x: 0,
    y: 0,
    vy: 0,
    w: 0,
    h: 0,
    canDouble: true,
    frame: 0,
  };

  let diamonds = [];
  let obstacles = [];
  let rockets = [];
  let particles = [];
  let bgOffset = 0;
  let bgOffset2 = 0;
  let distanceTravelled = 0;

  // ===== Init =====
  function resize() {
    const rect = container.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
    groundY = height - height * 0.14;

    // Scale player to screen
    player.w = Math.max(24, Math.floor(height * 0.16));
    player.h = Math.max(28, Math.floor(height * 0.19));
    player.x = Math.floor(width * 0.12);

    resetGame();
  }

  function resetGame() {
    player.y = groundY - player.h;
    player.vy = 0;
    player.canDouble = true;
    player.frame = 0;
    score = 0;
    mode = "running";
    flightTimer = 0;
    scrollX = 0;
    bgOffset = 0;
    bgOffset2 = 0;
    distanceTravelled = 0;
    gameOver = false;
    isPaused = false;
    isPlaying = false;
    isHolding = false;
    diamonds = [];
    obstacles = [];
    rockets = [];
    particles = [];

    // Seed initial objects
    for (let i = 0; i < 5; i++) {
      const x = width * 0.5 + i * (width * 0.35);
      diamonds.push(makeDiamond(x));
      if (i > 0 && Math.random() < 0.7) {
        obstacles.push(makeObstacle(x + width * 0.15));
      }
    }
    rockets.push(makeRocket(width * 0.5 + 2.5 * width * 0.35));

    updateHUD();
  }

  function makeDiamond(x) {
    return {
      x: x,
      y: groundY - player.h - 15 - Math.random() * (height * 0.35),
      collected: false,
      pulse: Math.random() * 6,
    };
  }

  function makeObstacle(x) {
    const size = Math.floor(height * 0.06) + Math.random() * (height * 0.03);
    return {
      x: x,
      y: groundY - size * 0.5,
      size: size,
      color: pickObstacleColor(),
    };
  }

  function makeRocket(x) {
    return {
      x: x,
      y: groundY - player.h - 10 - Math.random() * (height * 0.2),
      pulse: 0,
    };
  }

  function pickObstacleColor() {
    const colors = ["#e74c3c", "#c0392b", "#d35400", "#e67e22", "#8e44ad"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ===== HUD =====
  const scoreEl = document.getElementById("demo-score");
  const flyEl = document.getElementById("demo-fly");
  const overlayEl = document.getElementById("demo-overlay");
  const gameOverEl = document.getElementById("demo-gameover");
  const finalScoreEl = document.getElementById("demo-final-score");

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (flyEl) {
      flyEl.style.display = mode === "flying" ? "flex" : "none";
      const span = flyEl.querySelector("span:last-child");
      if (span) span.textContent = flightTimer.toFixed(1) + "s";
    }
    if (overlayEl)
      overlayEl.style.display = !isPlaying && !gameOver ? "flex" : "none";
    if (gameOverEl) gameOverEl.style.display = gameOver ? "flex" : "none";
    if (finalScoreEl && gameOver) finalScoreEl.textContent = "Score: " + score;
  }

  // ===== Game Speed =====
  function getSpeed() {
    const base = Math.max(1.5, height * 0.008);
    const ramp = Math.min(distanceTravelled * 0.00004, base * 0.8);
    const speed = base + ramp;
    return mode === "flying" ? speed * 1.6 : speed;
  }

  // ===== Physics =====
  function update() {
    if (gameOver || isPaused || !isPlaying) return;

    const speed = getSpeed();
    scrollX += speed;
    distanceTravelled += speed;

    // Parallax background offsets
    bgOffset = (bgOffset + speed * 0.3) % width;
    bgOffset2 = (bgOffset2 + speed * 0.15) % width;

    // Spawn new objects
    const lastD = diamonds[diamonds.length - 1];
    if (!lastD || lastD.x < width + 60) {
      const sx = width + 120 + Math.random() * 100;
      diamonds.push(makeDiamond(sx));

      if (Math.random() < 0.65) {
        obstacles.push(makeObstacle(sx + width * 0.15));
      }

      if (
        mode === "running" &&
        Math.random() < 0.12 &&
        rockets.length === 0
      ) {
        rockets.push(makeRocket(sx + width * 0.1));
      }
    }

    // Player physics
    const gravity = height * 0.0009;
    const jumpForce = -(height * 0.023);
    const doubleJumpForce = -(height * 0.019);

    if (mode === "running") {
      player.vy += gravity;
      player.y += player.vy;
      if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.canDouble = true;
      }
    } else {
      // Flying mode
      if (isHolding) {
        player.vy -= gravity * 1.8;
        // Rocket exhaust particles
        if (Math.random() < 0.7) {
          particles.push({
            x: player.x - 6,
            y: player.y + player.h * 0.5,
            vx: -speed * 0.4 - 1.2 - Math.random(),
            vy: (Math.random() - 0.5) * 1.8,
            size: Math.random() * 4 + 2,
            color: "rgba(255,110,0,0.85)",
            alpha: 1,
            life: 20,
          });
        }
      } else {
        player.vy += gravity * 0.8;
      }
      const maxVy = height * 0.018;
      player.vy = Math.max(-maxVy, Math.min(maxVy, player.vy));
      player.y += player.vy;

      if (player.y < 8) {
        player.y = 8;
        player.vy = 0;
      }
      if (player.y + player.h > groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
      }

      flightTimer -= 1 / 60;
      if (flightTimer <= 0) {
        mode = "running";
        player.vy = jumpForce * 0.3;
        // Transition burst
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: player.x + player.w * 0.5,
            y: player.y + player.h * 0.5,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 2,
            color: "rgba(255,255,255,0.5)",
            alpha: 0.8,
            life: 22,
          });
        }
      }
    }

    // Move objects
    diamonds.forEach((d) => (d.x -= speed));
    obstacles.forEach((o) => (o.x -= speed));
    rockets.forEach((r) => (r.x -= speed));

    // Particles
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;
    });
    particles = particles.filter((p) => p.alpha > 0);

    // Collisions: diamonds
    const pCX = player.x + player.w * 0.5;
    const pCY = player.y + player.h * 0.5;

    diamonds.forEach((d) => {
      if (!d.collected) {
        const dx = d.x - pCX;
        const dy = d.y - pCY;
        if (Math.sqrt(dx * dx + dy * dy) < player.w * 0.7) {
          d.collected = true;
          score += 15;
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: d.x,
              y: d.y,
              vx: (Math.random() - 0.5) * 3.5,
              vy: (Math.random() - 0.5) * 3.5,
              size: Math.random() * 2.5 + 1,
              color: "#5ECFFF",
              alpha: 1,
              life: 18,
            });
          }
        }
      }
    });

    // Collisions: rockets
    rockets.forEach((r, i) => {
      const dx = r.x - pCX;
      const dy = r.y - pCY;
      if (Math.sqrt(dx * dx + dy * dy) < player.w * 0.9) {
        mode = "flying";
        flightTimer = 5.5;
        player.y = r.y - player.h * 0.3;
        rockets.splice(i, 1);
        for (let j = 0; j < 14; j++) {
          particles.push({
            x: player.x + player.w * 0.5,
            y: player.y + player.h * 0.5,
            vx: (Math.random() - 0.5) * 5 - 1.5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 4 + 2,
            color: "#FBBF24",
            alpha: 1,
            life: 25,
          });
        }
      }
    });

    // Collisions: obstacles
    obstacles.forEach((o) => {
      const dx = o.x - pCX;
      const dy = o.y - pCY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitDist = o.size * 0.45 + player.w * 0.35;
      if (dist < hitDist) {
        if (mode === "flying") {
          // Destroy obstacle
          o.x = -500;
          score += 25;
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: o.x + speed,
              y: o.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              size: Math.random() * 3 + 1.5,
              color: o.color,
              alpha: 1,
              life: 25,
            });
          }
        } else {
          triggerCrash();
        }
      }
    });

    // Cleanup off-screen
    diamonds = diamonds.filter((d) => d.x > -100 && !d.collected);
    obstacles = obstacles.filter((o) => o.x > -100);
    rockets = rockets.filter((r) => r.x > -100);

    // Animate frame
    player.frame += 0.14;

    updateHUD();
  }

  function triggerCrash() {
    gameOver = true;
    isHolding = false;
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: player.x + player.w * 0.5,
        y: player.y + player.h * 0.5,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 5 + 2,
        color: i % 2 === 0 ? "#f44336" : "#FBBF24",
        alpha: 1,
        life: 35,
      });
    }
    updateHUD();
  }

  // ===== Draw =====
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // -- Sky gradient --
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#040810");
    skyGrad.addColorStop(0.35, "#081828");
    skyGrad.addColorStop(0.65, "#0d3050");
    skyGrad.addColorStop(1, "#145060");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // -- Parallax background image (city silhouette) --
    if (bgImg.complete && bgImg.naturalWidth) {
      const bgH = height * 0.55;
      const bgW = (bgImg.naturalWidth / bgImg.naturalHeight) * bgH;
      const bgY = groundY - bgH + height * 0.04;

      // Draw two copies for seamless scroll
      ctx.globalAlpha = 0.55;
      const offset = -(bgOffset % bgW);
      for (let x = offset; x < width + bgW; x += bgW) {
        ctx.drawImage(bgImg, x, bgY, bgW, bgH);
      }
      ctx.globalAlpha = 1;
    }

    // -- Ground --
    const groundH = height - groundY;
    // Ground surface line
    ctx.fillStyle = "rgba(200, 210, 220, 0.15)";
    ctx.fillRect(0, groundY, width, 1);

    // Ground fill
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, "rgba(20, 80, 96, 0.6)");
    groundGrad.addColorStop(1, "rgba(8, 20, 30, 0.9)");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY + 1, width, groundH);

    // Ground surface details
    ctx.strokeStyle = "rgba(94, 207, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      const waveY = groundY + 1 + Math.sin((x + scrollX) * 0.02) * 2;
      ctx.beginPath();
      ctx.moveTo(x, waveY);
      ctx.lineTo(x + 15, waveY + Math.sin((x + 15 + scrollX) * 0.02) * 2);
      ctx.stroke();
    }

    // -- Diamonds --
    diamonds.forEach((d) => {
      if (d.collected) return;
      d.pulse += 0.06;
      const sc = 1 + 0.1 * Math.sin(d.pulse);
      const size = Math.max(16, Math.floor(height * 0.065));

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.scale(sc, sc);

      if (diamondImg.complete && diamondImg.naturalWidth) {
        ctx.drawImage(
          diamondImg,
          -size * 0.5,
          -size * 0.5,
          size,
          size
        );
      } else {
        ctx.fillStyle = "#5ECFFF";
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.4);
        ctx.lineTo(size * 0.35, 0);
        ctx.lineTo(0, size * 0.4);
        ctx.lineTo(-size * 0.35, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Glow
      ctx.shadowColor = "rgba(94,207,255,0.4)";
      ctx.shadowBlur = 14;
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // -- Rockets --
    rockets.forEach((r) => {
      r.pulse += 0.06;
      const yOff = 3 * Math.sin(r.pulse);
      const rSize = Math.max(24, Math.floor(height * 0.1));

      ctx.save();
      ctx.translate(r.x, r.y + yOff);

      if (rocketImg.complete && rocketImg.naturalWidth) {
        ctx.drawImage(
          rocketImg,
          -rSize * 0.5,
          -rSize * 0.5,
          rSize,
          rSize
        );
      } else {
        ctx.fillStyle = "#FBBF24";
        ctx.beginPath();
        ctx.arc(0, 0, rSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shield glow
      const glowR = rSize * 0.7 + 2 * Math.sin(Date.now() * 0.008);
      const sg = ctx.createRadialGradient(0, 0, rSize * 0.25, 0, 0, glowR);
      sg.addColorStop(0, "rgba(251,191,36,0.25)");
      sg.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // -- Obstacles (colored blocks) --
    obstacles.forEach((o) => {
      ctx.save();
      ctx.translate(o.x, o.y);

      // Block body
      ctx.fillStyle = o.color;
      const hw = o.size * 0.5;
      const hh = o.size * 0.5;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, o.size, o.size, 3);
      ctx.fill();

      // Highlight edge
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(-hw, -hh, o.size, 3);

      // Shadow edge
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-hw, hh - 3, o.size, 3);

      // Warning glow
      const gDist = Math.abs(o.x - pCX());
      if (gDist < width * 0.25) {
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 8;
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    });

    // Helper for player center
    function pCX() {
      return player.x + player.w * 0.5;
    }

    // -- Particles --
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // -- Player --
    if (!gameOver) {
      ctx.save();
      ctx.translate(player.x + player.w * 0.5, player.y + player.h * 0.5);

      if (mode === "running") {
        const fi = Math.floor(player.frame) % charImgs.length;
        const img = charImgs[fi];
        const bob = Math.sin(Date.now() * 0.016) * 1.5;

        if (img.complete && img.naturalWidth) {
          ctx.drawImage(
            img,
            -player.w * 0.5,
            -player.h * 0.5 + bob,
            player.w,
            player.h
          );
        } else {
          // Fallback circle
          ctx.fillStyle = "#FBBF24";
          ctx.beginPath();
          ctx.arc(0, bob, player.w * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Flying mode: show character + shield
        const tilt = player.vy * 0.04;
        ctx.rotate(tilt);

        const fi = Math.floor(player.frame) % charImgs.length;
        const img = charImgs[fi];
        if (img.complete && img.naturalWidth) {
          ctx.drawImage(
            img,
            -player.w * 0.5,
            -player.h * 0.5,
            player.w,
            player.h
          );
        }

        // Shield effect
        const shieldR =
          player.w * 0.7 + 2 * Math.sin(Date.now() * 0.008);
        const sg = ctx.createRadialGradient(
          0,
          0,
          player.w * 0.3,
          0,
          0,
          shieldR
        );
        sg.addColorStop(0, "rgba(94,207,255,0.15)");
        sg.addColorStop(1, "rgba(94,207,255,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(94,207,255,0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR - 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ===== Game Loop =====
  function loop(time) {
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
      const onGround = player.y + player.h >= groundY - 1;
      const jumpForce = -(height * 0.023);
      const doubleJumpForce = -(height * 0.019);

      if (onGround) {
        player.vy = jumpForce;
        player.canDouble = true;
      } else if (player.canDouble) {
        player.vy = doubleJumpForce;
        player.canDouble = false;
      }
    }
  }

  function handleEnd(e) {
    if (e) e.preventDefault();
    isHolding = false;
  }

  // Mouse events
  canvas.addEventListener("mousedown", handleStart);
  canvas.addEventListener("mouseup", handleEnd);
  canvas.addEventListener("mouseleave", handleEnd);

  // Touch events
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

  // ===== Visibility API — pause when tab hidden =====
  document.addEventListener("visibilitychange", () => {
    isPaused = document.hidden;
  });

  // ===== Boot =====
  resize();
  requestAnimationFrame(loop);
  window.addEventListener("resize", resize);
})();
