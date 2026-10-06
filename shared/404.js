// shared/404.js — the wrong-door page.
// One taunt is picked at random for each visit; switching language keeps the
// same taunt, it just says it in the new language.

import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';

const tauntEl = document.getElementById('taunt');

// Pick once, from the list in the current language. Later renders reuse this
// index so the taunt does not change under the player's feet.
const index = Math.floor(Math.random() * t('notFound.taunts').length);

function renderTaunt() {
  const taunts = t('notFound.taunts');
  // Guard against a translation shipping fewer entries than English.
  tauntEl.textContent = taunts[index] || taunts[0];
}

applyI18n();
mountLangToggle();
renderTaunt();

// Re-say the taunt in the new language; the rest of the page repaints itself.
onLangChange(() => {
  applyI18n();
  renderTaunt();
});