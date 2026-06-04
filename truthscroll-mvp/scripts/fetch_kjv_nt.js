#!/usr/bin/env node
// Fetch the entire KJV New Testament (per-book) using bible-api.com and merge into data/kjv.json
// Usage: node scripts/fetch_kjv_nt.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BOOKS = [
  { book: 'Matthew', chapters: 28 },{ book: 'Mark', chapters: 16 },{ book: 'Luke', chapters: 24 },{ book: 'John', chapters: 21 },{ book: 'Acts', chapters: 28 },
  { book: 'Romans', chapters: 16 },{ book: '1 Corinthians', chapters: 16 },{ book: '2 Corinthians', chapters: 13 },{ book: 'Galatians', chapters: 6 },{ book: 'Ephesians', chapters: 6 },
  { book: 'Philippians', chapters: 4 },{ book: 'Colossians', chapters: 4 },{ book: '1 Thessalonians', chapters: 5 },{ book: '2 Thessalonians', chapters: 3 },{ book: '1 Timothy', chapters: 6 },
  { book: '2 Timothy', chapters: 4 },{ book: 'Titus', chapters: 3 },{ book: 'Philemon', chapters: 1 },{ book: 'Hebrews', chapters: 13 },{ book: 'James', chapters: 5 },
  { book: '1 Peter', chapters: 5 },{ book: '2 Peter', chapters: 3 },{ book: '1 John', chapters: 5 },{ book: '2 John', chapters: 1 },{ book: '3 John', chapters: 1 },
  { book: 'Jude', chapters: 1 },{ book: 'Revelation', chapters: 22 }
];

function sanitize(name){
  return name.replace(/[^0-9A-Za-z\s]/g,'').replace(/\s+/g,'_').toLowerCase();
}

const MAX_RETRIES = 5;

async function fetchChapter(book, chapter){
  const q = encodeURIComponent(`${book} ${chapter}`);
  const url = `https://bible-api.com/${q}?translation=kjv`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(()=>"");
    const message = body ? `${res.status} ${body}` : `HTTP ${res.status}`;
    const err = new Error(`${message} for ${book} ${chapter}`);
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  return j.verses ? j.verses.map(v => ({ book: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text.trim() })) : [];
}

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchChapterWithRetry(book, chapter){
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++){
    try {
      const verses = await fetchChapter(book, chapter);
      return verses;
    } catch (err) {
      const status = err.status || 0;
      const isRetryable = status === 429 || status >= 500 || status === 0;
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw err;
      }
      const delay = 1000 * Math.min(1 << (attempt - 1), 16);
      console.error(`  retry ${attempt}/${MAX_RETRIES} for ${book} ${chapter} after ${delay}ms: ${err.message}`);
      await sleep(delay + Math.floor(Math.random()*300));
    }
  }
  return [];
}

async function run(){
  const base = path.resolve(__dirname,'..');
  const dataDir = path.join(base,'data');
  for (const b of BOOKS){
    const outFile = path.join(dataDir, `kjv_${sanitize(b.book)}.json`);
    const all = [];
    console.log(`Fetching ${b.book} (${b.chapters} chapters)`);
    for (let ch=1; ch<=b.chapters; ch++){
      try{
        const verses = await fetchChapterWithRetry(b.book, ch);
        if (verses && verses.length) {
          all.push(...verses);
          console.log(`  ${b.book} ${ch} -> ${verses.length} verses`);
        } else {
          console.log(`  ${b.book} ${ch} -> no verses`);
        }
      }catch(e){
        console.error(`  failed ${b.book} ${ch}:`, e.message || e);
      }
      await sleep(1000);
    }
    fs.writeFileSync(outFile, JSON.stringify(all, null, 2), 'utf-8');
    console.log(`Wrote ${all.length} verses to ${outFile}`);
  }

  // run merger
  console.log('Running merge script...');
  try{
    execSync('node scripts/merge_kjv_books.js', { stdio: 'inherit' });
  }catch(e){
    console.error('Merge script failed:', e.message || e);
  }
}

if (require.main === module) run().catch(e=>{ console.error('Fatal error', e); process.exit(1); });
