// shared/landing.js — landing page: the typewriter message, codename picker,
// and the Begin button. Plain ES module, no build step.
//
// The message is typed one GRAPHEME at a time by the shared typewriter, so
// Bengali conjuncts never break when the page is switched to bn.

import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';
import { getPlayer, joinGame, validateAlias, restoreGame, clearSeal } from '/shared/track.js';

const CHAR_MS = 50; // ~163 characters => the message lands in about 8 seconds

const typed = document.getElementById('examTyped');
const text = document.getElementById('examText');
const skipBtn = document.getElementById('skipBtn');
const codenameInput = document.getElementById('codenameInput');
const codenameError = document.getElementById('codenameError');
const beginBtn = document.getElementById('beginBtn');
const restoreLink = document.getElementById('restoreLink');
const restoreForm = document.getElementById('restoreForm');
const restoreAlias = document.getElementById('restoreAlias');
const restoreSeal = document.getElementById('restoreSeal');
const restoreBtn = document.getElementById('restoreBtn');
const restoreError = document.getElementById('restoreError');

let typing = null;

// Start (or restart) the message. Re-running it is what makes a language change
// possible: the helper holds the text it was given, so a new language needs a
// new run.
function startTyping() {
  typing = typewriter(text, t('landing.message'), CHAR_MS, {
    // Fires when the message finishes on its own AND when Skip jumps to the end.
    onDone: () => {
      typed.classList.add('is-done');   // retires the caret
      skipBtn.disabled = true;
    }
  });
  return typing;
}

skipBtn.addEventListener('click', () => { if (typing) typing.finish(); });

// A language change repaints the page and shows the whole message again.
onLangChange(() => {
  applyI18n();
  if (typing) typing.stop();
  startTyping().finish();
});

// ---- codename input ----
function setNote(msg) {
  codenameError.textContent = msg;
  codenameError.hidden = !msg;
}

// Pre-fill from an existing player if one exists.
const existing = getPlayer();
if (existing) {
  codenameInput.value = existing.alias;
}

// Validate as the player types; surface errors early.
codenameInput.addEventListener('input', () => {
  const alias = codenameInput.value;
  if (alias.length > 0 && !validateAlias(alias)) {
    setNote(t('track.invalid'));
  } else {
    setNote('');
  }
});

codenameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    beginInvestigation();
  }
});

async function beginInvestigation() {
  const alias = codenameInput.value;
  const trimmed = validateAlias(alias);
  if (!trimmed) {
    setNote(t('track.invalid'));
    codenameInput.focus();
    return;
  }

  // If we already have a player with this alias, navigate right away.
  const current = getPlayer();
  if (current && current.alias === trimmed) {
    window.location.href = '/corridor/';
    return;
  }

  setNote('');

  try {
    await joinGame(trimmed);
    window.location.href = '/corridor/';
  } catch (err) {
    const msg = err?.message;
    if (msg === 'taken') {
      setNote(t('track.taken'));
    } else if (msg === 'offline') {
      // API unreachable: let the player continue without tracking.
      window.location.href = '/corridor/';
    } else {
      setNote(t('track.invalid'));
    }
    codenameInput.focus();
  }
}

// The Begin button is an <a> with href="/corridor/"; intercept clicks so we can
// run joinGame first. If joinGame fails offline, we still navigate.
beginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  beginInvestigation();
});

// ---- restore form ----
restoreLink.addEventListener('click', () => {
  restoreForm.hidden = false;
  restoreAlias.focus();
});

restoreBtn.addEventListener('click', async () => {
  const alias = restoreAlias.value.trim();
  const seal = restoreSeal.value.trim();
  if (!alias || !seal) {
    restoreError.textContent = t('track.restore.notFound');
    restoreError.hidden = false;
    return;
  }

  restoreError.hidden = true;
  restoreBtn.disabled = true;

  try {
    await restoreGame(alias, seal);
    window.location.href = '/corridor/';
  } catch (err) {
    const msg = err?.message;
    if (msg === 'offline') {
      // API unreachable: still let the player try to continue.
      window.location.href = '/corridor/';
    } else if (msg === 'rate_limited') {
      restoreError.textContent = t('track.restore.notFound');
      restoreError.hidden = false;
      restoreBtn.disabled = false;
    } else {
      restoreError.textContent = t('track.restore.notFound');
      restoreError.hidden = false;
      restoreBtn.disabled = false;
    }
  }
});

applyI18n();
mountLangToggle();
startTyping();
