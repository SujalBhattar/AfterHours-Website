(() => {
    "use strict";

    const GAME_ID = "drift";
    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    window.AfterhoursGames = window.AfterhoursGames || {};

    window.AfterhoursGames[GAME_ID] = (mount, services = {}) => {
        let destroyed = false;
        let paused = false;
        let animationFrame = 0;
        let renderer = null;
        let scene = null;
        let camera = null;
        let resizeObserver = null;
        let cleanup = () => { };
        let clock = null;
        let previousTime = 0;
        let elapsed = 0;
        let distance = 0;
        let speed = 0;
        let steer = 0;
        let targetSteer = 0;
        let cameraX = 0;
        let worldOffset = 0;
        let messageTimer = 0;
        let messageIndex = 0;
        let initializationToken = 0;
        let retryCount = 0;
        let uiTimer = 0;
        let slowFrames = 0;

        const keys = new Set();
        const geometries = new Set();
        const materials = new Set();
        const disposableTextures = new Set();

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const stopPrevious = window.AfterhoursGames.stopCurrent;
        if (typeof stopPrevious === "function") {
            stopPrevious();
        }

        mount.innerHTML = `
            <section class="drift-game" aria-label="DRIFT floating road game">
                <div class="drift-game__viewport"></div>
                <div class="drift-game__vignette"></div>
                <div class="drift-game__grain"></div>

                <header class="drift-game__top">
                    <div>
                        <span class="drift-game__eyebrow">
                            AFTERHOURS <span> / </span> OPEN WORLD 001
                        </span>
                        <h2>Somewhere,<br><em>else.</em></h2>
                    </div>

                    <button class="drift-game__pause" type="button">
                        Pause
                    </button>
                </header>

                <div class="drift-game__coordinates" aria-hidden="true">
                    <span>NO DESTINATION</span>
                    <span class="drift-game__coordinate-line"></span>
                    <span>JUST KEEP GOING</span>
                </div>

                <div class="drift-game__hud">
                    <div class="drift-game__speed-wrap">
                        <span class="drift-game__speed">00</span>
                        <span class="drift-game__unit">KM/H</span>
                    </div>

                    <span class="drift-game__hud-divider"></span>

                    <div class="drift-game__distance-wrap">
                        <span class="drift-game__distance">0</span>
                        <span class="drift-game__unit">METRES</span>
                    </div>
                </div>

                <div class="drift-game__message">
                    <span class="drift-game__message-dot"></span>
                    <span class="drift-game__message-text">
                        Find your own horizon.
                    </span>
                </div>

                <div class="drift-game__controls">
                    <button type="button" data-steer="left"
                        aria-label="Steer left">←</button>

                    <span class="drift-game__control-hint">
                        <span>W</span> ACCELERATE
                        <i></i>
                        <span>A / D</span> STEER
                    </span>

                    <button type="button" data-steer="right"
                        aria-label="Steer right">→</button>
                </div>

                <div class="drift-game__loading">
                    <span class="drift-game__loading-mark"></span>
                    <p>Finding the road...</p>
                </div>
            </section>
        `;

        const style = document.createElement("style");
        style.dataset.driftStyles = "true";
        style.textContent = `
            .drift-game {
                --drift-ink: #20271f;
                --drift-paper: #f4f2e9;
                --drift-moss: #a9b99a;
                --drift-sage: #c6cfb6;
                --drift-clay: #c68d76;

                position: relative;
                isolation: isolate;
                width: 100%;
                height: min(78svh, 760px);
                min-height: 480px;
                overflow: hidden;
                border-radius: 18px;
                background: #b9bba7;
                color: var(--drift-paper);
                font-family: "DM Sans", sans-serif;
                contain: paint;
            }

            .drift-game *,
            .drift-game *::before,
            .drift-game *::after {
                box-sizing: border-box;
            }

            .drift-game__viewport {
                position: absolute;
                inset: 0;
                z-index: -4;
                overflow: hidden;
            }

            .drift-game__viewport canvas {
                display: block;
                width: 100%;
                height: 100%;
                outline: none;
            }

            .drift-game__vignette {
                position: absolute;
                inset: 0;
                z-index: -3;
                pointer-events: none;
                background:
                    linear-gradient(
                        180deg,
                        rgba(24, 30, 23, .42),
                        transparent 24%
                    ),
                    linear-gradient(
                        0deg,
                        rgba(24, 30, 23, .58),
                        transparent 38%
                    ),
                    linear-gradient(
                        90deg,
                        rgba(24, 30, 23, .13),
                        transparent 28%,
                        transparent 72%,
                        rgba(24, 30, 23, .1)
                    );
            }

            .drift-game__grain {
                position: absolute;
                inset: 0;
                z-index: -2;
                pointer-events: none;
                opacity: .09;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E");
            }

            .drift-game__top {
                position: absolute;
                inset: 0 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 18px;
                padding: clamp(22px, 4.2vw, 44px);
            }

            .drift-game__eyebrow {
                display: block;
                margin-bottom: 17px;
                font: 10px/1.5 "DM Mono", monospace;
                letter-spacing: .13em;
                opacity: .8;
            }

            .drift-game__eyebrow span {
                padding: 0 5px;
                color: var(--drift-sage);
            }

            .drift-game__top h2 {
                margin: 0;
                font-size: clamp(38px, 6.4vw, 72px);
                font-weight: 450;
                letter-spacing: -.075em;
                line-height: .89;
            }

            .drift-game__top h2 em {
                color: var(--drift-sage);
                font-family: "Fraunces", Georgia, serif;
                font-weight: 400;
            }

            .drift-game button {
                color: inherit;
                font: inherit;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            .drift-game button:focus-visible {
                outline: 2px solid var(--drift-sage);
                outline-offset: 4px;
            }

            .drift-game__pause {
                padding: 11px 17px;
                border: 1px solid rgba(244, 242, 233, .48);
                border-radius: 999px;
                background: rgba(32, 39, 31, .23);
                backdrop-filter: blur(14px);
                font-size: 12px !important;
                transition:
                    background .2s ease,
                    color .2s ease,
                    border-color .2s ease;
            }

            .drift-game__pause:hover {
                color: var(--drift-ink);
                background: var(--drift-paper);
                border-color: var(--drift-paper);
            }

            .drift-game__coordinates {
                position: absolute;
                top: 48%;
                left: clamp(22px, 4.2vw, 44px);
                display: flex;
                align-items: center;
                gap: 10px;
                font: 8px "DM Mono", monospace;
                letter-spacing: .12em;
                opacity: .65;
                writing-mode: vertical-rl;
                transform: rotate(180deg);
            }

            .drift-game__coordinate-line {
                width: 1px;
                height: 44px;
                background: currentColor;
                opacity: .65;
            }

            .drift-game__hud {
                position: absolute;
                bottom: 98px;
                left: clamp(22px, 4.2vw, 44px);
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .drift-game__speed-wrap,
            .drift-game__distance-wrap {
                display: flex;
                align-items: baseline;
                gap: 8px;
            }

            .drift-game__speed {
                font: 400 clamp(30px, 4vw, 46px)/1 "DM Mono", monospace;
                letter-spacing: -.09em;
                font-variant-numeric: tabular-nums;
            }

            .drift-game__distance {
                font: 15px "DM Mono", monospace;
                font-variant-numeric: tabular-nums;
            }

            .drift-game__unit {
                font: 9px "DM Mono", monospace;
                letter-spacing: .06em;
                opacity: .74;
            }

            .drift-game__hud-divider {
                width: 1px;
                height: 24px;
                background: rgba(244, 242, 233, .45);
            }

            .drift-game__message {
                position: absolute;
                bottom: 104px;
                left: 50%;
                display: flex;
                align-items: center;
                gap: 9px;
                max-width: 38%;
                transform: translateX(-50%);
                font-size: 12px;
                text-align: center;
                white-space: nowrap;
                color: rgba(244, 242, 233, .93);
            }

            .drift-game__message-dot {
                width: 6px;
                height: 6px;
                flex: 0 0 auto;
                border-radius: 50%;
                background: var(--drift-sage);
                box-shadow: 0 0 12px rgba(198, 207, 182, .55);
            }

            .drift-game__controls {
                position: absolute;
                right: clamp(22px, 4.2vw, 44px);
                bottom: 25px;
                left: clamp(22px, 4.2vw, 44px);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
            }

            .drift-game__controls button {
                display: grid;
                width: 48px;
                height: 48px;
                flex: 0 0 auto;
                place-items: center;
                border: 1px solid rgba(244, 242, 233, .48);
                border-radius: 50%;
                background: rgba(32, 39, 31, .24);
                backdrop-filter: blur(14px);
                font-size: 23px;
                user-select: none;
                touch-action: none;
                transition:
                    color .16s ease,
                    background .16s ease,
                    transform .16s ease;
            }

            .drift-game__controls button:hover,
            .drift-game__controls button.is-pressed {
                color: var(--drift-ink);
                background: var(--drift-paper);
            }

            .drift-game__controls button.is-pressed {
                transform: scale(.94);
            }

            .drift-game__control-hint {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                gap: 7px;
                font: 9px/1.5 "DM Mono", monospace;
                letter-spacing: .08em;
                text-align: center;
                opacity: .8;
            }

            .drift-game__control-hint span {
                color: var(--drift-sage);
            }

            .drift-game__control-hint i {
                width: 3px;
                height: 3px;
                margin: 0 4px;
                border-radius: 50%;
                background: currentColor;
                opacity: .65;
            }

            .drift-game__loading {
                position: absolute;
                inset: 0;
                z-index: 5;
                display: grid;
                align-content: center;
                justify-items: center;
                gap: 14px;
                padding: 24px;
                background: #c4c5b1;
                color: var(--drift-ink);
                transition: opacity .55s ease, visibility .55s ease;
            }

            .drift-game__loading.is-hidden {
                visibility: hidden;
                opacity: 0;
                pointer-events: none;
            }

            .drift-game__loading p {
                margin: 0;
                font-size: 12px;
                letter-spacing: .04em;
            }

            .drift-game__loading-mark {
                width: 29px;
                height: 29px;
                border: 1px solid rgba(32, 39, 31, .22);
                border-top-color: var(--drift-ink);
                border-radius: 50%;
                animation: drift-spin .9s linear infinite;
            }

            .drift-game__error {
                max-width: 390px;
                text-align: center;
            }

            .drift-game__error h3 {
                margin: 0 0 12px;
                font-size: 27px;
                letter-spacing: -.05em;
            }

            .drift-game__error p {
                margin: 0 0 22px;
                font-size: 13px;
                line-height: 1.7;
            }

            .drift-game__error button {
                padding: 12px 18px;
                border: 1px solid var(--drift-ink);
                border-radius: 999px;
                background: var(--drift-ink);
                color: var(--drift-paper);
                font-size: 12px;
            }

            .drift-game__paused {
                position: absolute;
                inset: 0;
                z-index: 3;
                display: grid;
                align-content: center;
                justify-items: center;
                gap: 12px;
                background: rgba(32, 39, 31, .35);
                backdrop-filter: blur(5px);
                pointer-events: none;
                opacity: 0;
                transition: opacity .25s ease;
            }

            .drift-game__paused.is-visible {
                opacity: 1;
            }

            .drift-game__paused strong {
                font-size: clamp(34px, 5vw, 52px);
                font-weight: 450;
                letter-spacing: -.065em;
            }

            .drift-game__paused span {
                font: 9px "DM Mono", monospace;
                letter-spacing: .15em;
            }

            @keyframes drift-spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 600px) {
                .drift-game {
                    height: 76svh;
                    min-height: 490px;
                    border-radius: 14px;
                }

                .drift-game__top {
                    padding: 24px 20px;
                }

                .drift-game__top h2 {
                    font-size: clamp(39px, 11vw, 57px);
                }

                .drift-game__eyebrow {
                    margin-bottom: 13px;
                    font-size: 8px;
                }

                .drift-game__pause {
                    padding: 10px 13px;
                }

                .drift-game__coordinates {
                    left: 15px;
                    top: 48%;
                    font-size: 7px;
                }

                .drift-game__hud {
                    bottom: 91px;
                    left: 20px;
                    gap: 12px;
                }

                .drift-game__speed {
                    font-size: 31px;
                }

                .drift-game__distance {
                    font-size: 12px;
                }

                .drift-game__unit {
                    font-size: 8px;
                }

                .drift-game__message {
                    bottom: 64px;
                    max-width: 70%;
                    font-size: 10px;
                }

                .drift-game__controls {
                    right: 20px;
                    bottom: 12px;
                    left: 20px;
                }

                .drift-game__controls button {
                    width: 44px;
                    height: 44px;
                }

                .drift-game__control-hint {
                    max-width: 175px;
                    gap: 5px;
                    font-size: 8px;
                }
            }

            @media (max-width: 370px) {
                .drift-game__hud {
                    gap: 8px;
                }

                .drift-game__speed-wrap,
                .drift-game__distance-wrap {
                    gap: 5px;
                }

                .drift-game__coordinates {
                    display: none;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .drift-game__loading-mark {
                    animation-duration: 2.5s;
                }

                .drift-game__controls button,
                .drift-game__pause {
                    transition: none;
                }
            }
        `;

        mount.appendChild(style);

        const root = mount.querySelector(".drift-game");
        const viewport = mount.querySelector(".drift-game__viewport");
        const loading = mount.querySelector(".drift-game__loading");
        const pauseButton = mount.querySelector(".drift-game__pause");
        const speedDisplay = mount.querySelector(".drift-game__speed");
        const distanceDisplay = mount.querySelector(".drift-game__distance");
        const messageText = mount.querySelector(".drift-game__message-text");
        const steerButtons = [
            ...mount.querySelectorAll("[data-steer]")
        ];

        const pausedOverlay = document.createElement("div");
        pausedOverlay.className = "drift-game__paused";
        pausedOverlay.innerHTML = `
            <strong>Take your time.</strong>
            <span>THE WORLD CAN WAIT</span>
        `;
        root.appendChild(pausedOverlay);

        const messagePool = [
            "Find your own horizon.",
            "There is nowhere else to be.",
            "Take the long way around.",
            "The sky goes on forever.",
            "Let the road decide.",
            "Nothing to prove out here.",
            "Keep a little room for wonder."
        ];

        function rememberGeometry(geometry) {
            geometries.add(geometry);
            return geometry;
        }

        function rememberMaterial(material) {
            materials.add(material);
            return material;
        }

        function makeMaterial(THREE, color, roughness = 0.92) {
            return rememberMaterial(
                new THREE.MeshStandardMaterial({
                    color,
                    roughness,
                    metalness: 0
                })
            );
        }

        function addBox(
            THREE,
            parent,
            dimensions,
            position,
            material,
            rotation = [0, 0, 0]
        ) {
            const mesh = new THREE.Mesh(
                rememberGeometry(new THREE.BoxGeometry(...dimensions)),
                material
            );

            mesh.position.set(...position);
            mesh.rotation.set(...rotation);
            parent.add(mesh);
            return mesh;
        }

        function addRock(THREE, parent, position, scale, material, detail = 0) {
            const mesh = new THREE.Mesh(
                rememberGeometry(
                    new THREE.DodecahedronGeometry(1, detail)
                ),
                material
            );

            mesh.position.set(...position);
            mesh.scale.set(...scale);
            mesh.rotation.set(
                scale[0] * 0.11,
                scale[1] * 0.17,
                scale[2] * 0.08
            );

            parent.add(mesh);
            return mesh;
        }

        function updateUI() {
            speedDisplay.textContent = String(
                Math.round(speed * 4)
            ).padStart(2, "0");

            distanceDisplay.textContent =
                Math.floor(distance).toLocaleString();
        }

        function setPaused(value) {
            paused = value;
            pauseButton.textContent = paused ? "Resume" : "Pause";
            pausedOverlay.classList.toggle("is-visible", paused);
            pausedOverlay.setAttribute("aria-hidden", String(!paused));

            if (clock) {
                clock.getDelta();
            }

            keys.clear();
            steerButtons.forEach((button) => {
                button.classList.remove("is-pressed");
            });
        }

        function roadCurve(z) {
            return (
                Math.sin(z * 0.012) * 7.2 +
                Math.sin(z * 0.027 + 1.2) * 2.8 +
                Math.sin(z * 0.006 + 0.8) * 4.1
            );
        }

        async function initialize() {
            const token = ++initializationToken;

            if (destroyed) return;

            loading.classList.remove("is-hidden");
            loading.innerHTML = `
                <span class="drift-game__loading-mark"></span>
                <p>Finding the road...</p>
            `;

            try {
                const THREE = await import(
                    retryCount ? `${THREE_URL}?retry=${retryCount}` : THREE_URL
                );

                if (destroyed || token !== initializationToken) return;

                scene = new THREE.Scene();
                scene.background = new THREE.Color("#b9bba7");
                scene.fog = new THREE.FogExp2("#b9bba7", 0.0068);

                camera = new THREE.PerspectiveCamera(49, 1, 0.5, 520);
                camera.position.set(0, 5.5, 12.5);

                renderer = new THREE.WebGLRenderer({
                    antialias: (window.devicePixelRatio || 1) <= 1.5,
                    alpha: false,
                    powerPreference: "default"
                });

                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, 1.5)
                );

                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.12;
                renderer.setClearColor("#b9bba7", 1);
                renderer.domElement.setAttribute(
                    "aria-label",
                    "Three-dimensional view of a winding road among floating islands"
                );
                renderer.domElement.setAttribute("role", "img");

                viewport.appendChild(renderer.domElement);

                const ambient = new THREE.HemisphereLight(
                    "#f6edd9",
                    "#5e6c55",
                    2.05
                );
                scene.add(ambient);

                const sun = new THREE.DirectionalLight("#ffe6bd", 2.4);
                sun.position.set(-12, 22, 12);
                scene.add(sun);

                const rimLight = new THREE.DirectionalLight(
                    "#d2d8c0",
                    0.8
                );
                rimLight.position.set(12, 8, -20);
                scene.add(rimLight);

                const mat = {
                    road: makeMaterial(THREE, "#51574b"),
                    roadEdge: makeMaterial(THREE, "#d8d3c0"),
                    roadLine: makeMaterial(THREE, "#b9bda7"),
                    moss: makeMaterial(THREE, "#879a78"),
                    mossLight: makeMaterial(THREE, "#b4bea0"),
                    mossDark: makeMaterial(THREE, "#64765d"),
                    stone: makeMaterial(THREE, "#8c8d7b"),
                    stoneLight: makeMaterial(THREE, "#c1bba6"),
                    clay: makeMaterial(THREE, "#c58e77"),
                    clayDark: makeMaterial(THREE, "#a97060"),
                    car: makeMaterial(THREE, "#eee9dc", 0.56),
                    glass: makeMaterial(THREE, "#6c7a73", 0.36),
                    rubber: makeMaterial(THREE, "#30342e"),
                    moon: makeMaterial(THREE, "#eee3cb"),
                    cloud: makeMaterial(THREE, "#d6d4c1")
                };

                // A huge moon gives the scene a strange, quiet sense of scale.
                const moon = new THREE.Mesh(
                    rememberGeometry(
                        new THREE.SphereGeometry(9, 36, 28)
                    ),
                    mat.moon
                );

                moon.position.set(-25, 18, -145);
                scene.add(moon);

                const moonHalo = new THREE.Mesh(
                    rememberGeometry(
                        new THREE.SphereGeometry(10.3, 28, 20)
                    ),
                    rememberMaterial(
                        new THREE.MeshBasicMaterial({
                            color: "#e8dfc9",
                            transparent: true,
                            opacity: 0.12,
                            side: THREE.BackSide,
                            depthWrite: false
                        })
                    )
                );

                moonHalo.position.copy(moon.position);
                scene.add(moonHalo);

                // Low-poly cloud forms add depth without expensive effects.
                const cloudGroup = new THREE.Group();
                scene.add(cloudGroup);

                for (let i = 0; i < 8; i++) {
                    const cloud = new THREE.Group();
                    const cloudMaterial = mat.cloud;

                    for (let j = 0; j < 3; j++) {
                        const puff = new THREE.Mesh(
                            rememberGeometry(
                                new THREE.IcosahedronGeometry(1, 1)
                            ),
                            cloudMaterial
                        );

                        puff.position.set(j * 1.2, j % 2 * 0.4, 0);
                        puff.scale.set(
                            1.5 + j * 0.3,
                            0.55 + j * 0.12,
                            0.6
                        );
                        cloud.add(puff);
                    }

                    cloud.position.set(
                        (i % 2 ? 1 : -1) * (18 + (i % 4) * 5),
                        8 + (i % 3) * 5,
                        -35 - i * 25
                    );

                    cloud.userData.baseY = cloud.position.y;
                    cloud.userData.phase = i * 1.7;
                    cloud.userData.ahead = 35 + i * 25;
                    cloud.userData.span = 200;
                    cloudGroup.add(cloud);
                }

                // Floating islands: grassy caps with angular stone undersides.
                const islandGroup = new THREE.Group();
                scene.add(islandGroup);

                for (let i = 0; i < 20; i++) {
                    const side = i % 2 === 0 ? -1 : 1;
                    const scale = 1.4 + (i % 5) * 0.48;
                    const island = new THREE.Group();

                    const top = addRock(
                        THREE,
                        island,
                        [0, 0, 0],
                        [scale * 1.8, scale * 0.44, scale * 1.35],
                        i % 4 === 0 ? mat.mossLight : mat.moss,
                        1
                    );

                    top.rotation.y = i * 0.5;

                    const underside = new THREE.Mesh(
                        rememberGeometry(
                            new THREE.ConeGeometry(
                                scale * 1.25,
                                scale * 2.5,
                                7,
                                1
                            )
                        ),
                        i % 3 === 0 ? mat.stoneLight : mat.stone
                    );

                    underside.position.y = -scale * 1.2;
                    underside.rotation.y = i * 0.63;
                    island.add(underside);

                    if (i % 3 === 0) {
                        const smallRock = addRock(
                            THREE,
                            island,
                            [side * scale * 0.48, scale * 0.3, 0],
                            [scale * 0.5, scale * 0.24, scale * 0.48],
                            mat.mossDark,
                            0
                        );
                        smallRock.rotation.y = i;
                    }

                    island.position.set(
                        side * (13 + (i % 4) * 5.5),
                        -2 + Math.sin(i * 1.7) * 4.2,
                        -17 - i * 13.5
                    );

                    island.rotation.z =
                        side * (0.035 + (i % 3) * 0.025);

                    island.userData.baseY = island.position.y;
                    island.userData.phase = i * 0.9;
                    island.userData.ahead = 17 + i * 13.5;
                    island.userData.span = 20 * 13.5;
                    island.userData.side = side;
                    island.userData.lateral = 13 + (i % 4) * 5.5;
                    islandGroup.add(island);
                }

                // Distant monoliths break up the horizon.
                const monoliths = [];

                for (let i = 0; i < 14; i++) {
                    const side = i % 2 === 0 ? -1 : 1;
                    const height = 4 + (i % 4) * 2.4;

                    const monolith = addBox(
                        THREE,
                        scene,
                        [
                            1.1 + (i % 3) * 0.75,
                            height,
                            1.1 + (i % 2) * 0.5
                        ],
                        [0, height / 2 - 1.1, 0],
                        i % 4 === 0 ? mat.clay : mat.stoneLight,
                        [0, i * 0.3, side * 0.065]
                    );

                    monolith.userData.ahead = 40 + i * 19;
                    monolith.userData.span = 14 * 19;
                    monolith.userData.side = side;
                    monolith.userData.lateral = 19 + (i % 3) * 4;
                    monoliths.push(monolith);
                }

                // Road: ONE continuous ribbon instead of 44 separate slabs.
                // No seams, no per-segment rotation errors, and 4 draw calls
                // instead of ~150. Cross-sections are re-laid every frame from
                // the track coordinate, so the road scrolls toward the camera
                // and the dash pattern never pops.
                const roadWidth = 8.6;
                const ribbonStep = 3;
                const ribbonBehind = 4;
                const ribbonCount = 130;

                const polyMaterial = (color) =>
                    rememberMaterial(
                        new THREE.MeshStandardMaterial({
                            color,
                            roughness: 0.92,
                            metalness: 0,
                            polygonOffset: true,
                            polygonOffsetFactor: -2,
                            polygonOffsetUnits: -2
                        })
                    );

                const quadIndices = (parity) => {
                    const list = [];

                    for (let k = 0; k < ribbonCount - 1; k++) {
                        if (parity !== null && k % 2 !== parity) continue;

                        const l = k * 2;
                        const r = l + 1;
                        const nl = l + 2;
                        const nr = l + 3;

                        list.push(l, r, nl, r, nr, nl);
                    }

                    return new THREE.BufferAttribute(new Uint16Array(list), 1);
                };

                const ribbons = [];

                function makeRibbon(material, halfWidth, y, offsetX, dashed) {
                    const geometry = rememberGeometry(new THREE.BufferGeometry());
                    const positions = new Float32Array(ribbonCount * 6);
                    const normals = new Float32Array(ribbonCount * 6);

                    for (let i = 0; i < ribbonCount * 2; i++) {
                        normals[i * 3 + 1] = 1;
                    }

                    const attribute = new THREE.BufferAttribute(positions, 3);
                    attribute.setUsage(THREE.DynamicDrawUsage);

                    geometry.setAttribute("position", attribute);
                    geometry.setAttribute(
                        "normal",
                        new THREE.BufferAttribute(normals, 3)
                    );

                    const indexSets = dashed
                        ? [quadIndices(0), quadIndices(1)]
                        : [quadIndices(null)];

                    geometry.setIndex(indexSets[0]);

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.frustumCulled = false;
                    scene.add(mesh);

                    const ribbon = {
                        geometry,
                        attribute,
                        positions,
                        indexSets,
                        mesh,
                        halfWidth,
                        y,
                        offsetX,
                        dashed,
                        parity: 0
                    };

                    ribbons.push(ribbon);
                    return ribbon;
                }

                makeRibbon(mat.road, roadWidth / 2, 0, 0, false);
                makeRibbon(polyMaterial("#d8d3c0"), 0.075, 0.02, -roadWidth / 2, false);
                makeRibbon(polyMaterial("#d8d3c0"), 0.075, 0.02, roadWidth / 2, false);
                makeRibbon(polyMaterial("#b9bda7"), 0.04, 0.03, 0, true);

                // Lateral position of the track at coordinate s, relative to
                // where the player is, so the player stays on the road.
                const trackX = (s) => roadCurve(s) - roadCurve(worldOffset);
                const wrapAhead = (ahead0, speedScale, span) => {
                    const m = (ahead0 - worldOffset * speedScale) % span;
                    return (m < 0 ? m + span : m) - 25;
                };

                // The player's little car.
                const car = new THREE.Group();
                scene.add(car);

                addBox(
                    THREE,
                    car,
                    [1.68, 0.4, 3.12],
                    [0, 0.55, 0],
                    mat.car
                );

                addBox(
                    THREE,
                    car,
                    [1.18, 0.48, 1.34],
                    [0, 0.97, -0.26],
                    mat.glass,
                    [-0.12, 0, 0]
                );

                addBox(
                    THREE,
                    car,
                    [1.72, 0.1, 0.44],
                    [0, 0.46, 1.5],
                    mat.car
                );

                const wheelGeometry = rememberGeometry(
                    new THREE.CylinderGeometry(0.31, 0.31, 0.2, 12)
                );
                wheelGeometry.rotateZ(Math.PI / 2);

                const wheels = [];

                for (const x of [-0.87, 0.87]) {
                    for (const z of [-0.98, 1.03]) {
                        const wheel = new THREE.Mesh(
                            wheelGeometry,
                            mat.rubber
                        );

                        wheel.position.set(x, 0.34, z);
                        car.add(wheel);
                        wheels.push(wheel);
                    }
                }

                car.position.set(0, 0, 3);

                // Floating particles drift slowly past the player.
                const particles = [];
                const particleGeometry = rememberGeometry(
                    new THREE.IcosahedronGeometry(0.11, 0)
                );

                for (let i = 0; i < 42; i++) {
                    const particle = new THREE.Mesh(
                        particleGeometry,
                        i % 5 === 0 ? mat.clay : mat.stoneLight
                    );

                    particle.position.set(
                        (Math.random() - 0.5) * 54,
                        -1 + Math.random() * 19,
                        -Math.random() * 380
                    );

                    particle.userData.baseY = particle.position.y;
                    particle.userData.speed = 0.5 + Math.random() * 1.3;
                    particle.userData.phase = Math.random() * Math.PI * 2;
                    particle.userData.ahead = Math.random() * 380;
                    particle.userData.span = 380;
                    scene.add(particle);
                    particles.push(particle);
                }

                // A few foreground silhouettes add depth as the world scrolls.
                const foreground = new THREE.Group();
                scene.add(foreground);

                for (let i = 0; i < 8; i++) {
                    const side = i % 2 === 0 ? -1 : 1;
                    const height = 1.5 + (i % 4) * 0.9;

                    const rock = addRock(
                        THREE,
                        foreground,
                        [
                            side * (11 + (i % 3) * 3),
                            -1.3,
                            -20 - i * 42
                        ],
                        [height * 1.3, height * 0.9, height * 1.2],
                        i % 2 ? mat.stone : mat.mossDark,
                        0
                    );

                    rock.userData.ahead = 20 + i * 42;
                    rock.userData.span = 8 * 42;
                    rock.userData.side = side;
                    rock.userData.lateral = 11 + (i % 3) * 3;
                }

                clock = new THREE.Clock();
                clock.start();
                previousTime = 0;

                let pixelRatioCap = Math.min(window.devicePixelRatio || 1, 1.5);

                function resize() {
                    if (!renderer || !camera || destroyed) return;

                    const width = Math.max(1, viewport.clientWidth);
                    const height = Math.max(1, viewport.clientHeight);

                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();

                    renderer.setPixelRatio(pixelRatioCap);
                    renderer.setSize(width, height, false);
                }

                function updateRoad() {
                    const frac = worldOffset % ribbonStep;
                    const base = worldOffset - frac;
                    const here = roadCurve(worldOffset);
                    const parity = Math.floor(worldOffset / ribbonStep) % 2;

                    for (let k = 0; k < ribbonCount; k++) {
                        const ahead = (k - ribbonBehind) * ribbonStep - frac;
                        const s = base + (k - ribbonBehind) * ribbonStep;
                        const cx = roadCurve(s) - here;
                        const slope = (roadCurve(s + 1) - roadCurve(s - 1)) * 0.5;
                        const n = Math.hypot(slope, 1);
                        const rx = 1 / n;
                        const rz = slope / n;
                        const z = -ahead;
                        const i = k * 6;

                        for (const r of ribbons) {
                            const cxr = cx + rx * r.offsetX;
                            const czr = z + rz * r.offsetX;
                            const p = r.positions;

                            p[i] = cxr - rx * r.halfWidth;
                            p[i + 1] = r.y;
                            p[i + 2] = czr - rz * r.halfWidth;
                            p[i + 3] = cxr + rx * r.halfWidth;
                            p[i + 4] = r.y;
                            p[i + 5] = czr + rz * r.halfWidth;
                        }
                    }

                    for (const r of ribbons) {
                        r.attribute.needsUpdate = true;

                        // Dashes are tied to the absolute track index, so the
                        // pattern flips exactly when the cross-sections shift.
                        if (r.dashed && r.parity !== parity) {
                            r.parity = parity;
                            r.geometry.setIndex(r.indexSets[parity]);
                        }
                    }
                }

                function updateWorld(delta) {
                    elapsed += delta;

                    speed += (
                        (keys.has("w") || keys.has("arrowup") ? 30 : 17) -
                        speed
                    ) * delta * 0.38;

                    targetSteer =
                        (keys.has("a") || keys.has("arrowleft") ? -1 : 0) +
                        (keys.has("d") || keys.has("arrowright") ? 1 : 0);

                    steer += (
                        targetSteer - steer
                    ) * Math.min(1, delta * 5);

                    cameraX += (
                        steer * 3.0 - cameraX
                    ) * delta * 0.85;

                    distance += speed * delta * 0.85;
                    worldOffset += speed * delta * 1.0;

                    car.position.x = cameraX * 0.7;
                    car.position.y = 0.025 + Math.sin(elapsed * 1.7) * 0.035;
                    car.rotation.z = -steer * 0.045;
                    car.rotation.y = -steer * 0.055;

                    wheels.forEach((wheel) => {
                        wheel.rotation.x += delta * speed * 1.5;
                    });

                    updateRoad();

                    // Everything scrolls toward the camera with the road and
                    // follows the road's curve, so nothing drifts into it.
                    islandGroup.children.forEach((island) => {
                        const d = island.userData;
                        const ahead = wrapAhead(d.ahead, 1, d.span);

                        island.position.z = -ahead;
                        island.position.x =
                            trackX(worldOffset + ahead) + d.side * d.lateral;
                        island.position.y =
                            d.baseY +
                            Math.sin(elapsed * 0.45 + d.phase) * 0.3;
                    });

                    monoliths.forEach((monolith) => {
                        const d = monolith.userData;
                        const ahead = wrapAhead(d.ahead, 1, d.span);

                        monolith.position.z = -ahead;
                        monolith.position.x =
                            trackX(worldOffset + ahead) + d.side * d.lateral;
                    });

                    cloudGroup.children.forEach((cloud) => {
                        const d = cloud.userData;

                        cloud.position.z = -wrapAhead(d.ahead, 0.35, d.span);
                        cloud.position.y =
                            d.baseY + Math.sin(elapsed * 0.2 + d.phase) * 0.2;
                    });

                    particles.forEach((particle) => {
                        const d = particle.userData;

                        particle.position.z = -wrapAhead(d.ahead, 1, d.span);
                        particle.position.y =
                            d.baseY +
                            Math.sin(elapsed * d.speed + d.phase) * 0.28;
                    });

                    foreground.children.forEach((rock) => {
                        const d = rock.userData;
                        const ahead = wrapAhead(d.ahead, 1, d.span);

                        rock.position.z = -ahead;
                        rock.position.x =
                            trackX(worldOffset + ahead) + d.side * d.lateral;
                    });

                    camera.position.x += (
                        car.position.x * 0.68 - camera.position.x
                    ) * delta * 1.6;

                    camera.position.y =
                        5.3 + Math.sin(elapsed * 0.4) * 0.12;

                    camera.lookAt(
                        car.position.x * 0.48 +
                        (roadCurve(worldOffset + 18) - roadCurve(worldOffset)) * 0.55,
                        1.1,
                        -18
                    );

                    // Widen the lens a touch as you speed up.
                    const targetFov = 49 + Math.max(0, speed - 17) * 0.45;

                    if (Math.abs(camera.fov - targetFov) > 0.02) {
                        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 3);
                        camera.updateProjectionMatrix();
                    }

                    scene.fog.density =
                        0.0068 + Math.sin(elapsed * 0.12) * 0.00035;

                    if (elapsed > messageTimer) {
                        messageIndex =
                            (messageIndex + 1) % messagePool.length;

                        messageText.textContent = messagePool[messageIndex];
                        messageTimer = elapsed + 10;
                    }

                    uiTimer -= delta;

                    if (uiTimer <= 0) {
                        uiTimer = 0.1;
                        updateUI();
                    }
                }

                function frame(timestamp) {
                    if (destroyed) return;

                    animationFrame = requestAnimationFrame(frame);

                    if (paused || document.hidden) {
                        previousTime = timestamp;
                        return;
                    }

                    const delta = previousTime
                        ? Math.min((timestamp - previousTime) / 1000, 0.04)
                        : 0;

                    previousTime = timestamp;

                    // Slow device? Quietly lower resolution to stay smooth.
                    slowFrames = delta > 0.028
                        ? slowFrames + 1
                        : Math.max(0, slowFrames - 1);

                    if (slowFrames > 45 && pixelRatioCap > 0.75) {
                        pixelRatioCap = Math.max(0.75, pixelRatioCap - 0.25);
                        slowFrames = 0;
                        resize();
                    }

                    if (!reducedMotion.matches) {
                        updateWorld(delta);
                    } else {
                        // Reduced-motion mode retains steering and movement
                        // while avoiding extra ambient animation.
                        updateWorld(delta * 0.65);
                    }

                    renderer.render(scene, camera);
                }

                function onKeyDown(event) {
                    if (event.altKey || event.ctrlKey || event.metaKey) return;

                    const key = event.key.toLowerCase();

                    // Escape belongs to the main launcher, which closes DRIFT.
                    if (key === "escape") return;

                    if (
                        ["arrowleft", "arrowright", "arrowup", " "].includes(key) &&
                        !event.repeat
                    ) {
                        event.preventDefault();
                    }

                    if (key === " " && !event.repeat) {
                        setPaused(!paused);
                        return;
                    }

                    if (
                        ["a", "d", "w", "arrowleft", "arrowright", "arrowup"]
                            .includes(key)
                    ) {
                        keys.add(key);
                    }
                }

                function onKeyUp(event) {
                    keys.delete(event.key.toLowerCase());
                }

                function onVisibilityChange() {
                    if (document.hidden) {
                        setPaused(true);
                    }
                }

                function onPauseClick() {
                    setPaused(!paused);
                }

                function onSteerStart(event) {
                    if (paused) return;

                    const button = event.currentTarget;
                    const key = button.dataset.steer === "left"
                        ? "arrowleft"
                        : "arrowright";

                    keys.add(key);
                    button.classList.add("is-pressed");

                    try {
                        button.setPointerCapture(event.pointerId);
                    } catch (_) {
                        // Pointer capture may not be available in every browser.
                    }
                }

                function onSteerEnd(event) {
                    const button = event.currentTarget;
                    const key = button.dataset.steer === "left"
                        ? "arrowleft"
                        : "arrowright";

                    keys.delete(key);
                    button.classList.remove("is-pressed");
                }

                window.addEventListener("keydown", onKeyDown, {
                    passive: false
                });
                window.addEventListener("keyup", onKeyUp);
                window.addEventListener("blur", onVisibilityChange);
                document.addEventListener(
                    "visibilitychange",
                    onVisibilityChange
                );

                pauseButton.addEventListener("click", onPauseClick);

                steerButtons.forEach((button) => {
                    button.addEventListener("pointerdown", onSteerStart);
                    button.addEventListener("pointerup", onSteerEnd);
                    button.addEventListener("pointercancel", onSteerEnd);
                    button.addEventListener("lostpointercapture", onSteerEnd);
                });

                cleanup = () => {
                    window.removeEventListener("keydown", onKeyDown);
                    window.removeEventListener("keyup", onKeyUp);
                    window.removeEventListener("blur", onVisibilityChange);

                    document.removeEventListener(
                        "visibilitychange",
                        onVisibilityChange
                    );

                    pauseButton.removeEventListener("click", onPauseClick);

                    steerButtons.forEach((button) => {
                        button.removeEventListener("pointerdown", onSteerStart);
                        button.removeEventListener("pointerup", onSteerEnd);
                        button.removeEventListener("pointercancel", onSteerEnd);
                        button.removeEventListener(
                            "lostpointercapture",
                            onSteerEnd
                        );
                    });
                };

                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(viewport);
                resize();

                updateUI();
                loading.classList.add("is-hidden");
                animationFrame = requestAnimationFrame(frame);
            } catch (error) {
                if (destroyed || token !== initializationToken) return;

                console.error("AFTERHOURS DRIFT initialization error:", error);

                loading.innerHTML = `
                    <div class="drift-game__error">
                        <h3>The horizon is hiding.</h3>
                        <p>
                            DRIFT couldn't load its 3D scene.
                            Check your connection and try again.
                        </p>
                        <button type="button" class="drift-game__retry">
                            Try again
                        </button>
                    </div>
                `;

                loading.classList.remove("is-hidden");

                loading.querySelector(".drift-game__retry")
                    ?.addEventListener("click", () => {
                        retryCount += 1;

                        if (resizeObserver) {
                            resizeObserver.disconnect();
                            resizeObserver = null;
                        }

                        cleanup();
                        cleanup = () => { };

                        if (renderer) {
                            renderer.dispose();
                            renderer.domElement.remove();
                            renderer = null;
                        }

                        geometries.forEach((item) => item.dispose());
                        materials.forEach((item) => item.dispose());
                        disposableTextures.forEach((item) => item.dispose());
                        geometries.clear();
                        materials.clear();
                        disposableTextures.clear();

                        scene = null;
                        camera = null;
                        initialize();
                    });
            }
        }

        function destroy() {
            if (destroyed) return;

            destroyed = true;
            initializationToken++;

            cancelAnimationFrame(animationFrame);

            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }

            cleanup();
            keys.clear();

            if (renderer) {
                renderer.dispose();
                renderer.domElement.remove();
                renderer = null;
            }

            geometries.forEach((geometry) => geometry.dispose());
            materials.forEach((material) => material.dispose());
            disposableTextures.forEach((texture) => texture.dispose());

            geometries.clear();
            materials.clear();
            disposableTextures.clear();

            if (scene) {
                scene.clear();
                scene = null;
            }

            camera = null;
            clock = null;

            style.remove();
            mount.replaceChildren();
        }

        window.AfterhoursGames.setStopper?.(destroy);

        initialize();

        return destroy;
    };
})();