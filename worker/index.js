// worker/index.js — Cloudflare Worker for SolveMystery contest API.
// Serves /api/* endpoints backed by D1; everything else falls through to
// the static ASSETS binding.

const PAGE_ORDER = ['corridor', '2749', 'shush', 'coin', 'khufu', 'vault', 'results'];
const PAGE_SET = new Set(PAGE_ORDER);
const MAX_BODY_BYTES = 2048;
const MAX_ADDSEC = 30;
const MIN_PING_INTERVAL_SEC = 8;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function nowEpochSec() {
  return Math.floor(Date.now() / 1000);
}

async function parseBody(request) {
  if (!request.body) return {};
  const reader = request.body.getReader();
  const { value } = await reader.read();
  reader.releaseLock();
  if (value.byteLength > MAX_BODY_BYTES) {
    throw new Error('body too large');
  }
  try {
    const text = new TextDecoder('utf-8').decode(value);
    return JSON.parse(text);
  } catch {
    throw new Error('invalid json');
  }
}

function validateAlias(alias) {
  if (typeof alias !== 'string') return null;
  const trimmed = alias.trim();
  if (trimmed.length < 2 || trimmed.length > 16) return null;
  // Allow unicode letters/digits, space, underscore, dash.
  if (!/^[\p{L}\p{N} _-]+$/u.test(trimmed)) return null;
  return trimmed;
}

