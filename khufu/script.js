// /khufu/script.js — the "410 PAGE REMOVED" screen.
// Static layout (no intro overlay): a glitching headline, the deleted-page
// message, and the shared hint system. After all three hints unlock, a
// "Open Wayback Machine" button appears in the hint sheet.
// the player reads the old memo from the Wayback Machine and types the next
// address into their own browser bar.

import { CONFIG } from '/config.js';
import { initHints } from '/shared/hints.js';
import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';

// ---- editable constant (never translated) ----
const WAYBACK_URL = "https://web.archive.org/web/20261006142646/https://solvemystery.mowama36.workers.dev/khufu/";

// ---- DOM refs ----
const scene = document.getElementById('scene');
const status = document.getElementById('status');

// ---- hints: shared system + a Wayback Machine button in the foot slot ----
// After hint 3 unlocks, an "Open Wayback Machine" button appears inside the
// hint sheet, mirroring the /coin/ pattern for page-specific extras.
const waybackWrap = document.createElement('div');
waybackWrap.className = 'wayback-wrap';
const waybackBtn = document.createElement('button');
waybackBtn.type = 'button';
waybackBtn.className = 'btn';
waybackBtn.textContent = t('removed.waybackButton');
waybackWrap.appendChild(waybackBtn);

waybackBtn.addEventListener('click', () => {
  window.open(WAYBACK_URL, '_blank', 'noopener noreferrer');
});

const hintsApi = initHints({
  hints: CONFIG.stages.s5.hints,
  onAllUnlocked: ({ foot }) => foot.appendChild(waybackWrap),
});

// ---- language change: repaint static copy + hint foot button label ----
onLangChange(() => {
  applyI18n();
  waybackBtn.textContent = t('removed.waybackButton');
  if (hintsApi && !hintsApi.sheet.hidden) hintsApi.openSheet();
});

// ---- go ----
applyI18n();
mountLangToggle();
scene.focus({ preventScroll: true });
