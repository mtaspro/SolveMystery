// shared/engine.js — shared game engine: answer checking, saved progress, fragment tray.
// Plain ES module (no build step). Import from a stage page, e.g.
//   import { checkAnswer, renderFragmentTray } from '/shared/engine.js';

import { CONFIG } from '../config.js';

/* ------------------------------------------------------------------ *
 * Progress storage
 * Shape: { fragments: [ { pos: 3, letter: "A" }, ... ] }
 * Backed by localStorage["vr_progress"], with an in-memory fallback so
 * private mode / disabled storage / corrupt JSON still works.
 * ------------------------------------------------------------------ */
const STORAGE_KEY = 'vr_progress';
let memory = { fragments: [] }; // fallback copy, kept in sync on every save

// Coerce anything into the expected shape (never throws).
function normalise(data) {
  const frags = data && Array.isArray(data.fragments) ? data.fragments : [];
  return { fragments: frags.filter((f) => f && typeof f.pos === 'number' && f.letter) };
}

// Load progress: read localStorage, else keep the in-memory copy.
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) memory = normalise(JSON.parse(raw));
  } catch (err) {
    /* storage unavailable or corrupt -> fall back to memory */
  }
  return memory;
}

// Save progress: update memory first, then best-effort persist.
export function saveProgress(progress) {
  memory = normalise(progress);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (err) {
    /* ignore: memory copy is still authoritative for this session */
  }
  return memory;
}

/* ------------------------------------------------------------------ *
 * Answer checking
 * ------------------------------------------------------------------ */
// True when `input` matches the stage answer (trimmed + case-insensitive).
export function checkAnswer(stageId, input) {
  const stage = CONFIG.stages[stageId];
  if (!stage) return false;
  const guess = String(input == null ? '' : input).trim().toLowerCase();
  return guess === String(stage.answer).trim().toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Fragment collection
 * ------------------------------------------------------------------ */
// Award this stage's fragment (from CONFIG) and refresh the tray.
export function collectFragment(stageId) {
  const stage = CONFIG.stages[stageId];
  if (!stage || !stage.fragment) return loadProgress();
  const { pos, letter } = stage.fragment;
  const kept = loadProgress().fragments.filter((f) => f.pos !== pos); // one letter per slot
  kept.push({ pos, letter });
  return saveProgress({ fragments: kept });
}

/* ------------------------------------------------------------------ *
 * Fragment tray UI
 * ------------------------------------------------------------------ */
// Render (or refresh) a fixed top bar with 5 slots showing collected letters.
export function renderFragmentTray() {
  if (!document.body) return null; // safety: needs a body to mount into

  const byPos = {};
  for (const f of loadProgress().fragments) byPos[f.pos] = f.letter;

  let tray = document.getElementById('fragment-tray');
  if (!tray) {
    tray = document.createElement('div');
    tray.id = 'fragment-tray';
    tray.className = 'fragment-tray';
    tray.setAttribute('role', 'status');
    tray.setAttribute('aria-label', 'Collected fragments');
    document.body.prepend(tray); // fixed bar at the top of the page
  }
  document.body.classList.add('has-tray'); // pads content so the bar never covers it

  tray.innerHTML = ''; // rebuild the 5 fixed slots (positions 1-5)
  for (let pos = 1; pos <= 5; pos++) {
    const slot = document.createElement('span');
    slot.className = 'fragment-slot';
    const letter = byPos[pos];
    if (letter) {
      slot.classList.add('is-filled');
      slot.textContent = letter;
    } else {
      slot.textContent = '\u00B7'; // middle dot marks an empty slot
    }
    slot.setAttribute('aria-label', `Position ${pos}: ${letter || 'empty'}`);
    tray.appendChild(slot);
  }
  return tray;
}
