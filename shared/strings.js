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
  'results.finalNote': 'Every candidate passed. Screenshot this and send it to the group.',

   // ---- tracking ----
  'track.codenameLabel': 'Choose your codename',
  'track.codenamePlaceholder': '2-16 letters, numbers, spaces, _ or -',
  'track.codenameNote': 'This name appears on the candidate board.',
  'track.taken': 'That codename is taken. Try another.',
  'track.invalid': 'Use 2-16 letters or numbers.',

   // ---- social / visitor log ----
  'social.logButton': 'Visitor log',
  'social.logTitle': 'Visitor Log',
  'social.close': 'Close log',
  'social.reached': '{n} candidates reached this door.',
  'social.firstBlood': 'First blood: {alias}',
  'social.fastest': 'Fastest crack: {time}',
  'social.visitor': '{alias} \u2022 {time}',
  'social.noFirst': 'No first arrival yet.',
  'social.noFastest': '\u2014',
  'social.unavailable': 'The log is unavailable.',
  'social.tickerEntered': '{alias} entered /{page} {time} ago',
  'social.minutes': '{n}m',
  'social.hours': '{n}h',

   // ---- candidate board ----
  'board.header': 'CANDIDATE BOARD',
  'board.subtitle': 'Leaderboards for the investigation',
  'board.tabFastest': 'Fastest',
  'board.tabDedicated': 'Most dedicated',
  'board.refresh': 'Refresh',
  'board.hintNote': 'Each hint adds 60 seconds.',
  'board.noData': 'No candidates yet.',
  'board.rank': 'Rank',
  'board.candidate': 'Candidate',
  'board.hints': 'Hints',
  'board.total': 'Total',
  'board.score': 'Score',
  'board.firstBlood': 'First blood: {pages}',
  'board.unreached': '-',
  'board.meBadge': 'You',

   // ---- results: rank display ----
  'results.rank.message': 'You are candidate #{rank} to recover the results.',
  'results.rank.boardLink': 'View the candidate board'
};

