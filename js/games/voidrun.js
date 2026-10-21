
(() => {
    "use strict";

    const GAME_ID = "voidrun";
    const STORAGE_KEY = "afterhours-voidrun-best";
    const META_KEY = "afterhours-voidrun-field-notes";
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

        const onExit = services.onExit || (() => { });

        mount.innerHTML = `
      <section class="vr-game">
        <style>
          .vr-game {
            --vr-bg: #171915;
            --vr-panel: #20241d;
            --vr-moss: #a2b58b;
            --vr-clay: #c98770;
            overflow: hidden;
            position: relative;
            isolation: isolate;
            border: 1px solid #eeeadd22;
            border-radius: 20px;
            background: var(--vr-bg);
            color: ${IVORY};
            font-family: "DM Sans", sans-serif;
          }

          .vr-game *,
          .vr-game *::before,
          .vr-game *::after {
            box-sizing: border-box;
          }

          .vr-game button {
            font: inherit;
          }

          .vr-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 17px 22px;
            border-bottom: 1px solid #eeeadd13;
          }

          .vr-brand,
          .vr-mono,
          .vr-label,
          .vr-kicker,
          .vr-footer,
          .vr-button {
            font-family: "DM Mono", monospace;
          }

          .vr-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            color: ${MOSS};
            font-size: 10px;
            letter-spacing: .14em;
          }

          .vr-live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: ${MOSS};
            box-shadow: 0 0 14px #a2b58b77;
          }

          .vr-actions {
            display: flex;
            gap: 8px;
          }

          .vr-button {
            min-height: 37px;
            padding: 9px 13px;
            border: 1px solid #eeeadd26;
            border-radius: 999px;
            background: transparent;
            color: ${IVORY};
            font-size: 9px;
            letter-spacing: .04em;
            cursor: pointer;
            transition:
              background .18s,
              color .18s,
              border-color .18s,
              transform .18s;
          }

          .vr-button:hover {
            border-color: ${MOSS};
            background: #a2b58b12;
          }

          .vr-button:active {
            transform: scale(.97);
          }

          .vr-button--primary {
            border-color: ${MOSS};
            background: ${MOSS};
            color: ${BG};
          }

          .vr-button--primary:hover {
            background: #c1d0ad;
            color: ${BG};
          }

          .vr-button:focus-visible {
            outline: 2px solid ${MOSS};
            outline-offset: 3px;
          }

          .vr-hud {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            padding: 17px 20px;
          }

          .vr-stat {
            min-width: 0;
            padding: 0 10px;
            border-left: 1px solid #eeeadd13;
          }

          .vr-stat:first-child {
            border-left: 0;
            padding-left: 0;
          }

          .vr-label {
            color: ${MUTED};
            font-size: 9px;
            letter-spacing: .12em;
          }

          .vr-value {
            margin-top: 6px;
            font-size: clamp(19px, 2.5vw, 27px);
            font-weight: 500;
            letter-spacing: -.055em;
            font-variant-numeric: tabular-nums;
          }

          .vr-stat:last-child .vr-value {
            color: ${MOSS};
          }

          .vr-arena {
            position: relative;
            height: clamp(360px, 59vh, 640px);
            min-height: 320px;
            overflow: hidden;
            background: #20241d;
            border-block: 1px solid #eeeadd15;
            touch-action: manipulation;
          }

          .vr-canvas {
            display: block;
            width: 100%;
            height: 100%;
            touch-action: none;
            outline: none;
          }

          .vr-canvas:focus-visible {
            outline: 2px solid ${MOSS};
            outline-offset: -3px;
          }

          .vr-overlay {
            position: absolute;
            inset: 0;
            z-index: 5;
            display: grid;
            place-items: center;
            padding: clamp(18px, 5vw, 42px);
            background:
              radial-gradient(
                ellipse at 50% 45%,
                #293326b8,
                #171915ed 76%
              );
            text-align: center;
            backdrop-filter: blur(7px);
          }

          .vr-overlay[hidden] {
            display: none !important;
          }

          .vr-panel {
            width: min(100%, 480px);
          }

          .vr-kicker {
            color: ${MOSS};
            font-size: 9px;
            letter-spacing: .19em;
            line-height: 1.8;
          }

          .vr-title {
            margin: 19px 0 14px;
            font-family: "Space Grotesk", sans-serif;
            font-size: clamp(54px, 11vw, 94px);
            font-weight: 600;
            letter-spacing: -.085em;
            line-height: .88;
          }

          .vr-title span {
            color: ${MOSS};
          }

          .vr-description {
            max-width: 370px;
            margin: 18px auto 24px;
            color: #b3b4a9;
            font-size: 13px;
            line-height: 1.9;
          }

          .vr-overlay .vr-button {
            min-height: 45px;
            padding: 13px 21px;
          }

          .vr-overlay-actions {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 9px;
          }

          .vr-tip {
            margin-top: 19px;
            color: ${MUTED};
            font-size: 10px;
            line-height: 1.8;
          }

          .vr-footer {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            padding: 16px 14px 18px;
            color: ${MUTED};
            font-size: 9px;
            line-height: 1.8;
            text-align: center;
          }

          .vr-key {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            min-height: 23px;
            padding: 2px 7px;
            border: 1px solid #eeeadd2b;
            border-radius: 5px;
            color: ${IVORY};
          }

          .vr-mobile-controls {
            display: none;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            padding: 12px;
            border-top: 1px solid #eeeadd13;
          }

          .vr-mobile-controls button {
            min-height: 48px;
            border: 1px solid #eeeadd25;
            border-radius: 10px;
            background: #20241d;
            color: ${IVORY};
            font-family: "DM Mono", monospace;
            font-size: 10px;
            touch-action: none;
            user-select: none;
          }

          .vr-mobile-controls button:active {
            background: #35402f;
            border-color: ${MOSS};
          }

          .vr-progress {
            height: 3px;
            overflow: hidden;
            background: #eeeadd10;
          }

          .vr-progress-fill {
            width: 0%;
            height: 100%;
            background: ${MOSS};
            transition: width .12s linear;
          }

          .vr-relic-status {
            min-height: 31px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 20px;
            border-bottom: 1px solid #eeeadd13;
            color: #898d80;
            font: 9px/1.6 "DM Mono", monospace;
            letter-spacing: .1em;
          }

          .vr-relic-status.is-live {
            color: ${MOSS};
            background: linear-gradient(90deg, #a2b58b0c, transparent 75%);
          }

          .vr-toast {
            position: absolute;
            z-index: 4;
            top: 17px;
            left: 50%;
            max-width: calc(100% - 28px);
            padding: 9px 13px;
            border: 1px solid #a2b58b55;
            border-radius: 999px;
            background: #171915e8;
            color: ${MOSS};
            font-family: "DM Mono", monospace;
            font-size: 9px;
            letter-spacing: .07em;
            text-align: center;
            pointer-events: none;
            opacity: 0;
            transform: translate(-50%, -6px);
            transition: opacity .18s, transform .18s;
          }

          .vr-toast.is-visible {
            opacity: 1;
            transform: translate(-50%, 0);
          }

          @media (max-width: 600px) {
            .vr-game {
              border-radius: 13px;
            }

            .vr-top {
              padding: 14px 12px;
            }

            .vr-brand {
              font-size: 8px;
              letter-spacing: .08em;
            }

            .vr-actions {
              gap: 5px;
            }

            .vr-button {
              padding: 8px 9px;
              font-size: 8px;
            }

            .vr-hud {
              gap: 3px;
              padding: 14px 9px;
            }

            .vr-stat {
              padding-inline: 7px;
            }

            .vr-label {
              font-size: 8px;
              letter-spacing: .06em;
            }

            .vr-value {
              font-size: clamp(17px, 5vw, 23px);
            }

            .vr-arena {
              height: clamp(340px, 56vh, 490px);
              min-height: 330px;
            }

            .vr-relic-status {
              padding-inline: 10px;
              font-size: 8px;
              letter-spacing: .05em;
            }

            .vr-mobile-controls {
              display: grid;
            }

            .vr-footer {
              gap: 6px;
              padding: 12px 8px 15px;
              font-size: 8px;
            }

            .vr-key {
              min-width: 21px;
              min-height: 21px;
              padding-inline: 5px;
            }
          }

          @media (max-width: 370px) {
            .vr-brand {
              letter-spacing: .03em;
            }

            .vr-actions .vr-button {
              padding-inline: 7px;
            }

            .vr-hud {
              padding-inline: 5px;
            }

            .vr-stat {
              padding-inline: 5px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .vr-game *,
            .vr-game *::before,
            .vr-game *::after {
              scroll-behavior: auto !important;
              transition-duration: .01ms !important;
              animation-duration: .01ms !important;
            }
          }
        </style>

        <header class="vr-top">
          <div class="vr-brand">
            <span class="vr-live-dot"></span>
            AFTERHOURS / VOIDRUN
          </div>
          <div class="vr-actions">
            <button class="vr-button" type="button" data-pause>
              PAUSE
            </button>
            <button class="vr-button" type="button" data-exit>
              ← EXIT
            </button>
          </div>
        </header>

        <div class="vr-hud">
          <div class="vr-stat">
            <div class="vr-label">DISTANCE</div>
            <div class="vr-value" data-score>000000</div>
          </div>
          <div class="vr-stat">
            <div class="vr-label">BEST RUN</div>
            <div class="vr-value" data-best>000000</div>
          </div>
          <div class="vr-stat">
            <div class="vr-label">STREAK</div>
            <div class="vr-value" data-streak>×1</div>
          </div>
          <div class="vr-stat">
            <div class="vr-label">PACE</div>
            <div class="vr-value" data-speed>1.0×</div>
          </div>
        </div>

        <div class="vr-progress">
          <div class="vr-progress-fill" data-progress></div>
        </div>
        <div class="vr-relic-status" data-relic-status aria-live="polite">RELIC SYSTEM // STANDBY</div>

        <div class="vr-arena">
          <canvas
            class="vr-canvas"
            tabindex="0"
            aria-label="VOIDRUN endless runner. Use Space or Up to jump, Down to slide."
          ></canvas>

          <div class="vr-toast" data-toast aria-live="polite"></div>

          <div class="vr-overlay" data-overlay>
            <div class="vr-panel">
              <div class="vr-kicker" data-kicker>
                FIELD STUDY / 003
              </div>
              <h2 class="vr-title" data-title>
                VOID<span>RUN</span>
              </h2>
              <p class="vr-description" data-description>
                The world is waking up. Leap across the overgrown ruins,
                slide beneath the old structures, collect fragments,
                and see how far you can make it.
              </p>
              <div class="vr-overlay-actions">
                <button
                  class="vr-button vr-button--primary"
                  type="button"
                  data-start
                >
                  ENTER THE RUN ↗
                </button>
              </div>
              <div class="vr-tip" data-tip>
                SPACE / ↑ JUMP · ↓ SLIDE · COLLECT THE LIGHT
              </div>
            </div>
          </div>
        </div>

        <div class="vr-mobile-controls">
          <button type="button" data-mobile-jump>↑ JUMP</button>
          <button type="button" data-mobile-slide>↓ SLIDE</button>
          <button type="button" data-mobile-pause>Ⅱ PAUSE</button>
        </div>

        <footer class="vr-footer">
          <span class="vr-key">SPACE</span>
          <span class="vr-key">↑</span>
          JUMP
          <span class="vr-key">↓</span>
          SLIDE
          <span class="vr-key">ESC</span>
          EXIT
        </footer>
      </section>
    `;

        const root = mount.querySelector(".vr-game");
        const canvas = root.querySelector(".vr-canvas");
        const ctx = canvas.getContext("2d", { alpha: false });

        if (!ctx) {
            mount.textContent = "VOIDRUN could not initialize its canvas.";
            return;
        }

        const $ = (selector) => root.querySelector(selector);

        const scoreEl = $("[data-score]");
        const bestEl = $("[data-best]");
        const streakEl = $("[data-streak]");
        const speedEl = $("[data-speed]");
        const overlay = $("[data-overlay]");
        const titleEl = $("[data-title]");
        const kickerEl = $("[data-kicker]");
        const descriptionEl = $("[data-description]");
        const tipEl = $("[data-tip]");
        const startButton = $("[data-start]");
        const pauseButton = $("[data-pause]");
        const exitButton = $("[data-exit]");
        const mobileJumpButton = $("[data-mobile-jump]");
        const mobileSlideButton = $("[data-mobile-slide]");
        const mobilePauseButton = $("[data-mobile-pause]");
        const progressFill = $("[data-progress]");
        const relicStatus = $("[data-relic-status]");
        const toastEl = $("[data-toast]");

        let destroyed = false;
        let mode = "menu";
        let animationFrame = 0;
        let previousTime = 0;
        let width = 1;
        let height = 1;
        let dpr = 1;
        let groundY = 0;
        let elapsed = 0;
        let score = 0;
        let best = readBest();
        const meta = readMeta();
        let speed = 1;
        let groundOffset = 0;
        let spawnTimer = 0;
        let pickupTimer = 1.1;
        let toastTimer = 0;
        let screenShake = 0;
        let flash = 0;
        let combo = 0;
        let comboTimer = 0;
        let shards = 0;
        let jumps = 0;
        let nearMisses = 0;
        let shieldCharges = 0;
        let surgeTimer = 0;
        let nextTrialAt = 20;
        let trialActive = 0;
        let trialProgress = 0;
        let milestones = new Set();
        let lastHudUpdate = 0;
        let lastToast = "";
        let touchSlide = false;
        let currentBiome = 0;
        let worldTime = 0;
        let lastWorldSpeed = 0;
        let pendingJump = false;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const particles = [];
        const obstacles = [];
        const pickups = [];
        const scenery = [];
        const stars = [];

        const player = {
            x: 80,
            y: 0,
            w: 31,
            h: 45,
            normalH: 45,
            slideH: 24,
            vy: 0,
            grounded: true,
            jumpsLeft: 2,
            sliding: false,
            slideTimer: 0,
            coyote: 0,
            invulnerable: 0,
            squash: 0,
            runPhase: 0,
            lean: 0
        };

        const BIOMES = [
            {
                name: "MOSS FIELDS",
                skyTop: "#252d22",
                skyBottom: "#171915",
                far: "#303b2b",
                near: "#3b4933",
                accent: "#a2b58b"
            },
            {
                name: "CLAY DUSK",
                skyTop: "#342922",
                skyBottom: "#191a16",
                far: "#44362a",
                near: "#594334",
                accent: "#c98770"
            },
            {
                name: "PALE CANOPY",
                skyTop: "#29352b",
                skyBottom: "#171915",
                far: "#354737",
                near: "#4a5c43",
                accent: "#c0d0a7"
            }
        ];

        function random(min, max) {
            return min + Math.random() * (max - min);
        }

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function lerp(a, b, t) {
            return a + (b - a) * t;
        }

        function roundedRect(x, y, w, h, radius) {
            const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);

            ctx.beginPath();

            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(x, y, w, h, r);
            } else {
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
            }

            ctx.closePath();
        }

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
                // Storage is optional.
            }
        }

        function readMeta() {
            try {
                const saved = JSON.parse(localStorage.getItem(META_KEY) || "{}");
                return {
                    fragments: Math.max(0, Number(saved.fragments) || 0),
                    trials: Math.max(0, Number(saved.trials) || 0),
                    runs: Math.max(0, Number(saved.runs) || 0)
                };
            } catch {
                return { fragments: 0, trials: 0, runs: 0 };
            }
        }

        function saveMeta() {
            try {
                localStorage.setItem(META_KEY, JSON.stringify(meta));
            } catch {
                // Persistent progression is optional.
            }
        }

        function formatScore(value) {
            return Math.floor(value).toString().padStart(6, "0");
        }

        function syncHUD(force = false) {
            const now = performance.now();

            if (!force && now - lastHudUpdate < 90) return;
            lastHudUpdate = now;

            scoreEl.textContent = formatScore(score);
            bestEl.textContent = formatScore(best);
            streakEl.textContent = `×${Math.max(1, 1 + Math.floor(combo / 4))}`;
            speedEl.textContent = `${speed.toFixed(1)}×`;

            progressFill.style.width =
                `${Math.min(100, (score % 1000) / 10)}%`;

            if (relicStatus) {
                const parts = [];
                if (shieldCharges > 0) parts.push("AEGIS SHIELD ×" + shieldCharges);
                if (surgeTimer > 0) parts.push("OVERDRIVE " + surgeTimer.toFixed(1) + "s");
                if (trialActive > 0) parts.push("RIFT TRIAL " + trialProgress + "/3");
                relicStatus.textContent = parts.length
                    ? parts.join("  //  ")
                    : "FIELD NOTES // " + meta.fragments + " FRAGMENTS · " + meta.trials + " TRIALS · " + meta.runs + " RUNS";
                relicStatus.classList.toggle("is-live", parts.length > 0);
            }
        }

        function showToast(message) {
            if (message === lastToast && toastTimer > 0) return;

            lastToast = message;
            toastEl.textContent = message;
            toastEl.classList.add("is-visible");
            toastTimer = 1.45;
        }

        function showOverlay(kicker, title, description, button, tip = "") {
            kickerEl.textContent = kicker;

            if (title === "VOIDRUN") {
                titleEl.innerHTML = 'VOID<span>RUN</span>';
            } else {
                titleEl.textContent = title;
            }

            descriptionEl.textContent = description;
            startButton.textContent = button;
            tipEl.textContent = tip;
            overlay.hidden = false;
        }

        function resize() {
            if (destroyed) return;

            const rect = canvas.getBoundingClientRect();

            width = Math.max(1, rect.width);
            height = Math.max(1, rect.height);
            dpr = Math.min(window.devicePixelRatio || 1, 1.6);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            groundY = height * 0.79;
            player.x = Math.max(32, Math.min(width * 0.17, 92));

            if (player.grounded) {
                player.y = groundY - player.h;
            } else {
                player.y = Math.min(player.y, groundY - player.h);
            }

            createScenery();
            createStars();
            draw();
        }

        function createScenery() {
            scenery.length = 0;

            const count = Math.ceil(width / 90) + 8;

            for (let i = 0; i < count; i++) {
                scenery.push({
                    x: (i / count) * (width + 100) - 50,
                    y: groundY - random(28, height * 0.29),
                    size: random(22, 78),
                    depth: random(0.12, 0.65),
                    kind: Math.random() < 0.5 ? "hill" : "spire",
                    seed: random(0, 100)
                });
            }
        }

        function createStars() {
            stars.length = 0;

            for (let i = 0; i < 42; i++) {
                stars.push({
                    x: random(0, width),
                    y: random(10, groundY * 0.72),
                    r: random(0.4, 1.4),
                    a: random(0.12, 0.52),
                    phase: random(0, Math.PI * 2)
                });
            }
        }

        function reset() {
            mode = "playing";
            meta.runs++;
            saveMeta();
            elapsed = 0;
            worldTime = 0;
            score = 0;
            speed = 1;
            groundOffset = 0;
            spawnTimer = 0.85;
            pickupTimer = 1.4;
            screenShake = 0;
            flash = 0;
            combo = 0;
            comboTimer = 0;
            shards = 0;
            jumps = 0;
            nearMisses = 0;
            shieldCharges = 0;
            surgeTimer = 0;
            nextTrialAt = 20;
            trialActive = 0;
            trialProgress = 0;
            currentBiome = 0;
            lastWorldSpeed = 0;
            pendingJump = false;
            touchSlide = false;
            milestones = new Set();

            obstacles.length = 0;
            pickups.length = 0;
            particles.length = 0;

            player.x = Math.max(32, Math.min(width * 0.17, 92));
            player.h = player.normalH;
            player.y = groundY - player.h;
            player.vy = 0;
            player.grounded = true;
            player.jumpsLeft = 2;
            player.sliding = false;
            player.slideTimer = 0;
            player.coyote = 0;
            player.invulnerable = 0;
            player.squash = 0;
            player.runPhase = 0;
            player.lean = 0;

            syncHUD(true);
        }

        function start() {
            if (destroyed || mode === "playing") return;

            reset();
            overlay.hidden = true;
            pauseButton.textContent = "PAUSE";
            previousTime = performance.now();

            canvas.focus({ preventScroll: true });

            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(loop);
        }

        function pause() {
            if (destroyed || mode !== "playing") return;

            mode = "paused";
            cancelAnimationFrame(animationFrame);
            pauseButton.textContent = "RESUME";

            showOverlay(
                "FIELD STUDY / PAUSED",
                "TAKE A BREATH.",
                `Distance ${formatScore(score)}. Your run is paused. Pick up where you left off whenever you're ready.`,
                "RESUME RUN ↗",
                "YOUR PROGRESS IS PRESERVED"
            );

            draw();
        }

        function resume() {
            if (destroyed || mode !== "paused") return;

            mode = "playing";
            overlay.hidden = true;
            pauseButton.textContent = "PAUSE";
            previousTime = performance.now();
            animationFrame = requestAnimationFrame(loop);
        }

        function togglePause() {
            if (mode === "playing") pause();
            else if (mode === "paused") resume();
        }

        function jump() {
            if (mode !== "playing" || destroyed) return;

            if (player.sliding) {
                player.sliding = false;
                player.slideTimer = 0;
                player.h = player.normalH;
                player.y = Math.min(player.y, groundY - player.h);
            }

            const canGroundJump =
                player.grounded || player.coyote > 0;

            if (canGroundJump) {
                player.vy = -height * 1.12;
                player.grounded = false;
                player.coyote = 0;
                player.jumpsLeft = 1;
                player.squash = 0.12;
                player.cut = false;
                jumps++;

                burst(
                    player.x + player.w * 0.5,
                    groundY - 3,
                    MOSS_DARK,
                    9,
                    130
                );

                return;
            }

            if (player.jumpsLeft > 0) {
                player.jumpsLeft = 0;
                player.vy = -height * 0.87;
                player.cut = false;
                player.squash = 0.08;
                jumps++;

                burst(
                    player.x + player.w * 0.5,
                    player.y + player.h,
                    MOSS,
                    12,
                    160
                );

                showToast("SECOND WIND ✳");
            }
        }

        function releaseJump() {
            if (!player.grounded && !player.cut && player.vy < 0) {
                player.cut = true;
                player.vy *= 0.52;
            }
        }

        function beginSlide() {
            if (mode !== "playing") return;

            touchSlide = true;
            player.sliding = true;
            player.slideTimer = 0.48;
            player.h = player.slideH;
            player.y = groundY - player.h;
        }

        function endSlide() {
            touchSlide = false;
        }

        function spawnObstacle() {
            const difficulty = clamp(elapsed / 65, 0, 1);
            const roll = Math.random();

            let obstacle;

            if (roll < 0.34) {
                const size = random(24, 37);

                obstacle = {
                    type: "stone",
                    w: size,
                    h: size * random(1.0, 1.45),
                    color: CLAY,
                    hitPad: 3
                };
            } else if (roll < 0.59) {
                const size = random(27, 39);

                obstacle = {
                    type: "sprout",
                    w: size * 1.12,
                    h: size * 1.25,
                    color: MOSS,
                    hitPad: 4
                };
            } else if (roll < 0.78) {
                const size = random(23, 34);

                obstacle = {
                    type: "pillar",
                    w: size * 0.8,
                    h: size * random(1.55, 2.15),
                    color: MOSS_DARK,
                    hitPad: 4
                };
            } else {
                obstacle = {
                    type: "arch",
                    w: random(64, 85),
                    h: random(54, 66),
                    color: "#879d72",
                    hitPad: 2
                };
            }

            obstacle.x = width + obstacle.w + 8;
            obstacle.y = groundY - obstacle.h;
            obstacle.passed = false;
            obstacle.seed = random(0, 100);
            obstacle.difficulty = difficulty;
            obstacle.trial = trialActive > 0;

            obstacles.push(obstacle);
        }

        function spawnPickup() {
            const high = Math.random() < 0.48;
            const roll = Math.random();
            const type = roll < 0.12 ? "shield" : roll < 0.24 ? "surge" : "shard";

            pickups.push({
                type,
                x: width + 18,
                y: high ? groundY - random(100, 155) : groundY - random(55, 90),
                r: type === "shard" ? random(7, 10) : 12,
                phase: random(0, Math.PI * 2),
                collected: false
            });
        }

        function burst(x, y, color, amount = 10, force = 110) {
            const safeAmount = Math.min(amount, 26);

            for (let i = 0; i < safeAmount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = random(force * 0.25, force);

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - force * 0.12,
                    life: random(0.25, 0.62),
                    maxLife: 0.62,
                    size: random(1.5, 4),
                    color,
                    gravity: random(120, 270)
                });
            }
        }

        function addCombo() {
            combo++;
            comboTimer = 2.3;

            if (combo > 0 && combo % 4 === 0) {
                showToast(`STREAK ×${1 + Math.floor(combo / 4)}`);
            }
        }

        function crash() {
            if (mode !== "playing") return;

            mode = "gameover";
            cancelAnimationFrame(animationFrame);

            const finalScore = Math.floor(score);

            burst(
                player.x + player.w / 2,
                player.y + player.h / 2,
                CLAY,
                24,
                180
            );

            screenShake = reducedMotion.matches ? 0 : 12;
            flash = 0.4;

            if (finalScore > best) {
                best = finalScore;
                saveBest();
                showToast("NEW VOIDRUN RECORD ✳");
            }

            syncHUD(true);

            showOverlay(
                "FIELD NOTES / RUN ENDED",
                "OVERGROWN.",
                `Distance ${formatScore(finalScore)}. Shards ${shards}. Near misses ${nearMisses}. You made it through ${Math.floor(elapsed)} seconds. Ready for another run?`,
                "RUN IT BACK ↻",
                `BEST ${formatScore(best)} · ${shards} FRAGMENTS COLLECTED`
            );

            draw();
        }

        function update(dt) {
            elapsed += dt;
            worldTime += dt;

            const oldBiome = currentBiome;
            currentBiome = Math.floor(elapsed / 24) % BIOMES.length;

            if (oldBiome !== currentBiome && elapsed > 24) {
                showToast(BIOMES[currentBiome].name);
            }

            speed = Math.min(2.75, 1 + elapsed * 0.025);
            surgeTimer = Math.max(0, surgeTimer - dt);
            trialActive = Math.max(0, trialActive - dt);

            if (elapsed >= nextTrialAt && trialActive <= 0) {
                trialActive = 8;
                trialProgress = 0;
                nextTrialAt += 30;
                showToast("RIFT TRIAL // CLEAR 3 OBSTACLES");
                burst(width * 0.72, height * 0.28, MOSS, 18, 150);
            } else if (trialActive <= 0 && trialProgress > 0 && trialProgress < 3) {
                showToast("RIFT TRIAL MISSED · KEEP MOVING");
                trialProgress = 0;
            }

            const worldSpeed =
                250 * speed * (surgeTimer > 0 ? 1.22 : 1) * clamp(width / 760, 0.8, 1.45);

            lastWorldSpeed = worldSpeed;

            score += dt * 34 * speed;
            groundOffset = (groundOffset + worldSpeed * dt) % 48;

            player.runPhase += dt * (8 + speed * 3);
            player.invulnerable = Math.max(0, player.invulnerable - dt);
            player.squash = Math.max(0, player.squash - dt);
            player.coyote = Math.max(0, player.coyote - dt);

            if (!player.grounded) {
                player.vy += height * (player.vy > 0 ? 3.4 : 2.65) * dt;
                player.y += player.vy * dt;

                if (player.y + player.h >= groundY) {
                    player.y = groundY - player.h;
                    player.vy = 0;
                    player.grounded = true;
                    player.jumpsLeft = 1;
                    player.coyote = 0.11;
                    player.squash = 0.11;

                    burst(
                        player.x + player.w * 0.5,
                        groundY - 2,
                        MOSS_DARK,
                        5,
                        85
                    );

                    if (pendingJump) {
                        pendingJump = false;
                        jump();
                    }
                }
            } else {
                player.y = groundY - player.h;
            }

            if (player.sliding) {
                player.slideTimer -= dt;

                if (player.slideTimer <= 0 && !touchSlide) {
                    player.sliding = false;
                    player.h = player.normalH;
                    player.y = groundY - player.h;
                }
            }

            if (comboTimer > 0) {
                comboTimer -= dt;

                if (comboTimer <= 0) combo = 0;
            }

            spawnTimer -= dt;

            if (spawnTimer <= 0) {
                spawnObstacle();

                const minGap = Math.max(0.79, 1.42 / speed);
                const maxGap = Math.max(1.04, 2.02 / speed);

                spawnTimer = random(minGap, maxGap);
            }

            pickupTimer -= dt;

            if (pickupTimer <= 0) {
                spawnPickup();
                pickupTimer = random(1.6, 2.7);
            }

            const playerBox = {
                x: player.x + 5,
                y: player.y + 4,
                w: player.w - 10,
                h: player.h - 7
            };

            for (const obstacle of obstacles) {
                obstacle.x -= worldSpeed * dt;

                if (obstacle.passed) continue;

                const box = {
                    x: obstacle.x + obstacle.hitPad,
                    y: obstacle.y + obstacle.hitPad,
                    w: obstacle.w - obstacle.hitPad * 2,
                    h: obstacle.h - obstacle.hitPad
                };

                const hit =
                    playerBox.x < box.x + box.w &&
                    playerBox.x + playerBox.w > box.x &&
                    playerBox.y < box.y + box.h &&
                    playerBox.y + playerBox.h > box.y;

                if (hit && player.invulnerable <= 0) {
                    if (shieldCharges > 0) {
                        shieldCharges--;
                        player.invulnerable = 1.8;
                        screenShake = reducedMotion.matches ? 0 : 5;
                        flash = 0.22;
                        burst(player.x + player.w / 2, player.y + player.h / 2, MOSS, 22, 190);
                        showToast("AEGIS SHIELD BROKE · RUN SAVED");
                    } else {
                        crash();
                        return;
                    }
                }

                if (box.x + box.w < playerBox.x && !obstacle.passed) {
                    obstacle.passed = true;
                    nearMisses++;
                    score += 15 * Math.max(1, 1 + Math.floor(combo / 4));
                    addCombo();

                    if (obstacle.trial && trialActive > 0) {
                        trialProgress++;
                        score += 75;
                        burst(player.x + player.w, groundY - 18, MOSS, 8, 100);
                        if (trialProgress >= 3) {
                            trialActive = 0;
                            score += 250;
                            shards += 3;
                            meta.fragments += 3;
                            meta.trials++;
                            saveMeta();
                            showToast("RIFT TRIAL CLEARED · +250 / 3 SHARDS");
                        }
                    }

                    if (nearMisses % 5 === 0) {
                        showToast("CLEAN RUN ✳ +15");
                    }
                }
            }

            while (
                obstacles.length &&
                obstacles[0].x + obstacles[0].w < -20
            ) {
                obstacles.shift();
            }

            for (const pickup of pickups) {
                pickup.x -= worldSpeed * dt;
                pickup.phase += dt * 2.5;

                const px = player.x + player.w * 0.5;
                const py = player.y + player.h * 0.45;
                const distance = Math.hypot(px - pickup.x, py - pickup.y);

                if (!pickup.collected && distance < pickup.r + 24) {
                    pickup.collected = true;
                    burst(pickup.x, pickup.y, pickup.type === "surge" ? CLAY : MOSS, 15, 145);
                    flash = 0.14;

                    if (pickup.type === "shield") {
                        shieldCharges = Math.min(1, shieldCharges + 1);
                        score += 90;
                        showToast("AEGIS SHIELD ACQUIRED · ONE SAVE");
                    } else if (pickup.type === "surge") {
                        surgeTimer = Math.max(surgeTimer, 6);
                        score += 100;
                        showToast("OVERDRIVE ONLINE · BONUS SCORE");
                    } else {
                        shards++;
                        meta.fragments++;
                        saveMeta();
                        score += 60 * Math.max(1, 1 + Math.floor(combo / 4));
                        addCombo();
                        showToast(`FRAGMENT +60 · ${shards}`);
                    }
                }
            }

            while (
                pickups.length &&
                (pickups[0].x < -30 || pickups[0].collected)
            ) {
                pickups.shift();
            }

            for (const particle of particles) {
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += (particle.gravity || 180) * dt;
                particle.vx *= Math.max(0, 1 - dt * 1.5);
                particle.life -= dt;
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                if (particles[i].life <= 0) particles.splice(i, 1);
            }

            if (particles.length > 240) {
                particles.splice(0, particles.length - 240);
            }

            screenShake = Math.max(0, screenShake - dt * 30);
            flash = Math.max(0, flash - dt);

            toastTimer = Math.max(0, toastTimer - dt);

            if (toastTimer <= 0) {
                toastEl.classList.remove("is-visible");
                lastToast = "";
            }

            for (const milestone of [500, 1000, 2500, 5000]) {
                if (score >= milestone && !milestones.has(milestone)) {
                    milestones.add(milestone);
                    showToast(`DISTANCE MARKER ${milestone} ✳`);
                }
            }

            syncHUD();
        }

        function drawBackground() {
            const biome = BIOMES[currentBiome];

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, biome.skyTop);
            gradient.addColorStop(0.65, "#1d221b");
            gradient.addColorStop(1, biome.skyBottom);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            const glow = ctx.createRadialGradient(
                width * 0.72,
                height * 0.28,
                0,
                width * 0.72,
                height * 0.28,
                Math.max(width, height) * 0.65
            );

            glow.addColorStop(0, `${biome.accent}17`);
            glow.addColorStop(1, "#17191500");

            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            for (const star of stars) {
                const pulse = reducedMotion.matches
                    ? 1
                    : 0.65 + Math.sin(worldTime * 1.2 + star.phase) * 0.35;

                ctx.globalAlpha = star.a * pulse;
                ctx.fillStyle = "#e1e9d4";
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;

            for (const object of scenery) {
                const x = (
                    object.x -
                    groundOffset * object.depth * 0.28
                ) % (width + 160);

                const px = x < -80 ? x + width + 160 : x;

                ctx.globalAlpha = 0.24 + object.depth * 0.34;
                ctx.fillStyle = object.depth > 0.42
                    ? biome.near
                    : biome.far;

                ctx.beginPath();

                if (object.kind === "hill") {
                    ctx.ellipse(
                        px,
                        object.y + object.size * 0.35,
                        object.size * 1.35,
                        object.size * 0.55,
                        0,
                        Math.PI,
                        Math.PI * 2
                    );
                } else {
                    ctx.moveTo(px - object.size * 0.35, groundY);
                    ctx.lineTo(px, object.y - object.size * 0.4);
                    ctx.lineTo(px + object.size * 0.38, groundY);
                    ctx.closePath();
                }

                ctx.fill();
            }

            ctx.globalAlpha = 1;

            const horizon = ctx.createLinearGradient(
                0,
                groundY - 50,
                0,
                groundY + 12
            );

            horizon.addColorStop(0, "#a2b58b00");
            horizon.addColorStop(1, `${biome.accent}15`);

            ctx.fillStyle = horizon;
            ctx.fillRect(0, groundY - 50, width, 65);

            // Fine atmospheric grain.
            ctx.fillStyle = "#eeeadd08";

            for (let i = 0; i < 42; i++) {
                const x = (i * 97.31 + worldTime * 2) % width;
                const y = (i * 47.17) % Math.max(1, groundY);

                ctx.fillRect(x, y, 1, 1);
            }
        }

        function drawGround() {
            const biome = BIOMES[currentBiome];

            const ground = ctx.createLinearGradient(
                0,
                groundY,
                0,
                height
            );

            ground.addColorStop(0, "#35402f");
            ground.addColorStop(0.16, "#252c21");
            ground.addColorStop(1, BG);

            ctx.fillStyle = ground;
            ctx.fillRect(0, groundY, width, height - groundY);

            ctx.strokeStyle = `${biome.accent}77`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(0, groundY + 0.5);
            ctx.lineTo(width, groundY + 0.5);
            ctx.stroke();

            // Moving track marks give the world a sense of speed.
            ctx.lineWidth = 1;

            for (let i = -1; i < width / 48 + 2; i++) {
                const x = i * 48 - groundOffset;

                ctx.strokeStyle = "#a2b58b16";
                ctx.beginPath();
                ctx.moveTo(x, groundY + 10);
                ctx.lineTo(x - 13, height);
                ctx.stroke();

                ctx.fillStyle = "#a2b58b16";
                ctx.fillRect(x - 2, groundY + 19, 2, 2);
            }

            for (let i = 0; i < 7; i++) {
                const x = (
                    i * 163 -
                    groundOffset * 0.65
                ) % (width + 180);

                ctx.strokeStyle = "#a2b58b17";
                ctx.beginPath();
                ctx.moveTo(x, groundY - 2);
                ctx.lineTo(x - 15, groundY + 18);
                ctx.stroke();
            }
        }

        function drawObstacle(obstacle) {
            const { x, y, w, h, type } = obstacle;

            ctx.save();

            if (type === "stone") {
                ctx.fillStyle = "#c9877044";
                ctx.beginPath();
                ctx.ellipse(
                    x + w * 0.5,
                    groundY - 1,
                    w * 0.8,
                    5,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle = "#4c4135";
                ctx.beginPath();
                ctx.moveTo(x + w * 0.08, y + h);
                ctx.lineTo(x + w * 0.15, y + h * 0.42);
                ctx.lineTo(x + w * 0.44, y + h * 0.06);
                ctx.lineTo(x + w * 0.78, y + h * 0.2);
                ctx.lineTo(x + w, y + h);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = CLAY;
                ctx.globalAlpha = 0.82;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(x + w * 0.15, y + h * 0.42);
                ctx.lineTo(x + w * 0.44, y + h * 0.06);
                ctx.lineTo(x + w * 0.78, y + h * 0.2);
                ctx.stroke();
            } else if (type === "sprout") {
                ctx.strokeStyle = MOSS_DARK;
                ctx.lineWidth = Math.max(2, w * 0.12);
                ctx.beginPath();
                ctx.moveTo(x + w * 0.5, groundY);
                ctx.lineTo(x + w * 0.52, y + h * 0.45);
                ctx.stroke();

                ctx.fillStyle = MOSS;
                ctx.beginPath();
                ctx.ellipse(
                    x + w * 0.28,
                    y + h * 0.44,
                    w * 0.3,
                    h * 0.16,
                    -0.55,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(
                    x + w * 0.7,
                    y + h * 0.27,
                    w * 0.29,
                    h * 0.15,
                    0.55,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle = "#d5e2bd";
                ctx.globalAlpha = 0.6;
                ctx.fillRect(x + w * 0.31, y + h * 0.4, 3, 2);
            } else if (type === "pillar") {
                ctx.fillStyle = "#2c3528";
                ctx.fillRect(x, y, w, h);

                ctx.fillStyle = MOSS_DARK;
                ctx.fillRect(x + w * 0.12, y, w * 0.7, h);

                ctx.fillStyle = "#a2b58b25";
                ctx.fillRect(x + w * 0.22, y + 5, 2, h - 10);

                ctx.strokeStyle = MOSS;
                ctx.globalAlpha = 0.6;
                ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

                ctx.fillStyle = "#171915";
                for (let py = y + 12; py < y + h - 5; py += 16) {
                    ctx.fillRect(x + w * 0.55, py, w * 0.18, 3);
                }
            } else if (type === "arch") {
                // A low hanging arch is designed to be slid beneath.
                ctx.fillStyle = "#35402f";
                ctx.fillRect(x, y, w, 10);
                ctx.fillRect(x, y, 9, h);
                ctx.fillRect(x + w - 9, y, 9, h);

                ctx.strokeStyle = MOSS;
                ctx.globalAlpha = 0.72;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

                ctx.fillStyle = "#a2b58b33";
                ctx.fillRect(x + 11, y + 3, w - 22, 3);
            }

            ctx.restore();
        }

        function drawPickups() {
            for (const pickup of pickups) {
                if (pickup.collected) continue;
                const bob = Math.sin(pickup.phase) * 4;
                const x = pickup.x;
                const y = pickup.y + bob;
                const powerColor = pickup.type === "surge" ? CLAY : MOSS;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.PI / 4 + Math.sin(pickup.phase) * 0.14);
                ctx.shadowColor = powerColor;
                ctx.shadowBlur = pickup.type === "shard" ? 16 : 23;
                ctx.fillStyle = pickup.type === "shard" ? "#a2b58b22" : powerColor + "33";
                ctx.fillRect(-pickup.r * 1.6, -pickup.r * 1.6, pickup.r * 3.2, pickup.r * 3.2);
                ctx.shadowBlur = 0;
                ctx.fillStyle = powerColor;

                if (pickup.type === "shield") {
                    ctx.beginPath();
                    ctx.moveTo(0, -pickup.r);
                    ctx.lineTo(pickup.r * 0.78, -pickup.r * 0.45);
                    ctx.lineTo(pickup.r * 0.62, pickup.r * 0.5);
                    ctx.lineTo(0, pickup.r);
                    ctx.lineTo(-pickup.r * 0.62, pickup.r * 0.5);
                    ctx.lineTo(-pickup.r * 0.78, -pickup.r * 0.45);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(-pickup.r * 0.7, -pickup.r * 0.7, pickup.r * 1.4, pickup.r * 1.4);
                }

                ctx.fillStyle = "#edf2e3";
                ctx.fillRect(-1.5, -pickup.r * 0.4, 3, pickup.r * 0.8);
                ctx.restore();
            }
        }

        function drawPlayer() {
            const x = player.x;
            const y = player.y;
            const w = player.w;
            const h = player.h;

            ctx.save();

            if (player.invulnerable > 0 && Math.floor(worldTime * 18) % 2 === 0) {
                ctx.globalAlpha = 0.48;
            }

            const shadowWidth = player.grounded ? w * 0.8 : w * 0.56;

            ctx.fillStyle = "#00000044";
            ctx.beginPath();
            ctx.ellipse(
                x + w / 2,
                groundY + 1,
                shadowWidth,
                player.grounded ? 4 : 3,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            const squash = player.squash > 0
                ? 1 - Math.sin(player.squash * 16) * 0.12
                : 1;

            ctx.translate(x + w / 2, y + h);
            ctx.scale(1, squash);
            ctx.translate(-(x + w / 2), -(y + h));

            if (!player.sliding) {
                // Runner silhouette with a softly lit moss body.
                const legSwing = player.grounded
                    ? Math.sin(player.runPhase) * 5
                    : 1;

                ctx.strokeStyle = MOSS_DARK;
                ctx.lineWidth = 5;
                ctx.lineCap = "round";

                ctx.beginPath();
                ctx.moveTo(x + w * 0.35, y + h - 9);
                ctx.lineTo(
                    x + w * 0.28 + legSwing,
                    y + h - 2
                );
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + w * 0.67, y + h - 9);
                ctx.lineTo(
                    x + w * 0.72 - legSwing,
                    y + h - 2
                );
                ctx.stroke();

                ctx.fillStyle = MOSS_DARK;
                roundedRect(x + 4, y + 15, w - 8, h - 22, 7);
                ctx.fill();

                ctx.fillStyle = MOSS;
                roundedRect(x + 6, y + 8, w - 12, h * 0.45, 6);
                ctx.fill();

                ctx.fillStyle = "#e4ebd8";
                ctx.beginPath();
                ctx.arc(x + w * 0.68, y + 18, 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#d2dfbd";
                ctx.globalAlpha = 0.55;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(x + 9, y + 14);
                ctx.lineTo(x + 9, y + 28);
                ctx.stroke();
            } else {
                ctx.fillStyle = MOSS_DARK;
                roundedRect(x + 2, y + 7, w + 6, h - 8, 8);
                ctx.fill();

                ctx.fillStyle = MOSS;
                roundedRect(x + w * 0.36, y + 3, w * 0.54, h - 9, 7);
                ctx.fill();

                ctx.fillStyle = "#e4ebd8";
                ctx.beginPath();
                ctx.arc(x + w * 0.72, y + 9, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        function drawParticles() {
            for (const particle of particles) {
                ctx.globalAlpha = clamp(
                    particle.life / particle.maxLife,
                    0,
                    1
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

            ctx.save();

            if (screenShake > 0 && !reducedMotion.matches) {
                ctx.translate(
                    random(-screenShake, screenShake),
                    random(-screenShake * 0.45, screenShake * 0.45)
                );
            }

            drawBackground();
            drawGround();

            for (const obstacle of obstacles) {
                drawObstacle(obstacle);
            }

            if (trialActive > 0) {
                ctx.save();
                ctx.globalAlpha = 0.7 + Math.sin(worldTime * 9) * 0.2;
                ctx.strokeStyle = MOSS;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 8]);
                ctx.strokeRect(12, 12, width - 24, height - 24);
                ctx.setLineDash([]);
                ctx.fillStyle = MOSS;
                ctx.font = '10px "DM Mono", monospace';
                ctx.textAlign = "center";
                ctx.fillText("RIFT TRIAL  " + trialProgress + "/3", width / 2, 29);
                ctx.restore();
            }

            drawPickups();
            drawParticles();
            drawPlayer();

            if (flash > 0) {
                ctx.fillStyle = `rgba(201, 135, 112, ${flash * 0.2})`;
                ctx.fillRect(0, 0, width, height);
            }

            // Quiet edge vignette for a more cinematic play space.
            const vignette = ctx.createRadialGradient(
                width * 0.5,
                height * 0.48,
                height * 0.12,
                width * 0.5,
                height * 0.48,
                Math.max(width, height) * 0.73
            );

            vignette.addColorStop(0, "#00000000");
            vignette.addColorStop(1, "#080b071f");

            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);

            ctx.restore();
        }

        function loop(now) {
            if (destroyed || mode !== "playing") return;

            const dt = clamp((now - previousTime) / 1000, 0, 0.035);
            previousTime = now;

            update(dt);

            if (mode === "playing") {
                draw();
                animationFrame = requestAnimationFrame(loop);
            }
        }

        function handleKeyDown(event) {
            const code = event.code;

            if (
                event.target instanceof HTMLElement &&
                event.target.closest("button, input, textarea, select")
            ) {
                return;
            }

            if (code === "Escape") {
                // The existing AFTERHOURS launcher handles Escape as game exit.
                return;
            }

            if (code === "KeyP") {
                event.preventDefault();
                togglePause();
                return;
            }

            if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
                event.preventDefault();

                if (mode === "menu" || mode === "gameover") {
                    start();
                    return;
                }

                if (mode === "paused") {
                    resume();
                    return;
                }

                if (!event.repeat) jump();

                return;
            }

            if (code === "ArrowDown" || code === "KeyS") {
                event.preventDefault();

                if (mode === "playing") beginSlide();
            }
        }

        function handleKeyUp(event) {
            if (
                event.code === "Space" ||
                event.code === "ArrowUp" ||
                event.code === "KeyW"
            ) {
                releaseJump();
            }

            if (
                event.code === "ArrowDown" ||
                event.code === "KeyS"
            ) {
                endSlide();

                if (player.slideTimer <= 0 && player.sliding) {
                    player.sliding = false;
                    player.h = player.normalH;
                    player.y = groundY - player.h;
                }
            }
        }

        function handlePointerDown(event) {
            if (event.target.closest("button")) return;
            if (mode !== "playing") return;

            event.preventDefault();
            canvas.focus({ preventScroll: true });
            jump();
        }

        function handleVisibilityChange() {
            if (document.hidden && mode === "playing") {
                pause();
            }
        }

        function handleExit() {
            onExit();
        }

        function destroy() {
            if (destroyed) return;

            destroyed = true;
            mode = "destroyed";
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

            startButton.removeEventListener("click", handleStart);
            pauseButton.removeEventListener("click", togglePause);
            exitButton.removeEventListener("click", handleExit);
            mobileJumpButton.removeEventListener("pointerdown", handleMobileJump);
            mobileSlideButton.removeEventListener("pointerdown", handleMobileSlide);
            mobileSlideButton.removeEventListener("pointerup", endSlide);
            mobileSlideButton.removeEventListener("pointerleave", endSlide);
            mobileSlideButton.removeEventListener("pointercancel", endSlide);
            mobilePauseButton.removeEventListener("click", togglePause);

            if (activeGame === instance) activeGame = null;
        }

        function handleStart() {
            if (mode === "paused") {
                resume();
            } else {
                start();
            }
        }

        function handleMobileJump(event) {
            event.preventDefault();

            if (mode === "menu" || mode === "gameover") {
                start();
            } else if (mode === "paused") {
                resume();
            } else {
                jump();
            }
        }

        function handleMobileSlide(event) {
            event.preventDefault();
            beginSlide();
        }

        const instance = { destroy };

        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("pointerup", releaseJump);

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        canvas.addEventListener("pointerdown", handlePointerDown);

        startButton.addEventListener("click", handleStart);
        pauseButton.addEventListener("click", togglePause);
        exitButton.addEventListener("click", handleExit);

        mobileJumpButton.addEventListener(
            "pointerdown",
            handleMobileJump
        );

        mobileSlideButton.addEventListener(
            "pointerdown",
            handleMobileSlide
        );

        mobileSlideButton.addEventListener("pointerup", endSlide);
        mobileSlideButton.addEventListener("pointerleave", endSlide);
        mobileSlideButton.addEventListener("pointercancel", endSlide);

        mobilePauseButton.addEventListener("click", togglePause);

        activeGame = instance;

        resize();
        syncHUD(true);
        draw();

        window.AfterhoursGames.setStopper(destroy);
    }

    window.AfterhoursGames = window.AfterhoursGames || {};

    window.AfterhoursGames[GAME_ID] = (mount, services = {}) => {
        startGame(mount, services);
    };
})();