
(() => {
    "use strict";

    const GAME_ID = "lightspeed";

    const C = {
        ivory: "#eeeadd",
        moss: "#a2b58b",
        mossDark: "#64785a",
        clay: "#c98770",
        bg: "#171915",
        muted: "#898d80",
        mint: "#c6d4b0"
    };

    const STORAGE_KEY = "afterhours-lightspeed-best";
    let activeGame = null;

    function startGame(mount, services = {}) {
        if (activeGame) activeGame.destroy();

        const onExit = services.onExit || (() => { });
        const showToast = services.showToast || (() => { });

        mount.innerHTML = `
        <section class="ls-game">
          <style>
            .ls-game {
              --paper:${C.ivory};
              --moss:${C.moss};
              position:relative;
              overflow:hidden;
              isolation:isolate;
              color:var(--paper);
              background:${C.bg};
              border:1px solid #eeeadd20;
              border-radius:18px;
              font-family:"DM Sans",sans-serif;
            }
            .ls-game * { box-sizing:border-box; }
            .ls-game button { font:inherit; }
            .ls-top {
              display:flex;align-items:center;justify-content:space-between;
              gap:12px;padding:17px 22px;border-bottom:1px solid #eeeadd14;
            }
            .ls-brand,.ls-exit,.ls-label,.ls-kicker,.ls-start,.ls-footer {
              font-family:"DM Mono",monospace;
            }
            .ls-brand {font-size:10px;letter-spacing:.15em;color:var(--moss);}
            .ls-exit {
              padding:9px 13px;border:1px solid #eeeadd30;border-radius:99px;
              color:var(--paper);background:transparent;cursor:pointer;font-size:10px;
            }
            .ls-exit:hover {border-color:var(--moss);color:var(--moss);}
            .ls-hud {
              display:flex;justify-content:center;gap:clamp(20px,8vw,85px);
              padding:17px 10px;text-align:center;
            }
            .ls-label {font-size:9px;letter-spacing:.13em;color:${C.muted};}
            .ls-value {
              margin-top:6px;font-size:clamp(19px,3vw,27px);font-weight:500;
              letter-spacing:-.055em;font-variant-numeric:tabular-nums;
            }
            .ls-value[data-best],.ls-value[data-energy] {color:var(--moss);}
            .ls-arena {
              height:clamp(340px,58vh,620px);position:relative;overflow:hidden;
              background:#1b1e18;border-block:1px solid #eeeadd14;
            }
            .ls-canvas {display:block;width:100%;height:100%;touch-action:none;}
            .ls-overlay {
              position:absolute;inset:0;z-index:3;display:grid;place-items:center;
              padding:22px;text-align:center;background:#171915d9;
              backdrop-filter:blur(7px);
            }
            .ls-overlay[hidden] {display:none!important;}
            .ls-panel {width:min(100%,430px);}
            .ls-kicker {font-size:9px;letter-spacing:.2em;line-height:1.8;color:var(--moss);}
            .ls-title {
              margin:18px 0;font-family:"Space Grotesk",sans-serif;
              font-size:clamp(43px,9vw,78px);font-weight:600;
              letter-spacing:-.09em;line-height:.9;
            }
            .ls-title span {color:var(--moss);}
            .ls-description {max-width:340px;margin:18px auto 23px;color:#b3b4a9;font-size:13px;line-height:1.8;}
            .ls-start {
              padding:13px 21px;border:1px solid var(--moss);border-radius:99px;
              color:${C.bg};background:var(--moss);cursor:pointer;font-size:10px;
              letter-spacing:.055em;transition:transform .2s,background .2s;
            }
            .ls-start:hover {transform:translateY(-2px);background:#c1d0ad;}
            .ls-start:focus-visible,.ls-exit:focus-visible {
              outline:2px solid var(--paper);outline-offset:4px;
            }
            .ls-footer {
              display:flex;flex-wrap:wrap;justify-content:center;align-items:center;
              gap:6px;padding:15px 12px 18px;color:${C.muted};
              font-size:9px;line-height:2;text-align:center;
            }
            .ls-key {padding:2px 6px;border:1px solid #eeeadd29;border-radius:4px;color:var(--paper);}
            .ls-tip {
              position:absolute;left:50%;bottom:12px;z-index:2;
              transform:translateX(-50%);pointer-events:none;white-space:nowrap;
              color:#eeeadd9c;font:9px "DM Mono",monospace;letter-spacing:.1em;
              opacity:0;transition:opacity .25s;
            }
            .ls-tip.show {opacity:1;}
            .ls-game button:disabled {opacity:.5;cursor:default;}
            @media(max-width:540px) {
              .ls-game {border-radius:12px;}
              .ls-top {padding:14px 12px;}
              .ls-brand {font-size:9px;letter-spacing:.08em;}
              .ls-arena {height:340px;}
              .ls-hud {gap:clamp(15px,5vw,25px);padding:16px 5px;}
              .ls-footer {font-size:8px;padding-inline:7px;}
            }
            @media(prefers-reduced-motion:reduce) {
              .ls-game * {transition:none!important;}
            }
          </style>

          <header class="ls-top">
            <div class="ls-brand">AFTERHOURS / LIGHTSPEED</div>
            <button class="ls-exit" type="button">← EXIT GAME</button>
          </header>

          <div class="ls-hud">
            <div><div class="ls-label">SCORE</div><div class="ls-value" data-score>000000</div></div>
            <div><div class="ls-label">BEST</div><div class="ls-value" data-best>000000</div></div>
            <div><div class="ls-label">COMBO</div><div class="ls-value" data-combo>×1</div></div>
            <div><div class="ls-label">ENERGY</div><div class="ls-value" data-energy>◇ 0</div></div>
          </div>

          <div class="ls-arena">
            <canvas class="ls-canvas" aria-label="LIGHTSPEED game arena"></canvas>
            <div class="ls-overlay">
              <div class="ls-panel">
                <div class="ls-kicker" data-kicker>REFLEX PROTOCOL / 002</div>
                <h2 class="ls-title" data-title>LIGHT<span>SPEED</span></h2>
                <p class="ls-description" data-description>
                  Find the opening. Collect the signal. Ride the accelerating tunnel
                  for as long as your reflexes hold.
                </p>
                <button class="ls-start" type="button" data-start>INITIATE RUN ↗</button>
              </div>
            </div>
            <div class="ls-tip" data-tip>SHIFT OR SPACE · SHORT PHASE BURST</div>
          </div>

          <div class="ls-footer">
            <span class="ls-key">←</span><span class="ls-key">→</span>
            MOVE /
            <span class="ls-key">A</span><span class="ls-key">D</span>
            / SWIPE OR DRAG /
            <span class="ls-key">SPACE</span> PHASE BURST /
            <span class="ls-key">ESC</span> EXIT
          </div>
        </section>`;

        const root = mount.querySelector(".ls-game");
        const canvas = root.querySelector(".ls-canvas");
        const ctx = canvas.getContext("2d");
        const overlay = root.querySelector(".ls-overlay");
        const titleEl = root.querySelector("[data-title]");
        const kickerEl = root.querySelector("[data-kicker]");
        const descriptionEl = root.querySelector("[data-description]");
        const startButton = root.querySelector("[data-start]");
        const exitButton = root.querySelector(".ls-exit");
        const scoreEl = root.querySelector("[data-score]");
        const bestEl = root.querySelector("[data-best]");
        const comboEl = root.querySelector("[data-combo]");
        const energyEl = root.querySelector("[data-energy]");
        const tip = root.querySelector("[data-tip]");

        let destroyed = false;
        let mode = "menu";
        let raf = 0;
        let previousTime = 0;
        let width = 1;
        let height = 1;
        let dpr = 1;
        let elapsed = 0;
        let score = 0;
        let best = readBest();
        let combo = 1;
        let comboTimer = 0;
        let spawnTimer = 0.6;
        let pickupTimer = 2.6;
        let scroll = 0;
        let shake = 0;
        let bank = 0;
        let phaseTime = 0;
        let energy = 0;
        let streak = 0;
        let lastGateTime = 0;
        let pointerX = null;
        let dragging = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchMoved = false;
        let tipTimer = 0;
        let muted = false;

        const keys = new Set();
        let gates = [];
        let pickups = [];
        let particles = [];
        let stars = [];

        const player = {
            x: 0, y: 0, radius: 8.5, speed: 410,
            invulnerable: 0, targetX: null
        };

        function readBest() {
            try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; }
            catch { return 0; }
        }

        function saveBest() {
            try { localStorage.setItem(STORAGE_KEY, String(best)); }
            catch { }
        }

        function fmt(n) {
            return Math.max(0, Math.floor(n)).toString().padStart(6, "0");
        }

        function syncHUD() {
            scoreEl.textContent = fmt(score);
            bestEl.textContent = fmt(best);
            comboEl.textContent = "×" + combo;
            energyEl.textContent = "◇ " + energy;
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
            player.y = height * 0.79;
            player.x = clamp(player.x || width / 2, player.radius, width - player.radius);
            stars = Array.from({ length: 90 }, () => ({
                x: Math.random() * width,
                y: Math.random() * height * .25,
                size: Math.random() * 1.5 + .3,
                alpha: Math.random() * .45 + .1,
                phase: Math.random() * 7
            }));
            draw();
        }

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        function reset() {
            elapsed = 0;
            score = 0;
            combo = 1;
            comboTimer = 0;
            spawnTimer = 0.7;
            pickupTimer = 2.4;
            scroll = 0;
            shake = 0;
            bank = 0;
            phaseTime = 0;
            energy = 1;
            streak = 0;
            lastGateTime = 0;
            pointerX = null;
            dragging = false;
            keys.clear();
            gates = [];
            pickups = [];
            particles = [];
            player.x = width / 2;
            player.y = height * .79;
            player.invulnerable = 0;
            player.targetX = null;
            syncHUD();
        }

        function showOverlay(kicker, title, description, button) {
            kickerEl.textContent = kicker;
            if (title === "LIGHTSPEED") {
                titleEl.innerHTML = "LIGHT<span>SPEED</span>";
            } else {
                titleEl.textContent = title;
            }
            descriptionEl.textContent = description;
            startButton.textContent = button;
            overlay.hidden = false;
        }

        function start() {
            if (destroyed || mode === "running") return;
            reset();
            mode = "running";
            overlay.hidden = true;
            previousTime = performance.now();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(loop);
            tip.classList.add("show");
            clearTimeout(tipTimer);
            tipTimer = setTimeout(() => tip.classList.remove("show"), 2600);
        }

        function pause() {
            if (mode !== "running") return;
            mode = "paused";
            cancelAnimationFrame(raf);
            showOverlay(
                "SIGNAL HELD / TAKE A BREATH",
                "PAUSED.",
                "Your run is frozen. Resume the tunnel when you're ready.",
                "RESUME RUN ↗"
            );
            startButton.textContent = "RESUME RUN ↗";
            draw();
        }

        function resume() {
            if (mode !== "paused") return;
            mode = "running";
            overlay.hidden = true;
            previousTime = performance.now();
            raf = requestAnimationFrame(loop);
        }

        function spawnGate() {
            const difficulty = Math.min(1, elapsed / 95);
            const gapW = clamp(width * (.34 - difficulty * .085), width * .235, width * .34);
            const margin = Math.min(width * .14, gapW * .42);
            const half = gapW / 2;
            const center = clamp(
                width * .17 + Math.random() * width * .66,
                half + margin * .2,
                width - half - margin * .2
            );
            const y = -18;
            const moving = elapsed > 18 && Math.random() < Math.min(.48, elapsed / 180);
            gates.push({
                y, height: 17, gapCenter: center, gapWidth: gapW,
                passed: false, color: Math.random() < .78 ? C.moss : C.clay,
                phase: Math.random() * 6.28, drift: moving ? (Math.random() - .5) * Math.min(50, elapsed * .65) : 0,
                previousCenter: center
            });
        }

        function spawnPickup() {
            const x = width * (.17 + Math.random() * .66);
            pickups.push({
                x, y: -10, radius: 6, spin: Math.random() * 6.28,
                kind: Math.random() < .78 ? "shard" : "cell",
                alive: true
            });
        }

        function burst(x, y, color, amount = 12, power = 220) {
            for (let i = 0; i < amount; i++) {
                const a = Math.random() * Math.PI * 2;
                const v = 35 + Math.random() * power;
                particles.push({
                    x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                    life: .3 + Math.random() * .5, maxLife: .8,
                    size: Math.random() * 2.5 + 1, color
                });
            }
        }

        function phaseBurst() {
            if (mode !== "running" || energy <= 0 || phaseTime > 0) return;
            energy--;
            phaseTime = .42;
            player.invulnerable = Math.max(player.invulnerable, .48);
            burst(player.x, player.y, C.mint, 24, 160);
            shake = Math.max(shake, 2);
            syncHUD();
        }

        function crash() {
            if (mode !== "running") return;
            mode = "gameover";
            cancelAnimationFrame(raf);
            burst(player.x, player.y, C.clay, 35, 290);
            shake = 8;
            const finalScore = Math.floor(score);
            const record = finalScore > best;
            if (record) {
                best = finalScore;
                saveBest();
                showToast("NEW LIGHTSPEED RECORD ✳");
            }
            syncHUD();
            showOverlay(
                record ? "NEW RECORD / SIGNAL MASTERED" : "SIGNAL LOST / TRY AGAIN",
                "WIPED OUT.",
                `Final score: ${fmt(finalScore)}. ${streak ? "Clean gates: " + streak + ". " : ""}The tunnel waits for another run.`,
                "REBOOT RUN ↻"
            );
            draw();
        }

        function update(dt) {
            elapsed += dt;
            const difficulty = Math.min(2.35, elapsed * .027);
            const worldSpeed = 190 + difficulty * 93;
            scroll += worldSpeed * dt;
            score += dt * (95 + difficulty * 17);

            let direction = 0;
            if (keys.has("ArrowLeft") || keys.has("KeyA")) direction--;
            if (keys.has("ArrowRight") || keys.has("KeyD")) direction++;

            if (pointerX !== null && dragging) {
                const diff = pointerX - player.x;
                player.x += diff * Math.min(1, dt * 13);
            } else {
                player.x += direction * player.speed * (1 + difficulty * .06) * dt;
            }
            player.x = clamp(player.x, player.radius, width - player.radius);

            const sideSpeed = (player.x - (player.targetX ?? player.x)) / Math.max(dt, .001);
            bank += (clamp(sideSpeed / 450, -1, 1) - bank) * Math.min(1, dt * 8);
            player.targetX = player.x;

            if (phaseTime > 0) phaseTime = Math.max(0, phaseTime - dt);
            if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

            if (comboTimer > 0) {
                comboTimer -= dt;
                if (comboTimer <= 0) {
                    combo = 1;
                    syncHUD();
                }
            }

            spawnTimer -= dt;
            if (spawnTimer <= 0) {
                spawnGate();
                spawnTimer = Math.max(.58, 1.28 - difficulty * .19) * (.9 + Math.random() * .22);
            }

            pickupTimer -= dt;
            if (pickupTimer <= 0) {
                spawnPickup();
                pickupTimer = 2.7 + Math.random() * 2.4;
            }

            for (const gate of gates) {
                gate.previousCenter = gate.gapCenter;
                if (gate.drift) {
                    gate.gapCenter += Math.sin(elapsed * 1.3 + gate.phase) * gate.drift * dt;
                    gate.gapCenter = clamp(gate.gapCenter, gate.gapWidth / 2 + 5, width - gate.gapWidth / 2 - 5);
                }
                gate.y += worldSpeed * dt;
                const overlap = player.y + player.radius > gate.y &&
                    player.y - player.radius < gate.y + gate.height;
                const left = gate.gapCenter - gate.gapWidth / 2;
                const right = gate.gapCenter + gate.gapWidth / 2;
                const safe = player.x - player.radius > left + 1 &&
                    player.x + player.radius < right - 1;

                if (overlap && !safe && player.invulnerable <= 0) {
                    crash();
                    return;
                }

                if (!gate.passed && gate.y > player.y + player.radius) {
                    gate.passed = true;
                    streak++;
                    combo = Math.min(9, combo + 1);
                    comboTimer = 2.4;
                    score += 90 * combo;
                    lastGateTime = elapsed;
                    burst(player.x, player.y, gate.color, 8, 100);
                    syncHUD();
                }
            }
            gates = gates.filter(g => g.y < height + 30);

            for (const p of pickups) {
                p.y += worldSpeed * dt;
                p.spin += dt * 3.8;
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (p.alive && dx * dx + dy * dy < (p.radius + player.radius + 7) ** 2) {
                    p.alive = false;
                    if (p.kind === "cell") energy = Math.min(3, energy + 1);
                    score += p.kind === "cell" ? 160 : 75;
                    burst(p.x, p.y, p.kind === "cell" ? C.clay : C.mint, 14, 150);
                    syncHUD();
                }
            }
            pickups = pickups.filter(p => p.alive && p.y < height + 20);

            // Engine trail stays bounded, preventing runaway particle counts.
            if (Math.random() < dt * 45 && particles.length < 220) {
                particles.push({
                    x: player.x + (Math.random() - .5) * 5, y: player.y + 13,
                    vx: (Math.random() - .5) * 24 - bank * 25,
                    vy: 85 + Math.random() * 100, life: .25, maxLife: .25,
                    size: 1 + Math.random() * 1.5,
                    color: Math.random() < .6 ? C.clay : C.ivory
                });
            }

            for (const p of particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= Math.pow(.35, dt);
                p.vy *= Math.pow(.35, dt);
                p.life -= dt;
            }
            particles = particles.filter(p => p.life > 0);
            shake = Math.max(0, shake - dt * 24);
            syncHUD();
        }

        const HORIZON = .24;
        const horizonY = () => height * HORIZON;
        const depthT = y => Math.pow(clamp(y / height, 0, 1), 1.55);
        const rowY = y => horizonY() + (height - horizonY()) * depthT(y);
        const rowScale = y => .16 + (.84 / Math.max(.01, depthT(player.y))) * depthT(y);
        const colX = (x, y) => width / 2 + (x - width / 2) * rowScale(y);

        function shade(hex, f) {
            const n = parseInt(hex.slice(1), 16);
            return `rgb(${Math.min(255, ((n >> 16) & 255) * f | 0)},${Math.min(255, ((n >> 8) & 255) * f | 0)},${Math.min(255, (n & 255) * f | 0)})`;
        }

        function drawBackground() {
            const cx = width / 2, hy = horizonY();
            const sky = ctx.createLinearGradient(0, 0, 0, hy);
            sky.addColorStop(0, "#10130e");
            sky.addColorStop(.72, "#232a1d");
            sky.addColorStop(1, "#3d4634");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, hy + 1);

            for (const s of stars) {
                ctx.globalAlpha = s.alpha * (.65 + .35 * Math.sin(elapsed * 1.6 + s.phase));
                ctx.fillStyle = C.ivory;
                ctx.fillRect(s.x, s.y, s.size, s.size);
            }
            ctx.globalAlpha = 1;

            ctx.fillStyle = "#171c13";
            ctx.beginPath();
            ctx.moveTo(0, hy + 2);
            for (let x = 0; x <= width + 20; x += 18) {
                ctx.lineTo(x, hy - 8 - Math.abs(Math.sin(x * .011 + 1.3)) * 17 - Math.sin(x * .031) * 5);
            }
            ctx.lineTo(width, hy + 2); ctx.closePath(); ctx.fill();

            const floor = ctx.createLinearGradient(0, hy, 0, height);
            floor.addColorStop(0, "#2d3626");
            floor.addColorStop(.5, "#1e231a");
            floor.addColorStop(1, "#10130d");
            ctx.fillStyle = floor; ctx.fillRect(0, hy, width, height - hy);

            ctx.fillStyle = "rgba(162,181,139,.06)";
            ctx.beginPath();
            ctx.moveTo(colX(0, 0), hy); ctx.lineTo(colX(width, 0), hy);
            ctx.lineTo(colX(width, height), height); ctx.lineTo(colX(0, height), height);
            ctx.closePath(); ctx.fill();

            for (let i = -4; i <= 4; i++) {
                const x = cx + i * width * .1;
                ctx.strokeStyle = i === 0 ? "rgba(162,181,139,.2)" : "rgba(162,181,139,.09)";
                ctx.lineWidth = 1; ctx.beginPath();
                ctx.moveTo(colX(x, 0), hy); ctx.lineTo(colX(x, height), height); ctx.stroke();
            }

            const spacing = 62, offset = scroll % spacing;
            for (let yy = offset - spacing; yy < height; yy += spacing) {
                const a = Math.min(.2, Math.max(0, yy / (height * .34)) * .2);
                if (a < .003) continue;
                ctx.strokeStyle = `rgba(162,181,139,${a})`;
                ctx.beginPath(); ctx.moveTo(colX(0, yy), rowY(yy));
                ctx.lineTo(colX(width, yy), rowY(yy)); ctx.stroke();
            }

            ctx.lineCap = "round";
            ctx.strokeStyle = "rgba(162,181,139,.12)";
            ctx.lineWidth = 7; ctx.beginPath();
            ctx.moveTo(colX(0, 0), hy); ctx.lineTo(colX(0, height), height);
            ctx.moveTo(colX(width, 0), hy); ctx.lineTo(colX(width, height), height); ctx.stroke();
            ctx.strokeStyle = "rgba(190,208,168,.48)"; ctx.lineWidth = 1.2; ctx.stroke();

            ctx.save(); ctx.globalCompositeOperation = "lighter";
            const glow = ctx.createRadialGradient(cx, hy, 0, cx, hy, height * .6);
            glow.addColorStop(0, "rgba(201,135,112,.32)");
            glow.addColorStop(.35, "rgba(162,181,139,.1)");
            glow.addColorStop(1, "rgba(162,181,139,0)");
            ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height); ctx.restore();
        }

        function drawGates() {
            for (const g of gates) {
                const top = g.y, bottom = g.y + g.height;
                const sy = rowY(top), ey = rowY(bottom);
                const fog = clamp(bottom / (height * .34), 0, 1);
                if (fog <= .003 || ey <= sy) continue;
                const left = g.gapCenter - g.gapWidth / 2, right = g.gapCenter + g.gapWidth / 2;
                const lift = Math.max(3, 15 * rowScale(bottom));
                ctx.save(); ctx.globalAlpha = fog;

                function slab(x0, x1) {
                    if (x1 - x0 < 1) return;
                    const ax = colX(x0, top), bx = colX(x1, top);
                    const cx = colX(x1, bottom), dx = colX(x0, bottom);
                    const grad = ctx.createLinearGradient(0, sy, 0, ey);
                    grad.addColorStop(0, shade(g.color, .5));
                    grad.addColorStop(1, shade(g.color, 1.08));
                    ctx.fillStyle = grad; ctx.beginPath();
                    ctx.moveTo(ax, sy); ctx.lineTo(bx, sy); ctx.lineTo(cx, ey); ctx.lineTo(dx, ey);
                    ctx.closePath(); ctx.fill();
                    ctx.fillStyle = shade(g.color, .38);
                    ctx.fillRect(Math.min(dx, cx), ey, Math.abs(cx - dx), lift);
                    ctx.strokeStyle = "rgba(238,234,221,.4)";
                    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, ey + .5); ctx.lineTo(cx, ey + .5); ctx.stroke();
                }
                slab(0, left); slab(right, width);
                ctx.globalCompositeOperation = "lighter";
                for (const edge of [left, right]) {
                    ctx.strokeStyle = "rgba(190,208,168,.2)"; ctx.lineWidth = 8;
                    ctx.beginPath(); ctx.moveTo(colX(edge, top), sy); ctx.lineTo(colX(edge, bottom), ey + lift); ctx.stroke();
                    ctx.strokeStyle = "rgba(238,234,221,.7)"; ctx.lineWidth = 1.5; ctx.stroke();
                }
                ctx.restore();
            }
        }

        function drawPickups() {
            for (const p of pickups) {
                const y = rowY(p.y);
                const x = colX(p.x, p.y);
                const scale = Math.max(.2, rowScale(p.y));
                const r = (p.kind === "cell" ? 8 : 5) * scale;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(p.spin);
                ctx.globalCompositeOperation = "lighter";
                ctx.strokeStyle = p.kind === "cell" ? C.clay : C.mint;
                ctx.fillStyle = p.kind === "cell" ? "rgba(201,135,112,.22)" : "rgba(198,212,176,.2)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (p.kind === "cell") {
                    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
                    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
                    ctx.moveTo(0, -r); ctx.lineTo(0, r);
                } else {
                    ctx.moveTo(0, -r * 1.4); ctx.lineTo(r, 0);
                    ctx.lineTo(0, r * 1.4); ctx.lineTo(-r, 0); ctx.closePath();
                }
                ctx.fill(); ctx.stroke(); ctx.restore();
            }
        }

        function drawPlayer() {
            const px = player.x, py = rowY(player.y);
            ctx.save();
            if (player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 === 0) ctx.globalAlpha = .35;

            const shadow = ctx.createRadialGradient(px, py + 30, 0, px, py + 30, 28);
            shadow.addColorStop(0, "rgba(0,0,0,.5)");
            shadow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = shadow; ctx.beginPath(); ctx.ellipse(px, py + 30, 28, 8, 0, 0, Math.PI * 2); ctx.fill();

            ctx.translate(px, py); ctx.rotate(bank * .32); ctx.scale(1.3, 1.3);
            ctx.globalCompositeOperation = "lighter";
            const flick = .9 + Math.sin(elapsed * 50) * .08;
            const plume = ctx.createLinearGradient(0, 8, 0, 50 * flick);
            plume.addColorStop(0, "rgba(238,234,221,.8)");
            plume.addColorStop(.25, "rgba(201,135,112,.5)");
            plume.addColorStop(1, "rgba(201,135,112,0)");
            ctx.fillStyle = plume; ctx.beginPath();
            ctx.moveTo(-5, 8); ctx.lineTo(5, 8); ctx.lineTo(0, 50 * flick); ctx.closePath(); ctx.fill();

            const core = ctx.createRadialGradient(0, 9, 0, 0, 9, 17 * flick);
            core.addColorStop(0, "rgba(255,244,225,.9)");
            core.addColorStop(.4, "rgba(201,135,112,.45)");
            core.addColorStop(1, "rgba(201,135,112,0)");
            ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 9, 17 * flick, 0, Math.PI * 2); ctx.fill();

            ctx.globalCompositeOperation = "source-over";
            const hull = ctx.createLinearGradient(-12, 0, 12, 0);
            hull.addColorStop(0, C.mossDark); hull.addColorStop(.5, C.mint); hull.addColorStop(1, "#7f9570");
            ctx.fillStyle = hull; ctx.beginPath();
            ctx.moveTo(0, -15); ctx.lineTo(12, 11); ctx.lineTo(0, 5); ctx.lineTo(-12, 11); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,.24)"; ctx.beginPath();
            ctx.moveTo(0, -15); ctx.lineTo(12, 11); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = "rgba(238,234,221,.75)"; ctx.lineWidth = .8;
            ctx.beginPath(); ctx.moveTo(-12, 11); ctx.lineTo(0, -15); ctx.stroke();

            ctx.fillStyle = C.ivory; ctx.beginPath(); ctx.ellipse(0, -2, 2.6, 5, 0, 0, Math.PI * 2); ctx.fill();
            if (phaseTime > 0) {
                ctx.strokeStyle = "rgba(198,212,176,.8)"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(0, 0, 21 + Math.sin(elapsed * 30) * 2, 28, 0, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
        }

        function drawParticles() {
            ctx.save(); ctx.translate(0, rowY(player.y) - player.y);
            ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
            for (const p of particles) {
                ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
                ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.size * .8);
                ctx.beginPath(); ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * .045, p.y - p.vy * .045); ctx.stroke();
            }
            ctx.restore();
        }

        function drawPost() {
            const cx = width / 2, cy = height * .5;
            if (mode === "running") {
                ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
                const reach = Math.hypot(width, height) * .5;
                for (let i = 0; i < 14; i++) {
                    const a = i * 2.39996;
                    const t = (elapsed * .8 * (1 + Math.min(1, elapsed / 40)) + i * .173) % 1;
                    const r0 = reach * (.45 + t * .75), r1 = r0 + reach * .09 * (1 + elapsed / 80);
                    ctx.strokeStyle = `rgba(238,234,221,${(.02 + t * .08) * Math.min(1, elapsed / 20)})`;
                    ctx.lineWidth = 1 + t;
                    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .7);
                    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .7); ctx.stroke();
                }
                ctx.restore();
            }
            const v = ctx.createRadialGradient(cx, cy, Math.min(width, height) * .3, cx, cy, Math.hypot(width, height) * .62);
            v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)");
            ctx.fillStyle = v; ctx.fillRect(0, 0, width, height);
        }

        function draw() {
            if (destroyed || !ctx) return;
            ctx.save();
            if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
            drawBackground();
            drawGates();
            drawPickups();
            drawParticles();
            drawPlayer();
            drawPost();
            ctx.restore();
        }

        function loop(now) {
            if (mode !== "running" || destroyed) return;
            const dt = Math.min((now - previousTime) / 1000, .032);
            previousTime = now;
            update(dt);
            if (mode === "running") {
                draw();
                raf = requestAnimationFrame(loop);
            }
        }

        function handleKeyDown(e) {
            if (e.code === "Escape") {
                e.preventDefault();
                onExit();
                return;
            }
            if (e.code === "KeyP") {
                e.preventDefault();
                if (mode === "running") pause();
                else if (mode === "paused") resume();
                return;
            }
            if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
                if (!e.repeat) {
                    e.preventDefault();
                    if (mode === "paused") resume();
                    else if (mode === "running") phaseBurst();
                    else if (mode === "menu" || mode === "gameover") start();
                }
            }
            if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) {
                if (e.target instanceof HTMLElement && e.target.closest("button")) return;
                e.preventDefault();
                keys.add(e.code);
            }
        }

        function handleKeyUp(e) { keys.delete(e.code); }

        function handlePointerDown(e) {
            if (mode !== "running") return;
            dragging = true;
            touchMoved = false;
            const rect = canvas.getBoundingClientRect();
            pointerX = e.clientX - rect.left;
            touchStartX = e.clientX;
            touchStartY = e.clientY;
            try { canvas.setPointerCapture(e.pointerId); } catch { }
        }

        function handlePointerMove(e) {
            if (!dragging || mode !== "running") return;
            const rect = canvas.getBoundingClientRect();
            pointerX = clamp(e.clientX - rect.left, player.radius, width - player.radius);
            if (Math.abs(e.clientX - touchStartX) > 5 || Math.abs(e.clientY - touchStartY) > 5) touchMoved = true;
        }

        function handlePointerUp() {
            dragging = false;
            pointerX = null;
        }

        function handleStart() {
            if (mode === "paused") resume();
            else start();
        }

        function handleExit() { onExit(); }

        function handleVisibility() {
            if (document.hidden && mode === "running") pause();
        }

        function destroy() {
            if (destroyed) return;
            destroyed = true;
            mode = "destroyed";
            cancelAnimationFrame(raf);
            clearTimeout(tipTimer);
            window.removeEventListener("resize", resize);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("visibilitychange", handleVisibility);
            canvas.removeEventListener("pointerdown", handlePointerDown);
            canvas.removeEventListener("pointermove", handlePointerMove);
            canvas.removeEventListener("pointerup", handlePointerUp);
            canvas.removeEventListener("pointercancel", handlePointerUp);
            startButton.removeEventListener("click", handleStart);
            exitButton.removeEventListener("click", handleExit);
            if (activeGame === instance) activeGame = null;
        }

        const instance = { destroy };

        window.addEventListener("resize", resize);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        document.addEventListener("visibilitychange", handleVisibility);
        canvas.addEventListener("pointerdown", handlePointerDown);
        canvas.addEventListener("pointermove", handlePointerMove);
        canvas.addEventListener("pointerup", handlePointerUp);
        canvas.addEventListener("pointercancel", handlePointerUp);
        startButton.addEventListener("click", handleStart);
        exitButton.addEventListener("click", handleExit);

        activeGame = instance;
        bestEl.textContent = fmt(best);
        resize();
        reset();
        draw();

        window.AfterhoursGames.setStopper(destroy);
    }

    window.AfterhoursGames = window.AfterhoursGames || {};
    window.AfterhoursGames[GAME_ID] = (mount, services) => startGame(mount, services);
})();