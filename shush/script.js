// shush/script.js — Stage 3, the Science Lab CCTV archive.
// An "internet mystery" page: there is NO answer input, NO submit button and NO
// answer checking. The player reads the still and works out the next address
// themselves, typing it into their own browser's address bar, so this page
// never needs to know whether they got it right.
// Motion is skipped for users who prefer reduced motion. Taps/clicks only, no hover.

import { CONFIG } from '/config.js';
import { initHints } from '/shared/hints.js';
import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';

const STAGE = 's3';                   // this page's stage id in CONFIG

// ---------------------------------------------------------------------------
// EDIT HERE
// ---------------------------------------------------------------------------

// The still from Camera 02. Leave it empty ("") to keep the dashed placeholder
// box up instead — useful before the artwork is ready.
const LAB_IMAGE_URL = "https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1791207580/8INTH_xftzls.jpg";

// The school that owns the cameras. Used in the header and the page title.
const SCHOOL_NAME = "Greenfield School";

// ---------------------------------------------------------------------------

// ===========================================================================
// TEST ONLY — delete this whole block once LAB_IMAGE_URL is set for good.
// While there is no real still, draw a 1200x1600 stand-in with some small text
// on it, so the pinch/drag/double-tap viewer can be checked on a real phone.
// ===========================================================================
const TEST_IMAGE_W = 1200;
const TEST_IMAGE_H = 1600;

function testImageUrl(w, h) {
  const mid = h / 2;

  // One centred line of monospace text.
  function line(str, x, y, size, fill, weight) {
    const safe = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<text x="' + x + '" y="' + y + '" fill="' + fill +
      '" font-family="monospace" font-size="' + size + '"' +
      (weight ? ' font-weight="' + weight + '"' : '') +
      ' text-anchor="middle">' + safe + '</text>';
  }

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
    '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<rect width="' + w + '" height="' + h + '" fill="#101a2c"/>' +
    // A grid, so panning and pinching are easy to see happening.
    '<g stroke="#1d2b47" stroke-width="2">' +
      '<path d="M0 ' + mid + 'H' + w + 'M' + (w / 2) + ' 0V' + h + '"/>' +
      '<path d="M0 ' + (h / 4) + 'H' + w + 'M0 ' + (3 * h / 4) + 'H' + w +
        'M' + (w / 4) + ' 0V' + h + 'M' + (3 * w / 4) + ' 0V' + h + '"/>' +
    '</g>' +
    '<g fill="none" stroke="#39ff14" stroke-width="3" opacity=".55">' +
      '<rect x="40" y="40" width="' + (w - 80) + '" height="' + (h - 80) + '"/>' +
    '</g>' +
    // Viewfinder corners, to match the monitor frame.
    '<g stroke="#39ff14" stroke-width="4" opacity=".55">' +
      '<path d="M40 120V40h80M' + (w - 120) + ' 40h80v80M' + (w - 40) + ' ' + (h - 120) +
        'v80h-80M120 ' + (h - 40) + 'H40v-80"/>' +
    '</g>' +
    line('TEST PLACEHOLDER', w / 2, mid - 96, 40, '#39ff14', 700) +
    line(w + ' x ' + h + ' - no LAB_IMAGE_URL set', w / 2, mid - 44, 22, '#f3ead6') +
    // Small print: the thing you are meant to be able to read once zoomed in.
    line('Small print, for checking the zoom.', w / 2, mid + 10, 17, '#b9b1a1') +
    line('The quick brown fox jumps over 13 lazy dogs.', w / 2, mid + 36, 17, '#b9b1a1') +
    line('0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ', w / 2, mid + 62, 17, '#b9b1a1') +
    line('Pan with one finger, pinch with two.', w / 2, mid + 88, 17, '#b9b1a1') +
    line('Double-tap to toggle 100% / 250%.', w / 2, mid + 114, 17, '#b9b1a1') +
    line('SMALL PRINT BLOCK - CENTRE', w / 2, h - 52, 16, '#5fe08a') +
    line('TOP EDGE', w / 2, 96, 18, '#5fe08a') +
    line('BOTTOM EDGE', w / 2, h - 84, 18, '#5fe08a') +
    '</svg>';

  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}
