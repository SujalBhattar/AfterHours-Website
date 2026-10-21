(() => {
    "use strict";

    const GAME_ID = "lightspeed";

    // Organic Future palette: warm ivory, moss, clay and charcoal.
    const IVORY = "#eeeadd";
    const MOSS = "#a2b58b";
    const MOSS_DARK = "#64785a";
    const CLAY = "#c98770";
    const BG = "#171915";
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
      <section class="ls-game">
        <style>
          .ls-game {
            --ls-bg: ${BG};
            --ls-paper: ${IVORY};
            --ls-moss: ${MOSS};
            --ls-clay: ${CLAY};
            overflow: hidden;
            border: 1px solid #eeeadd20;
            border-radius: 18px;
            background: var(--ls-bg);
            color: var(--ls-paper);
            font-family: "DM Sans", sans-serif;
            isolation: isolate;
          }

          .ls-game *,
          .ls-game *::before,
          .ls-game *::after {
            box-sizing: border-box;
          }

          .ls-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 24px;
            border-bottom: 1px solid #eeeadd14;
          }

          .ls-brand,
          .ls-exit,
          .ls-label,
          .ls-kicker,
          .ls-start,
          .ls-footer {
            font-family: "DM Mono", monospace;
          }

          .ls-brand {
            color: var(--ls-moss);
            font-size: 10px;
            letter-spacing: .15em;
          }

          .ls-exit {
            padding: 9px 13px;
            border: 1px solid #eeeadd28;
            border-radius: 999px;
            background: transparent;
            color: var(--ls-paper);
            font-size: 10px;
            letter-spacing: .04em;
            cursor: pointer;
            transition: border-color .2s, background .2s, color .2s;
          }

          .ls-exit:hover {
            border-color: var(--ls-moss);
            background: #a2b58b12;
            color: var(--ls-moss);
          }

          .ls-hud {
            display: flex;
            justify-content: center;
            gap: clamp(24px, 9vw, 100px);
            padding: 21px 12px;
            text-align: center;
          }

          .ls-label {
            color: ${MUTED};
            font-size: 9px;
            letter-spacing: .14em;
          }

          .ls-value {
            margin-top: 7px;
            color: var(--ls-paper);
            font-size: 25px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
            letter-spacing: -.055em;
          }

          .ls-hud > div:last-child .ls-value {
            color: var(--ls-moss);
          }

          .ls-arena {
            position: relative;
            height: clamp(340px, 58vh, 620px);
            overflow: hidden;
            background: #1b1e18;
            border-top: 1px solid #eeeadd0b;
            border-bottom: 1px solid #eeeadd14;
          }

          .ls-canvas {
            display: block;
            width: 100%;
            height: 100%;
            touch-action: none;
          }

          .ls-overlay {
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

          .ls-overlay[hidden] {
            display: none !important;
          }

          .ls-panel {
            width: min(100%, 430px);
          }

          .ls-kicker {
            color: var(--ls-moss);
            font-size: 9px;
            letter-spacing: .2em;
            line-height: 1.7;
          }

          .ls-title {
            margin: 18px 0;
            font-family: "Space Grotesk", sans-serif;
            font-size: clamp(43px, 9vw, 78px);
            font-weight: 600;
            letter-spacing: -.09em;
            line-height: .88;
          }

          .ls-title span {
            color: var(--ls-moss);
          }

          .ls-description {
            max-width: 330px;
            margin: 19px auto 24px;
            color: #b3b4a9;
            font-size: 13px;
            line-height: 1.8;
          }

          .ls-start {
            padding: 13px 21px;
            border: 1px solid var(--ls-moss);
            border-radius: 999px;
            background: var(--ls-moss);
            color: #171915;
            font-size: 10px;
            letter-spacing: .055em;
            cursor: pointer;
            transition: transform .2s, background .2s, border-color .2s;
          }

          .ls-start:hover {
            transform: translateY(-2px);
            border-color: #c1d0ad;
            background: #c1d0ad;
          }

          .ls-start:focus-visible,
          .ls-exit:focus-visible {
            outline: 2px solid var(--ls-paper);
            outline-offset: 4px;
          }

          .ls-footer {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 18px 14px 21px;
            color: ${MUTED};
            font-size: 9px;
            line-height: 2;
            text-align: center;
          }

          .ls-key {
            display: inline-block;
            margin: 0 2px;
            padding: 1px 6px;
            border: 1px solid #eeeadd29;
            border-radius: 4px;
            color: var(--ls-paper);
          }

          @media (max-width: 540px) {
            .ls-game {
              border-radius: 12px;
            }

            .ls-top {
              padding: 16px 13px;
            }

            .ls-brand {
              font-size: 9px;
              letter-spacing: .09em;
            }

            .ls-arena {
              height: 340px;
            }

            .ls-hud {
              gap: 25px;
              padding: 18px 8px;
            }

            .ls-value {
              font-size: 21px;
            }

            .ls-footer {
              padding-inline: 8px;
              font-size: 8px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ls-game *,
            .ls-game *::before,
            .ls-game *::after {
              scroll-behavior: auto !important;
              transition-duration: .01ms !important;
              animation-duration: .01ms !important;
            }
          }
        </style>

        <header class="ls-top">
          <div class="ls-brand">AFTERHOURS / LIGHTSPEED</div>
          <button class="ls-exit" type="button">← EXIT GAME</button>
        </header>

        <div class="ls-hud">
          <div>
            <div class="ls-label">SCORE</div>
            <div class="ls-value" data-score>000000</div>
          </div>
          <div>
            <div class="ls-label">BEST</div>
            <div class="ls-value" data-best>000000</div>
          </div>
          <div>
            <div class="ls-label">COMBO</div>
            <div class="ls-value" data-combo>×1</div>
          </div>
        </div>

        <div class="ls-arena">
          <canvas class="ls-canvas" aria-label="LIGHTSPEED game arena"></canvas>

          <div class="ls-overlay">
            <div class="ls-panel">
              <div class="ls-kicker" data-kicker>REFLEX PROTOCOL / 002</div>
              <h2 class="ls-title" data-title>LIGHT<span>SPEED</span></h2>
              <p class="ls-description" data-description>
                The tunnel is collapsing. Dodge incoming gates,
                chain clean passes, and survive the accelerating void.
              </p>
              <button class="ls-start" type="button" data-start>
                INITIATE RUN ↗
              </button>
            </div>
          </div>
        </div>

        <div class="ls-footer">
          <span class="ls-key">←</span>
          <span class="ls-key">→</span>
          MOVE /
          <span class="ls-key">A</span>
          <span class="ls-key">D</span>
          / <span class="ls-key">SWIPE</span> ON MOBILE /
          <span class="ls-key">ESC</span> EXIT
        </div>
      </section>
    `;

        const root = mount.querySelector(".ls-game");
        const canvas = root.querySelector(".ls-canvas");
        const ctx = canvas.getContext("2d");

        const scoreEl = root.querySelector("[data-score]");
        const bestEl = root.querySelector("[data-best]");
        const comboEl = root.querySelector("[data-combo]");
        const overlay = root.querySelector(".ls-overlay");
        const titleEl = root.querySelector("[data-title]");
        const kickerEl = root.querySelector("[data-kicker]");
        const descriptionEl = root.querySelector("[data-description]");
        const startButton = root.querySelector("[data-start]");
        const exitButton = root.querySelector(".ls-exit");

        const STORAGE_KEY = "afterhours-lightspeed-best";

        let destroyed = false;
        let running = false;
        let animationFrame = 0;
        let previousTime = 0;
        let elapsed = 0;
        let score = 0;
        let best = readBest();
        let combo = 1;
        let comboTimer = 0;
        let spawnTimer = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let shake = 0;
        let prevX = 0;
        let bank = 0;
        let scroll = 0;
        let speedFactor = 1;

        const keys = new Set();
        let pointerX = null;

        const player = {
            x: 0,
            y: 0,
            radius: 11,
            speed: 390,
            targetX: null,
            invulnerable: 0
        };

        let obstacles = [];
        let particles = [];
        let stars = [];

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
                // Local storage is optional.
            }
        }

        function formatScore(value) {
            return Math.floor(value).toString().padStart(6, "0");
        }

        function syncScore() {
            scoreEl.textContent = formatScore(score);
        }

        bestEl.textContent = formatScore(best);

        function resize() {
            if (destroyed) return;

            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            player.y = height * 0.79;
            player.x = Math.max(
                player.radius,
                Math.min(width - player.radius, player.x || width / 2)
            );

            // Keep the player inside the arena after a resize.
            if (player.x === 0) player.x = width / 2;

            stars = Array.from({ length: 100 }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.6 + 0.2,
                alpha: Math.random() * 0.42 + 0.12,
                z: Math.random() * 0.9 + 0.1
            }));

            draw();
        }

        function reset() {
            elapsed = 0;
            score = 0;
            combo = 1;
            comboTimer = 0;
            spawnTimer = 0.5;
            shake = 0;

            obstacles = [];
            particles = [];
            keys.clear();
            pointerX = null;

            player.x = width / 2;
            player.y = height * 0.79;
            player.invulnerable = 0;
            prevX = width / 2;
            bank = 0;
            scroll = 0;
            speedFactor = 1;

            syncScore();
            comboEl.textContent = "×1";
        }

        function showOverlay(kicker, title, description, button) {
            kickerEl.textContent = kicker;

            if (title === "LIGHTSPEED") {
                titleEl.innerHTML = 'LIGHT<span>SPEED</span>';
            } else {
                titleEl.textContent = title;
            }

            descriptionEl.textContent = description;
            startButton.textContent = button;
            overlay.hidden = false;
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

        function spawnGate() {
            const gapWidth = Math.max(100, width * 0.25 - elapsed * 0.5);
            const safeWidth = Math.min(width, gapWidth);
            const gapCenter =
                safeWidth / 2 +
                Math.random() * Math.max(0, width - safeWidth);

            const gateHeight = 17;

            obstacles.push({
                y: -gateHeight,
                height: gateHeight,
                gapCenter,
                gapWidth: safeWidth,
                passed: false,
                color: Math.random() > 0.5 ? MOSS : CLAY
            });
        }

        function burst(x, y, color, amount = 12) {
            for (let i = 0; i < amount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = 60 + Math.random() * 260;

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    life: 0.3 + Math.random() * 0.55,
                    maxLife: 0.85,
                    size: Math.random() * 2.5 + 1,
                    color
                });
            }
        }

        function crash() {
            if (!running) return;

            running = false;
            cancelAnimationFrame(animationFrame);

            const finalScore = Math.floor(score);

            burst(player.x, player.y, MOSS, 35);
            shake = 8;

            if (finalScore > best) {
                best = finalScore;
                bestEl.textContent = formatScore(best);
                saveBest();
                showToast("NEW LIGHTSPEED RECORD ✳");
            }

            showOverlay(
                "SIGNAL LOST / TRY AGAIN",
                "WIPED OUT.",
                `Final score: ${formatScore(finalScore)}. ` +
                "The tunnel got faster. Ready for another run?",
                "REBOOT RUN ↻"
            );

            draw();
        }

        function update(dt) {
            elapsed += dt;

            const difficulty = Math.min(2.1, elapsed * 0.045);
            const worldSpeed = 190 + difficulty * 100;

            scroll += worldSpeed * dt;
            speedFactor = worldSpeed / 190;

            score += dt * (100 + difficulty * 20);

            // Keyboard movement.
            let direction = 0;

            if (keys.has("ArrowLeft") || keys.has("KeyA")) direction -= 1;
            if (keys.has("ArrowRight") || keys.has("KeyD")) direction += 1;

            player.x += direction * player.speed * dt;

            // Smooth pointer and touch movement.
            if (pointerX !== null) {
                const difference = pointerX - player.x;
                player.x += difference * Math.min(1, dt * 10);
            }

            player.x = Math.max(
                player.radius,
                Math.min(width - player.radius, player.x)
            );

            // Bank the ship into turns.
            const sideSpeed = (player.x - prevX) / Math.max(dt, 0.001);
            bank += (Math.max(-1, Math.min(1, sideSpeed / 450)) - bank) * Math.min(1, dt * 9);
            prevX = player.x;

            // Engine exhaust sparks.
            if (Math.random() < dt * 70) {
                particles.push({
                    x: player.x + (Math.random() - 0.5) * 5,
                    y: player.y + 15,
                    vx: (Math.random() - 0.5) * 30 - bank * 40,
                    vy: 140 + Math.random() * 120,
                    life: 0.32,
                    maxLife: 0.32,
                    size: 1.6 + Math.random() * 1.2,
                    color: Math.random() < 0.5 ? CLAY : IVORY
                });
            }

            if (comboTimer > 0) {
                comboTimer -= dt;

                if (comboTimer <= 0) {
                    combo = 1;
                    comboEl.textContent = "×1";
                }
            }

            if (player.invulnerable > 0) {
                player.invulnerable -= dt;
            }

            spawnTimer -= dt;

            if (spawnTimer <= 0) {
                spawnGate();
                spawnTimer = Math.max(0.48, 1.25 - difficulty * 0.22);
            }

            for (const gate of obstacles) {
                gate.y += worldSpeed * dt;

                const playerTop = player.y - player.radius;
                const playerBottom = player.y + player.radius;
                const gateTop = gate.y;
                const gateBottom = gate.y + gate.height;

                const verticalOverlap =
                    playerBottom > gateTop && playerTop < gateBottom;

                const gapLeft = gate.gapCenter - gate.gapWidth / 2;
                const gapRight = gate.gapCenter + gate.gapWidth / 2;

                const safelyInside =
                    player.x - player.radius > gapLeft &&
                    player.x + player.radius < gapRight;

                if (verticalOverlap && !safelyInside && player.invulnerable <= 0) {
                    crash();
                    return;
                }

                if (!gate.passed && gate.y > player.y + player.radius) {
                    gate.passed = true;
                    combo = Math.min(9, combo + 1);
                    comboTimer = 2.2;
                    comboEl.textContent = `×${combo}`;

                    score += 100 * combo;
                    burst(player.x, player.y, gate.color, 8);
                }
            }

            obstacles = obstacles.filter(
                gate => gate.y < height + gate.height
            );

            for (const particle of particles) {
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vx *= Math.pow(0.3, dt);
                particle.vy *= Math.pow(0.3, dt);
                particle.life -= dt;
            }

            particles = particles.filter(particle => particle.life > 0);
            shake = Math.max(0, shake - dt * 30);

            // Update after gate bonuses so the HUD always matches the real score.
            syncScore();
        }

        // =====================================================
        // Pseudo-3D renderer: the lane recedes to a horizon, gates
        // are lit slabs with depth, the ship hovers with a shadow.
        // Game logic stays flat; only the picture is in perspective.
        // =====================================================

        const HORIZON = 0.24;

        const shade = (hex, f) => {
            const n = parseInt(hex.slice(1, 7), 16);
            const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
            const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
            const b = Math.min(255, Math.round((n & 255) * f));
            return `rgb(${r},${g},${b})`;
        };

        const horizonY = () => height * HORIZON;
        const depthT = (y) => Math.pow(Math.max(0, y) / height, 1.55);
        const rowY = (y) => horizonY() + (height - horizonY()) * depthT(y);
        const rowScale = (y) => 0.16 + (0.84 / depthT(player.y)) * depthT(y);
        const colX = (x, y) => width / 2 + (x - width / 2) * rowScale(y);

        const fogAt = (y) => {
            const t = Math.min(1, Math.max(0, y / (height * 0.34)));
            return t * t * (3 - 2 * t);
        };

        function drawBackground() {
            const cx = width / 2;
            const h0 = horizonY();

            // Night sky warming toward the horizon.
            const sky = ctx.createLinearGradient(0, 0, 0, h0);
            sky.addColorStop(0, "#10130e");
            sky.addColorStop(0.7, "#232a1d");
            sky.addColorStop(1, "#3d4634");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, h0 + 1);

            for (const star of stars) {
                const sy = star.y * (h0 / height);
                ctx.globalAlpha = star.alpha * (0.65 + 0.35 * Math.sin(elapsed * 1.6 + star.x));
                ctx.fillStyle = IVORY;
                ctx.fillRect(star.x, sy, star.size, star.size);
            }

            ctx.globalAlpha = 1;

            // Far ridge line.
            ctx.fillStyle = "#171c13";
            ctx.beginPath();
            ctx.moveTo(0, h0 + 2);

            for (let x = 0; x <= width + 20; x += 20) {
                ctx.lineTo(
                    x,
                    h0 - 8 - Math.abs(Math.sin(x * 0.011 + 1.3)) * 17 - Math.sin(x * 0.031) * 5
                );
            }

            ctx.lineTo(width, h0 + 2);
            ctx.closePath();
            ctx.fill();

            // Ground plane.
            const floor = ctx.createLinearGradient(0, h0, 0, height);
            floor.addColorStop(0, "#2d3626");
            floor.addColorStop(0.5, "#1e231a");
            floor.addColorStop(1, "#10130d");
            ctx.fillStyle = floor;
            ctx.fillRect(0, h0, width, height - h0);

            // Lane surface, slightly brighter toward the viewer.
            const lane = ctx.createLinearGradient(0, h0, 0, height);
            lane.addColorStop(0, "rgba(162,181,139,0.02)");
            lane.addColorStop(1, "rgba(162,181,139,0.10)");
            ctx.fillStyle = lane;
            ctx.beginPath();
            ctx.moveTo(colX(0, 0), h0);
            ctx.lineTo(colX(width, 0), h0);
            ctx.lineTo(colX(width, height), height);
            ctx.lineTo(colX(0, height), height);
            ctx.closePath();
            ctx.fill();

            // Lane lines converge on the horizon.
            ctx.lineWidth = 1;

            for (let i = -4; i <= 4; i++) {
                const x = cx + i * width * 0.1;
                ctx.strokeStyle = i === 0 ? "rgba(162,181,139,0.2)" : "rgba(162,181,139,0.09)";
                ctx.beginPath();
                ctx.moveTo(colX(x, 0), h0);
                ctx.lineTo(colX(x, height), height);
                ctx.stroke();
            }

            // Cross lines rush toward the camera at the real world speed.
            const spacing = 62;
            const offset = scroll % spacing;

            for (let yy = offset - spacing; yy < height; yy += spacing) {
                const a = fogAt(yy) * 0.2;
                if (a <= 0.003) continue;

                ctx.strokeStyle = `rgba(162,181,139,${a})`;
                ctx.beginPath();
                ctx.moveTo(colX(0, yy), rowY(yy));
                ctx.lineTo(colX(width, yy), rowY(yy));
                ctx.stroke();
            }

            // Glowing lane walls.
            ctx.strokeStyle = "rgba(162,181,139,0.10)";
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.moveTo(colX(0, 0), h0);
            ctx.lineTo(colX(0, height), height);
            ctx.moveTo(colX(width, 0), h0);
            ctx.lineTo(colX(width, height), height);
            ctx.stroke();

            ctx.strokeStyle = "rgba(190,208,168,0.5)";
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Warm horizon light.
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            const glow = ctx.createRadialGradient(cx, h0, 0, cx, h0, height * 0.6);
            glow.addColorStop(0, "rgba(201,135,112,0.34)");
            glow.addColorStop(0.35, "rgba(162,181,139,0.11)");
            glow.addColorStop(1, "rgba(162,181,139,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        function drawGates() {
            for (const gate of obstacles) {
                const yT = gate.y;
                const yB = gate.y + gate.height;
                const sT = rowY(yT);
                const sB = rowY(yB);
                const fog = fogAt(yB);

                if (fog <= 0.003 || sB <= sT) continue;

                const left = gate.gapCenter - gate.gapWidth / 2;
                const right = gate.gapCenter + gate.gapWidth / 2;
                const lift = Math.max(3, 15 * rowScale(yB));

                ctx.save();
                ctx.globalAlpha = fog;

                const slab = (x0, x1) => {
                    if (x1 - x0 < 1) return;

                    const ax = colX(x0, yT);
                    const bx = colX(x1, yT);
                    const cx2 = colX(x1, yB);
                    const dx = colX(x0, yB);

                    // Top face, darker far away and lit near the edge.
                    const top = ctx.createLinearGradient(0, sT, 0, sB);
                    top.addColorStop(0, shade(gate.color, 0.5));
                    top.addColorStop(1, shade(gate.color, 1.08));
                    ctx.fillStyle = top;
                    ctx.beginPath();
                    ctx.moveTo(ax, sT);
                    ctx.lineTo(bx, sT);
                    ctx.lineTo(cx2, sB);
                    ctx.lineTo(dx, sB);
                    ctx.closePath();
                    ctx.fill();

                    // Front face in shadow.
                    const front = ctx.createLinearGradient(0, sB, 0, sB + lift);
                    front.addColorStop(0, shade(gate.color, 0.55));
                    front.addColorStop(1, shade(gate.color, 0.3));
                    ctx.fillStyle = front;
                    ctx.fillRect(Math.min(dx, cx2), sB, Math.abs(cx2 - dx), lift);

                    // Bright edge where the faces meet.
                    ctx.strokeStyle = "rgba(238,234,221,0.4)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(dx, sB + 0.5);
                    ctx.lineTo(cx2, sB + 0.5);
                    ctx.stroke();

                    // Contact shadow on the floor.
                    const cast = ctx.createLinearGradient(0, sB + lift, 0, sB + lift * 2.8);
                    cast.addColorStop(0, "rgba(0,0,0,0.42)");
                    cast.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = cast;
                    ctx.fillRect(Math.min(dx, cx2), sB + lift, Math.abs(cx2 - dx), lift * 1.8);
                };

                slab(0, left);
                slab(right, width);

                // Light spilling along the edges of the opening.
                ctx.globalCompositeOperation = "lighter";
                ctx.lineCap = "round";

                for (const edge of [left, right]) {
                    ctx.strokeStyle = "rgba(190,208,168,0.2)";
                    ctx.lineWidth = 9;
                    ctx.beginPath();
                    ctx.moveTo(colX(edge, yT), sT);
                    ctx.lineTo(colX(edge, yB), sB + lift);
                    ctx.stroke();

                    ctx.strokeStyle = "rgba(238,234,221,0.7)";
                    ctx.lineWidth = 1.6;
                    ctx.stroke();
                }

                ctx.restore();
            }
        }

        function drawPlayer() {
            const px = player.x;
            const py = rowY(player.y);
            const t = elapsed;

            ctx.save();

            if (
                player.invulnerable > 0 &&
                Math.floor(player.invulnerable * 15) % 2 === 0
            ) {
                ctx.globalAlpha = 0.35;
            }

            // Hover shadow on the floor.
            const shadow = ctx.createRadialGradient(px, py + 32, 0, px, py + 32, 28);
            shadow.addColorStop(0, "rgba(0,0,0,0.5)");
            shadow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = shadow;
            ctx.beginPath();
            ctx.ellipse(px, py + 32, 28, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.translate(px, py);
            ctx.rotate(bank * 0.32);
            ctx.scale(1.35, 1.35);

            // Exhaust plume and engine glow.
            const flick = 0.85 + Math.sin(t * 50) * 0.08 + Math.random() * 0.07;
            const plumeLength = 46 * flick * Math.min(1.5, speedFactor);

            ctx.globalCompositeOperation = "lighter";

            const plume = ctx.createLinearGradient(0, 8, 0, 8 + plumeLength);
            plume.addColorStop(0, "rgba(238,234,221,0.75)");
            plume.addColorStop(0.25, "rgba(201,135,112,0.5)");
            plume.addColorStop(1, "rgba(201,135,112,0)");
            ctx.fillStyle = plume;
            ctx.beginPath();
            ctx.moveTo(-5, 8);
            ctx.lineTo(5, 8);
            ctx.lineTo(0, 8 + plumeLength);
            ctx.closePath();
            ctx.fill();

            const core = ctx.createRadialGradient(0, 9, 0, 0, 9, 17 * flick);
            core.addColorStop(0, "rgba(255,244,225,0.9)");
            core.addColorStop(0.4, "rgba(201,135,112,0.45)");
            core.addColorStop(1, "rgba(201,135,112,0)");
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(0, 9, 17 * flick, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalCompositeOperation = "source-over";

            // Hull with a lit and a shadowed facet.
            const hull = ctx.createLinearGradient(-12, 0, 12, 0);
            hull.addColorStop(0, "#64785a");
            hull.addColorStop(0.5, "#c6d4b0");
            hull.addColorStop(1, "#7f9570");
            ctx.fillStyle = hull;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, 11);
            ctx.lineTo(0, 5);
            ctx.lineTo(-12, 11);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "rgba(0,0,0,0.24)";
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, 11);
            ctx.lineTo(0, 5);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "rgba(238,234,221,0.75)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-12, 11);
            ctx.lineTo(0, -15);
            ctx.stroke();

            // Glass canopy.
            const canopy = ctx.createRadialGradient(-1, -4, 0, 0, -2, 6);
            canopy.addColorStop(0, "#f6f1e4");
            canopy.addColorStop(1, "#4c5d44");
            ctx.fillStyle = canopy;
            ctx.beginPath();
            ctx.ellipse(0, -2, 2.6, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        function drawParticles() {
            ctx.save();
            ctx.translate(0, rowY(player.y) - player.y);
            ctx.globalCompositeOperation = "lighter";
            ctx.lineCap = "round";

            for (const particle of particles) {
                ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = Math.max(1, particle.size * 0.8);
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x - particle.vx * 0.045, particle.y - particle.vy * 0.045);
                ctx.stroke();
            }

            ctx.restore();
        }

        function drawPost() {
            const cx = width / 2;
            const cy = height * 0.5;

            // Speed streaks fly past as the run accelerates.
            if (running && speedFactor > 1.02) {
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                ctx.lineCap = "round";

                const reach = Math.hypot(width, height) * 0.5;

                for (let i = 0; i < 14; i++) {
                    const angle = i * 2.39996;
                    const t = (elapsed * 0.8 * speedFactor + i * 0.173) % 1;
                    const r0 = reach * (0.45 + t * 0.75);
                    const r1 = r0 + reach * 0.09 * speedFactor;

                    ctx.strokeStyle = `rgba(238,234,221,${(0.02 + t * 0.1) * (speedFactor - 1)})`;
                    ctx.lineWidth = 1 + t * 1.2;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0 * 0.7);
                    ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1 * 0.7);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Lens vignette.
            const vignette = ctx.createRadialGradient(
                cx, cy, Math.min(width, height) * 0.3,
                cx, cy, Math.hypot(width, height) * 0.62
            );
            vignette.addColorStop(0, "rgba(0,0,0,0)");
            vignette.addColorStop(1, "rgba(0,0,0,0.55)");
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
        }

        function draw() {
            if (destroyed || !ctx) return;

            ctx.save();

            if (shake > 0) {
                ctx.translate(
                    (Math.random() - 0.5) * shake,
                    (Math.random() - 0.5) * shake
                );
            }

            drawBackground();
            drawGates();
            drawParticles();
            drawPlayer();
            drawPost();

            ctx.restore();
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
            if (
                event.code === "Space" && !running && !overlay.hidden &&
                !(event.target instanceof HTMLElement && event.target.closest("button"))
            ) {
                event.preventDefault();
                start();
                return;
            }

            if (
                ["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)
            ) {
                if (
                    event.target instanceof HTMLElement &&
                    event.target.closest("button")
                ) {
                    return;
                }

                event.preventDefault();
                keys.add(event.code);
            }
        }

        function handleKeyUp(event) {
            keys.delete(event.code);
        }

        function handlePointerMove(event) {
            const rect = canvas.getBoundingClientRect();
            pointerX = event.clientX - rect.left;
        }

        function handlePointerLeave() {
            pointerX = null;
        }

        function handleStart() {
            start();
        }

        function handleExit() {
            onExit();
        }

        function handleVisibilityChange() {
            if (document.hidden && running) {
                running = false;
                cancelAnimationFrame(animationFrame);

                showOverlay(
                    "SIGNAL PAUSED",
                    "PAUSED.",
                    "Your current run has stopped. Start again when you're ready.",
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

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            canvas.removeEventListener("pointermove", handlePointerMove);
            canvas.removeEventListener("pointerdown", handlePointerMove);
            canvas.removeEventListener("pointerleave", handlePointerLeave);
            startButton.removeEventListener("click", handleStart);
            exitButton.removeEventListener("click", handleExit);

            if (activeGame === instance) {
                activeGame = null;
            }
        }

        const instance = { destroy };

        window.addEventListener("resize", resize);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        canvas.addEventListener("pointermove", handlePointerMove);
        canvas.addEventListener("pointerdown", handlePointerMove);
        canvas.addEventListener("pointerleave", handlePointerLeave);
        startButton.addEventListener("click", handleStart);
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