/* =========================================================
   AFTERHOURS Hero Model
   A real 3D object in the hero: a faceted moss planet with
   ring bands, ring dust, orbiting moons and drifting shards.

   - Drag to spin it (it eases back to a slow idle turn)
   - Tilts gently toward the pointer
   - Pauses off-screen, when the tab is hidden, or when the hero
     is hidden behind a game
   - Reduced motion: renders a single still frame
   - If WebGL / CDN fails, the CSS planet fallback stays visible
   ========================================================= */

(() => {
    "use strict";

    const host = document.getElementById("hero3d");
    if (!host) return;

    const art = host.closest(".ah-hero__art");
    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = Boolean(
        navigator.connection && navigator.connection.saveData
    );

    init().catch((error) => {
        console.warn("AFTERHOURS: hero 3D unavailable, using CSS planet.", error);
        host.remove();
        art?.classList.remove("has-3d");
    });

    const hex = (value) => [
        ((value >> 16) & 255) / 255,
        ((value >> 8) & 255) / 255,
        (value & 255) / 255
    ];

    const mix = (a, b, t) => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];

    async function init() {
        const THREE = await import(THREE_URL);

        const renderer = new THREE.WebGLRenderer({
            antialias: !saveData,
            alpha: true,
            powerPreference: "high-performance"
        });

        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;

        host.appendChild(renderer.domElement);
        art?.classList.add("has-3d");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
        camera.position.set(0, 0, 12);

        scene.add(new THREE.HemisphereLight(0xdfe8d0, 0x171915, 0.9));

        const sunLight = new THREE.DirectionalLight(0xffe2c4, 2.4);
        sunLight.position.set(4, 3, 5);
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0xa2b58b, 1.5);
        rimLight.position.set(-5, -1, -4);
        scene.add(rimLight);

        const model = new THREE.Group();
        scene.add(model);

        /* ---- Faceted planet ---- */

        const RADIUS = 1.55;
        const geometry = new THREE.IcosahedronGeometry(RADIUS, 7);
        const position = geometry.attributes.position;
        const count = position.count;

        const noise = (x, y, z) =>
            Math.sin(x * 1.7 + 1.3) * Math.sin(y * 1.9 + 0.4) * Math.sin(z * 1.6 + 2.1) +
            0.5 * Math.sin(x * 3.9 + y * 3.1) * Math.cos(z * 3.7) +
            0.25 * Math.sin(x * 8.1 + z * 7.3 + y * 6.7);

        const heights = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            const z = position.getZ(i);
            const length = Math.hypot(x, y, z) || 1;
            const dx = x / length;
            const dy = y / length;
            const dz = z / length;

            const n = noise(dx * 1.6, dy * 1.6, dz * 1.6);
            const r = RADIUS * (1 + n * 0.075);

            heights[i] = n;
            position.setXYZ(i, dx * r, dy * r, dz * r);
        }

        // Colour each triangle flat from its average height.
        const low = hex(0x2a3326);
        const mid = hex(0x65775a);
        const high = hex(0xa2b58b);
        const peak = hex(0xdfe8d0);
        const clay = hex(0xc98770);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i += 3) {
            const n = (heights[i] + heights[i + 1] + heights[i + 2]) / 3;
            const t = Math.min(1, Math.max(0, (n + 1.1) / 2.2));

            let color = t < 0.5
                ? mix(low, mid, t / 0.5)
                : mix(mid, high, (t - 0.5) / 0.5);

            if (t > 0.9) color = mix(high, peak, (t - 0.9) / 0.1);

            const cy = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3;
            const cx = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;

            if (Math.sin(cy * 5.5 + cx * 1.8) > 0.88) color = mix(color, clay, 0.75);

            for (let k = 0; k < 3; k++) {
                colors[(i + k) * 3] = color[0];
                colors[(i + k) * 3 + 1] = color[1];
                colors[(i + k) * 3 + 2] = color[2];
            }
        }

        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const planet = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                vertexColors: true,
                flatShading: true,
                roughness: 0.9,
                metalness: 0
            })
        );

        model.add(planet);

        // Soft atmosphere: bright only at the silhouette.
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(RADIUS * 1.13, 48, 32),
            new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                uniforms: { glow: { value: new THREE.Color(0xa2b58b) } },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vView;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        vec4 mv = modelViewMatrix * vec4(position, 1.0);
                        vView = normalize(-mv.xyz);
                        gl_Position = projectionMatrix * mv;
                    }
                `,
                fragmentShader: `
                    uniform vec3 glow;
                    varying vec3 vNormal;
                    varying vec3 vView;
                    void main() {
                        float f = pow(1.0 - abs(dot(vNormal, vView)), 2.6);
                        gl_FragColor = vec4(glow, f * 0.85);
                    }
                `
            })
        );

        model.add(atmosphere);

        /* ---- Rings ---- */

        const ringPivot = new THREE.Group();
        ringPivot.rotation.set(1.18, 0, -0.34);
        model.add(ringPivot);

        [
            [2.25, 2.55, 0.5],
            [2.68, 3.12, 0.32],
            [3.28, 3.36, 0.55]
        ].forEach(([inner, outer, opacity]) => {
            ringPivot.add(
                new THREE.Mesh(
                    new THREE.RingGeometry(inner, outer, 160),
                    new THREE.MeshBasicMaterial({
                        color: 0xa2b58b,
                        transparent: true,
                        opacity,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    })
                )
            );
        });

        const dustCount = saveData ? 350 : 1100;
        const dustPositions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2.2 + Math.random() * 1.25;

            dustPositions[i * 3] = Math.cos(angle) * radius;
            dustPositions[i * 3 + 1] = Math.sin(angle) * radius;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.07;
        }

        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(dustPositions, 3)
        );

        const dust = new THREE.Points(
            dustGeometry,
            new THREE.PointsMaterial({
                color: 0xeeeadd,
                size: 0.022,
                transparent: true,
                opacity: 0.75,
                depthWrite: false
            })
        );

        ringPivot.add(dust);

        /* ---- Moons ---- */

        const moons = [];

        [
            { distance: 4.1, size: 0.24, color: 0xc98770, speed: 0.34, tilt: [0.5, 0, 0.3] },
            { distance: 4.9, size: 0.16, color: 0xdfe8d0, speed: -0.24, tilt: [-0.4, 0, -0.5] },
            { distance: 3.7, size: 0.12, color: 0x7f9570, speed: 0.48, tilt: [1.0, 0, 0.1] }
        ].forEach((spec, i) => {
            const pivot = new THREE.Group();
            pivot.rotation.set(...spec.tilt);
            pivot.userData.speed = spec.speed;
            pivot.rotation.y = i * 2.1;

            const moon = new THREE.Mesh(
                new THREE.DodecahedronGeometry(spec.size, 0),
                new THREE.MeshStandardMaterial({
                    color: spec.color,
                    flatShading: true,
                    roughness: 0.85
                })
            );

            moon.position.x = spec.distance;
            pivot.add(moon);
            model.add(pivot);
            moons.push({ pivot, moon });
        });

        /* ---- Drifting shards ---- */

        const shards = [];
        const shardColors = [0x65775a, 0xa2b58b, 0xc98770, 0x4c5d44];

        for (let i = 0; i < (saveData ? 6 : 14); i++) {
            const shard = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.08, 0),
                new THREE.MeshStandardMaterial({
                    color: shardColors[i % shardColors.length],
                    flatShading: true,
                    roughness: 0.9
                })
            );

            const angle = Math.random() * Math.PI * 2;
            const radius = 3.8 + Math.random() * 1.6;

            shard.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 3.4,
                Math.sin(angle) * radius * 0.5
            );

            shard.userData = {
                spin: (Math.random() - 0.5) * 1.2,
                phase: Math.random() * Math.PI * 2,
                baseY: shard.position.y
            };

            shards.push(shard);
            model.add(shard);
        }

        /* ---- Input: pointer tilt + drag-to-spin ---- */

        const pointer = { x: 0, y: 0, tiltX: 0, tiltY: 0 };
        let dragging = false;
        let lastX = 0;
        let spinVelocity = 0.12;

        const onPointerMove = (event) => {
            const box = host.getBoundingClientRect();
            const cx = box.left + box.width / 2;
            const cy = box.top + box.height / 2;

            pointer.x = Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth / 2)));
            pointer.y = Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight / 2)));

            if (dragging) {
                const dx = event.clientX - lastX;
                lastX = event.clientX;
                spinVelocity = Math.max(-9, Math.min(9, dx * 0.4));
            }
        };

        const onPointerDown = (event) => {
            dragging = true;
            lastX = event.clientX;
            host.setPointerCapture?.(event.pointerId);
        };

        const onPointerUp = () => {
            dragging = false;
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        host.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        /* ---- Sizing ---- */

        let width = 0;
        let height = 0;

        function resize() {
            const w = host.clientWidth;
            const h = host.clientHeight;

            if (!w || !h) return;

            width = w;
            height = h;

            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, saveData ? 1 : 1.75));
            renderer.setSize(w, h, false);

            camera.aspect = w / h;

            const halfFov = (camera.fov * Math.PI) / 360;
            camera.position.z = Math.max(12, 5.4 / (Math.tan(halfFov) * camera.aspect));
            camera.updateProjectionMatrix();

            draw(0, performance.now());
        }

        /* ---- Animation ---- */

        function update(dt, now) {
            const t = now * 0.001;

            if (!dragging) {
                spinVelocity += (0.12 - spinVelocity) * Math.min(1, dt * 1.4);
            }

            planet.rotation.y += spinVelocity * dt;
            dust.rotation.z += dt * 0.03;

            pointer.tiltX += (pointer.y * 0.22 - pointer.tiltX) * 0.05;
            pointer.tiltY += (pointer.x * 0.3 - pointer.tiltY) * 0.05;

            model.rotation.x = 0.16 + pointer.tiltX;
            model.rotation.y = pointer.tiltY;
            model.position.y = Math.sin(t * 0.6) * 0.09;

            for (const { pivot, moon } of moons) {
                pivot.rotation.y += pivot.userData.speed * dt;
                moon.rotation.x += dt * 0.6;
            }

            for (const shard of shards) {
                const d = shard.userData;
                shard.rotation.x += d.spin * dt;
                shard.rotation.y += d.spin * dt * 0.7;
                shard.position.y = d.baseY + Math.sin(t * 0.5 + d.phase) * 0.12;
            }
        }

        function draw(dt, now) {
            update(dt, now);
            renderer.render(scene, camera);
        }

        let raf = 0;
        let last = 0;
        let running = false;
        let visible = true;

        function tick(now) {
            raf = requestAnimationFrame(tick);

            const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
            last = now;

            draw(dt, now);
        }

        function sync() {
            const shouldRun = visible && !document.hidden && !reduced.matches && width > 0;

            if (shouldRun && !running) {
                running = true;
                last = 0;
                raf = requestAnimationFrame(tick);
            } else if (!shouldRun && running) {
                running = false;
                cancelAnimationFrame(raf);
            }
        }

        if ("ResizeObserver" in window) {
            new ResizeObserver(() => {
                resize();
                sync();
            }).observe(host);
        } else {
            window.addEventListener("resize", () => {
                resize();
                sync();
            }, { passive: true });
        }

        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                visible = entries.some((entry) => entry.isIntersecting);
                sync();
            }).observe(host);
        }

        document.addEventListener("visibilitychange", sync);

        if (typeof reduced.addEventListener === "function") {
            reduced.addEventListener("change", sync);
        }

        renderer.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            running = false;
            cancelAnimationFrame(raf);
            host.remove();
            art?.classList.remove("has-3d");
        });

        resize();
        sync();
    }
})();