function isValidPage(page) {
  return PAGE_SET.has(page);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const method = request.method;
    const route = path.replace('/api', ''); // e.g. "/join"

    try {
      if (method === 'POST' && route === '/join') {
        const body = await parseBody(request);
        const alias = validateAlias(body?.alias);
        if (!alias) return json({ error: 'invalid alias' }, 400);

        const existing = await env.DB.prepare(
          'SELECT player_id FROM players WHERE LOWER(alias) = LOWER(?)'
        ).bind(alias).first();

        if (existing) {
          return json({ error: 'taken' }, 409);
        }

        const playerId = crypto.randomUUID();
        const ts = nowIso();
        await env.DB.prepare(
          'INSERT INTO players (player_id, alias, created_at) VALUES (?, ?, ?)'
        ).bind(playerId, alias, ts).run();

        return json({ playerId, alias });
      }

      if (method === 'POST' && route === '/ping') {
        const body = await parseBody(request);
        const { playerId, page, addSec, hint } = body || {};

        if (typeof addSec !== 'undefined' && typeof addSec !== 'number') {
          return json({ error: 'invalid addSec' }, 400);
        }
        if (hint !== undefined && hint !== true && hint !== false) {
          return json({ error: 'invalid hint' }, 400);
        }

        if (!playerId || typeof playerId !== 'string') {
          return json({ error: 'invalid playerId' }, 400);
        }
        if (!page || !isValidPage(page)) {
          return json({ error: 'invalid page' }, 400);
        }

        const player = await env.DB.prepare(
          'SELECT player_id, finished_at FROM players WHERE player_id = ?'
        ).bind(playerId).first();

        if (!player) {
          return json({ error: 'not found' }, 404);
        }

        const ts = nowIso();
        const epochSec = nowEpochSec();

        // Compute addSec with cap and abuse guard (min 8s since last_seen).
        let secToAdd = 0;
        if (typeof addSec === 'number') {
          secToAdd = Math.min(Math.max(0, Math.floor(addSec)), MAX_ADDSEC);
        }

        // Fetch existing page_stats to apply abuse guard.
        const stat = await env.DB.prepare(
          'SELECT first_seen, last_seen, active_sec, hints FROM page_stats WHERE player_id = ? AND page = ?'
        ).bind(playerId, page).first();

        if (stat) {
          const lastEpoch = Math.floor(new Date(stat.last_seen).getTime() / 1000);
          const elapsed = epochSec - lastEpoch;
          if (elapsed < MIN_PING_INTERVAL_SEC && secToAdd > 0) {
            secToAdd = 0;
          }
        }

        await env.DB.prepare(`
          INSERT INTO page_stats (player_id, page, first_seen, last_seen, active_sec, hints)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(player_id, page) DO UPDATE SET
            last_seen = excluded.last_seen,
            active_sec = page_stats.active_sec + excluded.active_sec,
            hints = page_stats.hints + excluded.hints
        `).bind(
          playerId, page, ts, ts,
          secToAdd,
          hint === true ? 1 : 0
        ).run();

        if (page === 'results' && !player.finished_at) {
          await env.DB.prepare(
            'UPDATE players SET finished_at = ? WHERE player_id = ?'
          ).bind(ts, playerId).run();
        }

        return json({ ok: true });
      }

      if (method === 'GET' && route === '/visitors') {
        const page = url.searchParams.get('page');
        if (!page || !isValidPage(page)) {
          return json({ error: 'invalid page' }, 400);
        }

        // total = number of players with a row for this page
        const totalRow = await env.DB.prepare(
          'SELECT COUNT(*) AS c FROM page_stats WHERE page = ?'
        ).bind(page).first();
        const total = totalRow.c;

        // next page in order
        const idx = PAGE_ORDER.indexOf(page);
        const nextPage = idx >= 0 && idx < PAGE_ORDER.length - 1
          ? PAGE_ORDER[idx + 1]
          : null;

        let fastestSec = null;
        if (nextPage) {
          // smallest active_sec among players that have a row for nextPage
          const fRow = await env.DB.prepare(
            'SELECT MIN(active_sec) AS m FROM page_stats WHERE page = ?'
          ).bind(nextPage).first();
          fastestSec = fRow.m ?? null;
        }

        // recent: up to 8 newest first_seen for this page
        const recentRows = await env.DB.prepare(
          `SELECT p.alias, ps.first_seen AS firstSeen
           FROM page_stats ps
           JOIN players p ON p.player_id = ps.player_id
           WHERE ps.page = ?
           ORDER BY ps.first_seen DESC
           LIMIT 8`
        ).bind(page).all();

        const recent = recentRows.results.map((r) => ({
          alias: r.alias,
          firstSeen: r.firstSeen,
        }));

        // first = earliest first_seen row for page X
        const firstRow = await env.DB.prepare(
          `SELECT p.alias, ps.first_seen AS firstSeen
           FROM page_stats ps
           JOIN players p ON p.player_id = ps.player_id
           WHERE ps.page = ?
           ORDER BY ps.first_seen ASC
           LIMIT 1`
        ).bind(page).first();

        const first = firstRow
          ? { alias: firstRow.alias, firstSeen: firstRow.firstSeen }
          : null;

        return json({ total, fastestSec, recent, first });
      }

      if (method === 'GET' && route === '/ticker') {
        // 5 most recent first_seen events across all pages
        const rows = await env.DB.prepare(
          `SELECT p.alias, ps.page, ps.first_seen AS at
           FROM page_stats ps
           JOIN players p ON p.player_id = ps.player_id
           ORDER BY ps.first_seen DESC
           LIMIT 5`
        ).all();

        const ticker = rows.results.map((r) => ({
          alias: r.alias,
          page: r.page,
          at: r.at,
        }));

        return json({ ticker });
      }

      if (method === 'GET' && route === '/board') {
        // Gather all players with their stats.
        const playerRows = await env.DB.prepare(
          `SELECT player_id, alias, finished_at FROM players ORDER BY created_at ASC`
        ).all();

        if (!playerRows.results.length) {
          return json({ pages: PAGE_ORDER, fastest: [], dedicated: [] });
        }

        // Build per-player stat map.
        const statsByPlayer = {};
        const allPlayerIds = playerRows.results.map((p) => p.player_id);
        const placeholders = allPlayerIds.map(() => '?').join(',');

        const statRows = await env.DB.prepare(
          `SELECT player_id, page, first_seen, last_seen, active_sec, hints
           FROM page_stats
           WHERE player_id IN (${placeholders})
           ORDER BY first_seen ASC`
        ).bind(...allPlayerIds).all();

        for (const s of statRows.results) {
          if (!statsByPlayer[s.player_id]) {
            statsByPlayer[s.player_id] = {};
          }
          statsByPlayer[s.player_id][s.page] = {
            first_seen: s.first_seen,
            last_seen: s.last_seen,
            active_sec: s.active_sec,
            hints: s.hints,
          };
        }

        // Determine first bloods (earliest first_seen per page).
        const firstBloods = {}; // page -> player_id
        for (const p of PAGE_ORDER) {
          firstBloods[p] = null;
        }

        const pageFirstRows = await env.DB.prepare(
          `SELECT page, player_id FROM page_stats
           ORDER BY first_seen ASC`
        ).all();

        for (const r of pageFirstRows.results) {
          if (firstBloods[r.page] === null) {
            firstBloods[r.page] = r.player_id;
          }
        }

        const players = [];
        for (const p of playerRows.results) {
          const stats = statsByPlayer[p.player_id] || {};
          const perPage = {};
          let totalSec = 0;
          let hints = 0;
          const firstBloodPages = [];

          for (const pg of PAGE_ORDER) {
            const s = stats[pg];
            if (s) {
              perPage[pg] = s.active_sec;
              totalSec += s.active_sec;
              hints += s.hints;
              if (firstBloods[pg] === p.player_id) {
                firstBloodPages.push(pg);
              }
            }
          }

          const finished = !!p.finished_at;
          const finishedAt = p.finished_at;

          players.push({
            alias: p.alias,
            firstBlood: firstBloodPages,
            hints,
            totalSec,
            perPage,
            finished,
            finishedAt,
          });
        }

        // fastest = finished players sorted by (totalSec + 60*hints) asc, with score
        const fastest = players
          .filter((pl) => pl.finished)
          .map((pl) => {
            const score = pl.totalSec + 60 * pl.hints;
            return { ...pl, score };
          })
          .sort((a, b) => a.score - b.score)
          .slice(0, 50);

        // dedicated = all players sorted by totalSec desc
        const dedicated = players
          .slice()
          .sort((a, b) => b.totalSec - a.totalSec)
          .slice(0, 50);

        return json({ pages: PAGE_ORDER, fastest, dedicated });
      }

      if (method === 'GET' && route === '/me') {
        const playerId = url.searchParams.get('playerId');
        if (!playerId || typeof playerId !== 'string') {
          return json({ error: 'invalid playerId' }, 400);
        }

        const player = await env.DB.prepare(
          'SELECT alias, finished_at FROM players WHERE player_id = ?'
        ).bind(playerId).first();

        if (!player) {
          return json({ error: 'not found' }, 404);
        }

        const finished = !!player.finished_at;

        let rank = null;
        if (finished) {
          // Rank among finished players by finished_at ascending.
          const rankRow = await env.DB.prepare(
            `SELECT COUNT(*) AS c FROM players
             WHERE finished_at IS NOT NULL AND finished_at <= ?`
          ).bind(player.finished_at).first();
          rank = rankRow.c;
        }

        return json({ alias: player.alias, finished, rank });
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'server error';
      if (msg === 'body too large' || msg === 'invalid json') {
        return json({ error: 'bad request' }, 400);
      }
      return json({ error: msg }, 500);
    }
  },
};
