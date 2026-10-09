// vault/script.js — the vault / principal's office.
// Strip-scramble puzzle: the player swaps vertical strips of a shredded
// document to reassemble it, then types the password into a keypad.
// Mobile-first, touch-only, honours prefers-reduced-motion.

import { CONFIG } from '/config.js';
import { initHints } from '/shared/hints.js';
import { t, tf, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';
import { startTracking } from '/shared/track.js';
import { initSocial } from '/shared/social.js';

// ---- editable constants (never translated) ----
const SCHOOL_NAME = "Greenfield School";

// SHA-256 hex of the lowercase word "grade".
const PASSWORD_HASH = "ffe97bba510b9f5cf1bb187bebb59cefa42a3f1654d2c993654382cd10468c2e";

// The shredded document. Each line is padded to exactly 36 chars so the
// 6-column strips line up perfectly.
const DOC_LINES = [
  "THE RESULTS WERE NEVER LOST.",
  "EVERY ONE OF YOU PASSED.",
  "THE FINAL PASSWORD IS BELOW:",
  "",
  "PASSWORD: GRADE"
];

const COL_WIDTH = 6;        // columns per strip => 36 total
const STRIP_COUNT = 6;

// Fixed scrambled starting order (not identity).
const START_ORDER = [3, 0, 5, 2, 4, 1];

// ---- derived: padded DOC_LINES ----
function padLine(line, width) {
  return line.length >= width ? line : line + " ".repeat(width - line.length);
}

const PADDED_LINES = DOC_LINES.map((l) => padLine(l, 36));
const LINE_COUNT = PADDED_LINES.length;

// ---- DOM refs ----
const pageTitle = document.getElementById('pageTitle');
const shredStatus = document.getElementById('shredStatus');
const stripsContainer = document.getElementById('strips');
const movesEl = document.getElementById('moves');
const vaultInput = document.getElementById('vaultInput');
const openBtn = document.getElementById('openBtn');
const keypadNote = document.getElementById('keypadNote');
const keypadError = document.getElementById('keypadError');
const intro = document.getElementById('intro');
const typed = document.getElementById('typed');
const beginBtn = document.getElementById('beginBtn');

// Read the user's motion preference at call time so it stays live.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// State
let order = START_ORDER.slice();
let selectedIndex = null;
let moves = 0;
let reassembled = false;

// ---- render functions ----

function extractStrip(stripNum) {
  const colStart = stripNum * COL_WIDTH;
  const colEnd = colStart + COL_WIDTH;
  return PADDED_LINES.map((line) => line.slice(colStart, colEnd));
}

function buildStrip(stripNum) {
  const wrap = document.createElement('div');
  wrap.className = 'paper__strip';
  wrap.dataset.strip = String(stripNum);

  const inner = document.createElement('div');
  inner.className = 'paper__strip-inner';

  const lines = extractStrip(stripNum);
  for (let i = 0; i < LINE_COUNT; i++) {
    const cell = document.createElement('span');
    cell.className = 'paper__cell';
    cell.textContent = lines[i];
    inner.appendChild(cell);
  }

  wrap.appendChild(inner);
  return wrap;
}

function renderStrips() {
  stripsContainer.innerHTML = '';
  order.forEach((stripNum, position) => {
    const strip = buildStrip(stripNum);
    strip.dataset.position = String(position);
    stripsContainer.appendChild(strip);
  });
}

// ---- interaction ----

function selectStrip(stripEl, position) {
  if (reassembled) return;
  const wasSelected = stripEl.classList.contains('is-selected');

  clearSelection();

  if (wasSelected) {
    selectedIndex = null;
  } else {
    stripEl.classList.add('is-selected');
    selectedIndex = position;
  }
}

function clearSelection() {
  const all = stripsContainer.querySelectorAll('.paper__strip');
  all.forEach((s) => s.classList.remove('is-selected'));
  selectedIndex = null;
}

function swapStrips(posA, posB) {
  if (posA === posB || reassembled) return;

  const tmp = order[posA];
  order[posA] = order[posB];
  order[posB] = tmp;

  renderStrips();
  moves++;
  updateMoves();

  if (isSolved()) {
    markReassembled();
  } else {
    clearSelection();
  }
}

function isSolved() {
  for (let i = 0; i < STRIP_COUNT; i++) {
    if (order[i] !== i) return false;
  }
  return true;
}

function markReassembled() {
  reassembled = true;
  movesEl.classList.add('is-done');
  shredStatus.textContent = t('vault.statusRepaired');
  shredStatus.classList.add('is-repaired');

  const all = stripsContainer.querySelectorAll('.paper__strip');
  all.forEach((s) => {
    s.classList.remove('is-selected');
    s.classList.add('is-locked');
  });

  // Unlock the keypad
  vaultInput.readOnly = false;
  openBtn.disabled = false;
  keypadNote.hidden = true;
  keypadError.hidden = true;
}

// A short visual flip when swapping.
function animateSwap(posA, posB) {
  if (prefersReducedMotion.matches) {
    swapStrips(posA, posB);
    return;
  }
  stripsContainer.classList.add('is-swapping');
  swapStrips(posA, posB);
  setTimeout(() => stripsContainer.classList.remove('is-swapping'), 300);
}

stripsContainer.addEventListener('click', (e) => {
  const strip = e.target.closest('.paper__strip');
  if (!strip) return;

  const position = Number(strip.dataset.position);
  if (!reassembled && Number.isNaN(position)) return;

  if (selectedIndex === null) {
    selectStrip(strip, position);
  } else if (selectedIndex === position) {
    clearSelection();
  } else {
    animateSwap(selectedIndex, position);
  }
});

// ---- moves counter ----
function updateMoves() {
  movesEl.textContent = tf('vault.moves', { n: moves });
}

// ---- password check ----
async function hashPassword(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
  const input = vaultInput.value;
  if (!input.trim()) return;

  const hash = await hashPassword(input);
  const correct = hash === PASSWORD_HASH;

  if (correct) {
    keypadError.hidden = true;
    vaultInput.classList.remove('is-shaking');
    vaultInput.classList.add('is-success');

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

    // Show success message before the button
    const msg = document.createElement('p');
    msg.className = 'keypad__msg';
    msg.textContent = t('vault.opened');
    msg.style.color = 'var(--neon)';
    msg.style.fontWeight = '700';
    keypadNote.hidden = true;
    openBtn.before(msg);

    // Mark the vault as open so /results/ grants access.
    try { window.localStorage.setItem('vr_vault_open', '1'); } catch { /* storage unavailable */ }

    // Green flash on the input, then redirect to results
    setTimeout(() => {
      vaultInput.classList.remove('is-success');
      window.location.assign('/results/');
    }, 1500);
  } else {
    // Wrong password: shake + error message
    vaultInput.classList.remove('is-success');
    keypadError.hidden = false;

    if (prefersReducedMotion.matches) {
      // No shake for reduced-motion users; just show the error
    } else {
      vaultInput.classList.add('is-shaking');
      setTimeout(() => vaultInput.classList.remove('is-shaking'), 420);
    }

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    vaultInput.select();
    vaultInput.focus();
  }
}

// ---- keypad submit ----
function submitKeypad() {
  if (!reassembled) return;
  checkPassword();
}

openBtn.addEventListener('click', submitKeypad);

vaultInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitKeypad();
  }
});

