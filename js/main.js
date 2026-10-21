
(() => {
    "use strict";

    const games = (window.AfterhoursGames = window.AfterhoursGames || {});
    const scriptBase = new URL(".", document.currentScript.src);

    const GAME_FILES = {
        lightspeed: "lightspeed.js",
        voidrun: "voidrun.js",
        "echo-chamber": "echo-chamber.js",
        drift: "drift.js"
    };

    const GAME_NAMES = {
        lightspeed: "Lightspeed",
        voidrun: "Voidrun",
        "echo-chamber": "Echo Chamber",
        drift: "Drift"
    };

    const stage = document.querySelector("#game-stage");
    const mount = document.querySelector("#game-mount");
    const backButton = document.querySelector("#back-to-arcade");
    const toast = document.querySelector("#toast");
    const stageKicker = document.querySelector("#stage-kicker");

    if (!stage || !mount) {
        console.error("AFTERHOURS: #game-stage or #game-mount is missing.");
        return;
    }

    let currentGameId = null;
    let currentStopper = null;
    let isOpening = false;
    let isClosing = false;
    let toastTimer = null;

    const loadingScripts = new Map();

    // Compatibility for browsers without CanvasRenderingContext2D.roundRect.
    if (
        window.CanvasRenderingContext2D &&
        !CanvasRenderingContext2D.prototype.roundRect
    ) {
        CanvasRenderingContext2D.prototype.roundRect = function (
            x, y, width, height, radius = 0
        ) {
            const r = Math.min(
                Array.isArray(radius) ? radius[0] : radius,
                width / 2,
                height / 2
            );

            this.moveTo(x + r, y);
            this.arcTo(x + width, y, x + width, y + height, r);
            this.arcTo(x + width, y + height, x, y + height, r);
            this.arcTo(x, y + height, x, y, r);
            this.arcTo(x, y, x + width, y, r);
            this.closePath();
            return this;
        };
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    games.setStopper = (stopper) => {
        currentStopper = typeof stopper === "function" ? stopper : null;
    };

    games.stopCurrent = () => {
        const stop = currentStopper;
        currentStopper = null;

        if (typeof stop === "function") {
            try {
                stop();
            } catch (error) {
                console.error("AFTERHOURS cleanup error:", error);
            }
        }
    };

    function showToast(message) {
        if (!toast) {
            console.info("AFTERHOURS:", message);
            return;
        }

        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.hidden = false;
        toast.classList.remove("is-leaving");

        requestAnimationFrame(() => {
            toast.classList.add("show", "is-visible");
        });

        toastTimer = setTimeout(() => {
            toast.classList.remove("show", "is-visible");
            toast.hidden = true;
        }, 2800);
    }

    function setArcadeVisible(visible) {
        const elements = [
            document.querySelector("#arcade"),
            document.querySelector("#about"),
            document.querySelector(".ah-marquee"),
            document.querySelector(".ah-hero")
        ];

        elements.forEach((element) => {
            if (element) element.hidden = !visible;
        });

        stage.hidden = visible;
        document.body.classList.toggle("game-is-open", !visible);
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: reducedMotion.matches ? "auto" : "smooth"
        });
    }

    function loadGameScript(gameId) {
        if (typeof games[gameId] === "function") {
            return Promise.resolve(games[gameId]);
        }

        if (!GAME_FILES[gameId]) {
            return Promise.reject(new Error(`Unknown game: ${gameId}`));
        }

        if (loadingScripts.has(gameId)) {
            return loadingScripts.get(gameId);
        }

        const promise = new Promise((resolve, reject) => {
            const src = new URL(GAME_FILES[gameId], scriptBase).href;

            // Reuse a script tag if the browser already has one.
            let script = [...document.scripts].find(
                (item) => item.src === src
            );

            if (script?.dataset.loaded === "true") {
                if (typeof games[gameId] === "function") {
                    resolve(games[gameId]);
                } else {
                    reject(new Error(
                        `${GAME_FILES[gameId]} loaded but did not register "${gameId}".`
                    ));
                }
                return;
            }

            if (!script) {
                script = document.createElement("script");
                script.src = src;
                script.async = true;
                script.dataset.afterhoursGame = gameId;
            }

            const onLoad = () => {
                script.dataset.loaded = "true";

                if (typeof games[gameId] === "function") {
                    resolve(games[gameId]);
                } else {
                    reject(new Error(
                        `${GAME_FILES[gameId]} did not register its game.`
                    ));
                }
            };

            const onError = () => {
                reject(new Error(`Could not load ${src}`));
            };

            script.addEventListener("load", onLoad, { once: true });
            script.addEventListener("error", onError, { once: true });

            // If an existing script already finished loading, check registration.
            if (
                script.isConnected &&
                script.dataset.loaded === "true"
            ) {
                onLoad();
            } else if (!script.isConnected) {
                document.head.appendChild(script);
            }
        }).finally(() => {
            loadingScripts.delete(gameId);
        });

        loadingScripts.set(gameId, promise);
        return promise;
    }

    function showGameError(error) {
        console.error("AFTERHOURS game launch error:", error);

        mount.replaceChildren();

        const panel = document.createElement("div");
        panel.className = "ah-game-error";

        const heading = document.createElement("h3");
        heading.textContent = "This round didn't load.";

        const message = document.createElement("p");
        message.textContent =
            "The game file could not start. Check that its JavaScript file exists beside index.html, then refresh.";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "ah-button";
        button.textContent = "Back to the arcade";
        button.addEventListener("click", closeGame);

        panel.append(heading, message, button);
        mount.append(panel);
    }

    async function openGame(gameId) {
        if (isOpening || isClosing) return;

        if (!GAME_FILES[gameId]) {
            showToast("That game isn't recognised.");
            return;
        }

        isOpening = true;
        currentGameId = gameId;

        try {
            mount.replaceChildren();

            if (stageKicker) {
                stageKicker.textContent = GAME_NAMES[gameId];
            }

            setArcadeVisible(false);
            window.AfterhoursBackground?.setLoad(
                gameId === "drift" ? "paused" : "light"
            );
            scrollToTop();

            const loading = document.createElement("p");
            loading.className = "ah-game-loading";
            loading.textContent = `Opening ${GAME_NAMES[gameId]}…`;
            mount.append(loading);

            const game = await loadGameScript(gameId);

            // User may have returned to the arcade while the file loaded.
            if (currentGameId !== gameId || isClosing) return;

            mount.replaceChildren();

            game(mount, {
                showToast,
                onExit: closeGame
            });
        } catch (error) {
            if (currentGameId === gameId) {
                showGameError(error);
            }
        } finally {
            isOpening = false;
        }
    }

    function closeGame() {
        if (isClosing || (!currentGameId && stage.hidden)) return;

        isClosing = true;

        try {
            currentGameId = null;
            games.stopCurrent();
            mount.replaceChildren();

            setArcadeVisible(true);
            window.AfterhoursBackground?.setLoad("full");

            document.querySelector("#arcade")?.scrollIntoView({
                block: "start",
                behavior: reducedMotion.matches ? "auto" : "smooth"
            });
        } finally {
            isClosing = false;
        }
    }

    // Delegation means clicks keep working even if the cards are recreated.
    document.addEventListener("click", (event) => {
        const card = event.target.closest("[data-open-game]");

        if (!card) return;

        event.preventDefault();
        openGame(card.dataset.openGame);
    });

    backButton?.addEventListener("click", closeGame);

    window.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            currentGameId &&
            !isOpening &&
            !isClosing
        ) {
            closeGame();
        }
    });

    console.info("AFTERHOURS launcher ready. Game cards are connected.");
})();