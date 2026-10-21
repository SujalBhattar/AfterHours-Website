(() => {
    "use strict";

    const GAME_ID = "voidrun";

    const BG = "#171915";
    const IVORY = "#eeeadd";
    const MOSS = "#a2b58b";
    const MOSS_DARK = "#65775a";
    const CLAY = "#c98770";
    const MUTED = "#898d80";

    let activeGame = null;

    function startGame(mount, services = {}) {
        if (activeGame) {
            activeGame.destroy();
            activeGame = null;
        }

        const showToast = services.showToast || (() => { });
        const onExit = services.onExit || (() => { });

        mount.innerHTML = `
      <section class="vr-game">
        <style>
          .vr-game {
            overflow: hidden;
            border: 1px solid #eeeadd20;
            border-radius: 18px;
            background: ${BG};
            color: ${IVORY};
            font-family: "DM Sans", sans-serif;
            isolation: isolate;
          }

          .vr-game *,
          .vr-game *::before,
          .vr-game *::after {
            box-sizing: border-box;
          }

          .vr-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 24px;
            border-bottom: 1px solid #eeeadd14;
          }

          .vr-brand,
          .vr-exit,
          .vr-label,
          .vr-kicker,
          .vr-start,
          .vr-footer {
            font-family: "DM Mono", monospace;
          }

          .vr-brand {
            color: ${MOSS};
            font-size: 10px;
            letter-spacing: .15em;
          }

          .vr-exit {
            padding: 9px 13px;
            border: 1px solid #eeeadd28;
            border-radius: 999px;
            background: transparent;
            color: ${IVORY};
            font-size: 10px;
            cursor: pointer;
            transition: border-color .2s, color .2s, background .2s;
          }

          .vr-exit:hover {
            border-color: ${MOSS};
            background: #a2b58b12;
            color: ${MOSS};
          }

          .vr-hud {
            display: flex;
            justify-content: center;
            gap: clamp(30px, 10vw, 110px);
            padding: 21px 12px;
            text-align: center;
          }

          .vr-label {
            color: ${MUTED};
            font-size: 9px;
            letter-spacing: .14em;
          }

          .vr-value {
            margin-top: 7px;
            font-size: 25px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
            letter-spacing: -.055em;
          }

          .vr-hud > div:last-child .vr-value {
            color: ${MOSS};
          }

          .vr-arena {
            position: relative;
            height: clamp(340px, 58vh, 620px);
            overflow: hidden;
            border-top: 1px solid #eeeadd0b;
            border-bottom: 1px solid #eeeadd14;
            background: #20241d;
          }

          .vr-canvas {
            display: block;
            width: 100%;
            height: 100%;
            touch-action: manipulation;
          }

          .vr-overlay {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #171915d9;
            text-align: center;
            backdrop-filter: blur(5px);
          }

          .vr-overlay[hidden] {
            display: none !important;
          }

          .vr-panel {
            width: min(100%, 430px);
          }

          .vr-kicker {
            color: ${MOSS};
            font-size: 9px;
            letter-spacing: .2em;
            line-height: 1.7;
          }

          .vr-title {
            margin: 18px 0;
            font-family: "Space Grotesk", sans-serif;
            font-size: clamp(46px, 10vw, 84px);
            font-weight: 600;
            letter-spacing: -.095em;
            line-height: .88;
          }

          .vr-title span {
            color: ${MOSS};
          }

          .vr-description {
            max-width: 330px;
            margin: 19px auto 24px;
            color: #b3b4a9;
            font-size: 13px;
            line-height: 1.8;
          }

          .vr-start {
            padding: 13px 21px;
            border: 1px solid ${MOSS};
            border-radius: 999px;
            background: ${MOSS};
            color: ${BG};
            font-size: 10px;
            letter-spacing: .055em;
            cursor: pointer;
            transition: transform .2s, background .2s, border-color .2s;
          }

          .vr-start:hover {
            transform: translateY(-2px);
            border-color: #c1d0ad;
            background: #c1d0ad;
          }

          .vr-start:focus-visible,
          .vr-exit:focus-visible {
            outline: 2px solid ${IVORY};
            outline-offset: 4px;
          }

          .vr-footer {
            padding: 18px 14px 21px;
            color: ${MUTED};
            font-size: 9px;
            line-height: 2;
            text-align: center;
          }

          .vr-key {
            display: inline-block;
            margin: 0 3px;
            padding: 1px 6px;
            border: 1px solid #eeeadd29;
            border-radius: 4px;
            color: ${IVORY};
          }

          @media (max-width: 540px) {
            .vr-game {
              border-radius: 12px;
            }

            .vr-top {
              padding: 16px 13px;
            }

            .vr-brand {
              font-size: 9px;
              letter-spacing: .09em;
            }

            .vr-arena {
              height: 340px;
            }

            .vr-hud {
              gap: 28px;
              padding: 18px 8px;
            }

            .vr-value {
              font-size: 21px;
            }

            .vr-footer {
              padding-inline: 8px;
              font-size: 8px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .vr-game *,
            .vr-game *::before,
            .vr-game *::after {
              transition-duration: .01ms !important;
              animation-duration: .01ms !important;
            }
          }
        </style>

        <header class="vr-top">
          <div class="vr-brand">AFTERHOURS / VOIDRUN</div>
          <button class="vr-exit" type="button">← EXIT GAME</button>
        </header>

        <div class="vr-hud">
          <div>
            <div class="vr-label">DISTANCE</div>
            <div class="vr-value" data-score>000000</div>
          </div>
          <div>
            <div class="vr-label">BEST</div>
            <div class="vr-value" data-best>000000</div>
          </div>
          <div>
            <div class="vr-label">PACE</div>
            <div class="vr-value" data-speed>1.0×</div>
          </div>
        </div>

        <div class="vr-arena">
          <canvas class="vr-canvas" aria-label="VOIDRUN endless runner game"></canvas>

          <div class="vr-overlay">
            <div class="vr-panel">
              <div class="vr-kicker" data-kicker>FIELD STUDY / 003</div>
              <h2 class="vr-title" data-title>VOID<span>RUN</span></h2>
              <p class="vr-description" data-description>
                The ground is moving. Jump the strange things growing
                in your path, keep your rhythm, and see how far you get.
              </p>
              <button class="vr-start" type="button" data-start>
                ENTER THE RUN ↗
              </button>
            </div>
          </div>
        </div>

        <div class="vr-footer">
          <span class="vr-key">SPACE</span>
          <span class="vr-key">↑</span>
          JUMP / TAP OR CLICK TO LEAP / 
          <span class="vr-key">ESC</span>
          EXIT
        </div>
      </section>
    `;

        const root = mount.querySelector(".vr-game");
        const canvas = root.querySelector(".vr-canvas");
        const ctx = canvas.getContext("2d");

        const scoreEl = root.querySelector("[data-score]");
        const bestEl = root.querySelector("[data-best]");
        const speedEl = root.querySelector("[data-speed]");
        const overlay = root.querySelector(".vr-overlay");
        const titleEl = root.querySelector("[data-title]");
        const kickerEl = root.querySelector("[data-kicker]");
        const descriptionEl = root.querySelector("[data-description]");
        const startButton = root.querySelector("[data-start]");
        const exitButton = root.querySelector(".vr-exit");

        const STORAGE_KEY = "afterhours-voidrun-best";

        let destroyed = false;
        let running = false;
        let animationFrame = 0;
        let previousTime = 0;
        let elapsed = 0;
        let score = 0;
        let best = readBest();
        let speed = 1;
        let spawnTimer = 0;
        let width = 1;
        let height = 1;
        let groundY = 0;
        let dpr = 1;
        let groundOffset = 0;
        let dustTimer = 0;

        const particles = [];
        const obstacles = [];

        const player = {
            x: 80,
            y: 0,
            width: 30,
            height: 42,
            vy: 0,
            grounded: true,
            squash: 0
        };

        function readBest() {
            try {
                return Number(localStorage.getItem(STORAGE_KEY)) || 0;
            } catch {
                return 0;
            }
        }

        function saveBest() {
            try {
                localStorage.setItem(STORAGE_KEY, String(best));
            } catch {
                // Storage may be unavailable in private browsing.
            }
        }

        function formatScore(value) {
            return Math.floor(value).toString().padStart(6, "0");
        }

        function syncHUD() {
            scoreEl.textContent = formatScore(score);
            bestEl.textContent = formatScore(best);
            speedEl.textContent = `${speed.toFixed(1)}×`;
        }

        function showOverlay(kicker, title, description, button) {
            kickerEl.textContent = kicker;

            if (title === "VOIDRUN") {
                titleEl.innerHTML = 'VOID<span>RUN</span>';
            } else {
                titleEl.textContent = title;
            }

            descriptionEl.textContent = description;
            startButton.textContent = button;
            overlay.hidden = false;
        }

        function resize() {
            if (destroyed) return;

            const rect = canvas.getBoundingClientRect();

            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            groundY = height * 0.78;
            player.x = Math.max(28, Math.min(width * 0.2, 90));
            player.y = Math.min(player.y, groundY - player.height);

            if (player.grounded) {
                player.y = groundY - player.height;
            }

            draw();
        }

        function reset() {
            elapsed = 0;
            score = 0;
            speed = 1;
            spawnTimer = 0.85;
            groundOffset = 0;
            dustTimer = 0;

            obstacles.length = 0;
            particles.length = 0;

            player.x = Math.max(28, Math.min(width * 0.2, 90));
            player.y = groundY - player.height;
            player.vy = 0;
            player.grounded = true;
            player.squash = 0;

            syncHUD();
        }

        function start() {
            if (destroyed || running) return;

            reset();
            running = true;
            overlay.hidden = true;
            previousTime = performance.now();

            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(loop);
        }

        let jumpBuffer = 0;

        function jump() {
            if (!running || destroyed) return;

            // Pressed a hair early? Remember it and jump on landing.
            if (!player.grounded) {
                jumpBuffer = 0.12;
                return;
            }

            player.cut = false;
            player.vy = -height * 1.12;
            player.grounded = false;
            player.squash = 0.14;

            burst(
                player.x + player.width / 2,
                groundY - 2,
                MOSS_DARK,
                7
            );
        }

        function spawnObstacle() {
            const size = 22 + Math.random() * 19;
            const type = Math.random();

            let obstacle;

            if (type < 0.36) {
                obstacle = {
                    type: "stone",
                    w: size,
                    h: size * (1.05 + Math.random() * 0.35),
                    color: CLAY
                };
            } else if (type < 0.72) {
                obstacle = {
                    type: "sprout",
                    w: size * 1.05,
                    h: size * 1.25,
                    color: MOSS
                };
            } else {
                obstacle = {
                    type: "pillar",
                    w: size * 0.72,
                    h: size * (1.3 + Math.random() * 0.55),
                    color: MOSS_DARK
                };
            }

            obstacle.x = width + obstacle.w + 4;
            obstacle.y = groundY - obstacle.h;
            obstacle.passed = false;

            obstacles.push(obstacle);
        }

        function burst(x, y, color, amount = 10) {
            for (let i = 0; i < amount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = 25 + Math.random() * 115;

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - 15,
                    life: 0.25 + Math.random() * 0.45,
                    maxLife: 0.7,
                    size: 1.5 + Math.random() * 2.5,
                    color
                });
            }
        }

        function crash() {
            if (!running) return;

            running = false;
            cancelAnimationFrame(animationFrame);

            const finalScore = Math.floor(score);

            burst(
                player.x + player.width / 2,
                player.y + player.height / 2,
                CLAY,
                22
            );

            if (finalScore > best) {
                best = finalScore;
                saveBest();
                showToast("NEW VOIDRUN RECORD ✳");
            }

            syncHUD();

            showOverlay(
                "FIELD NOTES / RUN ENDED",
                "OVERGROWN.",
                `Distance: ${formatScore(finalScore)}. The path keeps going. Fancy another attempt?`,
                "RUN IT BACK ↻"
            );

            draw();
        }

        function update(dt) {
            elapsed += dt;
            jumpBuffer = Math.max(0, jumpBuffer - dt);
            speed = Math.min(2.8, 1 + elapsed * 0.035);

            const worldSpeed = 260 * speed * Math.min(1.7, Math.max(1, width / 760));
            score += dt * 100 * speed;
            groundOffset = (groundOffset + worldSpeed * dt) % 46;

            // Gravity and jump arc.
            if (!player.grounded) {
                player.vy += height * (player.vy > 0 ? 3.7 : 2.9) * dt;
                player.y += player.vy * dt;

                if (player.y + player.height >= groundY) {
                    player.y = groundY - player.height;
                    player.vy = 0;
                    player.grounded = true;
                    player.squash = 0.12;

                    burst(
                        player.x + player.width / 2,
                        groundY - 2,
                        MOSS_DARK,
                        5
                    );

                    if (jumpBuffer > 0) {
                        jumpBuffer = 0;
                        jump();
                    }
                }
            }

            player.squash = Math.max(0, player.squash - dt);

            // Spawn obstacles with a little breathing room between them.
            spawnTimer -= dt;

            if (spawnTimer <= 0) {
                spawnObstacle();
                spawnTimer = Math.max(
                    0.72,
                    (1.45 + Math.random() * 0.65) / speed
                );
            }

            const playerBox = {
                x: player.x + 5,
                y: player.y + 5,
                w: player.width - 10,
                h: player.height - 8
            };

            for (const obstacle of obstacles) {
                obstacle.x -= worldSpeed * dt;

                const hit =
                    playerBox.x < obstacle.x + obstacle.w - 4 &&
                    playerBox.x + playerBox.w > obstacle.x + 4 &&
                    playerBox.y < obstacle.y + obstacle.h - 3 &&
                    playerBox.y + playerBox.h > obstacle.y + 3;

                if (hit) {
                    crash();
                    return;
                }
            }

            while (
                obstacles.length &&
                obstacles[0].x + obstacles[0].w < -10
            ) {
                obstacles.shift();
            }

            dustTimer -= dt;

            if (player.grounded && dustTimer <= 0) {
                dustTimer = 0.11;

                particles.push({
                    x: player.x + Math.random() * player.width,
                    y: groundY - 2,
                    vx: -25 - Math.random() * 45,
                    vy: -5 - Math.random() * 18,
                    life: 0.18 + Math.random() * 0.16,
                    maxLife: 0.35,
                    size: 1 + Math.random() * 2,
                    color: MOSS_DARK
                });
            }

            for (const particle of particles) {
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 35 * dt;
                particle.life -= dt;
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }

            syncHUD();
        }

        function drawBackground() {
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, width, height);

            const sky = ctx.createLinearGradient(0, 0, 0, height);

            sky.addColorStop(0, "#252b20");
            sky.addColorStop(0.68, "#20241c");
            sky.addColorStop(1, "#171915");

            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, height);

            // Large, quiet sun.
            const sunX = width * 0.77;
            const sunY = height * 0.25;
            const sunRadius = Math.min(width * 0.12, height * 0.17);

            ctx.fillStyle = "#c9877026";
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius * 1.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#c987706e";
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();

            // Layered distant hills.
            ctx.fillStyle = "#65775a22";
            ctx.beginPath();
            ctx.moveTo(0, groundY);

            for (let x = 0; x <= width + 30; x += 30) {
                const y =
                    height * 0.61 +
                    Math.sin((x + groundOffset * 0.2) * 0.012) * 14 +
                    Math.sin(x * 0.024) * 7;

                ctx.lineTo(x, y);
            }

            ctx.lineTo(width, groundY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#65775a35";
            ctx.beginPath();
            ctx.moveTo(0, groundY);

            for (let x = 0; x <= width + 25; x += 25) {
                const y =
                    height * 0.7 +
                    Math.sin((x - groundOffset * 0.35) * 0.014) * 10;

                ctx.lineTo(x, y);
            }

            ctx.lineTo(width, groundY);
            ctx.closePath();
            ctx.fill();
        }

        function drawGround() {
            ctx.fillStyle = "#25291f";
            ctx.fillRect(0, groundY, width, height - groundY);

            ctx.strokeStyle = "#a2b58b70";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(0, groundY + 0.5);
            ctx.lineTo(width, groundY + 0.5);
            ctx.stroke();

            // Small, repeating ground marks give a sense of speed.
            ctx.strokeStyle = "#eeeadd24";
            ctx.lineWidth = 1;

            for (let x = -46 + groundOffset; x < width + 46; x += 46) {
                ctx.beginPath();
                ctx.moveTo(x, groundY + 15);
                ctx.lineTo(x - 15, groundY + 15);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x - 20, groundY + 28);
                ctx.lineTo(x - 28, groundY + 28);
                ctx.stroke();
            }
        }

        function drawObstacle(obstacle) {
            const { x, y, w, h, type, color } = obstacle;

            ctx.save();

            if (type === "stone") {
                // Rounded, asymmetrical clay boulder.
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + w * 0.08, y + h);
                ctx.lineTo(x + w * 0.12, y + h * 0.43);
                ctx.lineTo(x + w * 0.35, y + h * 0.08);
                ctx.lineTo(x + w * 0.72, y);
                ctx.lineTo(x + w * 0.96, y + h * 0.34);
                ctx.lineTo(x + w, y + h);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#eeeadd45";
                ctx.fillRect(x + w * 0.37, y + h * 0.26, w * 0.2, 2);
            } else if (type === "sprout") {
                // A small abstract plant silhouette.
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(3, w * 0.13);
                ctx.lineCap = "round";

                ctx.beginPath();
                ctx.moveTo(x + w * 0.5, y + h);
                ctx.lineTo(x + w * 0.5, y + h * 0.35);
                ctx.stroke();

                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.ellipse(
                    x + w * 0.31,
                    y + h * 0.43,
                    w * 0.27,
                    h * 0.15,
                    -0.6,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(
                    x + w * 0.7,
                    y + h * 0.22,
                    w * 0.28,
                    h * 0.16,
                    0.65,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            } else {
                // A weathered standing stone.
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x + w * 0.12, y + h);
                ctx.lineTo(x + w * 0.18, y + h * 0.22);
                ctx.lineTo(x + w * 0.43, y);
                ctx.lineTo(x + w * 0.83, y + h * 0.12);
                ctx.lineTo(x + w * 0.94, y + h);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#eeeadd30";
                ctx.fillRect(x + w * 0.3, y + h * 0.3, 2, h * 0.32);
            }

            ctx.restore();
        }

        function drawPlayer() {
            const { x, y, width: pw, height: ph, squash } = player;

            ctx.save();

            // Ground shadow shrinks as the runner rises.
            const heightFromGround = Math.max(0, groundY - (y + ph));
            const shadowScale = Math.max(
                0.3,
                1 - heightFromGround / (height * 0.7)
            );

            ctx.fillStyle = "#00000040";
            ctx.beginPath();
            ctx.ellipse(
                x + pw * 0.5,
                groundY + 2,
                pw * 0.6 * shadowScale,
                3 * shadowScale,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Tiny landing squash.
            const scaleX = 1 + squash * 0.65;
            const scaleY = 1 - squash * 0.65;

            ctx.translate(x + pw / 2, y + ph / 2);
            ctx.scale(scaleX, scaleY);
            ctx.translate(-(x + pw / 2), -(y + ph / 2));

            // Rounded runner body.
            ctx.fillStyle = IVORY;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 9, pw - 8, ph - 9, 7);
            ctx.fill();

            // Moss-green upper panel.
            ctx.fillStyle = MOSS;
            ctx.beginPath();
            ctx.roundRect(x + 7, y + 3, pw - 14, 15, 5);
            ctx.fill();

            // Small dark face detail.
            ctx.fillStyle = BG;
            ctx.beginPath();
            ctx.arc(x + pw * 0.66, y + 13, 2, 0, Math.PI * 2);
            ctx.fill();

            // Feet.
            ctx.fillStyle = MOSS_DARK;
            ctx.fillRect(x + 4, y + ph - 3, 8, 4);
            ctx.fillRect(x + pw - 12, y + ph - 3, 8, 4);

            ctx.restore();
        }

        function drawParticles() {
            for (const particle of particles) {
                ctx.globalAlpha = Math.max(
                    0,
                    Math.min(1, particle.life / particle.maxLife)
                );

                ctx.fillStyle = particle.color;
                ctx.fillRect(
                    particle.x,
                    particle.y,
                    particle.size,
                    particle.size
                );
            }

            ctx.globalAlpha = 1;
        }

        function draw() {
            if (destroyed || !ctx) return;

            drawBackground();
            drawGround();

            for (const obstacle of obstacles) {
                drawObstacle(obstacle);
            }

            drawParticles();
            drawPlayer();
        }

        function loop(now) {
            if (!running || destroyed) return;

            const dt = Math.min((now - previousTime) / 1000, 0.035);
            previousTime = now;

            update(dt);

            if (running) {
                draw();
                animationFrame = requestAnimationFrame(loop);
            }
        }

        function handleKeyDown(event) {
            if (event.code !== "Space" && event.code !== "ArrowUp") return;

            if (
                event.target instanceof HTMLElement &&
                event.target.closest("button")
            ) {
                return;
            }

            event.preventDefault();

            if (!running) {
                if (!overlay.hidden) start();
                return;
            }

            jump();
        }

        // Let go early for a shorter hop.
        function releaseJump() {
            if (!player.grounded && !player.cut && player.vy < 0) {
                player.cut = true;
                player.vy *= 0.5;
            }
        }

        function handleKeyUp(event) {
            if (event.code === "Space" || event.code === "ArrowUp") releaseJump();
        }

        function handlePointerDown(event) {
            if (event.target.closest("button")) return;
            if (!running) return;

            event.preventDefault();
            jump();
        }

        function handleExit() {
            onExit();
        }

        function handleVisibilityChange() {
            if (document.hidden && running) {
                running = false;
                cancelAnimationFrame(animationFrame);

                showOverlay(
                    "FIELD STUDY / PAUSED",
                    "PAUSED.",
                    "This run has stopped while the page was hidden. Start a fresh run when you're ready.",
                    "START NEW RUN ↗"
                );
            }
        }

        function destroy() {
            if (destroyed) return;

            destroyed = true;
            running = false;
            cancelAnimationFrame(animationFrame);

            window.removeEventListener("resize", resize);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("pointerup", releaseJump);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            canvas.removeEventListener("pointerdown", handlePointerDown);
            startButton.removeEventListener("click", start);
            exitButton.removeEventListener("click", handleExit);

            if (activeGame === instance) {
                activeGame = null;
            }
        }

        const instance = { destroy };

        window.addEventListener("resize", resize);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("pointerup", releaseJump);
        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        canvas.addEventListener("pointerdown", handlePointerDown);
        startButton.addEventListener("click", start);
        exitButton.addEventListener("click", handleExit);

        activeGame = instance;

        resize();
        reset();
        draw();

        window.AfterhoursGames.setStopper(destroy);
    }

    window.AfterhoursGames = window.AfterhoursGames || {};
    window.AfterhoursGames[GAME_ID] = (mount, services) => {
        startGame(mount, services);
    };
})();