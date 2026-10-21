(() => {
  "use strict";

  const GAME_ID = "echo-chamber";

  const BG = "#171915";
  const IVORY = "#eeeadd";
  const MOSS = "#a2b58b";
  const CLAY = "#c98770";
  const LILAC = "#b4a4ca";
  const SAND = "#d7c79c";
  const MUTED = "#898d80";

  let activeGame = null;

  function startGame(mount, services = {}) {
    if (activeGame) {
      activeGame.destroy();
      activeGame = null;
    }

    const showToast = services.showToast || (() => { });
    const onExit = services.onExit || (() => { });

    mount.innerHTML = `
      <section class="ec-game">
        <style>
          .ec-game {
            overflow: hidden;
            border: 1px solid #eeeadd20;
            border-radius: 18px;
            background: ${BG};
            color: ${IVORY};
            font-family: "DM Sans", sans-serif;
            isolation: isolate;
          }

          .ec-game *,
          .ec-game *::before,
          .ec-game *::after {
            box-sizing: border-box;
          }

          .ec-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 24px;
            border-bottom: 1px solid #eeeadd14;
          }

          .ec-brand,
          .ec-exit,
          .ec-label,
          .ec-kicker,
          .ec-start,
          .ec-footer,
          .ec-progress-label {
            font-family: "DM Mono", monospace;
          }

          .ec-brand {
            color: ${MOSS};
            font-size: 10px;
            letter-spacing: .15em;
          }

          .ec-exit {
            padding: 9px 13px;
            border: 1px solid #eeeadd28;
            border-radius: 999px;
            background: transparent;
            color: ${IVORY};
            font-size: 10px;
            cursor: pointer;
            transition: border-color .2s, color .2s, background .2s;
          }

          .ec-exit:hover {
            border-color: ${MOSS};
            background: #a2b58b12;
            color: ${MOSS};
          }

          .ec-hud {
            display: flex;
            justify-content: center;
            gap: clamp(28px, 9vw, 90px);
            padding: 21px 12px;
            text-align: center;
          }

          .ec-label {
            color: ${MUTED};
            font-size: 9px;
            letter-spacing: .14em;
          }

          .ec-value {
            margin-top: 7px;
            font-size: 25px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
            letter-spacing: -.055em;
          }

          .ec-hud > div:first-child .ec-value {
            color: ${MOSS};
          }

          .ec-arena {
            position: relative;
            display: grid;
            min-height: clamp(390px, 62vh, 640px);
            place-items: center;
            overflow: hidden;
            padding: 32px 20px;
            border-top: 1px solid #eeeadd0b;
            border-bottom: 1px solid #eeeadd14;
            background:
              radial-gradient(ellipse at 50% 45%, #65775a20, transparent 65%),
              #1d201a;
          }

          .ec-play-area {
            width: min(100%, 540px);
            text-align: center;
          }

          .ec-status {
            min-height: 20px;
            margin: 0 0 22px;
            color: ${MUTED};
            font-family: "DM Mono", monospace;
            font-size: 10px;
            letter-spacing: .13em;
            line-height: 1.8;
          }

          .ec-board {
            display: grid;
            width: min(100%, 340px);
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: clamp(12px, 3vw, 19px);
            margin: 0 auto;
          }

          .ec-pad {
            position: relative;
            display: grid;
            min-width: 0;
            aspect-ratio: 1;
            place-items: center;
            overflow: hidden;
            border: 1px solid #eeeadd20;
            border-radius: 22px;
            background: #272a23;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            transition:
              transform .18s ease,
              background .18s ease,
              border-color .18s ease;
          }

          .ec-pad::before {
            position: absolute;
            inset: 10px;
            border: 1px solid #eeeadd0c;
            border-radius: 15px;
            content: "";
            pointer-events: none;
          }

          .ec-pad::after {
            position: absolute;
            width: 35%;
            aspect-ratio: 1;
            border-radius: 50%;
            background: currentColor;
            opacity: .09;
            content: "";
            pointer-events: none;
            transition: transform .22s ease, opacity .22s ease;
          }

          .ec-pad:hover {
            transform: translateY(-2px);
            border-color: #eeeadd50;
          }

          .ec-pad:active {
            transform: scale(.97);
          }

          .ec-pad:focus-visible {
            outline: 2px solid ${IVORY};
            outline-offset: 4px;
          }

          .ec-pad:disabled {
            cursor: default;
          }

          .ec-pad[data-pad="0"] { color: ${MOSS}; }
          .ec-pad[data-pad="1"] { color: ${CLAY}; }
          .ec-pad[data-pad="2"] { color: ${LILAC}; }
          .ec-pad[data-pad="3"] { color: ${SAND}; }

          .ec-pad.is-lit {
            transform: scale(.97);
            border-color: currentColor;
            background: color-mix(in srgb, currentColor 24%, #272a23);
          }

          .ec-pad.is-lit::after {
            transform: scale(1.8);
            opacity: .17;
          }

          .ec-pad.is-lit .ec-shape {
            transform: scale(1.12) rotate(-4deg);
          }

          .ec-shape {
            position: relative;
            z-index: 1;
            display: block;
            width: 39%;
            aspect-ratio: 1;
            border: 2px solid currentColor;
            background: color-mix(in srgb, currentColor 14%, transparent);
            transition: transform .22s ease;
          }

          .ec-pad[data-pad="0"] .ec-shape {
            border-radius: 50% 50% 42% 42%;
          }

          .ec-pad[data-pad="1"] .ec-shape {
            border-radius: 8px 8px 45% 8px;
            transform: rotate(45deg) scale(.82);
          }

          .ec-pad[data-pad="2"] .ec-shape {
            border-radius: 50%;
            clip-path: polygon(50% 0, 100% 100%, 0 100%);
          }

          .ec-pad[data-pad="3"] .ec-shape {
            border-radius: 8px;
            transform: rotate(45deg) scale(.76);
          }

          .ec-pad.is-lit[data-pad="1"] .ec-shape,
          .ec-pad.is-lit[data-pad="3"] .ec-shape {
            transform: rotate(0deg) scale(1.02);
          }

          .ec-progress {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin: 25px auto 0;
          }

          .ec-progress-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #eeeadd27;
            transition: background .2s, transform .2s;
          }

          .ec-progress-dot.is-complete {
            background: ${MOSS};
          }

          .ec-progress-dot.is-current {
            transform: scale(1.5);
            background: ${IVORY};
          }

          .ec-progress-label {
            margin-top: 14px;
            color: ${MUTED};
            font-size: 9px;
            letter-spacing: .1em;
          }

          .ec-overlay {
            position: absolute;
            inset: 0;
            z-index: 3;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #171915df;
            text-align: center;
            backdrop-filter: blur(6px);
          }

          .ec-overlay[hidden] {
            display: none !important;
          }

          .ec-panel {
            width: min(100%, 420px);
          }

          .ec-kicker {
            color: ${MOSS};
            font-size: 9px;
            letter-spacing: .2em;
            line-height: 1.7;
          }

          .ec-title {
            margin: 18px 0;
            font-family: "Space Grotesk", sans-serif;
            font-size: clamp(40px, 9vw, 72px);
            font-weight: 600;
            letter-spacing: -.09em;
            line-height: .9;
          }

          .ec-title span {
            color: ${MOSS};
          }

          .ec-description {
            max-width: 320px;
            margin: 18px auto 24px;
            color: #b3b4a9;
            font-size: 13px;
            line-height: 1.8;
          }

          .ec-start {
            padding: 13px 21px;
            border: 1px solid ${MOSS};
            border-radius: 999px;
            background: ${MOSS};
            color: ${BG};
            font-size: 10px;
            letter-spacing: .055em;
            cursor: pointer;
            transition: transform .2s, background .2s, border-color .2s;
          }

          .ec-start:hover {
            transform: translateY(-2px);
            border-color: #c1d0ad;
            background: #c1d0ad;
          }

          .ec-start:focus-visible,
          .ec-exit:focus-visible {
            outline: 2px solid ${IVORY};
            outline-offset: 4px;
          }

          .ec-footer {
            padding: 18px 14px 21px;
            color: ${MUTED};
            font-size: 9px;
            line-height: 2;
            text-align: center;
          }

          @media (max-width: 540px) {
            .ec-game {
              border-radius: 12px;
            }

            .ec-top {
              padding: 16px 13px;
            }

            .ec-brand {
              font-size: 9px;
              letter-spacing: .09em;
            }

            .ec-hud {
              gap: 24px;
              padding: 18px 8px;
            }

            .ec-value {
              font-size: 21px;
            }

            .ec-arena {
              min-height: 360px;
              padding: 26px 16px;
            }

            .ec-board {
              gap: 12px;
            }

            .ec-pad {
              border-radius: 17px;
            }

            .ec-pad::before {
              inset: 7px;
              border-radius: 11px;
            }

            .ec-footer {
              padding-inline: 8px;
              font-size: 8px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ec-game *,
            .ec-game *::before,
            .ec-game *::after {
              transition-duration: .01ms !important;
              animation-duration: .01ms !important;
            }
          }
        </style>

        <header class="ec-top">
          <div class="ec-brand">AFTERHOURS / ECHO CHAMBER</div>
          <button class="ec-exit" type="button">← EXIT GAME</button>
        </header>

        <div class="ec-hud">
          <div>
            <div class="ec-label">SCORE</div>
            <div class="ec-value" data-score>000000</div>
          </div>
          <div>
            <div class="ec-label">BEST</div>
            <div class="ec-value" data-best>000000</div>
          </div>
          <div>
            <div class="ec-label">ROUND</div>
            <div class="ec-value" data-round>01</div>
          </div>
        </div>

        <div class="ec-arena">
          <div class="ec-play-area">
            <p class="ec-status" data-status aria-live="polite">
              WATCH THE PATTERN
            </p>

            <div class="ec-board" aria-label="Memory sequence pads">
              <button class="ec-pad" data-pad="0" type="button" aria-label="Moss pad">
                <span class="ec-shape"></span>
              </button>
              <button class="ec-pad" data-pad="1" type="button" aria-label="Clay pad">
                <span class="ec-shape"></span>
              </button>
              <button class="ec-pad" data-pad="2" type="button" aria-label="Lilac pad">
                <span class="ec-shape"></span>
              </button>
              <button class="ec-pad" data-pad="3" type="button" aria-label="Sand pad">
                <span class="ec-shape"></span>
              </button>
            </div>

            <div class="ec-progress" data-progress aria-hidden="true"></div>
            <div class="ec-progress-label" data-progress-label>
              A SMALL EXERCISE IN ATTENTION
            </div>
          </div>

          <div class="ec-overlay">
            <div class="ec-panel">
              <div class="ec-kicker" data-kicker>MEMORY STUDY / 004</div>
              <h2 class="ec-title" data-title>ECHO <span>CHAMBER</span></h2>
              <p class="ec-description" data-description>
                Watch the pads light up. Repeat the sequence in the same
                order. Each round adds one more note to remember.
              </p>
              <button class="ec-start" type="button" data-start>
                BEGIN LISTENING ↗
              </button>
            </div>
          </div>
        </div>

        <div class="ec-footer">
          WATCH THE SEQUENCE / REPEAT IT / KEEP THE ECHO ALIVE
        </div>
      </section>
    `;

    const root = mount.querySelector(".ec-game");
    const pads = Array.from(root.querySelectorAll(".ec-pad"));
    const scoreEl = root.querySelector("[data-score]");
    const bestEl = root.querySelector("[data-best]");
    const roundEl = root.querySelector("[data-round]");
    const statusEl = root.querySelector("[data-status]");
    const progressEl = root.querySelector("[data-progress]");
    const progressLabelEl = root.querySelector("[data-progress-label]");
    const overlay = root.querySelector(".ec-overlay");
    const titleEl = root.querySelector("[data-title]");
    const kickerEl = root.querySelector("[data-kicker]");
    const descriptionEl = root.querySelector("[data-description]");
    const startButton = root.querySelector("[data-start]");
    const exitButton = root.querySelector(".ec-exit");

    const STORAGE_KEY = "afterhours-echo-chamber-best";

    let destroyed = false;
    let playing = false;
    let acceptingInput = false;
    let sequence = [];
    let inputIndex = 0;
    let score = 0;
    let best = readBest();
    let startBest = best;
    let round = 1;
    let timers = new Set();
    let sequenceToken = 0;

    bestEl.textContent = formatScore(best);
    roundEl.textContent = "01";

    function readBest() {
      try {
        return Number(localStorage.getItem(STORAGE_KEY)) || 0;
      } catch {
        return 0;
      }
    }

    function saveBest() {
      try {
        localStorage.setItem(STORAGE_KEY, String(best));
      } catch {
        // Storage may be unavailable.
      }
    }

    function formatScore(value) {
      return Math.floor(value).toString().padStart(6, "0");
    }

    function syncHUD() {
      scoreEl.textContent = formatScore(score);
      bestEl.textContent = formatScore(best);
      roundEl.textContent = String(round).padStart(2, "0");
    }

    function schedule(callback, delay) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!destroyed) callback();
      }, delay);

      timers.add(timer);
      return timer;
    }

    function clearTimers() {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }

      timers.clear();
    }

    function setPadLit(index, lit) {
      const pad = pads[index];
      if (!pad) return;

      pad.classList.toggle("is-lit", lit);
    }

    function flashPad(index, duration = 360) {
      setPadLit(index, true);

      schedule(() => {
        setPadLit(index, false);
      }, duration);
    }

    function setInputEnabled(enabled) {
      acceptingInput = enabled;

      pads.forEach((pad) => {
        pad.disabled = !enabled;
      });
    }

    function renderProgress() {
      progressEl.replaceChildren();

      const count = Math.min(sequence.length, 12);

      for (let i = 0; i < count; i++) {
        const dot = document.createElement("span");
        dot.className = "ec-progress-dot";

        if (i < inputIndex) {
          dot.classList.add("is-complete");
        } else if (i === inputIndex && acceptingInput) {
          dot.classList.add("is-current");
        }

        progressEl.append(dot);
      }

      progressLabelEl.textContent = acceptingInput
        ? `${inputIndex} OF ${sequence.length} NOTES REPEATED`
        : `ROUND ${String(round).padStart(2, "0")} / LISTEN CLOSELY`;
    }

    function showOverlay(kicker, title, description, button) {
      kickerEl.textContent = kicker;

      if (title === "ECHO CHAMBER") {
        titleEl.innerHTML = 'ECHO <span>CHAMBER</span>';
      } else {
        titleEl.textContent = title;
      }

      descriptionEl.textContent = description;
      startButton.textContent = button;
      overlay.hidden = false;
    }

    function reset() {
      clearTimers();
      sequenceToken++;

      playing = true;
      acceptingInput = false;
      sequence = [];
      inputIndex = 0;
      score = 0;
      round = 1;

      pads.forEach((pad) => {
        pad.classList.remove("is-lit");
        pad.disabled = true;
      });

      statusEl.textContent = "WATCH THE PATTERN";
      syncHUD();
      renderProgress();
    }

    function start() {
      if (destroyed || playing) return;

      reset();
      overlay.hidden = true;
      startBest = best;
      nextRound();
    }

    function nextRound() {
      if (destroyed || !playing) return;

      acceptingInput = false;
      setInputEnabled(false);
      inputIndex = 0;
      sequence.push(Math.floor(Math.random() * pads.length));

      round = sequence.length;
      syncHUD();
      renderProgress();

      statusEl.textContent = "WATCH THE PATTERN";

      const token = ++sequenceToken;
      let index = 0;

      schedule(function showNext() {
        if (
          destroyed ||
          !playing ||
          token !== sequenceToken
        ) return;

        if (index >= sequence.length) {
          schedule(() => {
            if (token !== sequenceToken || !playing) return;

            acceptingInput = true;
            setInputEnabled(true);
            statusEl.textContent = "YOUR TURN / REPEAT IT";
            renderProgress();
          }, 350);

          return;
        }

        flashPad(sequence[index], 330);
        index++;

        schedule(showNext, 620);
      }, 420);
    }

    function handlePadPress(event) {
      if (!playing || !acceptingInput || destroyed) return;

      const index = Number(event.currentTarget.dataset.pad);

      if (!Number.isInteger(index) || index < 0 || index >= pads.length) {
        return;
      }

      flashPad(index, 180);

      if (index !== sequence[inputIndex]) {
        endGame();
        return;
      }

      inputIndex++;
      score += 10 * round;

      if (score > best) {
        best = score;
        saveBest();
      }

      syncHUD();
      renderProgress();

      if (inputIndex >= sequence.length) {
        acceptingInput = false;
        setInputEnabled(false);

        score += 25 * round;
        syncHUD();

        statusEl.textContent = "PATTERN HELD / NEXT ROUND";

        schedule(() => {
          if (!destroyed && playing) nextRound();
        }, 650);
      }
    }

    function endGame() {
      if (!playing) return;

      playing = false;
      acceptingInput = false;
      sequenceToken++;
      clearTimers();
      setInputEnabled(false);

      pads.forEach((pad) => pad.classList.remove("is-lit"));

      if (score > startBest) {
        showToast("NEW ECHO CHAMBER RECORD ✳");
      }

      syncHUD();
      statusEl.textContent = "THE ECHO HAS FADED";
      renderProgress();

      showOverlay(
        "PATTERN BROKEN / TRY AGAIN",
        "LOST THE THREAD.",
        `You reached round ${round} with ${formatScore(score)} points. Listen again and see how far the pattern takes you.`,
        "LISTEN AGAIN ↻"
      );
    }

    function handleStart() {
      start();
    }

    function handleExit() {
      onExit();
    }

    function handleVisibilityChange() {
      if (document.hidden && playing) {
        playing = false;
        acceptingInput = false;
        sequenceToken++;
        clearTimers();
        setInputEnabled(false);

        pads.forEach((pad) => pad.classList.remove("is-lit"));

        showOverlay(
          "MEMORY STUDY / PAUSED",
          "PAUSED.",
          "The current sequence has been stopped. Start again when you're ready.",
          "START AGAIN ↗"
        );
      }
    }

    function destroy() {
      if (destroyed) return;

      destroyed = true;
      playing = false;
      acceptingInput = false;
      sequenceToken++;
      clearTimers();

      pads.forEach((pad) => {
        pad.removeEventListener("click", handlePadPress);
      });

      window.removeEventListener("keydown", handlePadKey);
      startButton.removeEventListener("click", handleStart);
      exitButton.removeEventListener("click", handleExit);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (activeGame === instance) {
        activeGame = null;
      }
    }

    const instance = { destroy };

    pads.forEach((pad) => {
      pad.disabled = true;
      pad.addEventListener("click", handlePadPress);
    });

    // Keyboard: 1-4 or Q W / A S (same layout as the pads).
    const padKeyMap = {
      Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
      Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
      KeyQ: 0, KeyW: 1, KeyA: 2, KeyS: 3
    };

    function handlePadKey(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

      const index = padKeyMap[event.code];

      if (index === undefined || !playing || !acceptingInput || destroyed) return;

      event.preventDefault();
      pads[index]?.click();
    }

    window.addEventListener("keydown", handlePadKey);
    startButton.addEventListener("click", handleStart);
    exitButton.addEventListener("click", handleExit);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    activeGame = instance;

    syncHUD();
    renderProgress();

    window.AfterhoursGames.setStopper(destroy);
  }

  window.AfterhoursGames = window.AfterhoursGames || {};
  window.AfterhoursGames[GAME_ID] = (mount, services) => {
    startGame(mount, services);
  };
})();