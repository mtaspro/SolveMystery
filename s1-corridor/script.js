// s1-corridor/script.js — Stage 1: the corridor.
// Scene: lightsOn -> lightsOff. The FIRST power cut is caused by reading the
// sticky note; after that the wall switch toggles light/dark and the torch
// follows the pointer. Puzzle: a 4-digit keypad checked by the shared engine,
// timed hints, then the success screen + fragment award.
// Motion is skipped for users who prefer reduced motion. Everything is
// taps/clicks (never hover).

import { CONFIG } from '/config.js';
import { checkAnswer, collectFragment, loadProgress, renderFragmentTray } from '/shared/engine.js';

const STAGE = 's1'; // this page's stage id (matches the folder name)

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
  fadeHint();
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
let hintGone = false;
function fadeHint() {
  if (hintGone) return;
  hintGone = true;
  scene.classList.add('has-dragged');
}

// --- keypad, hints and success ------------------------------------------
const stage = CONFIG.stages[STAGE];
const HINT_TIMES = [45, 90, 150];   // seconds after page load
const loadedAt = Date.now();

const codeBtn = document.getElementById('codeBtn');
const hintBtn = document.getElementById('hintBtn');
const hintCount = document.getElementById('hintCount');
const keypadSheet = document.getElementById('keypadSheet');
const keypadClose = document.getElementById('keypadClose');
const codeDisplay = document.getElementById('codeDisplay');
const keypadMsg = document.getElementById('keypadMsg');
const pad = document.getElementById('pad');
const hintSheet = document.getElementById('hintSheet');
const hintClose = document.getElementById('hintClose');
const hintList = document.getElementById('hintList');
const revealWrap = document.getElementById('revealWrap');
const revealBtn = document.getElementById('revealBtn');
const success = document.getElementById('success');
const successMsg = document.getElementById('successMsg');
const successLetter = document.getElementById('successLetter');
const nextBtn = document.getElementById('nextBtn');
const flash = document.getElementById('flash');

let code = '';        // the digits typed so far
let hintsOpen = 0;    // how many hints have unlocked
let hintTimer = 0;

// Already solved? (this stage's fragment is already sitting in localStorage)
function alreadySolved() {
  return loadProgress().fragments.some(
    (f) => f.pos === stage.fragment.pos && f.letter === stage.fragment.letter
  );
}

// ----- bottom sheets -----
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
[keypadSheet, hintSheet].forEach((sheet) => {
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(sheet); }); // tap scrim
});
keypadClose.addEventListener('click', () => closeSheet(keypadSheet));
hintClose.addEventListener('click', () => closeSheet(hintSheet));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSheet(keypadSheet); closeSheet(hintSheet); }
});

// ----- 4-digit display: plain divs, so no native keyboard ever appears -----
function renderCode() {
  codeDisplay.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('span');
    slot.className = 'code__slot' + (code[i] ? ' is-set' : '');
    slot.textContent = code[i] || '';
    codeDisplay.appendChild(slot);
  }
  codeDisplay.setAttribute('aria-label', 'Code, ' + code.length + ' of 4 digits');
  say('Code: ' + (code || 'empty'));
}
function pushDigit(d) {
  if (code.length >= 4) return;
  code += d;
  keypadMsg.textContent = '';
  renderCode();
}
function backspace() {
  if (!code.length) return;
  code = code.slice(0, -1);
  renderCode();
}

// ----- keypad keys: 1-9, backspace, 0, enter -----
function key(label, ariaLabel, onTap, extra) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pad__key' + (extra ? ' ' + extra : '');
  b.textContent = label;
  b.setAttribute('aria-label', ariaLabel);
  b.addEventListener('click', onTap);
  return b;
}
['1','2','3','4','5','6','7','8','9'].forEach((d) => pad.appendChild(key(d, d, () => pushDigit(d))));
pad.appendChild(key('⌫', 'Delete last digit', backspace));
pad.appendChild(key('0', '0', () => pushDigit('0')));
pad.appendChild(key('Enter', 'Check code', submitCode, 'pad__key--go'));

// ----- submit -----
function submitCode() {
  if (code.length < 4) { deny('Four digits, please.'); return; }
  if (checkAnswer(STAGE, code)) win();
  else deny('Access denied.');
}
function deny(msg) {
  keypadMsg.textContent = msg;
  codeDisplay.classList.remove('is-shaking');
  void codeDisplay.offsetWidth;                 // restart the shake animation
  codeDisplay.classList.add('is-shaking');
  buzz([70, 50, 70]);                           // guarded: not every browser has it
  code = '';
  renderCode();
  say(msg);
}
function buzz(pattern) {
  try { if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern); } catch (err) { /* unsupported */ }
}

// ----- success: flash, save progress, tray animation, next stage -----
function win() {
  closeSheet(keypadSheet);
  clearInterval(hintTimer);
  flash.classList.add('is-on');
  setTimeout(() => flash.classList.remove('is-on'), 650);
  collectFragment(STAGE);                       // saves "A" to localStorage
  setTimeout(showSuccess, prefersReducedMotion.matches ? 0 : 420);
}
function showSuccess() {
  successMsg.textContent = 'Hm. Impressive. One department down.';
  successLetter.textContent = stage.fragment.letter;
  nextBtn.setAttribute('href', stage.next);    // -> /s2-k7q/
  const tray = renderFragmentTray();           // 5 slots; the letter lands in slot 3
  if (tray) {
    tray.classList.remove('just-earned');
    void tray.offsetWidth;
    tray.classList.add('just-earned');         // CSS drop-in on slot 3
  }
  success.hidden = false;
  requestAnimationFrame(() => success.classList.add('is-open'));
  nextBtn.focus({ preventScroll: true });
  say('Code accepted. Fragment ' + stage.fragment.letter + ' filed to slot 3.');
}

// ----- hints: unlock at 45s / 90s / 150s, countdown on the locked button -----
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
  stage.hints.forEach((h, i) => {
    const li = document.createElement('li');
    const unlocked = i < hintsOpen;
    li.className = unlocked ? 'hints__item' : 'hints__locked';
    li.textContent = unlocked ? h
      : 'Locked — ' + Math.ceil(HINT_TIMES[i] - elapsed) + 's';
    hintList.appendChild(li);
  });
  revealWrap.hidden = hintsOpen < stage.hints.length;   // only once hint 3 is out
  openSheet(hintSheet);
}
revealBtn.addEventListener('click', () => {
  scene.classList.add('revealed');            // all four digits stay lit for good
  closeSheet(hintSheet);
  say('The digits are revealed.');
});
codeBtn.addEventListener('click', () => {
  keypadMsg.textContent = '';
  openSheet(keypadSheet);
});

// --- go ---
paint();
renderCode();
tickHints();
hintTimer = setInterval(tickHints, 1000);

// Saved progress already holds this stage's fragment -> skip straight to success.
if (alreadySolved()) {
  intro.hidden = true;
  showSuccess();
} else {
  startIntro();
}
