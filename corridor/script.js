// corridor/script.js — the corridor.
// An "internet mystery" page: the clue here is solved off-site and the player
// types the next address into their own browser address bar. So there is no
// answer checking, no code entry, no saved progress and no "next" button.
// Scene: lightsOn -> lightsOff. The FIRST power cut comes from reading the
// sticky note; after that the wall switch toggles light/dark and the torch
// follows the pointer. Hints unlock at 45s / 90s / 150s, and after hint 3 a
// "Reveal digits" button lights all four chalk marks for good.
// Motion is skipped for users who prefer reduced motion. Taps/clicks only.

import { CONFIG } from '/config.js';

const STAGE = 's1';                // this page's stage id in CONFIG
const HINTS = CONFIG.stages[STAGE].hints;
const HINT_TIMES = [45, 90, 150];  // seconds after page load
const INTRO_TEXT = "Candidates, your results have been relocated. Remain calm. Panic is permitted.";

// Read the user's motion preference at call time so it stays live.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// --- DOM refs ---
const scene = document.getElementById('scene');
const intro = document.getElementById('intro');
const introText = document.getElementById('introText');
const beginBtn = document.getElementById('beginBtn');
const sticky = document.getElementById('stickyNote');
const switchBtn = document.getElementById('lightSwitch');
const status = document.getElementById('status');
const hintBtn = document.getElementById('hintBtn');
const hintCount = document.getElementById('hintCount');
const hintSheet = document.getElementById('hintSheet');
const hintClose = document.getElementById('hintClose');
const hintList = document.getElementById('hintList');
const revealWrap = document.getElementById('revealWrap');
const revealBtn = document.getElementById('revealBtn');

// --- state machine ---
const Lights = { ON: 'lightsOn', OFF: 'lightsOff' };
let lights = Lights.ON;   // current state
let poweredDown = false;  // has the first power cut happened yet?
let busy = false;         // true during the flicker window

// Push the state to the DOM: the "dark" class lives on the scene element.
function paint() {
  const dark = lights === Lights.OFF;
  scene.classList.toggle('dark', dark);
  switchBtn.setAttribute('aria-pressed', String(!dark));
  switchBtn.setAttribute('aria-label', dark ? 'Light switch (lights off)' : 'Light switch (lights on)');
}

// Announce to the polite live region.
function say(msg) { status.textContent = ''; status.textContent = msg; }

// --- intro: typewriter + dismiss ---
let typer = null;     // interval id while typing
let failsafe = null;  // safety net so the Begin button always appears

function startIntro() {
  if (prefersReducedMotion.matches) { finishTyping(); return; } // no typing animation
  let i = 0;
  typer = setInterval(() => {
    i += 1;
    introText.textContent = INTRO_TEXT.slice(0, i);
    if (i >= INTRO_TEXT.length) finishTyping();
  }, 45);
  failsafe = setTimeout(finishTyping, 6000);
}

function finishTyping() {
  if (typer) { clearInterval(typer); typer = null; }
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  introText.textContent = INTRO_TEXT;
  intro.classList.add('is-ready');            // reveal the Begin button
  beginBtn.focus({ preventScroll: true });
}

function dismissIntro() {
  if (typer) { clearInterval(typer); typer = null; }
  intro.classList.add('is-hidden');
  const hide = () => { intro.hidden = true; };
  if (prefersReducedMotion.matches) hide();   // no fade when reduced
  else setTimeout(hide, 400);
  scene.focus({ preventScroll: true });
}

beginBtn.addEventListener('click', dismissIntro);
introText.addEventListener('click', finishTyping); // tap the text to skip typing

// --- sticky note: the first tap kills the power ---
sticky.addEventListener('click', () => {
  if (poweredDown || busy) return;            // only the first read matters
  sticky.classList.add('is-used');
  sticky.setAttribute('aria-pressed', 'true');
  powerCut();
});

function powerCut() {
  busy = true;
  scene.classList.add('is-flickering');       // ~600ms flicker, then dark
  const settle = () => {
    scene.classList.remove('is-flickering');
    poweredDown = true;
    lights = Lights.OFF;
    paint();
    busy = false;
    say('The lights go out.');
  };
  if (prefersReducedMotion.matches) settle(); // jump straight to dark
  else setTimeout(settle, 600);
}

// --- wall switch: inert until the power has cut, then a light/dark toggle ---
switchBtn.addEventListener('click', () => {
  if (busy) return;                           // ignore taps mid-flicker
  if (!poweredDown) { wiggle(); return; }     // nothing happens yet
  lights = lights === Lights.OFF ? Lights.ON : Lights.OFF;
  paint();
  say(lights === Lights.OFF ? 'The lights go out.' : 'The lights come back on.');
});

