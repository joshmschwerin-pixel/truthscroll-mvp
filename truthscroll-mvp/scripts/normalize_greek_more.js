#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const GREEK_TO_ENG = {
  'Μαθθαῖον': 'Matthew',
  'Ματθαῖον': 'Matthew',
  'Μάρκος': 'Mark',
  'Λουκᾶς': 'Luke',
  'Λουκᾶν': 'Luke',
  'Ἰωάννης': 'John',
  'Ἰωάννην': 'John',
  'Πράξεις': 'Acts',
  'Ῥωμαίους': 'Romans',
  'Κορινθίους': 'Corinthians',
  'Γαλάτας': 'Galatians',
  'Ἐφεσίους': 'Ephesians',
  'Φιλιππησίους': 'Philippians',
  'Κολοσσαεῖς': 'Colossians',
  'Θεσσαλονικεῖς': 'Thessalonians',
  'Τίτον': 'Titus',
  'Φιλήμονα': 'Philemon',
  'Ἑβραίους': 'Hebrews',
  'Ἰάκωβος': 'James',
  'Πέτρος': 'Peter',
  'Ἰωάννης': 'John',
  'Ἰούδας': 'Jude',
  'Ἀποκάλυψις': 'Revelation'
};

function load(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function save(p, d) { fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf-8'); }

function isPrefaceItem(it) {
  if (!it.book && it.text && it.text.length < 80) return true;
  const lower = (it.text||'').toLowerCase();
  return lower.includes('copyright') || lower.includes('prepared for') || lower.includes('source');
}

function mapBookName(greekName) {
  if (!greekName) return null;
  return GREEK_TO_ENG[greekName] || greekName;
}

function splitPerBook(items) {
  const books = {};
  for (const it of items) {
    if (isPrefaceItem(it)) continue;
    const bookKey = mapBookName(it.book) || 'Unknown';
    books[bookKey] = books[bookKey] || [];
    books[bookKey].push(it);
  }
  return books;
}

function main() {
  const base = path.resolve(__dirname, '..');
  const inPath = path.join(base, 'data', 'greek.json');
  if (!fs.existsSync(inPath)) { console.error('greek.json not found'); process.exit(1); }
  const items = load(inPath);
  const normalized = items.filter(it => !isPrefaceItem(it)).map(it => ({
    book: mapBookName(it.book),
    chapter: it.chapter || null,
    verse: it.verse || null,
    text: it.text || ''
  }));
  save(path.join(base, 'data', 'greek_normalized.json'), normalized);
  const books = splitPerBook(normalized);
  const outDir = path.join(base, 'data', 'greek_books');
  fs.mkdirSync(outDir, { recursive: true });
  Object.keys(books).forEach(k => save(path.join(outDir, `${k.replace(/\s+/g,'_')}.json`), books[k]));
  console.log('Wrote normalized greek_normalized.json and per-book files in data/greek_books');
}

if (require.main === module) main();
