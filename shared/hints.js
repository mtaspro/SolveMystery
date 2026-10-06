// shared/hints.js — the reusable "Stuck?" hint system.
// Renders its own fixed bottom action bar + bottom sheet, unlocks hints on a
// countdown measured from page load, shows a live countdown while locked, and
// lists unlocked hints (locked ones show their remaining time).
//
// Every string comes from /shared/strings.js, and `hints` is a list of KEYS
// (from /config.js), not text, so the panel re-renders in the current language.
//
//   import { initHints } from '/shared/hints.js';
//   initHints({
//     hints: CONFIG.stages.s1.hints,
//     times: [45, 90, 150],            // optional, this is the default
//     onAllUnlocked: ({ foot }) => { foot.appendChild(myButton); }
//   });
//
// Returns { openSheet, closeSheet, foot, sheet, openCount, stop }.

import { t, tf, onLangChange } from '/shared/i18n.js';

// Read the user's motion preference at call time so it stays live.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// The "0:45" clock on the button. Kept in code because the zero-padding is a
// format, not a translatable word; the words around it come from strings.js.
function fmt(sec) {
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

export function initHints({ hints = [], times = [45, 90, 150], onAllUnlocked } = {}) {
  const list = Array.isArray(hints) ? hints : [];
  if (!list.length) return null;               // nothing to offer: render nothing

  const loadedAt = Date.now();
  let open = 0;      // how many hints have unlocked
  let allDone = false;

  // ----- markup: fixed action bar + bottom sheet -----
  const bar = document.createElement('div');
  bar.className = 'actbar';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--ghost';
  const label = document.createElement('span');   // its own node, so a language
  const count = document.createElement('span');    // change can retarget it
  count.className = 'actbar__count';
  btn.append(label, count);
  bar.appendChild(btn);

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Assistance');
  sheet.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'sheet__panel';
  const head = document.createElement('div');
  head.className = 'sheet__head';
  const title = document.createElement('h2');
  title.className = 'sheet__title';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'sheet__close';
  close.textContent = '\u2715';
  head.append(title, close);

  const ol = document.createElement('ol');
  ol.className = 'hints';
  const foot = document.createElement('div'); // slot for page-specific extras
  foot.className = 'sheet__foot';

  panel.append(head, ol, foot);
  sheet.appendChild(panel);
  document.body.append(bar, sheet);

  // Every piece of copy that is not inside the hint list itself.
  function paintStrings() {
    label.textContent = t('hints.button');
    title.textContent = t('hints.title');
    sheet.setAttribute('aria-label', t('hints.title'));
    close.setAttribute('aria-label', t('hints.close'));
  }

  // ----- sheet -----
  function openSheet() {
    const elapsed = (Date.now() - loadedAt) / 1000;
    ol.innerHTML = '';
    list.forEach((key, i) => {
      const li = document.createElement('li');
      const unlocked = i < open;
      li.className = unlocked ? 'hints__item' : 'hints__locked';
      li.textContent = unlocked
        ? t(key)                                       // a missing key shows itself
        : tf('hints.locked', { n: Math.ceil(times[i] - elapsed) });
      ol.appendChild(li);
    });
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
  }

  function closeSheet() {
    if (sheet.hidden) return;
    sheet.classList.remove('is-open');
    const hide = () => { sheet.hidden = true; };
    if (prefersReducedMotion.matches) hide();   // no fade when reduced
    else setTimeout(hide, 260);
  }

  // ----- countdown, measured from page load -----
  function tick() {
    const elapsed = (Date.now() - loadedAt) / 1000;
    let n = 0;
    while (n < times.length && elapsed >= times[n]) n++;
    open = n;
    if (n >= times.length) {
      count.textContent = tf('hints.allOut', { n });
      count.classList.add('is-ready');
      if (!allDone) {                          // fire once, as the last hint lands
        allDone = true;
        if (typeof onAllUnlocked === 'function') onAllUnlocked({ foot, panel, sheet, closeSheet });
      }
    } else {
      count.textContent = fmt(Math.ceil(times[n] - elapsed));
      count.classList.remove('is-ready');
    }
  }

  btn.addEventListener('click', openSheet);
  close.addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); }); // tap scrim
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  // A language change repaints the bar and, if it is up, the open list.
  const offLang = onLangChange(() => {
    paintStrings();
    tick();
    if (!sheet.hidden) openSheet();
  });

  paintStrings();
  tick();
  const timer = setInterval(tick, 1000);

  return {
    openSheet,
    closeSheet,
    foot,
    sheet,
    get openCount() { return open; },
    stop: () => { clearInterval(timer); offLang(); }
  };
}