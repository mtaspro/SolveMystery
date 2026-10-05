// shared/landing.js — landing page: the typewriter message and its Skip button.
// Plain ES module, no build step. Touch-first: everything is a tap/click.

const MESSAGE = 'Your results have been relocated. I have hidden them across the internet. '
  + 'Each door has an address. The address is the answer. Solve the clue, find the next door.';
const CHAR_MS = 50; // ~163 characters => the message lands in about 8 seconds

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const typed = document.getElementById('examTyped');
const text = document.getElementById('examText');
const skipBtn = document.getElementById('skipBtn');

let i = 0;
let timer = 0;

// Jump straight to the finished message and retire the caret + Skip.
function finish() {
  clearInterval(timer);
  timer = 0;
  text.textContent = MESSAGE;
  typed.classList.add('is-done');
  skipBtn.disabled = true;
}

function start() {
  if (reduceMotion.matches) { finish(); return; } // no typing animation
  timer = setInterval(() => {
    i += 1;
    text.textContent = MESSAGE.slice(0, i);
    if (i >= MESSAGE.length) finish();
  }, CHAR_MS);
}

skipBtn.addEventListener('click', finish);
start();