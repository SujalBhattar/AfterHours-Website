(() => {
    "use strict";

    // Older Safari/Firefox lack CanvasRenderingContext2D.roundRect (Voidrun uses it).
    if (
        window.CanvasRenderingContext2D &&
        !CanvasRenderingContext2D.prototype.roundRect
    ) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
            const radius = Math.min(Array.isArray(r) ? r[0] : r, w / 2, h / 2);
            this.moveTo(x + radius, y);
            this.arcTo(x + w, y, x + w, y + h, radius);
            this.arcTo(x + w, y + h, x, y + h, radius);
            this.arcTo(x, y + h, x, y, radius);
            this.arcTo(x, y, x + w, y, radius);
            this.closePath();
            return this;
        };
    }

    const games = (window.AfterhoursGames = window.AfterhoursGames || {});

    let currentGameId = null;
    let currentStopper = null;
    let isOpening = false;
    let isClosing = false;
    let toastTimer = null;

    const stage = document.querySelector("#game-stage");
    const mount = document.querySelector("#game-mount");
    const backButton = document.querySelector("#back-to-arcade");
    const toast = document.querySelector("#toast");
    const stageKicker = document.querySelector("#stage-kicker");

    const gameNames = {
        lightspeed: "Lightspeed",
        voidrun: "Voidrun",
        "echo-chamber": "Echo Chamber",
        drift: "Drift"
    };

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    games.setStopper = (stopper) => {
        currentStopper =
            typeof stopper === "function" ? stopper : null;
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

    if (!stage || !mount) {
        console.error(
            "AFTERHOURS: Required game-stage or game-mount element is missing."
        );
        return;
    }

    function showToast(message) {
        if (!toast) {
            console.info("AFTERHOURS:", message);
            return;
        }

        window.clearTimeout(toastTimer);

        toast.textContent = String(message);
        toast.hidden = false;
        toast.classList.remove("is-leaving");

        requestAnimationFrame(() => {
            toast.classList.add("show", "is-visible");
        });

        toastTimer = window.setTimeout(() => {
            toast.classList.remove("show", "is-visible");
            toast.hidden = true;
        }, 2600);
    }

    function setArcadeVisible(visible) {
        const arcade = document.querySelector("#arcade");
        const about = document.querySelector("#about");
        const marquee = document.querySelector(".ah-marquee");
        const hero = document.querySelector(".ah-hero");

        if (arcade) arcade.hidden = !visible;
        if (about) about.hidden = !visible;
        if (marquee) marquee.hidden = !visible;
        if (hero) hero.hidden = !visible;

        stage.hidden = visible;
        document.body.classList.toggle("game-is-open", !visible);
    }

    function scrollToStage() {
        window.scrollTo({
            top: 0,
            behavior: reducedMotion.matches ? "auto" : "smooth"
        });
    }

    function closeGame() {
        if (isClosing || (!currentGameId && stage.hidden)) {
            return;
        }

        isClosing = true;

        try {
            games.stopCurrent();

            currentGameId = null;
            isOpening = false;

            mount.replaceChildren();
            setArcadeVisible(true);
            window.AfterhoursBackground?.setLoad("full");

            document.querySelector("#arcade")?.scrollIntoView({
                block: "start",
                behavior: reducedMotion.matches ? "auto" : "smooth"
            });

            const previousButton = document.querySelector(
                `[data-open-game="${CSS.escape(lastGameId || "lightspeed")}"]`
            );

            if (previousButton) {
                previousButton.focus({ preventScroll: true });
            }
        } finally {
            isClosing = false;
        }
    }

    let lastGameId = "lightspeed";

    function renderGameError(error) {
        console.error("AFTERHOURS game launch error:", error);

        mount.replaceChildren();

        const panel = document.createElement("div");
        panel.className = "ah-game-error";

        const heading = document.createElement("h3");
        heading.textContent = "This round didn't load.";

        const message = document.createElement("p");
        message.textContent =
            "Something went wrong while opening the game. Head back and try again.";

        const button = document.createElement("button");
        button.id = "game-error-back";
        button.type = "button";
        button.className = "ah-button";
        button.textContent = "Back to the arcade";
        button.addEventListener("click", closeGame);

        panel.append(heading, message, button);
        mount.append(panel);

        button.focus({ preventScroll: true });
    }

    function openGame(gameId) {
        if (isOpening || isClosing) return;

        const game = games[gameId];

        if (typeof game !== "function") {
            console.error(
                `AFTERHOURS: Game "${gameId}" is not registered.`
            );
            showToast("This game isn't available right now.");
            return;
        }

        isOpening = true;
        lastGameId = gameId;

        try {
            games.stopCurrent();

            currentGameId = gameId;
            mount.replaceChildren();

            if (stageKicker) {
                stageKicker.textContent =
                    gameNames[gameId] || "Now playing";
            }

            setArcadeVisible(false);
            window.AfterhoursBackground?.setLoad(
                gameId === "drift" ? "paused" : "light"
            );
            scrollToStage();

            game(mount, {
                showToast,
                onExit: closeGame
            });
        } catch (error) {
            games.stopCurrent();
            currentGameId = null;

            renderGameError(error);
        } finally {
            isOpening = false;
        }
    }

    document.querySelectorAll("[data-open-game]").forEach((button) => {
        button.addEventListener("click", () => {
            openGame(button.dataset.openGame);
        });
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

    console.log("AFTERHOURS arcade launcher initialized.");
})();