// ===========================================================================

// Read the user's motion preference at call time so it stays live.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// --- DOM refs ---
const siteName = document.getElementById('siteName');
const footage = document.getElementById('footage');
const footageBtn = document.getElementById('footageBtn');
const footagePh = document.getElementById('footagePh');
const zoom = document.getElementById('zoom');
const zoomScroll = document.getElementById('zoomScroll');
const zoomImg = document.getElementById('zoomImg');
const zoomTip = document.getElementById('zoomTip');
const zoomClose = document.getElementById('zoomClose');
const intro = document.getElementById('intro');
const introText = document.getElementById('introText');
const beginBtn = document.getElementById('beginBtn');
const status = document.getElementById('status');

// Announce to the polite live region.
function say(msg) { status.textContent = ''; status.textContent = msg; }

// --- header: fill in the one editable constant (the HTML copy is a fallback) ---
siteName.textContent = SCHOOL_NAME;
document.title = SCHOOL_NAME + ' - ' + t('lab.department');

// --- the still: swap it in, or leave the dashed placeholder up ---
footage.addEventListener('load', () => {
  footageBtn.hidden = false;
  footagePh.hidden = true;
  footageBtn.setAttribute('aria-label', t('lab.enlargeAria'));
  say(t('lab.itemLoaded'));
});

// A broken URL is not an error the player has to solve: the placeholder stays up.
footage.addEventListener('error', () => {
  footageBtn.hidden = true;
  footagePh.hidden = false;
  say(t('lab.itemUnavailable'));
});

footage.src = LAB_IMAGE_URL.trim() || testImageUrl(TEST_IMAGE_W, TEST_IMAGE_H);

// --- enlarged footage: pan, pinch, double-tap ---
const ZOOM_WIDE_PCT = 250;                 // matches .zoom__scroll.is-wide in style.css
const TIP_MS = 3000;                      // the "Double-tap to zoom" tip fades out after this
const TAP_SLOP = 12;                      // a pointer that moved further than this was a drag
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_SLOP = 40;               // the second tap has to land nearby

let lastFocus = null;   // the monitor button, to give focus back to
let closeTimer = null;
let tipTimer = null;

// Put the middle of the still in the middle of the screen.
function centerScroll() {
  zoomScroll.scrollLeft = Math.max(0, (zoomScroll.scrollWidth - zoomScroll.clientWidth) / 2);
  zoomScroll.scrollTop = Math.max(0, (zoomScroll.scrollHeight - zoomScroll.clientHeight) / 2);
}

function showTip() {
  if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
  zoomTip.classList.remove('is-gone');
  tipTimer = setTimeout(() => {
    zoomTip.classList.add('is-gone');
    tipTimer = null;
  }, TIP_MS);
}

// Double-tap toggles between the whole still and ZOOM_WIDE_PCT, holding the
// tapped point still on screen so it reads as a zoom rather than a jump.
function toggleZoom(clientX, clientY) {
  const rect = zoomScroll.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const cx = zoomScroll.scrollLeft + px;   // read before the width changes
  const cy = zoomScroll.scrollTop + py;

  const zoomedIn = zoomScroll.classList.toggle('is-wide');
  zoomScroll.getBoundingClientRect();      // flush the new width before we scroll
  const factor = zoomedIn ? ZOOM_WIDE_PCT / 100 : 100 / ZOOM_WIDE_PCT;

  zoomScroll.scrollLeft = cx * factor - px;
  zoomScroll.scrollTop = cy * factor - py;
  say(zoomedIn ? t('lab.zoomedIn') : t('lab.zoomedOut'));
}

function openZoom() {
  zoomImg.src = footage.currentSrc || footage.src;
  zoomImg.alt = footage.alt;
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  zoom.classList.remove('is-closing');
  zoom.hidden = false;
  document.body.style.overflow = 'hidden';
  lastFocus = footageBtn;

  zoomScroll.classList.add('is-wide');     // open at ZOOM_WIDE_PCT, centred
  centerScroll();
  zoomImg.addEventListener('load', centerScroll, { once: true });  // in case it is not cached

  showTip();
  say(t('lab.enlargedTip'));
  zoomClose.focus({ preventScroll: true });
}

