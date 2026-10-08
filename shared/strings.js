// shared/strings.js — every piece of user-visible copy, keyed by language.
// Plain ES module, no build step. Read it through t() in /shared/i18n.js.
//
// One entry per language. A language with no entry for a key falls back to
// English, and a key that exists nowhere returns the key itself — so a missing
// translation can never blank out a page or throw.
//
// Only static copy lives here. Puzzle data (hints, book titles, due dates)
// belongs in /config.js, and any string built at runtime — "5 items overdue",
// "Locked — 43s" — stays in the page that builds it, because t() does no
// interpolation.

// Mark a value as markup we wrote ourselves and trust applyI18n() to inject it
// as innerHTML. Anything NOT wrapped in html() is only ever written as
// textContent, so a translation can never smuggle markup into the page.
export const html = (value) => ({ __html: String(value) });

export const isTrustedHtml = (value) =>
  !!value && typeof value === 'object' && typeof value.__html === 'string';

const en = {
  // ---- shared chrome ----
  'common.from': 'The Examiner',
  'common.begin': 'Begin',
  'common.close': 'Close',

  // ---- language toggle ----
  'lang.toEn': 'Switch to English',
  'lang.toBn': 'Switch to Bengali',

  // ---- hints panel ----
  'hints.button': 'Stuck?',
  'hints.title': 'Assistance',
  'hints.close': 'Close hints',
  'hints.locked': 'Locked \u2014 {n}s',
  'hints.allOut': '{n} hints',

  // Hint bodies live here, not in /config.js: config.js only holds the keys, so
  // a hint can be translated. Wording must stay exactly as it was in English.
  'hints.s1.1': 'Some secrets only show up when the lights are off.',
  'hints.s1.2': 'Four doodles, four subjects. The timetable gives you the order.',
  'hints.s1.3': 'Put the digits in timetable order (Maths, Physics, Chemistry, ' +
    'English). That number is the next address: type it right after the site name ' +
    'in your browser\'s address bar.',

  'hints.s2.1': 'Only the books with a red OVERDUE tag matter.',
  'hints.s2.2': 'Open each one for its due date. Earliest first.',
  'hints.s2.3': 'Take the first letter of each title in date order. What does a ' +
    'librarian say? That word is the next address: type it right after the site name.',

  'hints.s3.1': 'Zoom in. Three tiles are circled.',
  'hints.s3.2': 'Read the short symbols in the numbered order, not the full names.',
  'hints.s3.3': 'Co + I + N. Say them together: that word is the next address. ' +
    'Type it right after the site name.',

  // ---- landing page ----
  'landing.banner': 'BOARD OF SECONDARY EXAMINATIONS - PORTAL OFFLINE',
  'landing.addressCaption': 'Type the answer here.',
  'landing.siteName': 'yoursite.app/',
  'landing.begin': 'Begin Investigation',
  'landing.skip': 'Skip',
  'landing.tip': 'Tip: answers are always lowercase, no spaces.',
  'landing.message': 'Your results have been relocated. I have hidden them across the ' +
    'internet. Each door has an address. The address is the answer. Solve the clue, ' +
    'find the next door.',

  // ---- 404 ----
  'notFound.code': '404 - WRONG DOOR',
  'notFound.note': 'Check spelling: lowercase, no spaces.',
  'notFound.back': 'Back to start',
  // One key holding the whole list: /shared/404.js picks a random entry.
  'notFound.taunts': [
    'Wrong door, candidate.',
    'Incorrect. Please reconsider your life choices.',
    'That door does not exist. Neither does your confidence.',
    'Have you tried reading the clue again?'
  ],

  // ---- stage 1: the corridor ----
  'corridor.intro': 'Candidates, your results have been relocated. Remain calm. ' +
    'Panic is permitted.',
  'corridor.noticeboard': 'Noticeboard',
  'corridor.timetable': 'Timetable',
  'corridor.stickyNote': "Don't trust the lights.",
  'corridor.clockLabel': 'Wall clock, quarter past three',
  'corridor.torchHint': 'Drag your finger to look around',
  'corridor.switchOn': 'Light switch (lights on)',
  'corridor.switchOff': 'Light switch (lights off)',
  'corridor.lightsOut': 'The lights go out.',
  'corridor.lightsOn': 'The lights come back on.',
  'corridor.switchDead': 'The switch is dead.',
  'corridor.revealButton': 'Reveal digits',
  'corridor.digitsRevealed': 'The digits are revealed.',

  // ---- stage 2: the library ----
  'library.crest': 'Est. 1974 \u00b7 Non-circulating after hours',
  'library.subtitle': 'Online Catalog',
  'library.searchPlaceholder': 'Search by title, author or subject',
  'library.searchButton': 'Search',
  'library.accountLabel': 'Account:',
  'library.shelfHint': 'Tap a spine to check its borrowing record.',
  'library.intro': 'Some books were never returned. Return them in order. Then be quiet.',
  'library.overdueItem': 'Overdue item',
  'library.borrowingRecord': 'Borrowing record',
  'library.returnedOnTime': 'Returned on time',
  'library.overdueTag': 'OVERDUE',
  'library.itemOverdue': '{n} item overdue',
  'library.itemsOverdue': '{n} items overdue',
  'library.spineOverdue': '{title}. Overdue, due {due}.',
  'library.spineReturned': '{title}. Returned on time.',
  'library.stampDue': 'DUE: {due}',
  'library.introFrom': 'A note from The Examiner',

  // ---- stage 3: the science lab ----
  'lab.rec': 'REC',
  'lab.department': 'Science Dept. - CCTV Archive',
  'lab.stripPrefix': 'Camera 02 - Lab 3 - Footage flagged by:',
  'lab.intro': 'At 03:07 AM something was written on the board. Cameras never lie. ' +
    'Neither do elements.',
  'lab.caption': 'Tap the footage to enlarge.',
  'lab.log': 'Evidence log: 3 marked items.',
  'lab.placeholder': 'Footage loading... (add LAB_IMAGE_URL)',
  'lab.itemLoaded': 'Footage loaded. Tap to enlarge.',
  'lab.itemUnavailable': 'Footage unavailable.',
  'lab.zoomedIn': 'Zoomed in.',
  'lab.zoomedOut': 'Zoomed out.',
  'lab.enlargedTip': 'Footage enlarged. Drag to pan, pinch to zoom, double-tap to toggle.',
  'lab.enlargeAria': 'Enlarge the Camera 02 still',
  'lab.zoomAria': 'Enlarged footage',
  'lab.zoomTip': 'Double-tap to zoom',

  // ---- stage 4: the canteen ----
  'canteen.header': 'Canteen - Order Display',
  'canteen.statusPending': 'Now serving: 03:07 - Announcement pending',
  'canteen.statusPlayed': 'Now serving: 03:07 - Announcement played',
  'canteen.intro': 'Hungry? Too bad. The canteen has one announcement today. Listen carefully.',
  'canteen.speakerLabel': "Tap to hear today's announcement",
  'canteen.speakerLabelReplay': 'Play again',
  'canteen.slow': 'Slow',
  'canteen.error': 'Audio unavailable. Show the transcript below.',
  'canteen.transcriptTitle': 'Transcript',
  'canteen.transcript.1': 'Attention, all candidates. Attention.',
  'canteen.transcript.2': 'The canteen will close early today.',
  'canteen.transcript.3': 'A message from the Examiner.',
  'canteen.transcript.4': 'Whose tomb am I? Ask the encyclopedia. The Great Pyramid of Giza.',
  'canteen.transcript.5': 'I repeat: the Great Pyramid of Giza.',
  'canteen.transcript.6': 'That is all.',
  'canteen.showTranscript': 'Show transcript',
  'canteen.wikipediaButton': 'Open Wikipedia',

  // ---- stage 5: removed page (410) ----
  'removed.code': '410 - PAGE REMOVED',
  'removed.message': 'This page has been deleted by the administrator.',
  'removed.lastSeen': 'Last seen: a few days ago',
  'removed.waybackButton': 'Open Wayback Machine',

  // ---- hints (stage 4) ----
  'hints.s4.1': 'Listen to the whole announcement. Tap the transcript if you can\'t hear it.',
  'hints.s4.2': 'The encyclopedia is Wikipedia. Look up the Great Pyramid of Giza.',
  'hints.s4.3': 'Read the first paragraph: whose tomb was it built for? That name is the next address. ' +
    'Type it right after the site name.',

  // ---- hints (stage 5) ----
  'hints.s5.1': 'Pages that vanish are sometimes remembered by the internet.',
  'hints.s5.2': 'Search for the internet\'s time machine. It is run by archive.org and called the Wayback Machine.',
  'hints.s5.3': 'Look up this page\'s old address (/khufu) in the Wayback Machine and read the saved copy. ' +
    'What it says is the next address.',

  // ---- stage 6: the vault ----
  'vault.intro': 'You found the vault. The paper shredder jammed halfway. Piece it together, candidate.',
  'vault.deskSubtitle': 'Principal\'s Office',
  'vault.statusJammed': 'Shredder status: JAMMED',
  'vault.statusRepaired': 'Shredder status: REPAIRED',
  'vault.moves': 'Moves: {n}',
  'vault.keypadNote': 'Reassemble the document first.',
  'vault.keypadLabel': 'Final password',
  'vault.openButton': 'Open vault',
  'vault.denied': 'Access denied.',
  'vault.opened': 'Vault open.',

  // ---- hints (stage 6) ----
  'hints.s6.1': 'Tap two strips to swap them. The words must connect across the strips.',
  'hints.s6.2': 'Find the strip that starts the first sentence, then match the edges line by line.',
  'hints.s6.3': 'When it reads cleanly, the password is on the paper. Type it into the keypad.',

  // ---- stage 7: results ----
  'results.banner': 'PORTAL RESTORED',
  'results.deniedTitle': 'ACCESS DENIED',
  'results.deniedNote': 'The vault must be opened first.',
  'results.backButton': 'Back to start',
  'results.line1': 'Connecting to the portal...',
  'results.line2': 'Bypassing The Examiner...',
  'results.line3': 'Decrypting results...',
  'results.progressLabel': 'Progress',
  'results.maskButton': 'Remove the Examiner\'s mask',
  'results.examinerWas': 'The Examiner was... {name}',
  'results.findYourName': 'Find your name:',
  'results.passed': 'PASSED',
  'results.certEyebrow': 'Certificate of Achievement',
  'results.finalNote': 'Every candidate passed. Screenshot this and send it to the group.'
};

export const STRINGS = {
  en,
  // Bengali copy lands here. Until then every key falls back to English.
  bn: {}
};