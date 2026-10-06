// 2749/script.js — Stage 2, the Library.
// An "internet mystery" page, like the corridor: there is NO answer input, NO
// submit button and NO answer checking. The player reads the due dates off the
// overdue books and types the next address into their own browser's address bar,
// so this page never needs to know whether they got it right.
// Motion is skipped for users who prefer reduced motion. Taps/clicks only, no hover.

import { CONFIG } from '/config.js';
import { initHints } from '/shared/hints.js';
import { t, tf, applyI18n, mountLangToggle, onLangChange } from '/shared/i18n.js';
import { typewriter } from '/shared/ui.js';

const STAGE = 's2';                 // this page's stage id in CONFIG

// ---------------------------------------------------------------------------
// EDIT HERE
// ---------------------------------------------------------------------------

// One constant for the site name (and the account holder). Subtitles, intros
// and labels all live in /shared/strings.js so the toggle can switch them.
const SITE = {
  name: 'Greenfield School Library',
  account: 'E. XAMINER',
};

// Titles stay English on purpose (the puzzle depends on their initials).
const BOOKS = [
  { title: 'Halfway to Midnight',               overdue: true,  due: '17 Oct' },
  { title: 'A Brief History of Canteen Queues', overdue: false, due: '' },
  { title: 'Unsolved Mysteries of Maths',      overdue: true,  due: '9 Oct' },
  { title: 'Silent Algebra',                    overdue: true,  due: '2 Oct' },
  { title: 'Chemistry for the Brave',           overdue: false, due: '' },
  { title: 'Study Hacks for Sleepers',          overdue: true,  due: '12 Oct' },
  { title: 'Homework Never Ends',               overdue: true,  due: '5 Oct' },
  { title: 'The Art of Procrastination',        overdue: false, due: '' },
];

// Spine colours, cycled by position. Keep these distinguishable on a dark screen.
const SPINE_COLORS = [
  '#3b4a8f', '#2f7d78', '#7a3f7a', '#35506b',
  '#4a7a3c', '#b5642a', '#b3922f', '#6a5a9c',
];

// ---------------------------------------------------------------------------

const PER_ROW = 4;                 // two rows of four

// Read the user's motion preference at call time so it stays live.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// --- DOM refs ---
const shelf = document.getElementById('shelf');
const modal = document.getElementById('bookModal');
const bookEyebrow = document.getElementById('bookEyebrow');
const bookTitle = document.getElementById('bookTitle');
const bookStamp = document.getElementById('bookStamp');
const bookClose = document.getElementById('bookClose');
const intro = document.getElementById('intro');
const introText = document.getElementById('introText');
const beginBtn = document.getElementById('beginBtn');
const status = document.getElementById('status');

// Announce to the polite live region.
function say(msg) { status.textContent = ''; status.textContent = msg; }

// --- header: fill in the one editable constant (the HTML copy is a fallback) ---
document.getElementById('siteName').textContent = SITE.name;
document.getElementById('acctName').textContent = SITE.account;
document.title = SITE.name + ' - ' + t('library.subtitle');

// Count the overdue books from the data itself, so the strip can never disagree
// with the shelf if you edit BOOKS above.
const overdueCount = BOOKS.filter((b) => b.overdue).length;
document.getElementById('acctDue').textContent = tf(
  overdueCount === 1 ? 'library.itemOverdue' : 'library.itemsOverdue',
  { n: overdueCount }
);

// --- state ---
let currentBookIndex = null;  // which book's modal is currently open

// --- the shelf ---
const seen = new Set();     // indexes of books already opened
let lastFocus = null;       // the spine that opened the dialog, to give focus back
let closeTimer = null;

function describe(book) {
  return book.overdue
    ? tf('library.spineOverdue', { title: book.title, due: book.due })
    : tf('library.spineReturned', { title: book.title });
}

