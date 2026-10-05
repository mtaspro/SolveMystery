// config.js — central puzzle data for the whole game.
// Plain ES module (no build step). Import with:  import { CONFIG } from '/config.js';

export const CONFIG = {
  // One entry per stage. Key = stage id (also the URL folder name).
  stages: {
    s1: {
      // No answer / fragment / next: the player types the next address themselves.
      hints: [
        "Some secrets only show up when the lights are off.",
        "Four doodles, four subjects. The timetable gives you the order.",
        "Put the digits in timetable order (Maths, Physics, Chemistry, English). That number is the next address: type it right after the site name in your browser's address bar."
      ]
    },

    // Stage 2 — the Library. Hints only, for now.
    s2: {
      hints: [
        "Only the books with a red OVERDUE tag matter.",
        "Open each one for its due date. Earliest first.",
        "Take the first letter of each title in date order. What does a librarian say? That word is the next address: type it right after the site name."
      ]
    }
  }
};
