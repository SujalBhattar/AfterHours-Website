
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
  const COLORS = [MOSS, CLAY, LILAC, SAND];
  const STORAGE_KEY = "afterhours-echo-chamber-best";

  let activeGame = null;

  function startGame(mount, services = {}) {
    if (activeGame) activeGame.destroy();

    const showToast = services.showToast || (() => { });
    const onExit = services.onExit || (() => { });

    mount.innerHTML = `
      <section class="ec-game">
        <style>
          .ec-game {
            --ec-bg:${BG};--ec-ivory:${IVORY};--ec-moss:${MOSS};
            position:relative;isolation:isolate;overflow:hidden;
            border:1px solid #eeeadd20;border-radius:18px;
            color:var(--ec-ivory);background:var(--ec-bg);
            font-family:"DM Sans",sans-serif;
          }
          .ec-game *,.ec-game *::before,.ec-game *::after{box-sizing:border-box}
          .ec-top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid #eeeadd14}
          .ec-brand,.ec-exit,.ec-label,.ec-kicker,.ec-start,.ec-footer,.ec-progress-label,.ec-status,.ec-mini{font-family:"DM Mono",monospace}
          .ec-brand{color:${MOSS};font-size:10px;letter-spacing:.15em}
          .ec-exit{padding:9px 13px;border:1px solid #eeeadd28;border-radius:99px;color:${IVORY};background:transparent;font-size:10px;cursor:pointer}
          .ec-exit:hover{border-color:${MOSS};color:${MOSS}}
          .ec-hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:19px 12px;text-align:center}
          .ec-label{color:${MUTED};font-size:9px;letter-spacing:.12em}
          .ec-value{margin-top:7px;font-size:clamp(17px,3vw,25px);font-weight:500;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
          .ec-stat:first-child .ec-value{color:${MOSS}}
          .ec-arena{position:relative;display:grid;min-height:clamp(390px,62vh,640px);place-items:center;overflow:hidden;padding:30px 18px;border-block:1px solid #eeeadd14;background:radial-gradient(ellipse at 50% 45%,#65775a26,transparent 65%),#1d201a}
          .ec-orbit{position:absolute;width:min(74vw,440px);aspect-ratio:1;border:1px solid #a2b58b0d;border-radius:50%;pointer-events:none}
          .ec-orbit:before,.ec-orbit:after{position:absolute;inset:10%;border:1px solid #a2b58b0b;border-radius:50%;content:""}
          .ec-orbit:after{inset:25%}
          .ec-play-area{position:relative;z-index:1;width:min(100%,470px);text-align:center}
          .ec-status{min-height:18px;margin:0 0 18px;color:${MUTED};font-size:10px;letter-spacing:.1em;line-height:1.8}
          .ec-board{display:grid;width:min(100%,350px);grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(11px,3vw,17px);margin:auto}
          .ec-pad{position:relative;display:grid;min-width:0;aspect-ratio:1;place-items:center;overflow:hidden;border:1px solid #eeeadd20;border-radius:22px;background:#272a23;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .16s,border-color .18s,background .18s,box-shadow .18s}
          .ec-pad:before{position:absolute;inset:9px;border:1px solid #eeeadd0c;border-radius:15px;content:"";pointer-events:none}
          .ec-pad:after{position:absolute;width:35%;aspect-ratio:1;border-radius:50%;background:currentColor;opacity:.07;content:"";transition:transform .2s,opacity .2s}
          .ec-pad[data-pad="0"]{color:${MOSS}}
          .ec-pad[data-pad="1"]{color:${CLAY}}
          .ec-pad[data-pad="2"]{color:${LILAC}}
          .ec-pad[data-pad="3"]{color:${SAND}}
          .ec-pad:hover:not(:disabled){transform:translateY(-2px);border-color:currentColor}
          .ec-pad:active:not(:disabled){transform:scale(.96)}
          .ec-pad:focus-visible{outline:2px solid ${IVORY};outline-offset:4px}
          .ec-pad:disabled{cursor:default}
          .ec-pad.is-lit{transform:scale(.97);border-color:currentColor;background:color-mix(in srgb,currentColor 25%,#272a23);box-shadow:inset 0 0 35px color-mix(in srgb,currentColor 13%,transparent),0 0 25px color-mix(in srgb,currentColor 15%,transparent)}
          .ec-pad.is-lit:after{transform:scale(1.8);opacity:.18}
          .ec-shape{position:relative;z-index:1;display:block;width:39%;aspect-ratio:1;border:2px solid currentColor;background:color-mix(in srgb,currentColor 14%,transparent);transition:transform .2s}
          .ec-pad[data-pad="0"] .ec-shape{border-radius:50% 50% 42% 42%}
          .ec-pad[data-pad="1"] .ec-shape{border-radius:8px 8px 45% 8px;transform:rotate(45deg) scale(.82)}
          .ec-pad[data-pad="2"] .ec-shape{clip-path:polygon(50% 0,100% 100%,0 100%);border-radius:4px}
          .ec-pad[data-pad="3"] .ec-shape{border-radius:7px;transform:rotate(45deg) scale(.76)}
          .ec-pad.is-lit[data-pad="1"] .ec-shape,.ec-pad.is-lit[data-pad="3"] .ec-shape{transform:rotate(0) scale(1.08)}
          .ec-pad.is-lit .ec-shape{transform:scale(1.12)}
          .ec-progress{display:flex;justify-content:center;flex-wrap:wrap;gap:7px;max-width:330px;margin:22px auto 0}
          .ec-progress-dot{width:5px;height:5px;border-radius:50%;background:#eeeadd28;transition:background .18s,transform .18s}
          .ec-progress-dot.is-complete{background:${MOSS}}
          .ec-progress-dot.is-current{transform:scale(1.6);background:${IVORY}}
          .ec-progress-label{margin-top:13px;color:${MUTED};font-size:9px;letter-spacing:.1em;line-height:1.8}
          .ec-overlay{position:absolute;inset:0;z-index:4;display:grid;place-items:center;padding:24px;background:#171915e3;text-align:center;backdrop-filter:blur(7px)}
          .ec-overlay[hidden]{display:none!important}
          .ec-panel{width:min(100%,420px)}
          .ec-kicker{color:${MOSS};font-size:9px;letter-spacing:.2em;line-height:1.8}
          .ec-title{margin:18px 0;font-family:"Space Grotesk",sans-serif;font-size:clamp(40px,9vw,72px);font-weight:600;letter-spacing:-.09em;line-height:.92}
          .ec-title span{color:${MOSS}}
          .ec-description{max-width:340px;margin:18px auto 24px;color:#b3b4a9;font-size:13px;line-height:1.8}
          .ec-start{padding:13px 21px;border:1px solid ${MOSS};border-radius:99px;background:${MOSS};color:${BG};font-size:10px;letter-spacing:.055em;cursor:pointer;transition:transform .2s,background .2s}
          .ec-start:hover{transform:translateY(-2px);background:#c1d0ad}
          .ec-start:focus-visible,.ec-exit:focus-visible{outline:2px solid ${IVORY};outline-offset:4px}
          .ec-secondary{display:block;margin:13px auto 0;padding:7px;border:0;background:transparent;color:${MUTED};font:9px "DM Mono",monospace;letter-spacing:.1em;cursor:pointer}
          .ec-secondary:hover{color:${IVORY}}
          .ec-footer{padding:17px 12px 20px;color:${MUTED};font-size:9px;line-height:2;text-align:center}
          .ec-key{display:inline-block;margin:0 2px;padding:1px 5px;border:1px solid #eeeadd29;border-radius:4px;color:${IVORY}}
          .ec-flash{animation:ec-flash .24s ease}
          @keyframes ec-flash{50%{filter:brightness(1.35)}}
          @media(max-width:540px){
            .ec-game{border-radius:12px}.ec-top{padding:15px 12px}
            .ec-brand{font-size:9px;letter-spacing:.08em}
            .ec-hud{gap:4px;padding:16px 5px}
            .ec-arena{min-height:360px;padding:25px 16px}
            .ec-board{gap:12px}.ec-pad{border-radius:17px}
            .ec-pad:before{inset:7px;border-radius:11px}
            .ec-footer{padding-inline:7px;font-size:8px}
          }
          @media(prefers-reduced-motion:reduce){.ec-game *,.ec-game *:before,.ec-game *:after{transition:none!important;animation:none!important}}
        </style>

        <header class="ec-top">
          <div class="ec-brand">AFTERHOURS / ECHO CHAMBER</div>
          <button class="ec-exit" type="button">← EXIT GAME</button>
        </header>

        <div class="ec-hud">
          <div class="ec-stat"><div class="ec-label">SCORE</div><div class="ec-value" data-score>000000</div></div>
          <div class="ec-stat"><div class="ec-label">BEST</div><div class="ec-value" data-best>000000</div></div>
          <div class="ec-stat"><div class="ec-label">ROUND</div><div class="ec-value" data-round>01</div></div>
          <div class="ec-stat"><div class="ec-label">STREAK</div><div class="ec-value" data-streak>×0</div></div>
        </div>

        <div class="ec-arena">
          <div class="ec-orbit"></div>
          <div class="ec-play-area">
            <p class="ec-status" data-status aria-live="polite">WATCH THE PATTERN</p>
            <div class="ec-board" aria-label="Memory sequence pads">
              <button class="ec-pad" data-pad="0" type="button" aria-label="Moss pad" disabled><span class="ec-shape"></span></button>
              <button class="ec-pad" data-pad="1" type="button" aria-label="Clay pad" disabled><span class="ec-shape"></span></button>
              <button class="ec-pad" data-pad="2" type="button" aria-label="Lilac pad" disabled><span class="ec-shape"></span></button>
              <button class="ec-pad" data-pad="3" type="button" aria-label="Sand pad" disabled><span class="ec-shape"></span></button>
            </div>
            <div class="ec-progress" data-progress aria-hidden="true"></div>
            <div class="ec-progress-label" data-progress-label>A SMALL EXERCISE IN ATTENTION</div>
          </div>

          <div class="ec-overlay" data-overlay>
            <div class="ec-panel">
              <div class="ec-kicker" data-kicker>MEMORY STUDY / 004</div>
              <h2 class="ec-title" data-title>ECHO <span>CHAMBER</span></h2>
              <p class="ec-description" data-description>Watch the pads light up. Repeat the sequence in the same order. Each round adds one more note to remember.</p>
              <button class="ec-start" type="button" data-start>BEGIN LISTENING ↗</button>
              <button class="ec-secondary" type="button" data-mode>MODE: STANDARD</button>
            </div>
          </div>
        </div>

        <div class="ec-footer">
          WATCH THE SEQUENCE / REPEAT IT / KEEP THE ECHO ALIVE
          <br><span class="ec-key">1</span><span class="ec-key">2</span><span class="ec-key">3</span><span class="ec-key">4</span> KEYBOARD PADS · <span class="ec-key">ESC</span> EXIT
        </div>
      </section>
    `;

    const root = mount.querySelector(".ec-game");
    const pads = [...root.querySelectorAll(".ec-pad")];
    const scoreEl = root.querySelector("[data-score]");
    const bestEl = root.querySelector("[data-best]");
    const roundEl = root.querySelector("[data-round]");
    const streakEl = root.querySelector("[data-streak]");
    const statusEl = root.querySelector("[data-status]");
    const progressEl = root.querySelector("[data-progress]");
    const progressLabelEl = root.querySelector("[data-progress-label]");
    const overlay = root.querySelector("[data-overlay]");
    const titleEl = root.querySelector("[data-title]");
    const kickerEl = root.querySelector("[data-kicker]");
    const descriptionEl = root.querySelector("[data-description]");
    const startButton = root.querySelector("[data-start]");
    const modeButton = root.querySelector("[data-mode]");
    const exitButton = root.querySelector(".ec-exit");

    let destroyed = false;
    let state = "menu";
    let sequence = [];
    let inputIndex = 0;
    let score = 0;
    let best = readBest();
    let round = 0;
    let streak = 0;
    let roundPerfect = true;
    let timers = new Set();
    let token = 0;
    let modeIndex = 0;
    let modeBeforePause = "menu";
    let lastInputAt = 0;
    let pauseSnapshot = null;
    let mirrorRound = false;
    let mirrorClears = 0;

    const modes = [
      { name: "STANDARD", speed: 620, flash: 340, gap: 260, points: 10 },
      { name: "QUICK", speed: 430, flash: 230, gap: 150, points: 15 },
      { name: "ZEN", speed: 800, flash: 470, gap: 420, points: 8 }
    ];

    function readBest() {
      try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; }
      catch { return 0; }
    }

    function saveBest() {
      try { localStorage.setItem(STORAGE_KEY, String(best)); }
      catch { }
    }

    function formatScore(n) {
      return Math.max(0, Math.floor(n)).toString().padStart(6, "0");
    }

    function syncHUD() {
      scoreEl.textContent = formatScore(score);
      bestEl.textContent = formatScore(best);
      roundEl.textContent = String(round).padStart(2, "0");
      streakEl.textContent = "×" + streak;
    }

    function schedule(fn, delay, ownToken = token) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!destroyed && ownToken === token) fn();
      }, delay);
      timers.add(timer);
      return timer;
    }

    function clearTimers() {
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    }

    function invalidateTimers() {
      token++;
      clearTimers();
    }

    function setLit(index, lit) {
      pads[index]?.classList.toggle("is-lit", lit);
    }

    function flashPad(index, duration = modes[modeIndex].flash) {
      if (!pads[index]) return;
      setLit(index, true);
      schedule(() => setLit(index, false), duration);
    }

    function enablePads(enabled) {
      pads.forEach(pad => { pad.disabled = !enabled; });
    }

    function renderProgress() {
      progressEl.replaceChildren();
      const maxDots = 32;
      const count = Math.min(sequence.length, maxDots);

      for (let i = 0; i < count; i++) {
        const dot = document.createElement("span");
        dot.className = "ec-progress-dot";
        if (i < inputIndex) dot.classList.add("is-complete");
        else if (i === inputIndex && state === "input") dot.classList.add("is-current");
        progressEl.append(dot);
      }

      if (sequence.length > maxDots) {
        const extra = document.createElement("span");
        extra.className = "ec-progress-dot is-complete";
        extra.title = `${sequence.length - maxDots} more notes`;
        progressEl.append(extra);
      }

      progressLabelEl.textContent = state === "input"
        ? mirrorRound
          ? `MIRROR ROUND · ${inputIndex} OF ${sequence.length} / REVERSE ORDER`
          : `${inputIndex} OF ${sequence.length} NOTES REPEATED`
        : state === "watch"
          ? mirrorRound
            ? `ROUND ${String(round).padStart(2, "0")} / REVERSE ORDER CHALLENGE`
            : `ROUND ${String(round).padStart(2, "0")} / LISTEN CLOSELY`
          : state === "between"
            ? "PATTERN HELD / PREPARING NEXT ROUND"
            : "A SMALL EXERCISE IN ATTENTION";
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
      invalidateTimers();
      sequence = [];
      inputIndex = 0;
      mirrorRound = false;
      mirrorClears = 0;
      score = 0;
      round = 0;
      streak = 0;
      roundPerfect = true;
      lastInputAt = 0;
      pauseSnapshot = null;
      pads.forEach(pad => {
        pad.classList.remove("is-lit");
        pad.disabled = true;
      });
      syncHUD();
      renderProgress();
    }

    function start() {
      if (destroyed || state === "watch" || state === "input" || state === "between") return;
      reset();
      state = "watch";
      overlay.hidden = true;
      nextRound();
    }

    function nextRound() {
      if (destroyed) return;
      invalidateTimers();
      state = "watch";
      enablePads(false);
      inputIndex = 0;
      roundPerfect = true;
      sequence.push(Math.floor(Math.random() * pads.length));
      round = sequence.length;
      mirrorRound = round > 0 && round % 5 === 0;
      syncHUD();
      renderProgress();
      statusEl.textContent = mirrorRound
        ? "MIRROR ROUND / WATCH, THEN REPEAT BACKWARDS"
        : "WATCH THE PATTERN";
      if (mirrorRound) showToast("MIRROR ROUND · REVERSE THE ECHO");
      const currentToken = token;
      let i = 0;
      const config = modes[modeIndex];
      const speedBoost = Math.max(.67, 1 - Math.max(0, round - 8) * .018);
      const flash = Math.max(130, config.flash * speedBoost);
      const gap = Math.max(75, config.gap * speedBoost);

      schedule(function showNext() {
        if (state !== "watch") return;

        if (i >= sequence.length) {
          schedule(() => {
            state = "input";
            enablePads(true);
            statusEl.textContent = "YOUR TURN / REPEAT IT";
            renderProgress();
          }, Math.max(220, gap), currentToken);
          return;
        }

        flashPad(sequence[i], flash);
        i++;
        schedule(showNext, flash + gap, currentToken);
      }, 400, currentToken);
    }

    function handlePadPress(event) {
      if (destroyed || state !== "input") return;
      const index = Number(event.currentTarget.dataset.pad);
      if (!Number.isInteger(index) || index < 0 || index > 3) return;

      flashPad(index, 170);

      const expectedIndex = mirrorRound
        ? sequence[sequence.length - 1 - inputIndex]
        : sequence[inputIndex];

      if (index !== expectedIndex) {
        roundPerfect = false;
        streak = 0;
        syncHUD();
        pads[index].classList.add("ec-flash");
        schedule(() => pads[index]?.classList.remove("ec-flash"), 250);
        endGame();
        return;
      }

      const now = performance.now();
      const quick = lastInputAt && now - lastInputAt < 850;
      lastInputAt = now;

      const multiplier = Math.min(5, 1 + Math.floor(streak / 3));
      score += modes[modeIndex].points * round * multiplier;
      if (quick) score += Math.max(1, Math.floor(round * .5));
      inputIndex++;

      if (score > best) {
        best = score;
        saveBest();
      }

      syncHUD();
      renderProgress();

      if (inputIndex >= sequence.length) {
        state = "between";
        enablePads(false);
        streak++;
        if (roundPerfect) score += 20 * round;
        if (mirrorRound) {
          mirrorClears++;
          score += 125 * Math.max(1, Math.floor(streak / 2));
          showToast("MIRROR BROKEN · BONUS +" + (125 * Math.max(1, Math.floor(streak / 2))));
        }
        if (score > best) {
          best = score;
          saveBest();
        }
        syncHUD();
        renderProgress();
        statusEl.textContent = roundPerfect ? "CLEAN ECHO / PERFECT ROUND" : "PATTERN HELD";
        if (round > 0 && round % 5 === 0) showToast(`ECHO CHAMBER · ROUND ${round} ✳`);
        const currentToken = token;
        schedule(() => {
          if (state === "between") nextRound();
        }, Math.max(500, modes[modeIndex].gap + 300), currentToken);
      }
    }

    function endGame() {
      invalidateTimers();
      state = "gameover";
      enablePads(false);
      pads.forEach(pad => pad.classList.remove("is-lit"));
      const record = score > best;
      if (record) {
        best = score;
        saveBest();
        showToast("NEW ECHO CHAMBER RECORD ✳");
      }
      syncHUD();
      statusEl.textContent = "THE ECHO HAS FADED";
      renderProgress();
      showOverlay(
        "PATTERN BROKEN / TRY AGAIN",
        "LOST THE THREAD.",
        `You reached round ${round} with ${formatScore(score)} points and a ${streak}-round streak. Switch modes or listen again to beat your record.`,
        "LISTEN AGAIN ↻"
      );
    }

    function cycleMode() {
      if (state === "watch" || state === "input" || state === "between") return;
      modeIndex = (modeIndex + 1) % modes.length;
      modeButton.textContent = `MODE: ${modes[modeIndex].name}`;
    }

    function pauseForHiddenTab() {
      if (state !== "watch" && state !== "input" && state !== "between") return;
      modeBeforePause = state;
      pauseSnapshot = {
        sequence: [...sequence],
        round,
        score,
        streak,
        inputIndex,
        modeBeforePause
      };
      invalidateTimers();
      state = "paused";
      enablePads(false);
      pads.forEach(pad => pad.classList.remove("is-lit"));
      showOverlay(
        "MEMORY STUDY / PAUSED",
        "PAUSED.",
        "The sequence has been stopped while this tab was hidden. Resume to replay the current sequence from the beginning.",
        "RESUME SEQUENCE ↗"
      );
      modeButton.hidden = true;
    }

    function resume() {
      if (state !== "paused" || !pauseSnapshot) {
        start();
        return;
      }
      const snapshot = pauseSnapshot;
      pauseSnapshot = null;
      sequence = snapshot.sequence;
      round = snapshot.round;
      score = snapshot.score;
      streak = snapshot.streak;
      inputIndex = 0;
      syncHUD();
      renderProgress();
      overlay.hidden = true;
      modeButton.hidden = false;
      state = "watch";
      invalidateTimers();
      const currentToken = token;
      let i = 0;
      const config = modes[modeIndex];

      statusEl.textContent = "REPLAYING THE SEQUENCE";
      schedule(function showNext() {
        if (state !== "watch") return;
        if (i >= sequence.length) {
          schedule(() => {
            state = "input";
            enablePads(true);
            statusEl.textContent = "YOUR TURN / REPEAT IT";
            renderProgress();
          }, config.gap, currentToken);
          return;
        }
        flashPad(sequence[i++], config.flash);
        schedule(showNext, config.flash + config.gap, currentToken);
      }, 350, currentToken);
    }

    function handleStart() {
      if (state === "paused") resume();
      else start();
    }

    function handleExit() { onExit(); }

    function handleVisibility() {
      if (document.hidden) pauseForHiddenTab();
    }

    function handleKey(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.code === "Escape") {
        event.preventDefault();
        onExit();
        return;
      }

      if (event.code === "Enter" && overlay && !overlay.hidden) {
        if (event.target === modeButton) return;
        event.preventDefault();
        handleStart();
        return;
      }

      const keyMap = {
        Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
        Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
        KeyQ: 0, KeyW: 1, KeyA: 2, KeyS: 3
      };
      const index = keyMap[event.code];
      if (index === undefined || state !== "input") return;
      if (event.target instanceof HTMLElement && event.target.closest("button")) return;
      event.preventDefault();
      pads[index]?.click();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      state = "destroyed";
      invalidateTimers();

      pads.forEach(pad => pad.removeEventListener("click", handlePadPress));
      window.removeEventListener("keydown", handleKey);
      startButton.removeEventListener("click", handleStart);
      modeButton.removeEventListener("click", cycleMode);
      exitButton.removeEventListener("click", handleExit);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (activeGame === instance) activeGame = null;
    }

    const instance = { destroy };

    pads.forEach(pad => {
      pad.addEventListener("click", handlePadPress);
      pad.disabled = true;
    });

    startButton.addEventListener("click", handleStart);
    modeButton.addEventListener("click", cycleMode);
    exitButton.addEventListener("click", handleExit);
    window.addEventListener("keydown", handleKey);
    document.addEventListener("visibilitychange", handleVisibility);

    activeGame = instance;
    bestEl.textContent = formatScore(best);
    modeButton.textContent = `MODE: ${modes[modeIndex].name}`;
    renderProgress();

    window.AfterhoursGames = window.AfterhoursGames || {};
    window.AfterhoursGames.setStopper(destroy);
  }

  window.AfterhoursGames = window.AfterhoursGames || {};
  window.AfterhoursGames[GAME_ID] = (mount, services) => startGame(mount, services);
})();