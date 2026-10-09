// shared/social.js — visitor log + live ticker for stage pages.
// Plain ES module, no libraries. All API calls swallow errors silently.
//
//   import { initSocial } from '/shared/social.js';
//   initSocial('corridor');  // page name matching the /api visitors param
//
// Adds a "Visitor log" button next to the Stuck button in the bottom action
// bar, and a ticker line fixed under the top of the page. If the player has
// not joined (no vr_player in localStorage), the log still shows but the
// ticker is skipped.

import { t, tf, applyI18n, onLangChange } from '/shared/i18n.js';
import { getPlayer } from '/shared/track.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const TICKER_REFRESH_MS = 20000; // 20 seconds
const TICKER_ROTATE_MS = 5000;   // rotate events every 5 seconds

// ---- helpers ----

function apiFetch(path) {
  return fetch(path, { method: 'GET', headers: { 'accept': 'application/json' } })
    .then(async (resp) => {
      if (!resp.ok) throw new Error('http_' + resp.status);
      return resp.json();
    })
    .catch(() => null);
}

function relTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return '';
  const deltaSec = Math.floor((Date.now() - then) / 1000);
  if (deltaSec < 0) return '';
  if (deltaSec < 60) return deltaSec + 's';
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return deltaMin + 'm';
  const deltaHr = Math.floor(deltaMin / 60);
  return deltaHr + 'h';
}

function formatCrack(sec) {
  if (sec == null || sec === undefined) return t('social.noFastest');
  const s = Number(sec);
  if (!isFinite(s)) return t('social.noFastest');
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  if (m > 0) return m + ' ' + rem + 's';
  return rem + 's';
}

// ---- visitor log sheet ----

