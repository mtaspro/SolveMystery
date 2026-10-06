// /coin/script.js — the canteen order display.
// One pre-recorded announcement plays through a real <audio> element (no native
// controls). Mobile-first, touch-only, no answer checking: the player listens
// and then types the next address into their own browser address bar.

import { CONFIG } from '/config.js';
import { initHints } from '/shared/hints.js';
import { t, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter, prefersReducedMotion } from '/shared/ui.js';

// ---- editable constants (never translated) ----
const PA_AUDIO_URL = "https://res.cloudinary.com/dxqtqnfgf/video/upload/v1791217408/canteenpa_xv0afk.mp3";
const SCHOOL_NAME = "Greenfield School";
const WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza";

// ---- DOM refs ----
const pageTitle = document.getElementById('pageTitle');
const statusEl = document.getElementById('status');
const intro = document.getElementById('intro');
const introText = document.getElementById('introText');
const typed = document.getElementById('typed');
const beginBtn = document.getElementById('beginBtn');
const speakerBtn = document.getElementById('speakerBtn');
const speakerLabel = document.getElementById('speakerLabel');
const equalizer = document.getElementById('equalizer');
const progressFill = document.getElementById('progressFill');
const timeLabel = document.getElementById('timeLabel');
const slowBtn = document.getElementById('slowBtn');
const transcriptBtn = document.getElementById('transcriptBtn');
const transcriptBtnLabel = document.getElementById('transcriptBtnLabel');
const errorMsg = document.getElementById('errorMsg');
const transcript = document.getElementById('transcript');
const transcriptTitle = transcript.querySelector('.transcript__title');
const transcriptBody = transcript.querySelector('.transcript__body');
const audio = document.getElementById('pa');

// Give the audio its source from the constant so the URL is never page copy.
audio.src = PA_AUDIO_URL;

// ---- state ----
let typing = null;      // typewriter handle while the intro is running
let failsafe = null;    // guaranteed Begin button even if typing stalls
let introDone = false;
let played = false;     // announcement completed at least once
let isSlow = false;
let hasError = false;
let transcriptOpen = false;

// ---- formatting ----
function formatTime(seconds) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// ---- transcript ----
function buildTranscript() {
  transcriptTitle.textContent = t('canteen.transcriptTitle');
  transcriptBody.innerHTML = '';
  let i = 1;
  let key = 'canteen.transcript.' + i;
  while (t(key) !== key && t(key) !== undefined && i <= 20) {
    const line = document.createElement('p');
    line.textContent = t(key);
    transcriptBody.appendChild(line);
    i++;
    key = 'canteen.transcript.' + i;
  }
}

function toggleTranscript() {
  transcriptOpen = !transcriptOpen;
  transcript.hidden = !transcriptOpen;
  transcriptBtnLabel.textContent = transcriptOpen ? t('canteen.transcriptTitle') : t('canteen.showTranscript');
  transcriptBtn.classList.toggle('is-active', transcriptOpen);
}

transcriptBtn.addEventListener('click', toggleTranscript);

// ---- dynamic text (built at runtime; the static bits are handled by applyI18n) ----
function renderText() {
  pageTitle.textContent = SCHOOL_NAME + ' - ' + t('canteen.header');
  statusEl.textContent = played ? t('canteen.statusPlayed') : t('canteen.statusPending');
  speakerLabel.textContent = played ? t('canteen.speakerLabelReplay') : t('canteen.speakerLabel');
  transcriptBtnLabel.textContent = transcriptOpen ? t('canteen.transcriptTitle') : t('canteen.showTranscript');
  errorMsg.textContent = t('canteen.error');
}

// Toggle the playing visuals (equalizer + speaker glow).
function setPlaying(on) {
  equalizer.classList.toggle('is-visible', on);
  speakerBtn.classList.toggle('is-playing', on);
}

// Rewind the progress bar + time label so a re-play ("Play again") starts clean.
function resetProgress() {
  progressFill.style.width = '0%';
  if (audio.readyState >= 1 && isFinite(audio.duration)) {
    timeLabel.textContent = formatTime(0) + ' / ' + formatTime(audio.duration);
  } else {
    timeLabel.textContent = '0:00 / 0:00';
  }
}

function updateProgress() {
  const { currentTime, duration } = audio;
  const pct = duration ? (currentTime / duration) * 100 : 0;
  progressFill.style.width = pct + '%';
  if (duration) timeLabel.textContent = formatTime(currentTime) + ' / ' + formatTime(duration);
}

function handleAudioError() {
  if (hasError) return;
  hasError = true;
  errorMsg.hidden = false;
  transcript.hidden = false;   // auto-reveal the transcript on failure
  transcriptOpen = true;
  transcriptBtnLabel.textContent = t('canteen.transcriptTitle');
  transcriptBtn.classList.add('is-active');
  setPlaying(false);
}

