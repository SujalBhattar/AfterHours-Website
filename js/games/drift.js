
(() => {
    "use strict";

    const GAME_ID = "drift";
    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    window.AfterhoursGames = window.AfterhoursGames || {};

    window.AfterhoursGames[GAME_ID] = (mount, services = {}) => {
        const oldStop = window.AfterhoursGames.stopCurrent;
        if (typeof oldStop === "function") oldStop();

        let dead = false;
        let paused = false;
        let frame = 0;
        let renderer;
        let scene;
        let camera;
        let observer;
        let lastTime = 0;
        let elapsed = 0;
        let distance = 0;
        let speed = 0;
        let steer = 0;
        let targetSteer = 0;
        let roadOffset = 0;
        let fragments = 0;
        let combo = 0;
        let comboTimer = 0;
        let previousCollect = -100;
        let driftCharge = 0;
        let driftChains = 0;
        let retryCount = 0;
        let pixelRatioCap = Math.min(devicePixelRatio || 1, 1.5);
        let cleanup = () => { };

        const keys = new Set();
        const geometries = new Set();
        const materials = new Set();
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
        const mobile = matchMedia("(max-width: 700px)").matches;
        const saveData = Boolean(navigator.connection?.saveData);

        mount.innerHTML = `
            <section class="drift-game" aria-label="Drift floating road game">
                <div class="drift-game__viewport"></div>
                <div class="drift-game__shade"></div>

                <header class="drift-game__header">
                    <div>
                        <div class="drift-game__eyebrow">AFTERHOURS / OPEN WORLD 001</div>
                        <h2>Somewhere,<br><em>else.</em></h2>
                        <p class="drift-game__subline">NO DESTINATION. JUST KEEP GOING.</p>
                    </div>
                    <button class="drift-game__pause" type="button">Pause</button>
                </header>

                <div class="drift-game__coordinates" aria-hidden="true">
                    <span>SECTOR 001</span>
                    <span class="drift-game__coordinate-line"></span>
                    <span>THE LONG WAY ROUND</span>
                </div>

                <div class="drift-game__hud">
                    <div>
                        <strong class="drift-game__speed">00</strong>
                        <small>KM/H</small>
                    </div>
                    <span class="drift-game__hud-divider"></span>
                    <div>
                        <strong class="drift-game__distance">0</strong>
                        <small>METRES</small>
                    </div>
                    <span class="drift-game__hud-divider"></span>
                    <div>
                        <strong class="drift-game__fragments">0</strong>
                        <small>FRAGMENTS</small>
                    </div>
                </div>

                <div class="drift-game__combo" aria-live="polite">
                    <span class="drift-game__combo-number">×1</span>
                    <span class="drift-game__combo-label">KEEP THE FLOW</span>
                </div>
                <div class="drift-game__drift-meter" aria-live="polite">
                    <div class="drift-game__drift-copy"><span data-drift-label>DRIFT CHARGE</span><span data-drift-count>0 CHAINS</span></div>
                    <div class="drift-game__drift-track"><span data-drift-fill></span></div>
                </div>

                <div class="drift-game__message" aria-live="polite">
                    Find your own horizon.
                </div>

                <div class="drift-game__controls">
                    <button type="button" data-steer="left" aria-label="Steer left">←</button>
                    <div class="drift-game__hint">
                        <span>W / ↑</span> ACCELERATE
                        <i></i>
                        <span>A / D</span> STEER
                    </div>
                    <button type="button" data-steer="right" aria-label="Steer right">→</button>
                </div>

                <div class="drift-game__loading">
                    <span class="drift-game__spinner"></span>
                    <p>Finding the road...</p>
                </div>

                <div class="drift-game__paused" aria-hidden="true">
                    <span class="drift-game__pause-kicker">TAKE YOUR TIME</span>
                    <strong>Paused.</strong>
                    <button type="button" class="drift-game__resume">Back to the road ↗</button>
                    <small>SPACE TO RESUME</small>
                </div>
            </section>
        `;

        const style = document.createElement("style");
        style.dataset.driftStyles = "true";
        style.textContent = `
            .drift-game {
                --ink: #171915;
                --paper: #eeeadd;
                --moss: #a2b58b;
                --sage: #c6d2b5;
                --clay: #c98770;
                position: relative;
                isolation: isolate;
                width: 100%;
                height: min(78svh, 780px);
                min-height: 490px;
                overflow: hidden;
                border-radius: 18px;
                background: #242b20;
                color: var(--paper);
                font-family: "DM Sans", sans-serif;
                contain: paint;
            }

            .drift-game *,
            .drift-game *::before,
            .drift-game *::after { box-sizing: border-box; }

            .drift-game button {
                color: inherit;
                font: inherit;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            .drift-game button:focus-visible {
                outline: 2px solid var(--sage);
                outline-offset: 4px;
            }

            .drift-game__viewport {
                position: absolute;
                z-index: -3;
                inset: 0;
                overflow: hidden;
                background:
                    radial-gradient(ellipse at 50% 48%, #526349, transparent 50%),
                    linear-gradient(180deg, #303b2c, #171915);
            }

            .drift-game__viewport canvas {
                display: block;
                width: 100%;
                height: 100%;
            }

            .drift-game__shade {
                position: absolute;
                z-index: -2;
                inset: 0;
                pointer-events: none;
                background:
                    linear-gradient(180deg, rgba(16,19,15,.54), transparent 30%),
                    linear-gradient(0deg, rgba(16,19,15,.75), transparent 43%),
                    linear-gradient(90deg, rgba(16,19,15,.23), transparent 30%, transparent 72%, rgba(16,19,15,.12));
            }

            .drift-game__header {
                position: absolute;
                inset: 0 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 18px;
                padding: clamp(22px, 4.2vw, 44px);
            }

            .drift-game__eyebrow,
            .drift-game__subline,
            .drift-game__coordinates,
            .drift-game__hud small,
            .drift-game__hint,
            .drift-game__combo-label,
            .drift-game__pause-kicker,
            .drift-game__paused small {
                font-family: "DM Mono", monospace;
                letter-spacing: .1em;
            }

            .drift-game__eyebrow {
                margin-bottom: 18px;
                font-size: 9px;
                opacity: .78;
            }

            .drift-game__header h2 {
                margin: 0;
                font-size: clamp(42px, 6.4vw, 76px);
                font-weight: 450;
                letter-spacing: -.075em;
                line-height: .88;
            }

            .drift-game__header h2 em {
                color: var(--sage);
                font-family: "Fraunces", Georgia, serif;
                font-weight: 400;
            }

            .drift-game__subline {
                margin-top: 18px;
                font-size: 8px;
                opacity: .66;
            }

            .drift-game__pause {
                padding: 11px 17px;
                border: 1px solid rgba(238,234,221,.45);
                border-radius: 999px;
                background: rgba(23,25,21,.28);
                backdrop-filter: blur(12px);
                font-size: 12px;
            }

            .drift-game__pause:hover {
                background: var(--paper);
                color: var(--ink);
            }

            .drift-game__coordinates {
                position: absolute;
                top: 48%;
                left: 25px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 8px;
                writing-mode: vertical-rl;
                transform: rotate(180deg);
                opacity: .65;
            }

            .drift-game__coordinate-line {
                width: 1px;
                height: 42px;
                background: currentColor;
            }

            .drift-game__hud {
                position: absolute;
                bottom: 102px;
                left: clamp(22px, 4.2vw, 44px);
                display: flex;
                align-items: center;
                gap: clamp(12px, 2vw, 22px);
            }

            .drift-game__hud > div {
                display: flex;
                align-items: baseline;
                gap: 7px;
            }

            .drift-game__hud strong {
                font: 400 clamp(24px, 3.7vw, 43px)/1 "DM Mono", monospace;
                letter-spacing: -.08em;
                font-variant-numeric: tabular-nums;
            }

            .drift-game__hud small {
                font-size: 8px;
                opacity: .7;
            }

            .drift-game__hud-divider {
                width: 1px;
                height: 22px;
                background: rgba(238,234,221,.35);
            }

            .drift-game__combo {
                position: absolute;
                right: clamp(22px, 4.2vw, 44px);
                bottom: 105px;
                display: flex;
                align-items: baseline;
                gap: 8px;
                transition: opacity .2s ease, transform .2s ease;
            }

            .drift-game__combo-number {
                color: var(--sage);
                font: 400 27px "DM Mono", monospace;
            }

            .drift-game__combo-label {
                font-size: 8px;
                opacity: .7;
            }

            .drift-game__combo.is-hot .drift-game__combo-number {
                color: var(--clay);
                text-shadow: 0 0 18px rgba(201,135,112,.45);
            }

            .drift-game__drift-meter {
                position:absolute;right:clamp(22px,4.2vw,44px);bottom:76px;
                width:min(210px,42%);pointer-events:none;
            }
            .drift-game__drift-copy {
                display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;
                color:rgba(238,234,221,.72);font:8px "DM Mono",monospace;letter-spacing:.08em;
            }
            .drift-game__drift-track {height:3px;overflow:hidden;background:#eeeadd22;}
            .drift-game__drift-track span {
                display:block;width:0;height:100%;background:var(--clay);
                box-shadow:0 0 12px #c9877088;transition:width .08s linear;
            }

            .drift-game__message {
                position: absolute;
                bottom: 58px;
                left: 50%;
                max-width: 75%;
                color: rgba(238,234,221,.88);
                font-size: 11px;
                text-align: center;
                transform: translateX(-50%);
                white-space: nowrap;
                transition: opacity .25s ease;
            }

            .drift-game__controls {
                position: absolute;
                right: clamp(20px, 4vw, 42px);
                bottom: 18px;
                left: clamp(20px, 4vw, 42px);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
            }

            .drift-game__controls button {
                display: grid;
                width: 46px;
                height: 46px;
                flex: 0 0 auto;
                place-items: center;
                border: 1px solid rgba(238,234,221,.5);
                border-radius: 50%;
                background: rgba(23,25,21,.35);
                backdrop-filter: blur(12px);
                font-size: 22px;
                user-select: none;
                touch-action: none;
            }

            .drift-game__controls button.is-pressed,
            .drift-game__controls button:hover {
                background: var(--paper);
                color: var(--ink);
            }

            .drift-game__hint {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                align-items: center;
                gap: 7px;
                font-size: 8px;
                text-align: center;
                opacity: .75;
            }

            .drift-game__hint span { color: var(--sage); }
            .drift-game__hint i {
                width: 3px;
                height: 3px;
                border-radius: 50%;
                background: currentColor;
            }

            .drift-game__loading,
            .drift-game__paused {
                position: absolute;
                z-index: 4;
                inset: 0;
                display: grid;
                align-content: center;
                justify-items: center;
                gap: 13px;
                padding: 24px;
                text-align: center;
                background: rgba(23,25,21,.82);
                backdrop-filter: blur(12px);
                transition: opacity .4s ease, visibility .4s ease;
            }

            .drift-game__loading p { margin: 0; font-size: 12px; }

            .drift-game__loading.is-hidden,
            .drift-game__paused:not(.is-visible) {
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
            }

            .drift-game__spinner {
                width: 28px;
                height: 28px;
                border: 1px solid rgba(238,234,221,.25);
                border-top-color: var(--sage);
                border-radius: 50%;
                animation: drift-spin 1s linear infinite;
            }

            .drift-game__paused { z-index: 5; }
            .drift-game__paused strong {
                font-size: clamp(42px, 7vw, 68px);
                font-weight: 400;
                letter-spacing: -.06em;
            }

            .drift-game__pause-kicker,
            .drift-game__paused small {
                font-size: 9px;
                opacity: .7;
            }

            .drift-game__resume {
                padding: 13px 20px;
                border: 1px solid var(--sage);
                border-radius: 999px;
                background: var(--sage);
                color: var(--ink) !important;
                font-size: 12px !important;
            }

            @keyframes drift-spin { to { transform: rotate(360deg); } }

            @media (max-width: 600px) {
                .drift-game {
                    height: 76svh;
                    min-height: 500px;
                    border-radius: 14px;
                }

                .drift-game__header { padding: 24px 20px; }
                .drift-game__header h2 { font-size: clamp(42px, 11vw, 59px); }
                .drift-game__eyebrow { font-size: 8px; }
                .drift-game__subline { max-width: 220px; font-size: 7px; line-height: 1.8; }
                .drift-game__coordinates { left: 12px; font-size: 7px; }
                .drift-game__hud { left: 20px; bottom: 108px; gap: 10px; }
                .drift-game__hud strong { font-size: 25px; }
                .drift-game__hud small { font-size: 7px; }
                .drift-game__hud-divider { height: 17px; }
                .drift-game__combo { right: 20px; bottom: 75px; }
                .drift-game__combo-number { font-size: 20px; }
                .drift-game__combo-label { font-size: 7px; }
                .drift-game__message { bottom: 60px; font-size: 10px; }
                .drift-game__controls { right: 20px; bottom: 12px; left: 20px; }
                .drift-game__controls button { width: 43px; height: 43px; }
                .drift-game__hint { max-width: 165px; font-size: 7px; gap: 5px; }
            }

            @media (max-width: 370px) {
                .drift-game__coordinates { display: none; }
                .drift-game__hud { gap: 7px; }
                .drift-game__hud > div { gap: 4px; }
                .drift-game__hud strong { font-size: 22px; }
                .drift-game__combo-label { display: none; }
            }

            @media (prefers-reduced-motion: reduce) {
                .drift-game__spinner { animation-duration: 3s; }
            }
        `;

        mount.appendChild(style);

        const root = mount.querySelector(".drift-game");
        const viewport = mount.querySelector(".drift-game__viewport");
        const loading = mount.querySelector(".drift-game__loading");
        const pauseButton = mount.querySelector(".drift-game__pause");
        const pausedOverlay = mount.querySelector(".drift-game__paused");
        const resumeButton = mount.querySelector(".drift-game__resume");
        const speedDisplay = mount.querySelector(".drift-game__speed");
        const distanceDisplay = mount.querySelector(".drift-game__distance");
        const fragmentsDisplay = mount.querySelector(".drift-game__fragments");
        const comboNumber = mount.querySelector(".drift-game__combo-number");
        const comboElement = mount.querySelector(".drift-game__combo");
        const driftFill = mount.querySelector("[data-drift-fill]");
        const driftLabel = mount.querySelector("[data-drift-label]");
        const driftCount = mount.querySelector("[data-drift-count]");
        const message = mount.querySelector(".drift-game__message");
        const steerButtons = [...mount.querySelectorAll("[data-steer]")];

        const messagePool = [
            "Find your own horizon.",
            "There's no rush to arrive.",
            "Take the long way round.",
            "Let the world move slowly.",
            "Nothing to prove out here.",
            "Somewhere is enough."
        ];

        const rand = (min, max) => min + Math.random() * (max - min);

        function rememberGeometry(geometry) {
            geometries.add(geometry);
            return geometry;
        }

        function rememberMaterial(material) {
            materials.add(material);
            return material;
        }

        function material(THREE, color, roughness = 0.84, metalness = 0) {
            return rememberMaterial(new THREE.MeshStandardMaterial({
                color,
                roughness,
                metalness,
                flatShading: true
            }));
        }

        function addBox(THREE, parent, size, position, mat, rotation = [0, 0, 0]) {
            const mesh = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(...size)),
                mat
            );
            mesh.position.set(...position);
            mesh.rotation.set(...rotation);
            parent.add(mesh);
            return mesh;
        }

        function addRock(THREE, parent, position, scale, mat) {
            const mesh = new THREE.Mesh(
                rememberGeometry(new THREE.IcosahedronGeometry(1, 1)),
                mat
            );
            mesh.position.set(...position);
            mesh.scale.set(...scale);
            mesh.rotation.set(rand(-.3, .3), rand(0, 6), rand(-.3, .3));
            parent.add(mesh);
            return mesh;
        }

        function roadCurve(z) {
            return Math.sin(z * .012) * 7.2 +
                Math.sin(z * .027 + 1.2) * 2.8 +
                Math.sin(z * .006 + .8) * 4.1;
        }

        function updateUI() {
            speedDisplay.textContent = String(Math.round(speed * 2.3)).padStart(2, "0");
            distanceDisplay.textContent = Math.floor(distance).toLocaleString();
            fragmentsDisplay.textContent = String(fragments);
            comboNumber.textContent = `×${Math.max(1, combo)}`;
            comboElement.classList.toggle("is-hot", combo >= 3);
            if (driftFill) driftFill.style.width = Math.min(100, driftCharge / 1.6 * 100) + "%";
            if (driftLabel) driftLabel.textContent = driftCharge >= 1.3 ? "HOLD THE LINE" : "DRIFT CHARGE";
            if (driftCount) driftCount.textContent = driftChains + " CHAINS";
        }

        function setPaused(value) {
            paused = value;
            pauseButton.textContent = paused ? "Resume" : "Pause";
            pausedOverlay.classList.toggle("is-visible", paused);
            pausedOverlay.setAttribute("aria-hidden", String(!paused));
            keys.clear();

            steerButtons.forEach((button) => {
                button.classList.remove("is-pressed");
            });

            if (!paused) lastTime = 0;
        }

        async function initialize() {
            const token = ++retryCount;
            loading.classList.remove("is-hidden");
            loading.innerHTML = `<span class="drift-game__spinner"></span><p>Finding the road...</p>`;

            try {
                const THREE = await import(THREE_URL);
                if (dead || token !== retryCount) return;

                scene = new THREE.Scene();
                scene.background = new THREE.Color("#20271f");
                scene.fog = new THREE.FogExp2("#20271f", .006);

                camera = new THREE.PerspectiveCamera(49, 1, .4, 500);
                camera.position.set(0, 5.5, 12.5);

                renderer = new THREE.WebGLRenderer({
                    antialias: !saveData && (devicePixelRatio || 1) <= 1.5,
                    alpha: false,
                    powerPreference: "low-power"
                });

                renderer.setPixelRatio(pixelRatioCap);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.18;
                renderer.setClearColor("#20271f", 1);
                viewport.replaceChildren(renderer.domElement);

                const hemisphere = new THREE.HemisphereLight("#e4ebd8", "#22291e", 2.1);
                scene.add(hemisphere);

                const sun = new THREE.DirectionalLight("#e9e1c8", 2.5);
                sun.position.set(-12, 22, 12);
                scene.add(sun);

                const rim = new THREE.DirectionalLight("#a2b58b", .9);
                rim.position.set(14, 8, -22);
                scene.add(rim);

                const glow = new THREE.PointLight("#c98770", 15, 80);
                glow.position.set(-12, 5, -45);
                scene.add(glow);

                const mats = {
                    road: material(THREE, "#353d31"),
                    edge: material(THREE, "#9ba98a"),
                    line: material(THREE, "#c6cfb6"),
                    moss: material(THREE, "#65775a"),
                    mossLight: material(THREE, "#879a78"),
                    mossDark: material(THREE, "#35442e"),
                    stone: material(THREE, "#777d6a"),
                    stoneLight: material(THREE, "#aab09a"),
                    clay: material(THREE, "#c98770"),
                    car: material(THREE, "#eeeadd", .48, .08),
                    glass: material(THREE, "#65776b", .3, .15),
                    rubber: material(THREE, "#22251f"),
                    moon: material(THREE, "#cdd4b8", .95)
                };

                /* Distant moon and its quiet halo. */
                const moon = new THREE.Mesh(
                    rememberGeometry(new THREE.SphereGeometry(8, 28, 20)),
                    mats.moon
                );
                moon.position.set(-23, 17, -145);
                scene.add(moon);

                const halo = new THREE.Mesh(
                    rememberGeometry(new THREE.SphereGeometry(9.2, 24, 18)),
                    rememberMaterial(new THREE.MeshBasicMaterial({
                        color: "#a2b58b",
                        transparent: true,
                        opacity: .09,
                        side: THREE.BackSide,
                        depthWrite: false
                    }))
                );
                halo.position.copy(moon.position);
                scene.add(halo);

                /* Layered floating islands. */
                const islands = [];
                const islandGroup = new THREE.Group();
                scene.add(islandGroup);

                for (let i = 0; i < 24; i++) {
                    const side = i % 2 ? 1 : -1;
                    const scale = 1.2 + (i % 5) * .48;
                    const island = new THREE.Group();

                    const top = addRock(
                        THREE, island, [0, 0, 0],
                        [scale * 1.8, scale * .4, scale * 1.35],
                        i % 4 ? mats.moss : mats.mossLight
                    );

                    top.rotation.y = i * .5;

                    const underside = new THREE.Mesh(
                        rememberGeometry(new THREE.ConeGeometry(scale * 1.2, scale * 2.5, 7)),
                        i % 3 ? mats.stone : mats.stoneLight
                    );
                    underside.position.y = -scale * 1.2;
                    underside.rotation.y = i * .63;
                    island.add(underside);

                    if (i % 3 === 0) {
                        addRock(
                            THREE, island,
                            [side * scale * .45, scale * .32, .1],
                            [scale * .46, scale * .23, scale * .5],
                            mats.mossDark
                        );
                    }

                    island.position.set(
                        side * (13 + (i % 4) * 5.5),
                        -2 + Math.sin(i * 1.7) * 4.2,
                        -17 - i * 13
                    );

                    island.userData = {
                        side,
                        lateral: 13 + (i % 4) * 5.5,
                        baseY: island.position.y,
                        phase: i * .9,
                        ahead: 17 + i * 13,
                        span: 24 * 13
                    };

                    islands.push(island);
                    islandGroup.add(island);
                }

                /* Distant monoliths create a surreal skyline. */
                const monoliths = [];

                for (let i = 0; i < 14; i++) {
                    const side = i % 2 ? 1 : -1;
                    const h = 4 + (i % 4) * 2.4;
                    const mesh = addBox(
                        THREE, scene,
                        [1.1 + (i % 3) * .7, h, 1.1 + (i % 2) * .5],
                        [side * (19 + (i % 3) * 4), h / 2 - 1.1, -40 - i * 19],
                        i % 4 === 0 ? mats.clay : mats.stoneLight,
                        [0, i * .3, side * .065]
                    );

                    mesh.userData = {
                        side,
                        lateral: 19 + (i % 3) * 4,
                        ahead: 40 + i * 19,
                        span: 14 * 19
                    };

                    monoliths.push(mesh);
                }

                /* Continuous dynamically curved road ribbon. */
                const roadWidth = 8.6;
                const roadSegments = 110;
                const roadStep = 3;
                const ribbons = [];

                function makeRibbon(mat, halfWidth, height, offsetX, dashed = false) {
                    const geometry = rememberGeometry(new THREE.BufferGeometry());
                    const positions = new Float32Array(roadSegments * 6);
                    const attr = new THREE.BufferAttribute(positions, 3);
                    attr.setUsage(THREE.DynamicDrawUsage);
                    geometry.setAttribute("position", attr);

                    const indices = [];
                    for (let i = 0; i < roadSegments - 1; i++) {
                        if (dashed && i % 2) continue;
                        const a = i * 2;
                        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
                    }
                    geometry.setIndex(indices);

                    const mesh = new THREE.Mesh(geometry, mat);
                    mesh.frustumCulled = false;
                    scene.add(mesh);

                    ribbons.push({ geometry, positions, attr, halfWidth, height, offsetX, dashed });
                }

                makeRibbon(mats.road, roadWidth / 2, 0, 0);
                makeRibbon(mats.edge, .075, .018, -roadWidth / 2);
                makeRibbon(mats.edge, .075, .018, roadWidth / 2);
                makeRibbon(mats.line, .035, .03, 0, true);

                function updateRoad() {
                    const frac = roadOffset % roadStep;
                    const base = roadOffset - frac;

                    for (let i = 0; i < roadSegments; i++) {
                        const s = base + (i - 4) * roadStep;
                        const z = -((i - 4) * roadStep - frac);
                        const cx = roadCurve(s) - roadCurve(roadOffset);
                        const slope = (roadCurve(s + .5) - roadCurve(s - .5));
                        const norm = Math.hypot(slope, 1);
                        const nx = 1 / norm;
                        const nz = slope / norm;

                        for (const r of ribbons) {
                            const centerX = cx + nx * r.offsetX;
                            const centerZ = z + nz * r.offsetX;
                            const idx = i * 6;
                            r.positions[idx] = centerX - nx * r.halfWidth;
                            r.positions[idx + 1] = r.height;
                            r.positions[idx + 2] = centerZ - nz * r.halfWidth;
                            r.positions[idx + 3] = centerX + nx * r.halfWidth;
                            r.positions[idx + 4] = r.height;
                            r.positions[idx + 5] = centerZ + nz * r.halfWidth;
                        }
                    }

                    for (const r of ribbons) {
                        r.attr.needsUpdate = true;
                        r.geometry.computeVertexNormals();
                    }
                }

                /* Player vehicle. */
                const car = new THREE.Group();
                scene.add(car);

                addBox(THREE, car, [1.68, .4, 3.12], [0, .55, 0], mats.car);
                addBox(THREE, car, [1.18, .48, 1.34], [0, .97, -.26], mats.glass, [-.12, 0, 0]);
                addBox(THREE, car, [1.72, .1, .44], [0, .46, 1.5], mats.car);

                const wheels = [];
                const wheelGeometry = rememberGeometry(new THREE.CylinderGeometry(.31, .31, .2, 12));
                wheelGeometry.rotateZ(Math.PI / 2);

                for (const x of [-.87, .87]) {
                    for (const z of [-.98, 1.03]) {
                        const wheel = new THREE.Mesh(wheelGeometry, mats.rubber);
                        wheel.position.set(x, .34, z);
                        car.add(wheel);
                        wheels.push(wheel);
                    }
                }

                car.position.set(0, 0, 3);

                /* Collectible glowing fragments, recycled as the road moves. */
                const collectibleGroup = new THREE.Group();
                scene.add(collectibleGroup);

                const collectibles = [];
                const crystalGeometry = rememberGeometry(new THREE.OctahedronGeometry(.38, 0));
                const crystalMaterial = rememberMaterial(new THREE.MeshStandardMaterial({
                    color: "#d3e4b6",
                    emissive: "#8eaa6e",
                    emissiveIntensity: 1.8,
                    roughness: .25,
                    metalness: .22
                }));

                const crystalGlow = rememberMaterial(new THREE.MeshBasicMaterial({
                    color: "#a2b58b",
                    transparent: true,
                    opacity: .15,
                    side: THREE.BackSide,
                    depthWrite: false
                }));

                for (let i = 0; i < 10; i++) {
                    const crystal = new THREE.Group();
                    const core = new THREE.Mesh(crystalGeometry, crystalMaterial);
                    const aura = new THREE.Mesh(
                        rememberGeometry(new THREE.SphereGeometry(.65, 12, 10)),
                        crystalGlow
                    );
                    crystal.add(aura, core);

                    crystal.userData = {
                        ahead: 22 + i * 28,
                        span: 10 * 28,
                        lane: i % 2 ? 1 : -1,
                        phase: i * 1.3,
                        collected: false
                    };

                    collectibles.push(crystal);
                    collectibleGroup.add(crystal);
                }

                /* Tiny floating debris, kept deliberately inexpensive. */
                const particleCount = saveData ? 24 : mobile ? 30 : 48;
                const particleGeometry = rememberGeometry(new THREE.IcosahedronGeometry(.11, 0));
                const particles = [];

                for (let i = 0; i < particleCount; i++) {
                    const particle = new THREE.Mesh(
                        particleGeometry,
                        i % 5 === 0 ? mats.clay : mats.stoneLight
                    );

                    particle.position.set(
                        rand(-28, 28),
                        rand(-1, 17),
                        -rand(0, 360)
                    );

                    particle.userData = {
                        baseY: particle.position.y,
                        speed: rand(.4, 1.3),
                        phase: rand(0, Math.PI * 2),
                        ahead: rand(0, 360),
                        span: 360
                    };

                    particles.push(particle);
                    scene.add(particle);
                }

                const clouds = [];
                const cloudGroup = new THREE.Group();
                scene.add(cloudGroup);

                for (let i = 0; i < 8; i++) {
                    const cloud = new THREE.Group();

                    for (let j = 0; j < 3; j++) {
                        const puff = new THREE.Mesh(
                            rememberGeometry(new THREE.IcosahedronGeometry(1, 1)),
                            mats.stoneLight
                        );
                        puff.position.set(j * 1.3, (j % 2) * .4, 0);
                        puff.scale.set(1.5 + j * .3, .55 + j * .12, .6);
                        cloud.add(puff);
                    }

                    cloud.position.set(
                        (i % 2 ? 1 : -1) * (18 + (i % 4) * 5),
                        8 + (i % 3) * 5,
                        -35 - i * 25
                    );

                    cloud.userData = {
                        baseY: cloud.position.y,
                        phase: i * 1.7,
                        ahead: 35 + i * 25,
                        span: 200
                    };

                    clouds.push(cloud);
                    cloudGroup.add(cloud);
                }

                function wrapAhead(ahead, span, multiplier = 1) {
                    const raw = (ahead - roadOffset * multiplier) % span;
                    return (raw < 0 ? raw + span : raw) - 22;
                }

                function trackX(ahead) {
                    return roadCurve(roadOffset + ahead) - roadCurve(roadOffset);
                }

                function updateWorld(dt) {
                    elapsed += dt;

                    const accelerating =
                        keys.has("w") || keys.has("arrowup");

                    const braking =
                        keys.has("s") || keys.has("arrowdown");

                    const desiredSpeed = braking ? 4 : accelerating ? 34 : 19;
                    speed += (desiredSpeed - speed) * Math.min(1, dt * .9);

                    targetSteer =
                        (keys.has("a") || keys.has("arrowleft") ? -1 : 0) +
                        (keys.has("d") || keys.has("arrowright") ? 1 : 0);

                    steer += (targetSteer - steer) * Math.min(1, dt * 4.8);

                    distance += speed * dt * .85;
                    roadOffset += speed * dt;

                    const isDrifting = speed > 22 && Math.abs(steer) > .58;
                    if (isDrifting) {
                        driftCharge += dt * (0.55 + Math.abs(steer) * .7) * (speed / 30);
                        if (driftCharge >= 1.6) {
                            driftCharge -= 1.6;
                            driftChains++;
                            fragments++;
                            combo = elapsed - previousCollect < 5 ? combo + 1 : 1;
                            previousCollect = elapsed;
                            comboTimer = 5;
                            message.textContent = "CLEAN DRIFT · FRAGMENT BANKED";
                            message.style.color = "#c98770";
                            services.showToast?.("Clean drift chain · +" + combo + " flow");
                        }
                    } else {
                        driftCharge = Math.max(0, driftCharge - dt * .42);
                    }

                    car.position.x = steer * 2.1;
                    car.position.y = .035 + Math.sin(elapsed * 1.8) * .035;
                    car.rotation.z = -steer * .045;
                    car.rotation.y = -steer * .07;

                    for (const wheel of wheels) {
                        wheel.rotation.x += dt * speed * 1.4;
                    }

                    updateRoad();

                    for (const island of islands) {
                        const d = island.userData;
                        const ahead = wrapAhead(d.ahead, d.span);

                        island.position.z = -ahead;
                        island.position.x = trackX(ahead) + d.side * d.lateral;
                        island.position.y = d.baseY + Math.sin(elapsed * .45 + d.phase) * .3;
                    }

                    for (const monolith of monoliths) {
                        const d = monolith.userData;
                        const ahead = wrapAhead(d.ahead, d.span);

                        monolith.position.z = -ahead;
                        monolith.position.x = trackX(ahead) + d.side * d.lateral;
                    }

                    for (const cloud of clouds) {
                        const d = cloud.userData;
                        const ahead = wrapAhead(d.ahead, d.span, .35);

                        cloud.position.z = -ahead;
                        cloud.position.y = d.baseY + Math.sin(elapsed * .2 + d.phase) * .2;
                    }

                    for (const particle of particles) {
                        const d = particle.userData;
                        particle.position.z = -wrapAhead(d.ahead, d.span);
                        particle.position.y =
                            d.baseY + Math.sin(elapsed * d.speed + d.phase) * .28;
                    }

                    for (const crystal of collectibles) {
                        const d = crystal.userData;
                        const ahead = wrapAhead(d.ahead, d.span);

                        crystal.position.z = -ahead;
                        crystal.position.x =
                            trackX(ahead) + d.lane * (2.2 + Math.sin(d.phase) * .2);
                        crystal.position.y = 1.15 + Math.sin(elapsed * 1.8 + d.phase) * .3;

                        crystal.rotation.y += dt * 1.3;
                        crystal.rotation.z = Math.sin(elapsed + d.phase) * .12;

                        const carX = car.position.x;
                        const closeEnough =
                            Math.abs(ahead - 3) < 2.1 &&
                            Math.abs(crystal.position.x - carX) < 1.3;

                        if (closeEnough && elapsed - previousCollect > .35) {
                            fragments++;
                            combo = elapsed - previousCollect < 5 ? combo + 1 : 1;
                            previousCollect = elapsed;
                            comboTimer = 5;
                            d.ahead += d.span;

                            message.textContent = [
                                "A little light for the road.",
                                "One more thing found.",
                                "Keep the good things close.",
                                "The world leaves little gifts."
                            ][fragments % 4];

                            message.style.color = "#d3e4b6";
                            window.setTimeout(() => {
                                if (!dead) message.style.color = "";
                            }, 600);

                            services.showToast?.(
                                combo >= 3 ? `Fragment found · ×${combo} flow combo` : "Fragment found"
                            );
                        }
                    }

                    comboTimer -= dt;
                    if (comboTimer <= 0) combo = 0;

                    camera.position.x +=
                        (car.position.x * .68 - camera.position.x) * dt * 1.5;

                    camera.position.y = 5.25 + Math.sin(elapsed * .4) * .12;

                    const curveAhead =
                        roadCurve(roadOffset + 18) - roadCurve(roadOffset);

                    camera.lookAt(
                        car.position.x * .48 + curveAhead * .55,
                        1.1,
                        -18
                    );

                    const targetFov = 49 + Math.max(0, speed - 19) * .35;
                    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 2.5);
                    camera.updateProjectionMatrix();

                    scene.fog.density = .006 + Math.sin(elapsed * .12) * .00025;

                    updateUI();
                }

                function resize() {
                    if (dead || !renderer || !camera) return;

                    const width = Math.max(1, viewport.clientWidth);
                    const height = Math.max(1, viewport.clientHeight);

                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();

                    renderer.setPixelRatio(pixelRatioCap);
                    renderer.setSize(width, height, false);
                }

                function tick(now) {
                    if (dead) return;

                    frame = requestAnimationFrame(tick);

                    if (paused || document.hidden) {
                        lastTime = now;
                        return;
                    }

                    const dt = lastTime
                        ? Math.min((now - lastTime) / 1000, .04)
                        : .016;

                    lastTime = now;

                    if (!reducedMotion.matches) {
                        updateWorld(dt);
                    } else {
                        updateWorld(dt * .65);
                    }

                    renderer.render(scene, camera);
                }

                function onKeyDown(event) {
                    if (event.altKey || event.ctrlKey || event.metaKey) return;

                    const key = event.key.toLowerCase();

                    if (key === "escape") return;

                    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) {
                        event.preventDefault();
                    }

                    if (key === " " && !event.repeat) {
                        setPaused(!paused);
                        return;
                    }

                    if (["a", "d", "w", "s", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
                        keys.add(key);
                    }
                }

                function onKeyUp(event) {
                    keys.delete(event.key.toLowerCase());
                }

                function onBlur() {
                    keys.clear();
                }

                function onVisibility() {
                    if (document.hidden) setPaused(true);
                }

                function onSteerStart(event) {
                    if (paused) return;

                    const button = event.currentTarget;
                    const key = button.dataset.steer === "left" ? "arrowleft" : "arrowright";

                    keys.add(key);
                    button.classList.add("is-pressed");

                    try {
                        button.setPointerCapture(event.pointerId);
                    } catch (_) { }
                }

                function onSteerEnd(event) {
                    const button = event.currentTarget;
                    keys.delete(button.dataset.steer === "left" ? "arrowleft" : "arrowright");
                    button.classList.remove("is-pressed");
                }

                function onPause() {
                    setPaused(!paused);
                }

                function onResume() {
                    setPaused(false);
                }

                function setPaused(value) {
                    paused = value;
                    pauseButton.textContent = paused ? "Resume" : "Pause";
                    pausedOverlay.classList.toggle("is-visible", paused);
                    pausedOverlay.setAttribute("aria-hidden", String(!paused));
                    keys.clear();
                    steerButtons.forEach((button) => button.classList.remove("is-pressed"));
                    lastTime = 0;
                }

                window.addEventListener("keydown", onKeyDown, { passive: false });
                window.addEventListener("keyup", onKeyUp);
                window.addEventListener("blur", onBlur);
                document.addEventListener("visibilitychange", onVisibility);
                pauseButton.addEventListener("click", onPause);
                resumeButton.addEventListener("click", onResume);

                steerButtons.forEach((button) => {
                    button.addEventListener("pointerdown", onSteerStart);
                    button.addEventListener("pointerup", onSteerEnd);
                    button.addEventListener("pointercancel", onSteerEnd);
                    button.addEventListener("lostpointercapture", onSteerEnd);
                });

                cleanup = () => {
                    window.removeEventListener("keydown", onKeyDown);
                    window.removeEventListener("keyup", onKeyUp);
                    window.removeEventListener("blur", onBlur);
                    document.removeEventListener("visibilitychange", onVisibility);
                    pauseButton.removeEventListener("click", onPause);
                    resumeButton.removeEventListener("click", onResume);

                    steerButtons.forEach((button) => {
                        button.removeEventListener("pointerdown", onSteerStart);
                        button.removeEventListener("pointerup", onSteerEnd);
                        button.removeEventListener("pointercancel", onSteerEnd);
                        button.removeEventListener("lostpointercapture", onSteerEnd);
                    });
                };

                observer = new ResizeObserver(resize);
                observer.observe(viewport);
                resize();
                updateRoad();
                updateUI();

                loading.classList.add("is-hidden");
                frame = requestAnimationFrame(tick);
            } catch (error) {
                if (dead) return;

                console.error("AFTERHOURS DRIFT initialization error:", error);

                loading.innerHTML = `
                    <div>
                        <h3 style="margin:0 0 10px;font-weight:400">The horizon is hiding.</h3>
                        <p style="max-width:300px;line-height:1.7">
                            The 3D scene couldn't load. Check your connection and try again.
                        </p>
                        <button type="button" class="drift-game__resume">Try again</button>
                    </div>
                `;

                loading.classList.remove("is-hidden");

                loading.querySelector("button")?.addEventListener("click", () => {
                    cleanup();
                    cleanup = () => { };

                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }

                    if (renderer) {
                        renderer.dispose();
                        renderer.domElement.remove();
                        renderer = null;
                    }

                    geometries.forEach((g) => g.dispose());
                    materials.forEach((m) => m.dispose());
                    geometries.clear();
                    materials.clear();

                    scene = null;
                    camera = null;
                    initialize();
                });
            }
        }

        function destroy() {
            if (dead) return;
            dead = true;

            cancelAnimationFrame(frame);
            if (observer) observer.disconnect();

            cleanup();
            keys.clear();

            if (renderer) {
                renderer.dispose();
                renderer.domElement.remove();
            }

            geometries.forEach((g) => g.dispose());
            materials.forEach((m) => m.dispose());

            geometries.clear();
            materials.clear();

            style.remove();
            mount.replaceChildren();
        }

        window.AfterhoursGames.setStopper?.(destroy);
        initialize();

        return destroy;
    };
})();