function renderShelf() {
  for (let start = 0; start < BOOKS.length; start += PER_ROW) {
    const row = document.createElement('div');
    row.className = 'shelf__row';

    BOOKS.slice(start, start + PER_ROW).forEach((book, offset) => {
      const index = start + offset;

      const spine = document.createElement('button');
      spine.type = 'button';
      spine.className = 'spine';
      spine.style.setProperty('--spine', SPINE_COLORS[index % SPINE_COLORS.length]);
      spine.setAttribute('aria-label', describe(book));

      const title = document.createElement('span');
      title.className = 'spine__title';
      title.textContent = book.title;          // textContent: titles stay inert text
      spine.appendChild(title);

      if (book.overdue) {
        const tag = document.createElement('span');
        tag.className = 'spine__tag';
        tag.textContent = t('library.overdueTag');
        spine.appendChild(tag);
      }

      const dot = document.createElement('span');   // shown once the book is opened
      dot.className = 'spine__seen';
      dot.setAttribute('aria-hidden', 'true');
      spine.appendChild(dot);

      spine.addEventListener('click', () => openBook(index, spine));
      row.appendChild(spine);
    });

    shelf.appendChild(row);
  }
}
// --- book record dialog ---
function openBook(index, spine) {
  currentBookIndex = index;
  const book = BOOKS[index];
  const stampText = book.overdue ? tf('library.stampDue', { due: book.due }) : t('library.returnedOnTime');

  bookEyebrow.textContent = book.overdue ? t('library.overdueItem') : t('library.borrowingRecord');
  bookTitle.textContent = book.title;
  bookStamp.textContent = stampText;
  bookStamp.className = 'stamp ' + (book.overdue ? 'stamp--due' : 'stamp--ok');

  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  modal.classList.remove('is-closing');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  lastFocus = spine;
  spine.classList.add('is-seen');        // subtle "checked" dot
  seen.add(index);

  say(book.title + '. ' + stampText);
  bookClose.focus({ preventScroll: true });
}

function closeBook() {
  if (modal.hidden) return;
  modal.classList.add('is-closing');
  const hide = () => {
    modal.hidden = true;
    modal.classList.remove('is-closing');
    closeTimer = null;
    currentBookIndex = null;
  };
  if (prefersReducedMotion.matches) hide();   // no fade when reduced
  else closeTimer = setTimeout(hide, 180);
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

bookClose.addEventListener('click', closeBook);
modal.addEventListener('click', (e) => { if (e.target === modal) closeBook(); });  // tap outside
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBook(); });

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
  intro.classList.add('is-ready');         // reveal the Begin button
  beginBtn.focus({ preventScroll: true });
}

function startIntro() {
  introDone = false;
  introText.classList.add('is-typing');
  failsafe = setTimeout(finishIntro, 7000);
  typing = typewriter(introText, t('library.intro'), 42, { onDone: finishIntro });
  return typing;
}

function dismissIntro() {
  if (typing) { typing.stop(); typing = null; }
  if (failsafe) { clearTimeout(failsafe); failsafe = null; }
  intro.classList.add('is-hidden');
  const hide = () => { intro.hidden = true; };
  if (prefersReducedMotion.matches) hide();  // no fade when reduced
  else setTimeout(hide, 380);
  const first = shelf.querySelector('.spine');
  if (first) first.focus({ preventScroll: true });
}

beginBtn.addEventListener('click', dismissIntro);

// --- shared hint system (fixed "Stuck?" bar + bottom sheet) ---
// Hints are advisory only: no answer, no checking. On stage 2 there is nothing
// to reveal beyond the text, so the onAllUnlocked slot stays empty.
initHints({ hints: CONFIG.stages[STAGE].hints });

// --- language change: re-render dynamic text without a reload ---
onLangChange(() => {
  applyI18n();
  // Account strip
  document.getElementById('acctDue').textContent = tf(
    overdueCount === 1 ? 'library.itemOverdue' : 'library.itemsOverdue',
    { n: overdueCount }
  );
  // Spine aria-labels
  shelf.querySelectorAll('.spine').forEach((spine, index) => {
    spine.setAttribute('aria-label', describe(BOOKS[index]));
  });
  // Spine tags
  shelf.querySelectorAll('.spine__tag').forEach((tag) => {
    tag.textContent = t('library.overdueTag');
  });
  // Intro: if still showing, jump to full text in the new language.
  if (!intro.hidden) {
    if (typing) { typing.stop(); typing = null; }
    if (failsafe) { clearTimeout(failsafe); failsafe = null; }
    startIntro().finish();
  }
  // Modal: if open, re-render its content.
  if (!modal.hidden && currentBookIndex !== null) {
    const book = BOOKS[currentBookIndex];
    const stampText = book.overdue ? tf('library.stampDue', { due: book.due }) : t('library.returnedOnTime');
    bookEyebrow.textContent = book.overdue ? t('library.overdueItem') : t('library.borrowingRecord');
    bookStamp.textContent = stampText;
  }
});

// --- go ---
applyI18n();
mountLangToggle();
renderShelf();
startIntro();
