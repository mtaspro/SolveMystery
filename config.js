// config.js — central puzzle data for the whole game.
// Plain ES module (no build step). Import with:  import { CONFIG } from '/config.js';

export const CONFIG = {
  // One entry per stage. Key = stage id (also the URL folder name).
  stages: {
    s1: {
      answer: "2749",                       // expected input (trimmed, case-insensitive)
      fragment: { letter: "A", pos: 3 },     // puzzle piece awarded on success -> slot 3
      next: "/s2-k7q/",                      // where to go after solving
      hints: [
        "Some secrets only show up when the lights are off.",
        "Four doodles, four subjects. The timetable gives you the order.",
        "Order the digits by the timetable: Maths, Physics, Chemistry, English."
      ]
    }
  }
};
