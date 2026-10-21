/* =========================================================
   AFTERHOURS 3D Background
   Drifting moss stones, orbit rings and dust in a dark
   moss-green space. Pointer + scroll parallax.

   - three.js loaded from the same CDN URL Drift uses
   - Pauses when the tab is hidden or Drift is open
   - Honors prefers-reduced-motion (renders one still frame)
   - If WebGL or the CDN is unavailable, the 2D ambient
     canvas (ambient.js) simply stays as the fallback
   ========================================================= */

(() => {
    "use strict";

    const host = document.getElementById("bg3d");
    if (!host) return;

    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = Boolean(
        navigator.connection && navigator.connection.saveData
    );

    let load = "full"; // "full" | "light" | "paused"
    let applyLoad = (value) => { load = value; };

    window.AfterhoursBackground = {
        setLoad: (value) => applyLoad(value)
    };

    init().catch((error) => {
        console.warn("AFTERHOURS: 3D background unavailable, using 2D fallback.", error);
        host.remove();
    });

    async function init() {
        const THREE = await import(THREE_URL);

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "low-power"
        });

        renderer.setClearColor(0x171915, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        host.appendChild(renderer.domElement);

        // WebGL worked: retire the 2D fallback.
        window.AfterhoursAmbient?.destroy();
        document.getElementById("ambient-canvas")?.remove();
        document.getElementById("ambient-sculpture")?.remove();

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x171915, 0.04);

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 90);
        camera.position.set(0, 0, 14);

        scene.add(new THREE.HemisphereLight(0xdfe8d0, 0x171915, 1.1));

        const warm = new THREE.DirectionalLight(0xc98770, 1.5);
        warm.position.set(-6, 5, 7);
        scene.add(warm);

        const moss = new THREE.PointLight(0xa2b58b, 45, 45, 2);
        moss.position.set(6, -2, 4);
        scene.add(moss);

        const world = new THREE.Group();
        scene.add(world);

        const rand = (min, max) => min + Math.random() * (max - min);
        const aspect0 = window.innerWidth / Math.max(1, window.innerHeight);
        const spreadX = 7 * aspect0 + 6;

        /* ---- Organic stones ---- */

        const palette = [0x3d4a36, 0x4c5d44, 0x65775a, 0x7f9570, 0x52633f, 0xc98770];
        const stones = [];
        const stoneCount = saveData ? 9 : 17;

        for (let i = 0; i < stoneCount; i++) {
            const geometry = new THREE.IcosahedronGeometry(1, 1);
            const p = geometry.attributes.position;

            for (let v = 0; v < p.count; v++) {
                const k =
                    1 +
                    Math.sin(p.getX(v) * 3.1 + i) *
                    Math.cos(p.getY(v) * 2.7 + i * 1.3) *
                    0.16;

                p.setXYZ(v, p.getX(v) * k, p.getY(v) * k, p.getZ(v) * k);
            }

            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({
                color: palette[i % palette.length],
                roughness: 0.88,
                metalness: 0.02,
                flatShading: true
            });

            const mesh = new THREE.Mesh(geometry, material);
            const size = rand(0.35, 1.35);

            mesh.scale.set(
                size * rand(0.8, 1.2),
                size * rand(0.7, 1.1),
                size * rand(0.8, 1.2)
            );

            mesh.position.set(
                rand(-spreadX, spreadX),
                rand(-12, 8),
                rand(-16, 3)
            );

            mesh.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));

            mesh.userData = {
                rx: rand(-0.12, 0.12),
                ry: rand(-0.16, 0.16),
                bob: rand(0.25, 0.55),
                phase: rand(0, Math.PI * 2),
                baseY: mesh.position.y
            };

            stones.push(mesh);
            world.add(mesh);
        }

        /* ---- Dust ---- */

        const dustCount = saveData ? 120 : 340;
        const dustPositions = new Float32Array(dustCount * 3);
        const dustSpeeds = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = rand(-spreadX - 3, spreadX + 3);
            dustPositions[i * 3 + 1] = rand(-14, 12);
            dustPositions[i * 3 + 2] = rand(-18, 6);
            dustSpeeds[i] = rand(0.05, 0.25);
        }

        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(dustPositions, 3)
        );

        world.add(
            new THREE.Points(
                dustGeometry,
                new THREE.PointsMaterial({
                    color: 0xeeeadd,
                    size: 0.06,
                    transparent: true,
                    opacity: 0.55,
                    depthWrite: false
                })
            )
        );

        /* ---- Input: pointer + scroll parallax ---- */

        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        let scrollTarget = 0;
        let scrollSmooth = 0;

        const onPointerMove = (event) => {
            pointer.tx = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
            pointer.ty = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        };

        const onPointerLeave = () => {
            pointer.tx = 0;
            pointer.ty = 0;
        };

        const onScroll = () => {
            const max = Math.max(
                1,
                document.documentElement.scrollHeight - window.innerHeight
            );
            scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        /* ---- Sizing ---- */

        function resize() {
            const width = window.innerWidth;
            const height = Math.max(1, window.innerHeight);

            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, saveData ? 1 : 1.5)
            );
            renderer.setSize(width, height, false);

            camera.aspect = width / height;
            camera.position.z = camera.aspect < 1 ? 18 : 14;
            camera.updateProjectionMatrix();

            if (!running) draw(0, 0);
        }

        /* ---- Animation ---- */

        function update(dt, now) {
            const time = now * 0.001;

            pointer.x += (pointer.tx - pointer.x) * 0.04;
            pointer.y += (pointer.ty - pointer.y) * 0.04;
            scrollSmooth += (scrollTarget - scrollSmooth) * 0.06;

            camera.position.x = pointer.x * 1.4;
            camera.position.y = -pointer.y * 0.9 - scrollSmooth * 6;
            camera.lookAt(pointer.x * 0.4, camera.position.y * 0.9, 0);

            for (const stone of stones) {
                const d = stone.userData;
                stone.rotation.x += d.rx * dt;
                stone.rotation.y += d.ry * dt;
                stone.position.y = d.baseY + Math.sin(time * d.bob + d.phase) * 0.35;
            }



            for (let i = 0; i < dustCount; i++) {
                dustPositions[i * 3 + 1] += dustSpeeds[i] * dt;
                if (dustPositions[i * 3 + 1] > 12) dustPositions[i * 3 + 1] = -14;
            }

            dustGeometry.attributes.position.needsUpdate = true;
        }

        function draw(dt, now) {
            update(dt, now);
            renderer.render(scene, camera);
        }

        let raf = 0;
        let last = 0;
        let running = false;

        function tick(now) {
            raf = requestAnimationFrame(tick);

            const interval = load === "light" ? 1000 / 24 : 1000 / 45;
            if (now - last < interval) return;

            const dt = last ? Math.min((now - last) / 1000, 0.06) : 0.016;
            last = now;

            draw(dt, now);
        }

        function sync() {
            const shouldRun =
                load !== "paused" && !document.hidden && !reduced.matches;

            if (shouldRun && !running) {
                running = true;
                last = 0;
                raf = requestAnimationFrame(tick);
            } else if (!shouldRun && running) {
                running = false;
                cancelAnimationFrame(raf);
            }

            if (!shouldRun && load !== "paused") draw(0, 0);
        }

        applyLoad = (value) => {
            load = value;
            sync();
        };

        window.addEventListener("resize", resize, { passive: true });
        document.addEventListener("visibilitychange", sync);

        if (typeof reduced.addEventListener === "function") {
            reduced.addEventListener("change", sync);
        }

        renderer.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            running = false;
            cancelAnimationFrame(raf);
            host.remove();
        });

        resize();
        sync();
    }
})();