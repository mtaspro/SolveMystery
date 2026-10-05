// shared/404.js — the wrong-door page.
// One taunt is picked at random for each visit.

// The taunts The Examiner can say when you knock on a door that isn't there.
const TAUNTS = [
  "Wrong door, candidate.",
  "Incorrect. Please reconsider your life choices.",
  "That door does not exist. Neither does your confidence.",
  "Have you tried reading the clue again?"
];

const tauntEl = document.getElementById('taunt');
tauntEl.textContent = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];