function clearError() {
  hasError = false;
  errorMsg.hidden = true;
}

// ---- intro: Examiner typewriter ----
function finishIntro() {
  if (introDone) return;
  introDone = true;
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  if (typing) { typing.finish(); typing = null; }
  intro.classList.add('is-ready');      // reveal the Begin button
  beginBtn.focus({ preventScroll: true });
}

function startIntro() {
  introDone = false;
  typed.textContent = '';
  const text = t('canteen.intro');
  failsafe = setTimeout(finishIntro, 7500);
  typing = typewriter(typed, text, 45, { onDone: finishIntro });
  return typing;
}

function dismissIntro() {
  if (typing) { typing.stop(); typing = null; }
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  intro.classList.add('is-hidden');
  if (prefersReducedMotion()) { intro.hidden = true; }
  else { setTimeout(() => { intro.hidden = true; }, 400); }
}

beginBtn.addEventListener('click', dismissIntro);
// Tapping the typed line jumps to the end so the Begin button appears sooner.
introText.addEventListener('click', () => { if (typing) typing.finish(); });

// ---- audio play / pause ----
// On iOS/Safari and most mobile browsers, Web Audio / <audio>.play() is only
// allowed inside a direct user gesture. So we call audio.play() SYNCHRONOUSLY
// right here in the click handler and handle the returned promise separately —
// no await, no setTimeout, no other work before the call.
speakerBtn.addEventListener('click', () => {
  if (hasError) clearError();             // allow a retry after a failure
  if (audio.paused) {
    playAnnouncement();                   // play event resets the progress visuals
  }
  else {
    audio.pause();
  }
});

function playAnnouncement() {
  // The very first synchronous play() inside this tap is what mobile browsers
  // need to see. Catch the promise so a rejected play (gesture not trusted,
  // preload blocked, etc.) never throws an unhandled rejection.
  try {
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(handleAudioError);
  } catch (err) {
    handleAudioError();
  }
}

audio.addEventListener('play', () => {
  setPlaying(true);
  resetProgress();
});
audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', () => {
  if (isFinite(audio.duration)) {
    timeLabel.textContent = formatTime(0) + ' / ' + formatTime(audio.duration);
    progressFill.style.width = '0%';
  }
});
audio.addEventListener('ended', () => {
  setPlaying(false);
  played = true;
  if (isFinite(audio.duration)) {
    progressFill.style.width = '100%';
    timeLabel.textContent = formatTime(audio.duration) + ' / ' + formatTime(audio.duration);
  }
  speakerLabel.textContent = t('canteen.speakerLabelReplay');
  statusEl.textContent = t('canteen.statusPlayed');
});
audio.addEventListener('error', handleAudioError);

// Pause when the page is hidden or the screen locks — mobile browsers fire
// visibilitychange on lock, and a background tab should never keep playing.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !audio.paused) audio.pause();
});

// ---- slow playback (0.75x) ----
slowBtn.addEventListener('click', () => {
  isSlow = !isSlow;
  audio.playbackRate = isSlow ? 0.75 : 1;
  slowBtn.classList.toggle('is-active', isSlow);
});

// ---- hints: shared system + a Wikipedia button in the foot slot ----
// After hint 3 unlocks, an "Open Wikipedia" button appears inside the hint
// sheet, mirroring the corridor's "Reveal digits" pattern for page-specific
// extras.
const wikiWrap = document.createElement('div');
wikiWrap.className = 'wiki-wrap';
const wikiBtn = document.createElement('button');
wikiBtn.type = 'button';
wikiBtn.className = 'btn';
wikiBtn.textContent = t('canteen.wikipediaButton');
wikiWrap.appendChild(wikiBtn);

wikiBtn.addEventListener('click', () => {
  window.open(WIKIPEDIA_URL, '_blank', 'noopener noreferrer');
});

const hintsApi = initHints({
  hints: CONFIG.stages.s4.hints,
  onAllUnlocked: ({ foot }) => foot.appendChild(wikiWrap),
});

// ---- language change: repaint static copy + dynamic text ----
onLangChange(() => {
  applyI18n();
  buildTranscript();
  renderText();
  wikiBtn.textContent = t('canteen.wikipediaButton');
  if (!intro.hidden) {
    if (typing) { typing.stop(); typing = null; }
    if (failsafe) { clearTimeout(failsafe); failsafe = null; }
    typed.textContent = t('canteen.intro');
    if (!intro.classList.contains('is-ready')) {
      intro.classList.add('is-ready');
      beginBtn.focus({ preventScroll: true });
    }
  }
});

// ---- go ----
buildTranscript();
renderText();
applyI18n();
mountLangToggle();
startIntro();
