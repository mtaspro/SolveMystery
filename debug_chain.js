// Test the i18n + strings + typewriter chain in a simulated browser context
const fs = require('fs');

// Read all files
const stringsSrc = fs.readFileSync('shared/strings.js', 'utf8');
const uiSrc = fs.readFileSync('shared/ui.js', 'utf8');
const i18nSrc = fs.readFileSync('shared/i18n.js', 'utf8');

console.log('=== strings.js ===');
console.log('Exports STRINGS:', stringsSrc.includes('export const STRINGS'));
console.log('Exports html:', stringsSrc.includes('export const html'));
console.log('Exports isTrustedHtml:', stringsSrc.includes('export const isTrustedHtml'));

console.log('\n=== ui.js ===');
console.log('Exports typewriter:', uiSrc.includes('export function typewriter'));
console.log('Exports splitGraphemes:', uiSrc.includes('export function splitGraphemes'));
console.log('Exports prefersReducedMotion:', uiSrc.includes('export function prefersReducedMotion'));

console.log('\n=== i18n.js ===');
console.log('Imports from strings.js:', i18nSrc.includes("from '/shared/strings.js'"));
console.log('Imports html:', i18nSrc.includes('isTrustedHtml'));

// Now check if t() would work
console.log('\n=== String key check ===');
console.log("landing.message starts with:", stringsSrc.includes("'landing.message': 'Your results have been relocated"));
console.log("common.from =", stringsSrc.includes("'common.from': 'The Examiner'"));

// Check the typewriter function signature
const typeMatch = uiSrc.match(/export function typewriter\(([^)]+)\)/);
console.log('\ntypewriter signature:', typeMatch ? typeMatch[1] : 'NOT FOUND');

// Check what t() returns for landing.message
// Simulate: lookup('landing.message', 'en')
const enMatch = stringsSrc.match(/'landing\.message':\s*'([\s\S]*?)(?:'\s*,\s*$|\}';)/m);
if (enMatch) {
  // Check if it's a concatenated string
  const idx = stringsSrc.indexOf("'landing.message'");
  const chunk = stringsSrc.substring(idx, idx + 300);
  console.log('\nlanding.message chunk:', chunk);
}
