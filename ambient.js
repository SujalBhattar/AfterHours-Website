/* =========================================================
   AFTERHOURS® Ambient Engine
   Organic Future / Lightweight interactive atmosphere

   Features:
   - Sparse drifting particles
   - Gentle pointer-responsive sculpture
   - Low-DPI canvas rendering for performance
   - Reduced-motion support
   - Visibility-aware animation
   - No external libraries
   - No interference with game controls
   ========================================================= */

(() => {
    "use strict";

    const canvas = document.getElementById("ambient-canvas");
    const sculpture = document.getElementById("ambient-sculpture");

    if (!canvas || !sculpture) return;

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    const connection = navigator.connection;
    const saveData = Boolean(connection && connection.saveData);

    const settings = {
        particleCount: 44,
        maxPixelRatio: 1.5,
        maxFrameRate: 30,
        pointerEase: 0.055,
        pointerRange: 13,
        particleSpeed: 0.12,
        connectionDistance: 125
    };

    if (saveData) {
        settings.particleCount = 18;
        settings.maxPixelRatio = 1;
        settings.maxFrameRate = 20;
    }

    const state = {
        width: 0,
        height: 0,
        pixelRatio: 1,
        particles: [],
        animationFrame: 0,
        lastFrame: 0,
        elapsed: 0,
        running: false,
        destroyed: false,
        pointerX: 0,
        pointerY: 0,
        targetX: 0,
        targetY: 0,
        scrollY: window.scrollY || 0
    };

    const colors = {
        paper: "241, 239, 229",
        moss: "168, 181, 138"
    };

    const random = (min, max) =>
        min + Math.random() * (max - min);

    const clamp = (value, min, max) =>
        Math.min(max, Math.max(min, value));

    const canAnimate = () =>
        !state.destroyed &&
        !document.hidden &&
        !reducedMotion.matches;

    /* -------------------------------------------------------
       Canvas sizing
       ------------------------------------------------------- */

    function resizeCanvas() {
        if (state.destroyed) return;

        const bounds = canvas.getBoundingClientRect();

        state.width = Math.max(1, bounds.width || window.innerWidth);
        state.height = Math.max(1, bounds.height || window.innerHeight);

        state.pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            settings.maxPixelRatio
        );

        canvas.width = Math.round(state.width * state.pixelRatio);
        canvas.height = Math.round(state.height * state.pixelRatio);

        context.setTransform(
            state.pixelRatio,
            0,
            0,
            state.pixelRatio,
            0,
            0
        );

        createParticles();
        drawStaticFrame();
    }

    /* -------------------------------------------------------
       Particle creation
       ------------------------------------------------------- */

    function createParticles() {
        const area = state.width * state.height;

        const areaBasedCount = Math.round(area / 25000);

        const count = Math.min(
            settings.particleCount,
            Math.max(12, areaBasedCount)
        );

        state.particles = Array.from({ length: count }, () => ({
            x: random(0, state.width),
            y: random(0, state.height),
            radius: random(0.65, 1.45),
            alpha: random(0.09, 0.31),
            speedX: random(-0.13, 0.13) * settings.particleSpeed,
            speedY: random(-0.19, -0.035) * settings.particleSpeed,
            phase: random(0, Math.PI * 2),
            moss: Math.random() > 0.76
        }));
    }

    /* -------------------------------------------------------
       Draw the quiet frame
       ------------------------------------------------------- */

    function clearCanvas() {
        context.clearRect(0, 0, state.width, state.height);
    }

    function drawStaticFrame() {
        clearCanvas();

        for (const particle of state.particles) {
            drawParticle(particle, 0);
        }
    }

    function drawParticle(particle, time) {
        const pulse = 0.82 + Math.sin(time * 0.0005 + particle.phase) * 0.18;
        const alpha = particle.alpha * pulse;

        context.beginPath();
        context.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );

        context.fillStyle = particle.moss
            ? `rgba(${colors.moss}, ${alpha})`
            : `rgba(${colors.paper}, ${alpha})`;

        context.fill();
    }

    /* -------------------------------------------------------
       Subtle particle connections
       ------------------------------------------------------- */

    function drawConnections() {
        const particles = state.particles;
        const maxDistance = settings.connectionDistance;
        const maxDistanceSquared = maxDistance * maxDistance;

        context.lineWidth = 0.55;

        for (let i = 0; i < particles.length; i += 1) {
            const first = particles[i];

            for (let j = i + 1; j < particles.length; j += 1) {
                const second = particles[j];

                const dx = first.x - second.x;
                const dy = first.y - second.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared > maxDistanceSquared) continue;

                const distance = Math.sqrt(distanceSquared);
                const opacity = (1 - distance / maxDistance) * 0.075;

                context.beginPath();
                context.moveTo(first.x, first.y);
                context.lineTo(second.x, second.y);
                context.strokeStyle = `rgba(${colors.moss}, ${opacity})`;
                context.stroke();
            }
        }
    }

    /* -------------------------------------------------------
       Movement
       ------------------------------------------------------- */

    function updateParticles(delta) {
        const movement = Math.min(delta, 50) / 16.67;

        for (const particle of state.particles) {
            particle.x += particle.speedX * movement;
            particle.y += particle.speedY * movement;

            if (particle.x < -5) {
                particle.x = state.width + 5;
            } else if (particle.x > state.width + 5) {
                particle.x = -5;
            }

            if (particle.y < -5) {
                particle.y = state.height + 5;
                particle.x = random(0, state.width);
            }
        }
    }

    function updateSculpture() {
        state.pointerX +=
            (state.targetX - state.pointerX) * settings.pointerEase;

        state.pointerY +=
            (state.targetY - state.pointerY) * settings.pointerEase;

        const x = state.pointerX * settings.pointerRange;
        const y = state.pointerY * settings.pointerRange;

        sculpture.style.setProperty("--ah-pointer-x", `${x.toFixed(2)}px`);
        sculpture.style.setProperty("--ah-pointer-y", `${y.toFixed(2)}px`);

        sculpture.style.setProperty(
            "--ah-pointer-rotation",
            `${(-12 + state.pointerX * 2.5).toFixed(2)}deg`
        );
    }

    /* -------------------------------------------------------
       Animation loop
       ------------------------------------------------------- */

    function render(timestamp) {
        if (!state.running || state.destroyed) return;

        state.animationFrame = requestAnimationFrame(render);

        const frameInterval = 1000 / settings.maxFrameRate;

        if (timestamp - state.lastFrame < frameInterval) return;

        const delta = state.lastFrame
            ? timestamp - state.lastFrame
            : frameInterval;

        state.lastFrame = timestamp;
        state.elapsed = timestamp;

        updateParticles(delta);
        updateSculpture();

        clearCanvas();
        drawConnections();

        for (const particle of state.particles) {
            drawParticle(particle, timestamp);
        }
    }

    function start() {
        if (state.running || !canAnimate()) return;

        state.running = true;
        state.lastFrame = 0;

        state.animationFrame = requestAnimationFrame(render);
    }

    function stop() {
        state.running = false;

        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
            state.animationFrame = 0;
        }
    }

    function syncMotionPreference() {
        if (canAnimate()) {
            start();
        } else {
            stop();
            drawStaticFrame();

            sculpture.style.setProperty("--ah-pointer-x", "0px");
            sculpture.style.setProperty("--ah-pointer-y", "0px");
            sculpture.style.setProperty("--ah-pointer-rotation", "-12deg");
        }
    }

    /* -------------------------------------------------------
       Pointer interaction
       ------------------------------------------------------- */

    function handlePointerMove(event) {
        if (
            !finePointer.matches ||
            reducedMotion.matches ||
            !canAnimate()
        ) {
            return;
        }

        state.targetX = clamp(
            (event.clientX / Math.max(1, state.width) - 0.5) * 2,
            -1,
            1
        );

        state.targetY = clamp(
            (event.clientY / Math.max(1, state.height) - 0.5) * 2,
            -1,
            1
        );
    }

    function handlePointerLeave() {
        state.targetX = 0;
        state.targetY = 0;
    }

    /* -------------------------------------------------------
       Visibility and cleanup
       ------------------------------------------------------- */

    function handleVisibilityChange() {
        if (document.hidden) {
            stop();
        } else {
            syncMotionPreference();
        }
    }

    function handleMotionPreferenceChange() {
        syncMotionPreference();
    }

    function handleResize() {
        resizeCanvas();
    }

    function handleScroll() {
        state.scrollY = window.scrollY || 0;

        /*
          Fade the background as the visitor moves down the page.
          The effect is intentionally subtle and never changes
          the position or behaviour of game elements.
        */

        const fade = clamp(
            1 - state.scrollY / Math.max(1, window.innerHeight * 1.25),
            0.28,
            1
        );

        canvas.style.opacity = String(
            reducedMotion.matches ? 0 : 0.9 * fade
        );

        sculpture.style.opacity = String(0.34 * fade);
    }

    function destroy() {
        if (state.destroyed) return;

        state.destroyed = true;
        stop();

        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        if (typeof reducedMotion.removeEventListener === "function") {
            reducedMotion.removeEventListener(
                "change",
                handleMotionPreferenceChange
            );
        } else {
            reducedMotion.removeListener(handleMotionPreferenceChange);
        }
    }

    /* -------------------------------------------------------
       Initialize
       ------------------------------------------------------- */

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
        passive: true
    });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave, {
        passive: true
    });
    window.addEventListener("scroll", handleScroll, {
        passive: true
    });

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener(
            "change",
            handleMotionPreferenceChange
        );
    } else {
        reducedMotion.addListener(handleMotionPreferenceChange);
    }

    resizeCanvas();
    handleScroll();
    syncMotionPreference();

    window.AfterhoursAmbient = {
        destroy,
        refresh: resizeCanvas,
        pause: stop,
        resume: syncMotionPreference
    };
})();