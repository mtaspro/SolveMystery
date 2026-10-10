// shared/track.js — player identity + activity tracking.
// Plain ES module, no libraries. All fetch calls swallow errors silently
// so the game keeps working even if the API is down or blocked.
//
//   import { getPlayer, joinGame, startTracking, trackHint } from '/shared/track.js';
//   import { getSeal, restoreGame } from '/shared/track.js';
//
// Player identity is stored in localStorage under "vr_player" as
// JSON { playerId, alias }. localStorage may throw (private mode, etc.),
// so every access is guarded and an in-memory fallback is used.

const STORAGE_KEY = 'vr_player';
const SEAL_KEY = 'vr_seal';

let memoryPlayer = null;

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.playerId && parsed.alias) {
          memoryPlayer = parsed;
          return parsed;
        }
      } catch {}
    }
  } catch { /* localStorage unavailable — fall through to memory */ }

  return memoryPlayer;
}

function writeStored(player) {
  memoryPlayer = player;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  } catch { /* memory only */ }
}

function clearStored() {
  memoryPlayer = null;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ---- public API ----

export function getPlayer() {
  return readStored();
}

export function clearPlayer() {
  clearStored();
}

const VALID_ALIAS = /^[\p{L}\p{N} _-]+$/u;

export function validateAlias(alias) {
  if (typeof alias !== 'string') return null;
  const trimmed = alias.trim();
  if (trimmed.length < 2 || trimmed.length > 16) return null;
  if (!VALID_ALIAS.test(trimmed)) return null;
  return trimmed;
}

export async function joinGame(alias) {
  const trimmed = validateAlias(alias);
  if (!trimmed) {
    throw new Error('invalid alias');
  }

  // If we already have a player with the same alias, reuse it.
  const existing = readStored();
  if (existing && existing.alias === trimmed) {
    return existing;
  }

  let resp;
  try {
    resp = await fetch('/api/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alias: trimmed }),
      keepalive: true,
    });
  } catch {
    throw new Error('offline');
  }

  if (!resp.ok) {
    const err = await parseJsonSafe(resp);
    if (resp.status === 409 && err && err.error === 'taken') {
      throw new Error('taken');
    }
    throw new Error('api error');
  }

  const data = await resp.json();
  const player = { playerId: data.playerId, alias: data.alias || trimmed };
  writeStored(player);

  // Store the seal in its own key (also on the player object for convenience).
  if (data.seal) {
    try { window.localStorage.setItem(SEAL_KEY, data.seal); } catch { /* ignore */ }
  }
  return player;
}

// ---- seal helpers ----

export function getSeal() {
  try {
    return window.localStorage.getItem(SEAL_KEY) || null;
  } catch {
    return null;
  }
}

export function clearSeal() {
  try { window.localStorage.removeItem(SEAL_KEY); } catch { /* ignore */ }
}

// Restore a player from their codename + Royal Seal.
export async function restoreGame(alias, seal) {
  if (!alias || !seal || typeof alias !== 'string' || typeof seal !== 'string') {
    throw new Error('invalid');
  }

  let resp;
  try {
    resp = await fetch('/api/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alias, seal }),
      keepalive: true,
    });
  } catch {
    throw new Error('offline');
  }

  if (!resp.ok) {
    const err = await parseJsonSafe(resp);
    if (resp.status === 404 && err && err.error === 'not_found') {
      throw new Error('not_found');
    }
    if (resp.status === 429) throw new Error('rate_limited');
    throw new Error('api error');
  }

  const data = await resp.json();
  const player = { playerId: data.playerId, alias: data.alias || alias };
  writeStored(player);
  return player;
}

async function parseJsonSafe(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

// ---- tracking ----

const PING_INTERVAL_MS = 10000; // 10 seconds

let trackingSession = null;

export function startTracking(page) {
  // Only one active tracker per page.
  if (trackingSession) {
    trackingSession.stop();
  }

  const player = readStored();
  if (!player) {
    return null; // no player => no tracking
  }

  let accumulatedSec = 0;
  let lastPingEpochSec = 0;
  let lastActivityEpochSec = 0;
  const nowSec = () => Math.floor(Date.now() / 1000);

  function isActiveRecently() {
    const since = nowSec() - lastActivityEpochSec;
    return since <= 60;
  }

  function isVisible() {
    return document.visibilityState === 'visible';
  }

  function touch() {
    lastActivityEpochSec = nowSec();
  }

  function ping(addSec, extra = {}) {
    const payload = { playerId: player.playerId, page, addSec: addSec || 0, ...extra };
    try {
      fetch('/api/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {}); // swallow silently
    } catch {
      /* API unreachable — not an error */
    }
  }

  function sendAccumulated() {
    if (!isVisible() || !isActiveRecently()) {
      accumulatedSec = 0;
      return;
    }
    const sec = Math.floor(accumulatedSec);
    if (sec > 0) {
      ping(sec);
      accumulatedSec = 0;
      lastPingEpochSec = nowSec();
    }
  }

  // Send an immediate first ping with addSec 0 (marks first_seen).
  ping(0);
  lastPingEpochSec = nowSec();
  lastActivityEpochSec = nowSec();

  // Accumulate active seconds each second while visible + recently active.
  const timer = setInterval(() => {
    if (isVisible() && isActiveRecently()) {
      accumulatedSec += 1;
    }
  }, 1000);

  // Every PING_INTERVAL_MS, flush accumulated seconds.
  const flushTimer = setInterval(sendAccumulated, PING_INTERVAL_MS);

  // Activity listeners.
  touch();
  const onActivity = () => touch();
  document.addEventListener('pointerdown', onActivity, true);
  document.addEventListener('touchstart', onActivity, true);
  document.addEventListener('scroll', onActivity, { passive: true });
  document.addEventListener('keydown', onActivity, true);

  // Final ping on page hide / beforeunload.
  function finalPing() {
    if (isVisible() && isActiveRecently()) {
      const sec = Math.floor(accumulatedSec);
      if (sec > 0) {
        // Use sendBeacon for reliability during page hide.
        const payload = JSON.stringify({
          playerId: player.playerId, page, addSec: sec,
        });
        try {
          navigator.sendBeacon('/api/ping', payload);
        } catch {
          ping(sec);
        }
      }
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finalPing();
  });
  window.addEventListener('pagehide', finalPing);

  const stop = () => {
    clearInterval(timer);
    clearInterval(flushTimer);
    document.removeEventListener('pointerdown', onActivity, true);
    document.removeEventListener('touchstart', onActivity, true);
    document.removeEventListener('scroll', onActivity, { passive: true });
    document.removeEventListener('keydown', onActivity, true);
    document.removeEventListener('visibilitychange', finalPing);
    window.removeEventListener('pagehide', finalPing);
    sendAccumulated();
  };

  trackingSession = { stop, player, page };
  return trackingSession;
}

export function trackHint(page) {
  const player = readStored();
  if (!player) return;
  try {
    fetch('/api/ping', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ playerId: player.playerId, page, addSec: 0, hint: true }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* silently ignored */
  }
}

// On module load: if no player, stop tracking.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (trackingSession) {
      trackingSession.stop();
    }
  });
}
