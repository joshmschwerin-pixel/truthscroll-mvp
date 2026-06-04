#!/usr/bin/env node
// Fetch KJV chapters from bible-api.com and write verse-level JSON
// Usage: node scripts/fetch_kjv_api.js "John" data/kjv_john.json

const fs = require('fs');
const path = require('path');

async function fetchChapter(book, chapter) {
  const q = encodeURIComponent(`${book} ${chapter}`);
  const url = `https://bible-api.com/${q}?translation=kjv`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  if (!j.verses || !j.verses.length) return null;
  return j.verses.map(v => ({ book: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text.trim() }));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/fetch_kjv_api.js "Book Name" out.json [maxChapters]');
    process.exit(2);
  }
  const book = args[0];
  const out = args[1];
  const maxChapters = Number(args[2]||50);
  const all = [];
  for (let ch = 1; ch <= maxChapters; ch++) {
    try {
      const verses = await fetchChapter(book, ch);
      if (!verses) {
        console.log(`no chapter ${ch}, stopping`);
        break;
      }
      all.push(...verses);
      console.log(`fetched ${book} ${ch} (${verses.length} verses)`);
    } catch (e) {
      console.error('error fetching', book, ch, e.message || e);
      break;
    }
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`Wrote ${all.length} verses to ${out}`);
}

if (require.main === module) main();
