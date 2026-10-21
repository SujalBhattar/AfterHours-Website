
(() => {
    "use strict";

    if (window.AfterhoursHero3D) {
        window.AfterhoursHero3D.destroy();
    }

    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const state = {
        host: null,
        renderer: null,
        scene: null,
        camera: null,
        root: null,
        frame: 0,
        running: false,
        destroyed: false,
        pointerX: 0,
        pointerY: 0,
        resizeHandler: null,
        pointerHandler: null,
        motionHandler: null,
        objects: [],
        geometries: new Set(),
        materials: new Set()
    };

    async function init() {
        state.host = document.getElementById("hero-visual");

        if (!state.host) {
            console.warn("[AFTERHOURS] Hero visual container not found.");
            return;
        }

        let THREE;

        try {
            THREE = await import(THREE_URL);
        } catch (error) {
            console.warn(
                "[AFTERHOURS] Hero 3D failed to load. CSS artwork remains visible.",
                error
            );
            return;
        }

        if (state.destroyed) return;

        const canvas = document.createElement("canvas");
        canvas.className = "ah-hero3d-canvas";
        canvas.setAttribute("aria-hidden", "true");

        Object.assign(canvas.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: "0",
            pointerEvents: "none"
        });

        state.host.appendChild(canvas);

        try {
            state.renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                powerPreference: "high-performance"
            });
        } catch (error) {
            canvas.remove();

            console.warn(
                "[AFTERHOURS] WebGL unavailable for the hero scene.",
                error
            );
            return;
        }

        const renderer = state.renderer;

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.5)
        );

        renderer.setSize(
            state.host.clientWidth,
            state.host.clientHeight
        );

        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        state.scene = new THREE.Scene();

        state.camera = new THREE.PerspectiveCamera(
            38,
            state.host.clientWidth /
            Math.max(state.host.clientHeight, 1),
            0.1,
            100
        );

        state.camera.position.set(0, 0, 9);

        const ambientLight = new THREE.AmbientLight(
            0xb8d1a0,
            1.8
        );

        state.scene.add(ambientLight);

        const keyLight = new THREE.PointLight(
            0xd8edb5,
            42,
            30
        );

        keyLight.position.set(-3, 4, 5);
        state.scene.add(keyLight);

        const rimLight = new THREE.PointLight(
            0x789b61,
            32,
            25
        );

        rimLight.position.set(4, -2, -2);
        state.scene.add(rimLight);

        state.root = new THREE.Group();
        state.scene.add(state.root);

        createCentralObject(THREE);
        createOrbitRings(THREE);
        createFloatingFragments(THREE);
        createDust(THREE);

        state.resizeHandler = resize;
        state.pointerHandler = onPointerMove;
        state.motionHandler = onMotionChange;

        window.addEventListener("resize", state.resizeHandler, {
            passive: true
        });

        window.addEventListener(
            "pointermove",
            state.pointerHandler,
            { passive: true }
        );

        reducedMotion.addEventListener(
            "change",
            state.motionHandler
        );

        renderStill();
        start();

        console.info("[AFTERHOURS] Hero 3D scene initialized.");
    }

    function trackGeometry(geometry) {
        state.geometries.add(geometry);
        return geometry;
    }

    function trackMaterial(material) {
        state.materials.add(material);
        return material;
    }

    function createCentralObject(THREE) {
        const geometry = trackGeometry(
            new THREE.IcosahedronGeometry(1.45, 2)
        );

        const material = trackMaterial(
            new THREE.MeshStandardMaterial({
                color: 0x607d4c,
                roughness: 0.3,
                metalness: 0.24,
                flatShading: true
            })
        );

        const core = new THREE.Mesh(geometry, material);

        core.rotation.set(0.25, 0.2, 0.1);
        core.userData.kind = "core";

        state.root.add(core);
        state.objects.push(core);

        const innerGeometry = trackGeometry(
            new THREE.IcosahedronGeometry(0.78, 1)
        );

        const innerMaterial = trackMaterial(
            new THREE.MeshStandardMaterial({
                color: 0xb7ce96,
                emissive: 0x344b29,
                emissiveIntensity: 0.6,
                roughness: 0.45,
                metalness: 0.18,
                wireframe: true,
                transparent: true,
                opacity: 0.55
            })
        );

        const inner = new THREE.Mesh(
            innerGeometry,
            innerMaterial
        );

        inner.scale.setScalar(1.04);
        inner.userData.kind = "inner";
        state.root.add(inner);
        state.objects.push(inner);
    }

    function createOrbitRings(THREE) {
        const configurations = [
            {
                radius: 2.15,
                tube: 0.009,
                color: 0xc4dba4,
                opacity: 0.7,
                rotation: [0.75, 0.2, 0.45]
            },
            {
                radius: 2.55,
                tube: 0.006,
                color: 0x78976a,
                opacity: 0.6,
                rotation: [1.25, 0.65, -0.5]
            },
            {
                radius: 1.9,
                tube: 0.005,
                color: 0xa8c58c,
                opacity: 0.4,
                rotation: [0.15, 1.15, 0.9]
            }
        ];

        configurations.forEach((config, index) => {
            const geometry = trackGeometry(
                new THREE.TorusGeometry(
                    config.radius,
                    config.tube,
                    8,
                    180
                )
            );

            const material = trackMaterial(
                new THREE.MeshBasicMaterial({
                    color: config.color,
                    transparent: true,
                    opacity: config.opacity
                })
            );

            const ring = new THREE.Mesh(geometry, material);

            ring.rotation.set(...config.rotation);
            ring.userData.kind = "ring";
            ring.userData.ringIndex = index;

            state.root.add(ring);
            state.objects.push(ring);
        });
    }

    function createFloatingFragments(THREE) {
        const fragmentMaterial = trackMaterial(
            new THREE.MeshStandardMaterial({
                color: 0x8da979,
                roughness: 0.48,
                metalness: 0.3,
                flatShading: true
            })
        );

        const fragments = [
            { x: -2.6, y: 1.25, z: -0.5, size: 0.18 },
            { x: 2.65, y: 1.4, z: -0.7, size: 0.12 },
            { x: -2.25, y: -1.55, z: 0.2, size: 0.14 },
            { x: 2.3, y: -1.45, z: -0.4, size: 0.2 },
            { x: 0.2, y: 2.55, z: -1.1, size: 0.1 },
            { x: -0.2, y: -2.55, z: -0.5, size: 0.13 }
        ];

        fragments.forEach((config, index) => {
            const geometry = trackGeometry(
                new THREE.OctahedronGeometry(config.size, 0)
            );

            const fragment = new THREE.Mesh(
                geometry,
                fragmentMaterial
            );

            fragment.position.set(
                config.x,
                config.y,
                config.z
            );

            fragment.rotation.set(
                index * 0.8,
                index * 0.4,
                index * 0.6
            );

            fragment.userData.kind = "fragment";
            fragment.userData.seed = index * 1.7;

            state.root.add(fragment);
            state.objects.push(fragment);
        });
    }

    function createDust(THREE) {
        const count = window.innerWidth < 640 ? 120 : 240;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 7;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
        }

        const geometry = trackGeometry(
            new THREE.BufferGeometry()
        );

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        const material = trackMaterial(
            new THREE.PointsMaterial({
                color: 0xc3d8a5,
                size: 0.022,
                transparent: true,
                opacity: 0.6,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            })
        );

        const dust = new THREE.Points(geometry, material);
        dust.userData.kind = "dust";

        state.root.add(dust);
        state.objects.push(dust);
    }

    function resize() {
        if (!state.renderer || !state.host || state.destroyed) {
            return;
        }

        const width = Math.max(state.host.clientWidth, 1);
        const height = Math.max(state.host.clientHeight, 1);

        state.camera.aspect = width / height;
        state.camera.updateProjectionMatrix();

        state.renderer.setSize(width, height);
        renderStill();
    }

    function onPointerMove(event) {
        state.pointerX =
            (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;

        state.pointerY =
            (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    }

    function renderStill() {
        if (!state.renderer || state.destroyed) return;

        state.renderer.render(state.scene, state.camera);
    }

    function animate() {
        if (!state.running || state.destroyed) return;

        const time = performance.now() * 0.001;

        for (const object of state.objects) {
            switch (object.userData.kind) {
                case "core":
                    object.rotation.y = time * 0.13;
                    object.rotation.x =
                        0.25 + Math.sin(time * 0.4) * 0.08;
                    object.position.y = Math.sin(time * 0.55) * 0.07;
                    break;

                case "inner":
                    object.rotation.y = -time * 0.18;
                    object.rotation.x = time * 0.1;
                    break;

                case "ring": {
                    const index = object.userData.ringIndex;
                    object.rotation.z +=
                        (index === 1 ? -1 : 1) * 0.0008;
                    break;
                }

                case "fragment": {
                    const seed = object.userData.seed;
                    object.rotation.x = time * 0.12 + seed;
                    object.rotation.y = time * 0.17 + seed;
                    object.position.y +=
                        Math.sin(time + seed) * 0.0007;
                    break;
                }

                case "dust":
                    object.rotation.y = time * 0.015;
                    break;
            }
        }

        state.camera.position.x +=
            (state.pointerX * 0.3 - state.camera.position.x) * 0.018;

        state.camera.position.y +=
            (-state.pointerY * 0.22 - state.camera.position.y) * 0.018;

        state.camera.lookAt(0, 0, 0);

        renderStill();
        state.frame = requestAnimationFrame(animate);
    }

    function start() {
        if (state.running || state.destroyed) return;

        if (reducedMotion.matches) {
            renderStill();
            return;
        }

        state.running = true;
        state.frame = requestAnimationFrame(animate);
    }

    function stop() {
        state.running = false;
        cancelAnimationFrame(state.frame);
    }

    function onMotionChange() {
        stop();
        renderStill();

        if (!reducedMotion.matches) start();
    }

    function destroy() {
        if (state.destroyed) return;

        state.destroyed = true;
        stop();

        window.removeEventListener("resize", state.resizeHandler);
        window.removeEventListener(
            "pointermove",
            state.pointerHandler
        );

        reducedMotion.removeEventListener(
            "change",
            state.motionHandler
        );

        for (const geometry of state.geometries) {
            geometry.dispose();
        }

        for (const material of state.materials) {
            material.dispose();
        }

        if (state.renderer) {
            state.renderer.dispose();
            state.renderer.forceContextLoss();
        }

        if (state.host) {
            const canvas = state.host.querySelector(
                ".ah-hero3d-canvas"
            );

            if (canvas) canvas.remove();
        }

        state.objects = [];
        state.geometries.clear();
        state.materials.clear();

        state.renderer = null;
        state.scene = null;
        state.camera = null;
        state.root = null;
    }

    window.AfterhoursHero3D = {
        start,
        stop,
        resize,
        destroy
    };

    init();
})();