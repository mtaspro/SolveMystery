// results/script.js — the results page.
// Locked screen if the vault has not been opened; a terminal-style
// "decrypting" animation if it has; then a confetti burst, the
// "PORTAL RESTORED" banner, and the reveal content (mask, friends, cards).
// Mobile-first, touch-only, honours prefers-reduced-motion.

import { t, tf, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';
import { RESULTS_DATA } from '/results/data.js';
import { startTracking, getPlayer } from '/shared/track.js';

// ---- DOM refs ----
const locked = document.getElementById('locked');
const terminal = document.getElementById('terminal');
const revealContent = document.getElementById('revealContent');
const bannerTitle = document.getElementById('bannerTitle');
const line1 = document.getElementById('line1');
const line2 = document.getElementById('line2');
const line3 = document.getElementById('line3');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const skipBtn = document.getElementById('skipBtn');

// Reveal content
const maskBtn = document.getElementById('maskBtn');
const examinerCard = document.getElementById('examinerCard');
const examinerWho = document.getElementById('examinerWho');
const examinerLine = document.getElementById('examinerLine');
const friends = document.getElementById('friends');
const friendsChips = document.getElementById('friendsChips');
const cert = document.getElementById('cert');
const certEyebrow = document.getElementById('certEyebrow');
const certName = document.getElementById('certName');
const certGrade = document.getElementById('certGrade');
const certMessage = document.getElementById('certMessage');
const certGroup = document.getElementById('certGroup');
 const finalNote = document.getElementById('finalNote');
 const finalNoteText = document.getElementById('finalNoteText');
 const finalNoteSignal = document.getElementById('finalNoteSignal');
 const rankBar = document.getElementById('rankBar');
 const rankText = document.getElementById('rankText');

 const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// State
let maskRemoved = false;
let hasOpenedCard = false;

// ---- localStorage check ----
function hasVaultKey() {
  try {
    return window.localStorage.getItem('vr_vault_open') === '1';
  } catch {
    return true;
  }
}

// ---- confetti ----
function createConfetti() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const colors = ['#39ff14', '#ff6b6b', '#ffd49e', '#5fe08a', '#39c5bb'];
  const n = 120;
  const particles = [];

  for (let i = 0; i < n; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 5 + 2,
      vx: (Math.random() - .5) * 2,
      vy: Math.random() * 2 + 1,
      a: Math.random() * .6 + .4,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  const start = performance.now();
  const DURATION = 3000;

  function tick(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += .08;
      p.x += p.vx;
      p.y += p.vy;
      p.a -= .003;
      if (p.a < 0) p.a = 0;

      ctx.globalAlpha = Math.max(0, p.a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);
}

// ---- typewriter helper ----
function typeLine(el, speed = 30) {
  return new Promise((resolve) => {
    const typing = typewriter(el, el.textContent, speed, { onDone: resolve });
    if (prefersReducedMotion.matches) typing.finish();
  });
}

// ---- terminal sequence ----
async function runTerminal() {
  if (terminal.hidden) return;

  await typeLine(line1);
  line1.classList.add('is-typed');

  await typeLine(line2);
  line2.classList.add('is-typed');

  await typeLine(line3);
  line3.classList.add('is-typed');

  // Progress bar: 0 to 100% over ~3 seconds.
  const PROGRESS_MS = 3000;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const pct = Math.min(100, (elapsed / PROGRESS_MS) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = Math.round(pct) + '%';

    if (pct < 100) {
      requestAnimationFrame(step);
    } else {
      progressFill.style.width = '100%';
      progressText.textContent = '100%';
      finishTerminal();
    }
  }

  requestAnimationFrame(step);
}

function finishTerminal() {
  terminal.hidden = true;
  revealContent.hidden = false;
  bannerTitle.classList.add('is-glow');

  startTracking('results');
  loadRank();

  if (!prefersReducedMotion.matches) {
    createConfetti();
  }
}

function loadRank() {
  if (!rankBar) return;
  const player = getPlayer();
  if (!player) {
    rankBar.hidden = true;
    return;
  }
  // Fetch the player's rank from the API.
  fetch('/api/me?playerId=' + encodeURIComponent(player.playerId))
    .then(async (resp) => {
      if (!resp.ok) throw new Error('http_' + resp.status);
      return resp.json();
    })
    .then((data) => {
      if (data && data.rank != null && data.rank > 0) {
        rankText.textContent = tf('results.rank.message', { n: data.rank });
        rankBar.hidden = false;
      } else {
        rankBar.hidden = true;
      }
    })
    .catch(() => {
      // API unreachable: hide the rank bar silently.
      rankBar.hidden = true;
    });
}

// ---- skip ----
function skipAll() {
  progressFill.style.width = '100%';
  progressText.textContent = '100%';
  line1.classList.add('is-typed');
  line2.classList.add('is-typed');
  line3.classList.add('is-typed');
  finishTerminal();
}

skipBtn.addEventListener('click', skipAll);

// ---- mask reveal ----
maskBtn.addEventListener('click', () => {
  if (maskRemoved) return;
  maskRemoved = true;

  // Mask-slide animation: the button shrinks and slides up, revealing the card.
  if (prefersReducedMotion.matches) {
    maskBtn.hidden = true;
    examinerCard.hidden = false;
    showFriends();
  } else {
    maskBtn.classList.add('is-revealed');
    setTimeout(() => {
      maskBtn.hidden = true;
      examinerCard.hidden = false;
      showFriends();
    }, 500);
  }
});

function showFriends() {
  examinerWho.textContent = tf('results.examinerWas', { name: RESULTS_DATA.examinerName });
  examinerLine.textContent = RESULTS_DATA.examinerLine;

  // Build friend chips
  friendsChips.innerHTML = '';
  RESULTS_DATA.friends.forEach((friend, index) => {
    if (!friend.name) return;
    const chip = document.createElement('button');
    chip.className = 'friend-chip';
    chip.type = 'button';
    chip.textContent = friend.name;
    chip.dataset.index = String(index);
    chip.addEventListener('click', () => showFriendCard(index));
    friendsChips.appendChild(chip);
  });

  friends.hidden = false;
}

function showFriendCard(index) {
  const friend = RESULTS_DATA.friends[index];
  if (!friend) return;

  // Set fields (skip missing ones)
  certEyebrow.textContent = t('results.certEyebrow');
  certName.textContent = friend.name || '';
  certGrade.textContent = friend.grade || '';
  certMessage.textContent = friend.message || '';
  certGroup.textContent = RESULTS_DATA.groupName || '';

  // Update active chip
  const chips = friendsChips.querySelectorAll('.friend-chip');
  chips.forEach((c) => c.classList.remove('is-active'));
  const activeChip = friendsChips.querySelector('[data-index="' + index + '"]');
  if (activeChip) activeChip.classList.add('is-active');

  cert.hidden = false;
  cert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (!hasOpenedCard) {
    hasOpenedCard = true;
    showFinalNote();
  }
}

function showFinalNote() {
  finalNoteText.textContent = RESULTS_DATA.finalNote || t('results.finalNote');
  if (finalNoteSignal) {
    finalNoteSignal.textContent = t('results.signal');
    finalNoteSignal.hidden = false;
  }
  finalNote.hidden = false;
}

// ---- language change ----
onLangChange(() => {
  applyI18n();
  // Update the examiner card with interpolated key if already revealed
  if (maskRemoved) {
    examinerWho.textContent = tf('results.examinerWas', { name: RESULTS_DATA.examinerName });
  }
  // Refresh friend chips (names from data, so no change, but re-render labels)
  if (hasOpenedCard) {
    finalNoteText.textContent = RESULTS_DATA.finalNote || t('results.finalNote');
  }
});

// ---- go ----
function init() {
  applyI18n();
  mountLangToggle();

  const granted = hasVaultKey();

  if (!granted) {
    locked.hidden = false;
    terminal.hidden = true;
    revealContent.hidden = true;
    return;
  }

  // Granted: start terminal sequence
  locked.hidden = true;
  terminal.hidden = false;
  revealContent.hidden = true;

  if (prefersReducedMotion.matches) {
    line1.classList.add('is-typed');
    line2.classList.add('is-typed');
    line3.classList.add('is-typed');
    setTimeout(finishTerminal, 100);
  } else {
    runTerminal();
  }
}

init();
