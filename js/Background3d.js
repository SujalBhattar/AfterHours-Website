
(() => {
    "use strict";

    if (window.AfterhoursBackground3D) {
        window.AfterhoursBackground3D.destroy();
    }

    const REDUCED_MOTION = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const THREE_URL =
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

    const state = {
        renderer: null,
        scene: null,
        camera: null,
        points: null,
        structure: null,
        frame: 0,
        running: false,
        destroyed: false,
        width: window.innerWidth,
        height: window.innerHeight,
        pointerX: 0,
        pointerY: 0,
        resizeHandler: null,
        pointerHandler: null,
        motionHandler: null,
        canvas: null
    };

    async function init() {
        if (state.destroyed) return;

        let THREE;

        try {
            THREE = await import(THREE_URL);
        } catch (error) {
            console.warn(
                "[AFTERHOURS] Three.js background unavailable. CSS atmosphere remains active.",
                error
            );
            return;
        }

        if (state.destroyed) return;

        const canvas = document.createElement("canvas");
        canvas.className = "ah-background3d-canvas";
        canvas.setAttribute("aria-hidden", "true");

        Object.assign(canvas.style, {
            position: "fixed",
            inset: "0",
            width: "100%",
            height: "100%",
            zIndex: "0",
            pointerEvents: "none",
            opacity: "0.28"
        });

        document.body.prepend(canvas);
        state.canvas = canvas;

        try {
            state.renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: false,
                powerPreference: "low-power"
            });
        } catch (error) {
            canvas.remove();
            state.canvas = null;

            console.warn(
                "[AFTERHOURS] WebGL is unavailable; using CSS background.",
                error
            );
            return;
        }

        const renderer = state.renderer;

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.5)
        );
        renderer.setSize(state.width, state.height);
        renderer.setClearColor(0x101811, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        state.scene = new THREE.Scene();

        state.camera = new THREE.PerspectiveCamera(
            48,
            state.width / state.height,
            0.1,
            100
        );

        state.camera.position.set(0, 0, 12);

        const particleCount = window.innerWidth < 700 ? 350 : 750;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 23;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

            const shade = Math.random();

            colors[i * 3] = 0.35 + shade * 0.23;
            colors[i * 3 + 1] = 0.48 + shade * 0.28;
            colors[i * 3 + 2] = 0.25 + shade * 0.15;
        }

        const particleGeometry = new THREE.BufferGeometry();

        particleGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        particleGeometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
        );

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.035,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        state.points = new THREE.Points(
            particleGeometry,
            particleMaterial
        );

        state.scene.add(state.points);

        const geometry = new THREE.IcosahedronGeometry(3.1, 2);

        const wireMaterial = new THREE.MeshBasicMaterial({
            color: 0x819e69,
            wireframe: true,
            transparent: true,
            opacity: 0.055,
            depthWrite: false
        });

        state.structure = new THREE.Mesh(geometry, wireMaterial);
        state.structure.position.set(4.5, -0.3, -3);
        state.structure.scale.set(1.25, 1.25, 1.25);

        state.scene.add(state.structure);

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

        REDUCED_MOTION.addEventListener(
            "change",
            state.motionHandler
        );

        renderStill();
        start();

        console.info("[AFTERHOURS] 3D background initialized.");
    }

    function resize() {
        if (!state.renderer || state.destroyed) return;

        state.width = window.innerWidth;
        state.height = window.innerHeight;

        state.camera.aspect = state.width / state.height;
        state.camera.updateProjectionMatrix();

        state.renderer.setSize(state.width, state.height);
        state.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.5)
        );
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

        const time = performance.now() * 0.00012;

        if (state.points) {
            state.points.rotation.y = time * 0.45;
            state.points.rotation.x = Math.sin(time) * 0.06;
        }

        if (state.structure) {
            state.structure.rotation.y = time * 0.6;
            state.structure.rotation.x = time * 0.25;
        }

        if (state.camera) {
            state.camera.position.x +=
                (state.pointerX * 0.18 - state.camera.position.x) * 0.015;

            state.camera.position.y +=
                (-state.pointerY * 0.12 - state.camera.position.y) * 0.015;

            state.camera.lookAt(0, 0, 0);
        }

        renderStill();
        state.frame = requestAnimationFrame(animate);
    }

    function start() {
        if (state.running || state.destroyed) return;

        if (REDUCED_MOTION.matches) {
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

        if (!REDUCED_MOTION.matches) start();
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

        REDUCED_MOTION.removeEventListener(
            "change",
            state.motionHandler
        );

        if (state.points) {
            state.points.geometry.dispose();
            state.points.material.dispose();
        }

        if (state.structure) {
            state.structure.geometry.dispose();
            state.structure.material.dispose();
        }

        if (state.renderer) {
            state.renderer.dispose();
            state.renderer.forceContextLoss();
        }

        if (state.canvas) state.canvas.remove();

        state.renderer = null;
        state.scene = null;
        state.camera = null;
        state.points = null;
        state.structure = null;
    }

    window.AfterhoursBackground3D = {
        start,
        stop,
        resize,
        destroy
    };

    init();
})();