function closeZoom() {
  if (zoom.hidden) return;
  zoom.classList.add('is-closing');
  const hide = () => {
    zoom.hidden = true;
    zoom.classList.remove('is-closing');
    closeTimer = null;
  };
  if (prefersReducedMotion.matches) hide();   // no fade when reduced
  else closeTimer = setTimeout(hide, 200);
  if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; }
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

// A tap is a pointerup that did not travel. Anything else is a pan, and a pan
// must never be mistaken for a double-tap.
let downX = 0, downY = 0, downAt = 0;
let tapAt = 0, tapX = 0, tapY = 0;

zoomScroll.addEventListener('pointerdown', (e) => {
  downX = e.clientX; downY = e.clientY; downAt = Date.now();
});

zoomScroll.addEventListener('pointerup', (e) => {
  if (Date.now() - downAt > 700) return;                              // long press
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > TAP_SLOP) return;  // that was a drag

  const now = Date.now();
  const nearby = Math.hypot(e.clientX - tapX, e.clientY - tapY) <= DOUBLE_TAP_SLOP;
  if (now - tapAt < DOUBLE_TAP_MS && nearby) {
    tapAt = 0;                          // consumed: a third tap starts a new pair
    toggleZoom(e.clientX, e.clientY);
    return;
  }
  tapAt = now; tapX = e.clientX; tapY = e.clientY;
});

footageBtn.addEventListener('click', openZoom);
zoomClose.addEventListener('click', closeZoom);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeZoom(); });

// --- intro: typewriter + dismiss ---
let typing = null;      // typewriter handle while typing
let failsafe = null;    // safety net so the Begin button always appears
let introDone = false;  // guards finishIntro against re-entry from onDone

function finishIntro() {
  if (introDone) return;
  introDone = true;
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  if (typing) { typing.finish(); typing = null; }
  introText.classList.remove('is-typing');
  intro.classList.add('is-ready');      // reveal the Begin button
  if (!intro.hidden) beginBtn.focus({ preventScroll: true });
}

function startIntro() {
  introDone = false;
  introText.classList.add('is-typing');
  failsafe = setTimeout(finishIntro, 6000);
  typing = typewriter(introText, t('lab.intro'), 42, { onDone: finishIntro });
  return typing;
}

function dismissIntro() {
  if (typing) { typing.stop(); typing = null; }
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  intro.classList.add('is-hidden');
  const hide = () => { intro.hidden = true; };
  if (prefersReducedMotion.matches) hide();  // no fade when reduced
  else setTimeout(hide, 380);
  // Hand focus to the still if it has already arrived; otherwise nothing in
  // the main area is focusable, so leave it be.
  if (!footageBtn.hidden) footageBtn.focus({ preventScroll: true });
}

beginBtn.addEventListener('click', dismissIntro);
introText.addEventListener('click', () => { if (typing) typing.finish(); });   // tap the note to skip typing

// --- shared hint system (fixed "Stuck?" bar + bottom sheet) ---
// Hints are advisory only: no answer, no checking. On this stage there is
// nothing extra to reveal once they are all out, so onAllUnlocked is left empty.
initHints({ hints: CONFIG.stages[STAGE].hints });

// --- language change: re-render dynamic text without a reload ---
onLangChange(() => {
  applyI18n();
  // Footage button aria-label (only matters once the still has loaded).
  if (!footageBtn.hidden) {
    footageBtn.setAttribute('aria-label', t('lab.enlargeAria'));
  }
  // Intro: if still showing, jump to full text in the new language.
  if (!intro.hidden) {
    if (typing) { typing.stop(); typing = null; }
    if (failsafe) { clearTimeout(failsafe); failsafe = null; }
    startIntro().finish();
  }
});

// --- go ---
applyI18n();
mountLangToggle();
startIntro();