// shared/ui.js — shared UI helpers. Plain ES module, no libraries, no build step.
//
//   import { typewriter } from '/shared/ui.js';
//   const typing = typewriter(el, t('landing.message'), 45);
//   typing.finish();   // jump to the end, e.g. from a Skip button
//   await typing.done;

// ---- graphemes ----
// Bengali builds words out of conjuncts: several code points that must appear
// together ("ক" + "্" + "ষ" is one letter ক্ষ). Stepping through the string one
// code point at a time tears those apart mid-letter, so split on grapheme
// clusters instead.
let segmenter = null;
try {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  }
} catch { segmenter = null; }

export function splitGraphemes(text) {
  const value = String(text);
  if (segmenter) return Array.from(segmenter.segment(value), (part) => part.segment);
  // Best effort only: Array.from splits by code point, so surrogate pairs
  // (emoji, some scripts) stay whole, but a conjunct still needs Intl.Segmenter.
  return Array.from(value);
}

export function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}

// ---- typewriter ----
// Writes `text` into `el` one grapheme at a time, every `speed` ms.
//
// Returns { finish, stop, done, text }:
//   finish()  jump straight to the whole string and resolve
//   stop()    cancel and leave whatever is already on screen
//   done      Promise, resolved either way
//
// Motion is skipped by default for users who prefer reduced motion; pass
// { reducedMotion: false } to animate anyway.
export function typewriter(el, text, speed = 45, options = {}) {
  const {
    reducedMotion = prefersReducedMotion(),
    onChar = null,
    onDone = null
  } = options;

  const graphemes = splitGraphemes(text);
  let shown = 0;
  let timer = 0;
  let settle = null;

  const done = new Promise((resolve) => { settle = resolve; });

  function write(count) {
    el.textContent = graphemes.slice(0, count).join('');
    if (onChar && count > 0) onChar(graphemes[count - 1], count);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = 0; }
    settle(text);
    return done;
  }

  function finish() {
    if (timer) { clearInterval(timer); timer = 0; }
    write(graphemes.length);
    settle(text);
    if (onDone) onDone();
    return done;
  }

  if (reducedMotion) {
    write(graphemes.length);
    settle(text);
    if (onDone) onDone();
  } else {
    write(0);
    timer = setInterval(() => {
      shown += 1;
      write(shown);
      if (shown >= graphemes.length) finish();
    }, Math.max(1, speed));
  }

  return { finish, stop, done, text };
}