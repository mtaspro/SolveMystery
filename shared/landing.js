// shared/landing.js — landing page: the typewriter message and its Skip button.
// Plain ES module, no build step. Touch-first: everything is a tap/click.
//
// The message is typed one GRAPHEME at a time by the shared typewriter, so
// Bengali conjuncts never break when the page is switched to bn.

import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';

const CHAR_MS = 50; // ~163 characters => the message lands in about 8 seconds

const typed = document.getElementById('examTyped');
const text = document.getElementById('examText');
const skipBtn = document.getElementById('skipBtn');

let typing = null;

// Start (or restart) the message. Re-running it is what makes a language change
// possible: the helper holds the text it was given, so a new language needs a
// new run.
function startTyping() {
  typing = typewriter(text, t('landing.message'), CHAR_MS, {
    // Fires when the message finishes on its own AND when Skip jumps to the end.
    onDone: () => {
      typed.classList.add('is-done');   // retires the caret
      skipBtn.disabled = true;
    }
  });
  return typing;
}

skipBtn.addEventListener('click', () => { if (typing) typing.finish(); });

// Static copy first, then the toggle (which calls applyI18n() when clicked), then
// the typing. A language change repaints the page and shows the whole message
// again straight away, rather than replaying the animation.
onLangChange(() => {
  applyI18n();
  if (typing) typing.stop();
  startTyping().finish();
});

applyI18n();
mountLangToggle();
startTyping();