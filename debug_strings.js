// Quick test of the strings module
const fs = require('fs');

// Simulate what the browser would do: import strings and check t() for landing.message
const stringsContent = fs.readFileSync('shared/strings.js', 'utf8');

// Check if landing.message exists and looks right
const enSection = stringsContent.substring(
  stringsContent.indexOf("const en = {"),
  stringsContent.indexOf("export const STRINGS")
);

const hasLandingMessage = enSection.includes("'landing.message'");
console.log('Has landing.message key:', hasLandingMessage);

// Check for syntax issues
const match = enSection.match(/'landing\.message':\s*'([^']*)'/);
if (match) {
  console.log('landing.message value:', JSON.stringify(match[1]));
} else {
  console.log('Could not extract landing.message value');
  // Try with concatenation
  const idx = enSection.indexOf("'landing.message'");
  if (idx >= 0) {
    console.log('Context around landing.message:', enSection.substring(idx - 50, idx + 200));
  }
}

// Check for trailing commas or syntax issues in strings.js
console.log('\n--- Last 10 lines of en section ---');
const lines = enSection.split('\n');
console.log(lines.slice(-10).join('\n'));
