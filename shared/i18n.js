// shared/i18n.js — the language switch. Two languages: "en" (default) and "bn".
// Plain ES module, no libraries, no build step.
//
//   import { t, applyI18n, mountLangToggle, onLangChange, setLang, getLang }
//     from '/shared/i18n.js';
//
// The choice is kept in localStorage under "vr_lang". localStorage throws in
// some privacy modes and does not exist at all outside a browser, so every
// access is guarded and falls back to this module's own memory.

import { STRINGS, isTrustedHtml } from '/shared/strings.js';

export const LANGS = ['en', 'bn'];
export const DEFAULT_LANG = 'en';

const STORAGE_KEY = 'vr_lang';
const TOGGLE_ID = 'vr-lang-toggle';

// Browsers hand us regional tags ("bn-BD", "en-GB"); fold them to the base.
const ALIASES = {
  en: 'en', eng: 'en', english: 'en',
  bn: 'bn', bengali: 'bn', bangla: 'bn'
};

export function normaliseLang(value) {
  if (typeof value !== 'string') return DEFAULT_LANG;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return ALIASES[base] || DEFAULT_LANG;
}

// ---- storage, with an in-memory fallback ----
const memory = new Map();

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) { memory.set(STORAGE_KEY, raw); return raw; }
  } catch { /* no localStorage (or blocked) - fall through to memory */ }
  return memory.has(STORAGE_KEY) ? memory.get(STORAGE_KEY) : null;
}

function writeStored(lang) {
  memory.set(STORAGE_KEY, lang);
  try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* memory only */ }
}

// ---- current language ----
let current = normaliseLang(readStored());

export function getLang() {
  return current;
}

function applyHtmlLang() {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', current);
}

export function setLang(lang) {
  const next = normaliseLang(lang);
  const changed = next !== current;
  current = next;
  writeStored(next);
  applyHtmlLang();
  if (changed) notify(next);
  return current;
}

// ---- lookups ----
// The raw dictionary value, so callers can tell trusted markup from a plain
// string. Falls back to English, then to undefined.
function lookup(key, lang) {
  const table = STRINGS[lang];
  if (table && Object.prototype.hasOwnProperty.call(table, key)) return table[key];
  const fallback = STRINGS[DEFAULT_LANG];
  if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
  return undefined;
}

export function t(key) {
  const value = lookup(key, current);
  if (isTrustedHtml(value)) return value.__html;
  // A list key (the 404 taunts) hands back a copy of the array, so a caller can
  // index it and callers cannot edit the dictionary through it.
  if (Array.isArray(value)) return value.slice();
  if (value === undefined) return key;
  return value;
}

// Interpolation: tf('lib.overdue', { n: 5 }) fills the {n} holes in the string.
// A placeholder with no matching variable is left exactly as it is, so a missing
// value shows up as {n} instead of silently vanishing.
export function tf(key, vars) {
  const template = t(key);
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match);
}

// ---- static markup ----
// data-i18n="key"      -> textContent
// data-i18n-aria="key" -> aria-label
// data-i18n-html="key" -> innerHTML, and only for strings marked trusted with
//                        html() in /shared/strings.js. Everything else is
//                        written as textContent, so a translation cannot
//                        inject markup.
export function applyI18n(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    const value = lookup(key, current);
    if (isTrustedHtml(value)) el.innerHTML = value.__html;
    else el.textContent = t(key);
  });
}

// ---- change notification, for text that is built at runtime ----
const listeners = new Set();

export function onLangChange(callback) {
  if (typeof callback !== 'function') return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);   // unsubscribe
}

function notify(lang) {
  for (const callback of listeners) {
    // One broken listener must not stop the rest from repainting.
    try { callback(lang); } catch (err) { console.error('[i18n] listener failed', err); }
  }
}

// ---- the toggle every page mounts ----
// A fixed top-right button reading "EN | বাং". It switches immediately, with no
// reload, and keeps <html lang> in step.
export function mountLangToggle({ target = null } = {}) {
  const doc = typeof document !== 'undefined' ? document : null;
  if (!doc) return null;

  const existing = doc.getElementById(TOGGLE_ID);
  if (existing) return existing;             // already mounted: never twice

  const option = (lang, label) => {
    const span = doc.createElement('span');
    span.className = 'langtoggle__opt';
    span.lang = lang;                        // so a screen reader reads it correctly
    span.textContent = label;
    return span;
  };

  const button = doc.createElement('button');
  button.type = 'button';
  button.id = TOGGLE_ID;
  button.className = 'langtoggle';

  const en = option('en', 'EN');
  const separator = doc.createElement('span');
  separator.className = 'langtoggle__sep';
  separator.setAttribute('aria-hidden', 'true');
  separator.textContent = '|';
  const bn = option('bn', '\u09ac\u09be\u0982');   // বাং

  button.append(en, separator, bn);

  const paint = () => {
    const lang = getLang();
    button.dataset.lang = lang;
    en.classList.toggle('is-active', lang === 'en');
    bn.classList.toggle('is-active', lang === 'bn');
    button.setAttribute('aria-label', t(lang === 'en' ? 'lang.toBn' : 'lang.toEn'));
  };

  button.addEventListener('click', () => {
    setLang(getLang() === 'en' ? 'bn' : 'en');
    applyI18n();                             // static copy swaps now, no reload
  });

  paint();
  onLangChange(paint);                       // stays right if a page switches elsewhere

  (target || doc.body || doc.documentElement).appendChild(button);
  return button;
}

// Set <html lang> for the stored language as soon as the module loads.
applyHtmlLang();