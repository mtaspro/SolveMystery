// config.js — central puzzle data for the whole game.
// Plain ES module (no build step). Import with:  import { CONFIG } from '/config.js';
//
// Hints are stored as STRING KEYS, not as text: the copy itself lives in
// /shared/strings.js so it can be translated, and the shared hint system looks
// each key up with t() at render time. See /shared/hints.js.

export const CONFIG = {
  // One entry per stage. Key = stage id (also the URL folder name).
  stages: {
    s1: {
      // No answer / fragment / next: the player types the next address themselves.
      hints: ['hints.s1.1', 'hints.s1.2', 'hints.s1.3']
    },

    // Stage 2 — the Library.
    s2: {
      hints: ['hints.s2.1', 'hints.s2.2', 'hints.s2.3']
    },

    // Stage 3 — the Science Lab CCTV archive.
    s3: {
      hints: ['hints.s3.1', 'hints.s3.2', 'hints.s3.3']
    },

    // Stage 4 — the canteen.
    s4: {
      hints: ['hints.s4.1', 'hints.s4.2', 'hints.s4.3']
    }
  }
};