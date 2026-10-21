
(() => {
    "use strict";

    if (window.AfterhoursAmbient) {
        window.AfterhoursAmbient.destroy();
    }

    const canvas = document.getElementById("ambient-canvas");
    if (!canvas) {
        console.warn("[AFTERHOURS] Ambient canvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const state = {
        width: 0,
        height: 0,
        dpr: 1,
        particles: [],
        pointer: { x: -1000, y: -1000 },
        frame: 0,
        running: false,
        destroyed: false
    };

    const PARTICLE_COUNT = 65;
    const CONNECTION_DISTANCE = 115;

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    function resize() {
        if (state.destroyed) return;

        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.round(state.width * state.dpr);
        canvas.height = Math.round(state.height * state.dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;

        ctx.setTransform(
            state.dpr, 0, 0, state.dpr, 0, 0
        );

        createParticles();
        draw();
    }

    function createParticles() {
        const count = Math.min(
            PARTICLE_COUNT,
            Math.max(25, Math.floor(state.width / 18))
        );

        state.particles = Array.from(
            { length: count },
            () => ({
                x: random(0, state.width),
                y: random(0, state.height),
                radius: random(0.5, 1.7),
                alpha: random(0.13, 0.45),
                vx: random(-0.12, 0.12),
                vy: random(-0.17, -0.035),
                phase: random(0, Math.PI * 2)
            })
        );
    }

    function drawBackgroundGlow() {
        const glow = ctx.createRadialGradient(
            state.width * 0.68,
            state.height * 0.32,
            0,
            state.width * 0.68,
            state.height * 0.32,
            Math.max(state.width, state.height) * 0.7
        );

        glow.addColorStop(0, "rgba(81, 111, 63, 0.09)");
        glow.addColorStop(0.5, "rgba(43, 67, 41, 0.035)");
        glow.addColorStop(1, "rgba(16, 24, 17, 0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, state.width, state.height);
    }

    function drawGrid() {
        const spacing = 72;

        ctx.save();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "rgba(171, 198, 142, 0.035)";

        for (let x = 0; x <= state.width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, state.height);
            ctx.stroke();
        }

        for (let y = 0; y <= state.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(state.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawConnections() {
        const particles = state.particles;

        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];

            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.hypot(dx, dy);

                if (distance > CONNECTION_DISTANCE) continue;

                const alpha =
                    (1 - distance / CONNECTION_DISTANCE) * 0.085;

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(169, 199, 135, ${alpha})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
            }
        }
    }

    function drawParticles() {
        for (const particle of state.particles) {
            const dx = particle.x - state.pointer.x;
            const dy = particle.y - state.pointer.y;
            const distance = Math.hypot(dx, dy);
            const pointerBoost = distance < 180
                ? (1 - distance / 180) * 0.4
                : 0;

            ctx.beginPath();
            ctx.arc(
                particle.x,
                particle.y,
                particle.radius + pointerBoost,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(192, 215, 160, ${Math.min(0.8, particle.alpha + pointerBoost)})`;

            ctx.fill();
        }
    }

    function drawPointerGlow() {
        if (state.pointer.x < 0 || state.pointer.y < 0) return;

        const glow = ctx.createRadialGradient(
            state.pointer.x,
            state.pointer.y,
            0,
            state.pointer.x,
            state.pointer.y,
            210
        );

        glow.addColorStop(0, "rgba(132, 170, 99, 0.055)");
        glow.addColorStop(1, "rgba(132, 170, 99, 0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, state.width, state.height);
    }

    function draw() {
        if (state.destroyed) return;

        ctx.clearRect(0, 0, state.width, state.height);

        drawBackgroundGlow();
        drawGrid();
        drawConnections();
        drawParticles();
        drawPointerGlow();
    }

    function update() {
        for (const particle of state.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < -5) particle.x = state.width + 5;
            if (particle.x > state.width + 5) particle.x = -5;
            if (particle.y < -5) {
                particle.y = state.height + 5;
                particle.x = random(0, state.width);
            }
        }
    }

    function animate() {
        if (!state.running || state.destroyed) return;

        update();
        draw();
        state.frame = requestAnimationFrame(animate);
    }

    function start() {
        if (state.destroyed || state.running) return;

        state.running = true;

        if (reducedMotion.matches) {
            draw();
            state.running = false;
            return;
        }

        state.frame = requestAnimationFrame(animate);
    }

    function stop() {
        state.running = false;
        cancelAnimationFrame(state.frame);
    }

    function onPointerMove(event) {
        state.pointer.x = event.clientX;
        state.pointer.y = event.clientY;
    }

    function onPointerLeave() {
        state.pointer.x = -1000;
        state.pointer.y = -1000;
    }

    function onMotionPreferenceChange() {
        stop();
        draw();

        if (!reducedMotion.matches) start();
    }

    function destroy() {
        if (state.destroyed) return;

        stop();
        state.destroyed = true;

        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        reducedMotion.removeEventListener(
            "change",
            onMotionPreferenceChange
        );

        ctx.clearRect(0, 0, state.width, state.height);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, {
        passive: true
    });
    window.addEventListener("pointerleave", onPointerLeave, {
        passive: true
    });
    reducedMotion.addEventListener(
        "change",
        onMotionPreferenceChange
    );

    resize();
    start();

    window.AfterhoursAmbient = { destroy, resize, start, stop };

    console.info("[AFTERHOURS] Ambient atmosphere initialized.");
})();