function wiggle() {
  if (prefersReducedMotion.matches) return;   // no motion for reduced users
  switchBtn.classList.remove('is-wiggling');
  void switchBtn.offsetWidth;                 // restart the CSS animation
  switchBtn.classList.add('is-wiggling');
  say('The switch is dead.');
}
switchBtn.addEventListener('animationend', () => switchBtn.classList.remove('is-wiggling'));

// --- torch: in the dark, a pool of light follows the finger -------------
// Uses Pointer Events; .scene has touch-action:none so the drag is ours. We
// deliberately do NOT setPointerCapture — capturing would retarget the follow-up
// "click" away from the switch/sticky buttons and break their taps.
const TORCH_OFFSET = 40;      // lift the lit centre 40px above the finger
const last = { x: 0, y: 0 };  // most recent client point (re-projected on resize)
let hasPoint = false;
let rect = scene.getBoundingClientRect();
let dragging = false;
let rafId = 0;

// Remember the newest point and queue a single rAF write (never more than one).
function queueTorch(clientX, clientY) {
  last.x = clientX; last.y = clientY; hasPoint = true;
  if (!rafId) rafId = requestAnimationFrame(writeTorch);
}

// The CSS-variable write happens here, inside requestAnimationFrame.
function writeTorch() {
  rafId = 0;
  scene.style.setProperty('--x', (last.x - rect.left) + 'px');
  scene.style.setProperty('--y', (last.y - rect.top - TORCH_OFFSET) + 'px');
}

// Re-measure on resize/rotation, then re-project the last point onto it.
function measure() {
  rect = scene.getBoundingClientRect();
  if (hasPoint) queueTorch(last.x, last.y);
}

scene.addEventListener('pointerdown', (e) => {
  if (lights !== Lights.OFF) return;   // the torch only exists in the dark
  dragging = true;
  queueTorch(e.clientX, e.clientY);
  fadeTorchHint();
});
scene.addEventListener('pointermove', (e) => {
  if (!dragging || lights !== Lights.OFF) return;
  queueTorch(e.clientX, e.clientY);
});
['pointerup', 'pointercancel'].forEach((type) => scene.addEventListener(type, () => { dragging = false; }));

window.addEventListener('resize', measure);
window.addEventListener('orientationchange', measure);
if (window.visualViewport) window.visualViewport.addEventListener('resize', measure);

// Fade the "look around" prompt after the first drag.
let torchHintGone = false;
function fadeTorchHint() {
  if (torchHintGone) return;
  torchHintGone = true;
  scene.classList.add('has-dragged');
}

// --- hints: unlock at 45 / 90 / 150s, countdown on the locked button -----
const loadedAt = Date.now();
let hintsOpen = 0;    // how many hints have unlocked
let hintTimer = 0;

function fmt(sec) {
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function tickHints() {
  const elapsed = (Date.now() - loadedAt) / 1000;
  let n = 0;
  while (n < HINT_TIMES.length && elapsed >= HINT_TIMES[n]) n++;
  hintsOpen = n;
  if (n >= HINT_TIMES.length) {
    hintCount.textContent = n + ' hints';
    hintCount.classList.add('is-ready');
  } else {
    hintCount.textContent = fmt(Math.ceil(HINT_TIMES[n] - elapsed));
    hintCount.classList.remove('is-ready');
  }
}

hintBtn.addEventListener('click', openHints);
function openHints() {
  const elapsed = (Date.now() - loadedAt) / 1000;
  hintList.innerHTML = '';
  HINTS.forEach((text, i) => {
    const li = document.createElement('li');
    const unlocked = i < hintsOpen;
    li.className = unlocked ? 'hints__item' : 'hints__locked';
    li.textContent = unlocked ? text
      : 'Locked — ' + Math.ceil(HINT_TIMES[i] - elapsed) + 's';
    hintList.appendChild(li);
  });
  revealWrap.hidden = hintsOpen < HINTS.length;   // only once hint 3 is out
  openSheet(hintSheet);
}

revealBtn.addEventListener('click', () => {
  scene.classList.add('revealed');            // all four digits stay lit for good
  closeSheet(hintSheet);
  say('The digits are revealed.');
});

// --- bottom sheet (hints only) -----
function openSheet(sheet) {
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
}
function closeSheet(sheet) {
  if (sheet.hidden) return;
  sheet.classList.remove('is-open');
  const hide = () => { sheet.hidden = true; };
  if (prefersReducedMotion.matches) hide();
  else setTimeout(hide, 260);
}
hintSheet.addEventListener('click', (e) => { if (e.target === hintSheet) closeSheet(hintSheet); });
hintClose.addEventListener('click', () => closeSheet(hintSheet));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(hintSheet); });

// --- go ---
paint();
tickHints();
hintTimer = setInterval(tickHints, 1000);
startIntro();