export const STRINGS = {
  en,
  // Bengali copy lands here. Until then every key falls back to English.
  bn: {
    // ---- shared chrome ----
    'common.from': 'পরীক্ষক',
    'common.begin': 'শুরু করুন',
    'common.close': 'বন্ধ করুন',

    // ---- language toggle ----
    'lang.toEn': 'English-এ পরিবর্তন করুন',
    'lang.toBn': 'বাংলায় পরিবর্তন করুন',

    // ---- hints panel ----
    'hints.button': 'আটকে গেছেন?',
    'hints.title': 'সাহায্য',
    'hints.close': 'হিন্ট বন্ধ করুন',
    'hints.locked': 'লক করা আছে — {n} সেকেন্ড',
    'hints.allOut': '{n}টি হিন্ট',

    // Hint bodies live here, not in /config.js: config.js only holds the keys, so
    // a hint can be translated. Wording must stay exactly as it was in English.
    'hints.s1.1': 'কিছু গোপন তথ্য কেবল তখনই দেখা যায় যখন আলো নেভানো থাকে।',
    'hints.s1.2': 'চারটি হিজিবিজি আঁকা ছবি, চারটি বিষয়। রুটিনটি আপনাকে সঠিক ক্রম জানিয়ে দেবে।',
    'hints.s1.3': 'সংখ্যাগুলোকে ক্লাসের রুটিনের ক্রমানুসারে সাজান (গণিত, পদার্থবিজ্ঞান, রসায়ন, ' +
      'ইংরেজি)। সেই সংখ্যাটিই হলো পরবর্তী ঠিকানা: আপনার ব্রাউজারের অ্যাড্রেস বারে ' +
      'সাইটের নামের ঠিক পরেই এটি টাইপ করুন।',

    'hints.s2.1': 'কেবল লাল রঙের OVERDUE (মেয়াদোত্তীর্ণ) ট্যাগ থাকা বইগুলোই গুরুত্বপূর্ণ।',
    'hints.s2.2': 'ফেরতের শেষ তারিখ দেখতে প্রতিটি বই খুলুন। সবচেয়ে আগের তারিখটি সবার আগে রাখুন।',
    'hints.s2.3': 'তারিখের ক্রমানুসারে প্রতিটি শিরোনামের প্রথম অক্ষরটি নিন। একজন ' +
      'লাইব্রেরিয়ান কীভাবে চুপ করতে বলেন? সেই শব্দটিই হলো পরবর্তী ঠিকানা: সাইটের নামের ঠিক পরেই এটি টাইপ করুন।',

    'hints.s3.1': 'জুম ইন করুন। তিনটি টাইলস গোল চিহ্নিত করা আছে।',
    'hints.s3.2': 'সম্পূর্ণ নামের বদলে সংখ্যাযুক্ত ক্রমানুসারে সংক্ষিপ্ত প্রতীকগুলো পড়ুন।',
    'hints.s3.3': 'Co + I + N। একসাথে উচ্চারণ করুন: সেই শব্দটিই হলো পরবর্তী ঠিকানা। ' +
      'সাইটের নামের ঠিক পরেই এটি টাইপ করুন।',

    // ---- landing page ----
    'landing.banner': 'মাধ্যমিক শিক্ষা বোর্ড - পোর্টাল অফলাইন',
    'landing.addressCaption': 'এখানে উত্তর টাইপ করুন।',
    'landing.siteName': 'yoursite.app/',
    'landing.begin': 'তদন্ত শুরু করুন',
    'landing.skip': 'স্কিপ করুন',
    'landing.tip': 'পরামর্শ: উত্তর সবসময় ছোট হাতের অক্ষরে (lowercase) এবং মাঝখানে কোনো স্পেস ছাড়া হবে।',
    'landing.message': 'আপনার ফলাফল অন্য জায়গায় সরিয়ে নেওয়া হয়েছে। আমি সেগুলো ইন্টারনেটের ' +
      'বিভিন্ন স্থানে লুকিয়ে রেখেছি। প্রতিটি দরজার একটি ঠিকানা আছে। উত্তরের মধ্যেই লুকিয়ে আছে সেই ঠিকানা। ' +
      'ধাঁধা সমাধান করুন, পরবর্তী দরজা খুঁজে নিন।',

    // ---- 404 ----
    'notFound.code': '404 - ভুল দরজা',
    'notFound.note': 'বানান পরীক্ষা করুন: ছোট হাতের অক্ষর, কোনো স্পেস থাকবে না।',
    'notFound.back': 'শুরুতে ফিরে যান',
    // One key holding the whole list: /shared/404.js picks a random entry.
    'notFound.taunts': [
      'ভুল দরজা, পরীক্ষার্থী।',
      'ভুল উত্তর। আপনার জীবন নিয়ে নতুন করে ভাবার অনুরোধ করা হচ্ছে।',
      'এই দরজার কোনো অস্তিত্ব নেই। আপনার আত্মবিশ্বাসেরও নয়।',
      'ধাঁধাটি কি আরেকবার পড়ার চেষ্টা করেছেন?'
    ],

    // ---- stage 1: the corridor ----
    'corridor.intro': 'পরীক্ষার্থীরা, তোমাদের ফলাফল অন্যত্র সরিয়ে নেওয়া হয়েছে। শান্ত থাকো। ' +
      'আতঙ্কিত হওয়ার অনুমতি দেওয়া হলো।',
    'corridor.noticeboard': 'নোটিশবোর্ড',
    'corridor.timetable': 'রুটিন',
    'corridor.stickyNote': 'আলোর ওপর বিশ্বাস রাখবে না।',
    'corridor.clockLabel': 'দেয়াল ঘড়ি, তিনটা বেজে পনেরো মিনিট',
    'corridor.torchHint': 'চারপাশ দেখতে আঙুল দিয়ে ড্র্যাগ করুন',
    'corridor.switchOn': 'লাইটের সুইচ (আলো জ্বলছে)',
    'corridor.switchOff': 'লাইটের সুইচ (আলো নেভানো)',
    'corridor.lightsOut': 'আলো নিভে গেল।',
    'corridor.lightsOn': 'আলো আবার জ্বলে উঠল।',
    'corridor.switchDead': 'সুইচটি কাজ করছে না।',
    'corridor.revealButton': 'সংখ্যাগুলো প্রকাশ করুন',
    'corridor.digitsRevealed': 'সংখ্যাগুলো প্রকাশ পেয়েছে।',

    // ---- stage 2: the library ----
    'library.crest': 'স্থাপিত ১৯৭৪ \u00b7 নির্ধারিত সময়ের পর বই বাইরে নেওয়া নিষেধ',
    'library.subtitle': 'অনলাইন ক্যাটালগ',
    'library.searchPlaceholder': 'শিরোনাম, লেখক বা বিষয় দিয়ে খুঁজুন',
    'library.searchButton': 'খুঁজুন',
    'library.accountLabel': 'একাউন্ট:',
    'library.shelfHint': 'বইয়ের ধারকটির ওপর ট্যাপ করে জমার রেকর্ড দেখুন।',
    'library.intro': 'কিছু বই কখনোই ফেরত দেওয়া হয়নি। সেগুলোকে ক্রমানুসারে ফেরত দিন। তারপর চুপ থাকুন।',
    'library.overdueItem': 'মেয়াদোত্তীর্ণ আইটেম',
    'library.borrowingRecord': 'বই ধারের রেকর্ড',
    'library.returnedOnTime': 'যথাসময়ে ফেরত দেওয়া হয়েছে',
    'library.overdueTag': 'OVERDUE',
    'library.itemOverdue': '{n}টি আইটেম মেয়াদোত্তীর্ণ',
    'library.itemsOverdue': '{n}টি আইটেম মেয়াদোত্তীর্ণ',
    'library.spineOverdue': '{title}। মেয়াদোত্তীর্ণ, ফেরতের তারিখ ছিল {due}।',
    'library.spineReturned': '{title}। যথাসময়ে ফেরত দেওয়া হয়েছে।',
    'library.stampDue': 'ফেরতের তারিখ: {due}',
    'library.introFrom': 'পরীক্ষকের একটি নোট',

    // ---- stage 3: the science lab ----
    'lab.rec': 'REC',
    'lab.department': 'বিজ্ঞান বিভাগ - সিসিটিভি আর্কাইভ',
    'lab.stripPrefix': 'ক্যামেরা ০২ - ল্যাব ৩ - ফুটেজ চিহ্নিত করেছে:',
    'lab.intro': 'রাত ০৩:০৭ মিনিটে বোর্ডে কিছু একটা লেখা হয়েছিল। ক্যামেরা কখনো মিথ্যা বলে না। ' +
      'মৌলগুলোও নয়।',
    'lab.caption': 'ফুটেজ বড় করে দেখতে ট্যাপ করুন।',
    'lab.log': 'প্রমাণের লগ: ৩টি চিহ্নিত আইটেম।',
    'lab.placeholder': 'ফুটেজ লোড হচ্ছে... (LAB_IMAGE_URL যোগ করুন)',
    'lab.itemLoaded': 'ফুটেজ লোড হয়েছে। বড় করতে ট্যাপ করুন।',
    'lab.itemUnavailable': 'ফুটেজ পাওয়া যায়নি।',
    'lab.zoomedIn': 'জুম ইন করা হয়েছে।',
    'lab.zoomedOut': 'জুম আউট করা হয়েছে।',
    'lab.enlargedTip': 'ফুটেজ বড় করা হয়েছে। প্যান করতে ড্র্যাগ করুন, জুম করতে পিঞ্চ করুন, টগল করতে ডাবল-ট্যাপ করুন।',
    'lab.enlargeAria': 'ক্যামেরা ০২-এর স্থিরচিত্র বড় করুন',
    'lab.zoomAria': 'বড় করা ফুটেজ',
    'lab.zoomTip': 'জুম করতে ডাবল-ট্যাপ করুন',

    // ---- stage 4: the canteen ----
    'canteen.header': 'ক্যান্টিন - অর্ডারের ডিসপ্লে',
    'canteen.statusPending': 'এখন পরিবেশন করা হচ্ছে: ০৩:০৭ - ঘোষণা অপেক্ষমাণ',
    'canteen.statusPlayed': 'এখন পরিবেশন করা হচ্ছে: ০৩:০৭ - ঘোষণা প্রচারিত হয়েছে',
    'canteen.intro': 'ক্ষুধা লেগেছে? কিছু করার নেই। ক্যান্টিনে আজ একটি ঘোষণাই রয়েছে। মনোযোগ দিয়ে শুনুন।',
    'canteen.speakerLabel': 'আজকের ঘোষণাটি শুনতে ট্যাপ করুন',
    'canteen.speakerLabelReplay': 'আবার শুনুন',
    'canteen.slow': 'ধীরগতি',
    'canteen.error': 'অডিও পাওয়া যায়নি। নিচের লিখিত রূপটি দেখুন।',
    'canteen.transcriptTitle': 'অনুলিপি (Transcript)',
    'canteen.transcript.1': 'সকল পরীক্ষার্থীর দৃষ্টি আকর্ষণ করা যাচ্ছে। মনোযোগ দিন।',
    'canteen.transcript.2': 'আজকে ক্যান্টিন নির্ধারিত সময়ের আগেই বন্ধ হয়ে যাবে।',
    'canteen.transcript.3': 'পরীক্ষকের পক্ষ থেকে একটি বার্তা।',
    'canteen.transcript.4': 'আমি কার সমাধি? বিশ্বকোষকে জিজ্ঞাসা করুন। গিজার গ্রেট পিরামিড।',
    'canteen.transcript.5': 'আমি আবার বলছি: গিজার গ্রেট পিরামিড।',
    'canteen.transcript.6': 'ধন্যবাদ।',
    'canteen.showTranscript': 'অনুলিপি দেখুন',
    'canteen.wikipediaButton': 'উইকিপিডিয়া খুলুন',

    // ---- stage 5: removed page (410) ----
    'removed.code': '410 - পেজটি সরিয়ে ফেলা হয়েছে',
    'removed.message': 'এডমিনিস্ট্রেটর এই পেজটি মুছে ফেলেছেন।',
    'removed.lastSeen': 'সর্বশেষ দেখা গেছে: কিছুদিন আগে',
    'removed.waybackButton': 'Wayback Machine খুলুন',

    // ---- hints (stage 4) ----
    'hints.s4.1': 'সম্পূর্ণ ঘোষণাটি শুনুন। শুনতে না পেলে লিখিত অনুলিপির ওপর ট্যাপ করুন।',
    'hints.s4.2': 'বিশ্বকোষ বলতে উইকিপিডিয়াকে বোঝানো হয়েছে। "Great Pyramid of Giza" লিখে সার্চ করুন।',
    'hints.s4.3': 'প্রথম অনুচ্ছেদটি পড়ুন: এটি কার সমাধি হিসেবে তৈরি করা হয়েছিল? সেই নামটিই হলো পরবর্তী ঠিকানা। ' +
      'সাইটের নামের ঠিক পরেই এটি টাইপ করুন।',

    // ---- hints (stage 5) ----
    'hints.s5.1': 'যে পেজগুলো হারিয়ে যায়, ইন্টারনেট সেগুলো মাঝেমধ্যে মনে রাখে।',
    'hints.s5.2': 'ইন্টারনেটের টাইম মেশিনটি খুঁজুন। এটি archive.org পরিচালনা করে এবং এর নাম Wayback Machine।',
    'hints.s5.3': 'Wayback Machine-এ এই পেজের পুরনো ঠিকানাটি (/khufu) খুঁজুন এবং সংরক্ষিত কপিটি পড়ুন। ' +
      'সেখানে যা লেখা আছে সেটিই হলো পরবর্তী ঠিকানা।',

    // ---- stage 6: the vault ----
    'vault.intro': 'আপনি ভল্টটি খুঁজে পেয়েছেন। কাগজ কুচানোর মেশিনটি (shredder) মাঝপথে আটকে গিয়েছিল। টুকরোগুলো জোড়া দিন, পরীক্ষার্থী।',
    'vault.deskSubtitle': 'অধ্যক্ষের কক্ষ',
    'vault.statusJammed': 'মেশিনের অবস্থা: আটকে গেছে (JAMMED)',
    'vault.statusRepaired': 'মেশিনের অবস্থা: মেরামত করা হয়েছে (REPAIRED)',
    'vault.moves': 'চেষ্টা করেছেন: {n} বার',
    'vault.keypadNote': 'প্রথমে নথিটি পুনর্গঠন করুন।',
    'vault.keypadLabel': 'চূড়ান্ত পাসওয়ার্ড',
    'vault.openButton': 'ভল্ট খুলুন',
    'vault.denied': 'প্রবেশাধিকার দেওয়া হয়নি।',
    'vault.opened': 'ভল্ট খুলে গেছে।',

    // ---- hints (stage 6) ----
    'hints.s6.1': 'দুটি টুকরো অদলবদল করতে তাদের ওপর ট্যাপ করুন। টুকরোগুলোর মধ্যকার লেখাগুলোর মিল থাকতে হবে।',
    'hints.s6.2': 'প্রথম বাক্য শুরু হওয়া টুকরোটি খুঁজুন, তারপর লাইন ধরে ধরে ধারের অংশগুলো মেলান।',
    'hints.s6.3': 'পুরো পড়া সম্পন্ন হলে, কাগজের ওপর পাসওয়ার্ডটি দেখতে পাবেন। কীপ্যাডে তা টাইপ করুন।',

    // ---- stage 7: results ----
    'results.banner': 'পোর্টাল পুনরুদ্ধার করা হয়েছে',
    'results.deniedTitle': 'প্রবেশাধিকার দেওয়া হয়নি',
    'results.deniedNote': 'প্রথমে ভল্টটি খুলতে হবে।',
    'results.backButton': 'শুরুতে ফিরে যান',
    'results.line1': 'পোর্টালে সংযোগ করা হচ্ছে...',
    'results.line2': 'পরীক্ষকের বাধা বাইপাস করা হচ্ছে...',
    'results.line3': 'ফলাফল ডিক্রিপ্ট করা হচ্ছে...',
    'results.progressLabel': 'অগ্রগতি',
    'results.maskButton': 'পরীক্ষকের মুখোশ খুলে দিন',
    'results.examinerWas': 'পরীক্ষক ছিলেন... {name}',
    'results.findYourName': 'আপনার নাম খুঁজুন:',
    'results.passed': 'উত্তীর্ণ',
    'results.certEyebrow': 'কৃতিত্বের সনদপত্র',
    'results.finalNote': 'প্রত্যেক পরীক্ষার্থী উত্তীর্ণ হয়েছেন। এটির স্ক্রিনশট নিয়ে গ্রুপে পাঠিয়ে দিন।'
  }
};