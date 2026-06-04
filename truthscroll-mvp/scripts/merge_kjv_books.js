#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CANONICAL_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

function canonicalIndex(book) {
  if (!book) return Number.MAX_SAFE_INTEGER;
  const clean = book.trim().replace(/[^0-9A-Za-z\s]/g, '').replace(/\s+/g,' ').toLowerCase();
  for (let i=0;i<CANONICAL_BOOKS.length;i++){
    const cand = CANONICAL_BOOKS[i].toLowerCase();
    if (clean === cand) return i;
    // allow matches like '1 Samuel' vs 'I Samuel' or 'I Sam.' etc
    if (clean.startsWith(cand)) return i;
    if (cand.startsWith(clean)) return i;
    if (clean.replace(/^1\s/,'i ').startsWith(cand)) return i;
  }
  return Number.MAX_SAFE_INTEGER;
}

function loadJson(p){
  try{ return JSON.parse(fs.readFileSync(p,'utf-8')); }catch(e){return null}
}

function findKjvFiles(dir){
  const files = fs.readdirSync(dir).filter(f=>/^(kjv_).*\.json$/i.test(f));
  return files.map(f=>path.join(dir,f));
}

function normalizeItem(it){
  // ensure {book,chapter,verse,text}
  const book = it.book || it.book_name || null;
  const chapter = (typeof it.chapter === 'number') ? it.chapter : (it.chapter ? Number(it.chapter) : null);
  const verse = (typeof it.verse === 'number') ? it.verse : (it.verse ? Number(it.verse) : null);
  const text = (it.text || '').trim();
  return {book, chapter, verse, text};
}

function isValidVerse(item){
  return item && item.book && Number.isFinite(item.chapter) && Number.isFinite(item.verse) && item.chapter > 0 && item.verse > 0 && item.text;
}

function main(){
  const base = path.resolve(__dirname,'..');
  const dataDir = path.join(base,'data');
  const outPath = path.join(dataDir,'kjv.json');
  const files = findKjvFiles(dataDir);
  if (!files.length){
    console.log('No per-book kjv_*.json files found in data/. Nothing merged.');
    process.exit(0);
  }
  console.log('Found files:', files.map(f=>path.basename(f)).join(', '));
  const all = [];
  for (const f of files){
    const j = loadJson(f);
    if (!Array.isArray(j)) continue;
    for (const it of j){
      const n = normalizeItem(it);
      if (isValidVerse(n)) {
        all.push(n);
      }
    }
  }
  // sort
  all.sort((a,b)=>{
    const ai = canonicalIndex(a.book);
    const bi = canonicalIndex(b.book);
    if (ai!==bi) return ai-bi;
    const ac = a.chapter||0; const bc = b.chapter||0;
    if (ac!==bc) return ac-bc;
    const av = a.verse||0; const bv = b.verse||0;
    if (av!==bv) return av-bv;
    return (a.text||'').localeCompare(b.text||'');
  });

  // backup existing
  if (fs.existsSync(outPath)){
    const bak = outPath + '.bak.' + Date.now();
    fs.copyFileSync(outPath,bak);
    console.log('Backed up existing kjv.json to', path.basename(bak));
  }

  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`Wrote ${all.length} merged verses to ${outPath}`);
}

if (require.main===module) main();