export function initSocial(page) {
  if (!page || typeof page !== 'string') return null;

  const player = getPlayer();
  const hasPlayer = !!player;

  // Create the visitor log button and append it to the actbar.
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--ghost social__btn';
  btn.id = 'socialLogBtn';
  btn.dataset.socialPage = page;
  btn.textContent = t('social.logButton');

  // The sheet reuses .sheet / .sheet__panel from hints.css.
  const sheet = document.createElement('div');
  sheet.className = 'sheet social__sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', t('social.logTitle'));
  sheet.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'sheet__panel social__panel';

  const head = document.createElement('div');
  head.className = 'sheet__head';
  const title = document.createElement('h2');
  title.className = 'sheet__title';
  title.textContent = t('social.logTitle');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'sheet__close';
  close.textContent = '\u2715';
  close.setAttribute('aria-label', t('social.close'));
  head.append(title, close);

  const content = document.createElement('div');
  content.className = 'social__content';
  const summary = document.createElement('p');
  summary.className = 'social__summary';
  const firstBlood = document.createElement('p');
  firstBlood.className = 'social__first';
  const fastest = document.createElement('p');
  fastest.className = 'social__fastest';
  const list = document.createElement('ul');
  list.className = 'social__list';

  content.append(summary, firstBlood, fastest, list);
  panel.append(head, content);
  sheet.appendChild(panel);

  document.body.append(sheet);

  // Append the button to the existing actbar (created by hints.js).
  function mountToActbar() {
    const actbar = document.querySelector('.actbar');
    if (actbar) {
      actbar.appendChild(btn);
    }
  }
  mountToActbar();
  // Retry on microtask in case actbar is added slightly later.
  if (!document.querySelector('.actbar')) {
    queueMicrotask(mountToActbar);
  }

  // ---- sheet open/close ----
  function openSheet() {
    if (sheet.hidden) sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    loadVisitors();
  }

  function closeSheet() {
    if (sheet.hidden || !sheet.classList.contains('is-open')) return;
    sheet.classList.remove('is-open');
    const hide = () => { sheet.hidden = true; };
    if (prefersReducedMotion.matches) hide();
    else setTimeout(hide, 260);
  }

  btn.addEventListener('click', openSheet);
  close.addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden && sheet.classList.contains('is-open')) closeSheet(); });

  // ---- load visitors ----
  async function loadVisitors() {
    const data = await apiFetch('/api/visitors?page=' + encodeURIComponent(page));
    if (!data) {
      summary.textContent = t('social.unavailable');
      firstBlood.textContent = '';
       fastest.textContent = '';
      while (list.firstChild) list.removeChild(list.firstChild);
      return;
    }

    const total = data.total;
    summary.textContent = total > 0
      ? tf('social.reached', { n: total })
      : t('social.reached').replace('{n}', '0');

    if (data.first && data.first.alias) {
      firstBlood.textContent = tf('social.firstBlood', { alias: data.first.alias });
    } else {
      firstBlood.textContent = t('social.noFirst');
    }

    if (data.fastestSec != null) {
      fastest.textContent = tf('social.fastest', { time: formatCrack(data.fastestSec) });
    } else {
      fastest.textContent = '';
    }

    while (list.firstChild) list.removeChild(list.firstChild);
    if (data.recent && Array.isArray(data.recent)) {      data.recent.forEach((v) => {
        const li = document.createElement('li');
        li.className = 'social__row';
        li.textContent = tf('social.visitor', { alias: v.alias, time: relTime(v.firstSeen) });
        list.appendChild(li);
      });
    }
  }

  // ---- ticker ----
  let tickerEl = null;
  let tickerTimer = null;
  let rotateTimer = null;
  let tickerEvents = [];
  let tickerIndex = 0;
  let tickerVisible = false;

  if (hasPlayer) {
    tickerEl = document.createElement('div');
    tickerEl.className = 'ticker';
    tickerEl.setAttribute('aria-live', 'polite');
    tickerEl.setAttribute('aria-atomic', 'true');
    tickerEl.textContent = '';
    document.body.appendChild(tickerEl);

    async function refreshTicker() {
      const data = await apiFetch('/api/ticker');
      if (data && Array.isArray(data.ticker) && data.ticker.length > 0) {
        tickerEvents = data.ticker;
        tickerIndex = 0;
        renderTicker();
        if (!tickerVisible) {
          tickerEl.hidden = false;
          tickerVisible = true;
        }
      }
    }

    function renderTicker() {
      if (!tickerEvents.length) {
        tickerEl.textContent = '';
        return;
      }
      const ev = tickerEvents[tickerIndex];
      tickerEl.textContent = tf('social.tickerEntered', {
        alias: ev.alias,
        page: ev.page,
        time: relTime(ev.at)
      });
    }

    function rotateTicker() {
      if (!tickerEvents.length) return;
      tickerIndex = (tickerIndex + 1) % tickerEvents.length;
      renderTicker();
    }

    function tick() {
      if (document.visibilityState === 'visible') {
        refreshTicker();
      }
    }

    // Start paused, show on first data.
    tickerEl.hidden = true;

    // Poll every 20s while visible.
    tickerTimer = setInterval(tick, TICKER_REFRESH_MS);

    // Rotate every 5s.
    rotateTimer = setInterval(rotateTicker, TICKER_ROTATE_MS);

    // Visibility change: stop when hidden, restart when visible.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (tickerVisible) {
          tickerEl.hidden = true;
          tickerVisible = false;
        }
      } else {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Reduced motion: just show one event, no rotation.
    if (prefersReducedMotion.matches) {
      if (rotateTimer) clearInterval(rotateTimer);
      rotateTimer = null;
    }

    // Initial load.
    tick();
  }

  // ---- language change ----
  const offLang = onLangChange(() => {
    applyI18n();
    btn.textContent = t('social.logButton');
    sheet.setAttribute('aria-label', t('social.logTitle'));
    title.textContent = t('social.logTitle');
    close.setAttribute('aria-label', t('social.close'));
    // Sheet content will re-render on next open; if open, reload.
    if (!sheet.hidden && sheet.classList.contains('is-open')) {
      loadVisitors();
    }
  });

  return {
    openSheet,
    closeSheet,
    sheet,
    stop: () => {
      offLang();
      if (tickerTimer) clearInterval(tickerTimer);
      if (rotateTimer) clearInterval(rotateTimer);
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (tickerEl && tickerEl.parentNode) tickerEl.parentNode.removeChild(tickerEl);
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    }
  };
}
