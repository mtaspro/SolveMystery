// board/script.js — the candidate board page.
// Fetches GET /api/board and renders a sortable-by-tab table of all players.
// Two tabs: "Fastest" (finished players by score) and "Most dedicated"
// (all players by total active time). Refreshes every 30s while visible.
// Plain ES module, no libraries. All data rendered via textContent.

import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { getPlayer } from '/shared/track.js';

const PAGE_ORDER = ['corridor', '2749', 'shush', 'coin', 'khufu', 'vault', 'results'];
const REFRESH_MS = 30000;

const tabFastest = document.getElementById('tabFastest');
const tabDedicated = document.getElementById('tabDedicated');
const refreshBtn = document.getElementById('refreshBtn');
const headRow = document.getElementById('boardHeadRow');
const body = document.getElementById('boardBody');
const statusEl = document.getElementById('boardStatus');
const hintNote = document.getElementById('boardHint');

let currentTab = 'fastest';
let refreshTimer = null;
let boardData = null;

const me = getPlayer();
const myAlias = me ? me.alias : null;

// ---- helpers ----

function fmtSec(sec) {
  if (sec == null || sec === undefined) return t('board.unreached');
  const s = Number(sec);
  if (!isFinite(s)) return t('board.unreached');
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

function fetchBoard() {
  return fetch('/api/board', { method: 'GET' })
    .then(async (resp) => {
      if (!resp.ok) throw new Error('http_' + resp.status);
      return resp.json();
    })
    .catch(() => {
      statusEl.textContent = t('board.unavailable') || 'Failed to load board.';
      return null;
    });
}

function buildHeader() {
  while (headRow.firstChild) headRow.removeChild(headRow.firstChild);
  const cols = [t('board.rank'), t('board.candidate'), ...PAGE_ORDER, t('board.hints'), t('board.total')];
  cols.forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });

  // Add a score column only for the Fastest tab.
  if (currentTab === 'fastest') {
    const scoreTh = document.createElement('th');
    scoreTh.textContent = t('board.score');
    headRow.appendChild(scoreTh);
  }
}

function buildRow(player, rank) {
  const tr = document.createElement('tr');

  // Highlight if this is the current player.
  if (player.alias === myAlias) tr.classList.add('board__me');

  // Rank (1-indexed).
  const rankTd = document.createElement('td');
  rankTd.textContent = String(rank);
  tr.appendChild(rankTd);

  // Candidate name (sticky first-of-row after rank in DOM, but visually second).
  // Actually rank is the sticky first child; candidate is second.
  const nameTd = document.createElement('td');
  nameTd.textContent = player.alias;
  nameTd.style.minWidth = '100px';

  // First blood badge.
  if (player.firstBlood && player.firstBlood.length > 0) {
    const badge = document.createElement('span');
    badge.className = 'board__first-blood';
    const pagesText = player.firstBlood.join(', ');
    badge.textContent = tf('board.firstBlood', { pages: pagesText });
    nameTd.appendChild(badge);
  }

  // My badge.
  if (player.alias === myAlias) {
    const myBadge = document.createElement('span');
    myBadge.className = 'board__me-badge';
    myBadge.textContent = t('board.meBadge');
    nameTd.appendChild(myBadge);
  }

  tr.appendChild(nameTd);

  // Per-page active time.
  PAGE_ORDER.forEach((pg) => {
    const td = document.createElement('td');
    const sec = player.perPage && Object.prototype.hasOwnProperty.call(player.perPage, pg)
      ? player.perPage[pg] : null;
    td.textContent = sec != null ? fmtSec(sec) : t('board.unreached');
    tr.appendChild(td);
  });

  // Hints.
  const hintsTd = document.createElement('td');
  hintsTd.textContent = String(player.hints || 0);
  tr.appendChild(hintsTd);

  // Total.
  const totalTd = document.createElement('td');
  totalTd.textContent = fmtSec(player.totalSec || 0);
  tr.appendChild(totalTd);

  // Score (only in fastest tab).
  if (currentTab === 'fastest') {
    const scoreTd = document.createElement('td');
    scoreTd.className = 'board__score';
    scoreTd.textContent = String(player.score || '');
    tr.appendChild(scoreTd);
  }

  return tr;
}

function render() {
  buildHeader();

  while (body.firstChild) body.removeChild(body.firstChild);

  if (!boardData) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const colCount = PAGE_ORDER.length + 4 + (currentTab === 'fastest' ? 1 : 0);
    td.colSpan = colCount;
    td.className = 'board__empty';
    td.textContent = t('board.noData');
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  const rows = currentTab === 'fastest' ? boardData.fastest : boardData.dedicated;
  if (!rows || !rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.className = 'board__empty';
    td.textContent = t('board.noData');
    const colCount = PAGE_ORDER.length + 4 + (currentTab === 'fastest' ? 1 : 0);
    td.colSpan = colCount;
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  rows.forEach((player, i) => {
    const tr = buildRow(player, i + 1);
    body.appendChild(tr);
  });
}

function setTab(tab) {
  currentTab = tab;
  tabFastest.classList.toggle('is-active', tab === 'fastest');
  tabDedicated.classList.toggle('is-active', tab === 'dedicated');
  hintNote.hidden = tab !== 'fastest';
  render();
}

function tick() {
  if (document.visibilityState === 'visible') {
    refresh();
  }
}

async function refresh() {
  statusEl.textContent = '';
  const data = await fetchBoard();
  if (data) {
    boardData = data;
    render();
  }
}

tabFastest.addEventListener('click', () => setTab('fastest'));
tabDedicated.addEventListener('click', () => setTab('dedicated'));
refreshBtn.addEventListener('click', refresh);

// Start with: hint note visible only on fastest tab, hint hidden on dedicated.
hintNote.hidden = false;

// Refresh every 30s while visible.
refreshTimer = setInterval(tick, REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refresh();
  }
});

applyI18n();
mountLangToggle();
render();
refresh();