// ---- intro: typewriter ----
let typing = null;
let failsafe = null;
let introDone = false;

function finishIntro() {
  if (introDone) return;
  introDone = true;
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  if (typing) { typing.finish(); typing = null; }
  intro.classList.add('is-ready');
  beginBtn.focus({ preventScroll: true });
}

function startIntro() {
  introDone = false;
  typed.textContent = '';
  const text = t('vault.intro');
  failsafe = setTimeout(finishIntro, 6000);
  typing = typewriter(typed, text, 45, { onDone: finishIntro });
  return typing;
}

function dismissIntro() {
  if (typing) { typing.stop(); typing = null; }
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  intro.classList.add('is-hidden');
  const hide = () => { intro.hidden = true; };
  if (prefersReducedMotion.matches) hide();
  else setTimeout(hide, 380);
}

beginBtn.addEventListener('click', dismissIntro);

// ---- language change ----
onLangChange(() => {
  applyI18n();
  pageTitle.textContent = SCHOOL_NAME + ' - ' + t('vault.deskSubtitle');
  shredStatus.textContent = reassembled
    ? t('vault.statusRepaired')
    : t('vault.statusJammed');
  updateMoves();
  if (!reassembled) {
    keypadNote.textContent = t('vault.keypadNote');
  }
  if (keypadError) {
    keypadError.textContent = t('vault.denied');
  }
  if (!intro.hidden) {
    if (typing) { typing.stop(); typing = null; }
    if (failsafe) { clearTimeout(failsafe); failsafe = null; }
    startIntro().finish();
  }
});

// ---- hints ----
initHints({
  hints: CONFIG.stages.s6.hints,
  page: 'vault',
});

// ---- go ----
function init() {
  pageTitle.textContent = SCHOOL_NAME + ' - ' + t('vault.deskSubtitle');
  shredStatus.textContent = t('vault.statusJammed');
  movesEl.textContent = tf('vault.moves', { n: moves });

  // Keypad starts locked
  vaultInput.readOnly = true;
  openBtn.disabled = true;

  // Build and render strips
  renderStrips();

  // Intro
  applyI18n();
  mountLangToggle();
  startIntro();
  startTracking('vault');
initSocial('vault');
}

init();
