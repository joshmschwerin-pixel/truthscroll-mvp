#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

function normalizeGreek(items) {
  const verses = [];
  let currentBook = null;
  let lastVerse = null;
  const bookHeaderRe = /^Κατὰ\s+(.+)$/i;
  const chapterHeaderRe = /^Κεφάλαιον\s*(\d+)/i;
  const verseRe = /^(\d+):(\d+)\s*(.*)$/;

  for (const it of items) {
    const text = (it.text || '').trim();
    if (!text) continue;
    const mBook = text.match(bookHeaderRe);
    if (mBook) {
      currentBook = mBook[1].trim();
      continue;
    }
    const mChap = text.match(chapterHeaderRe);
    if (mChap) {
      // chapter header may appear alone; set current chapter context
      // but verses often contain chapter:verse so we prefer those
      // store as lastVerse context marker
      lastVerse = null;
      continue;
    }
    const mVerse = text.match(verseRe);
    if (mVerse) {
      const chap = Number(mVerse[1]);
      const verse = Number(mVerse[2]);
      const body = mVerse[3].trim();
      const obj = { book: currentBook || null, chapter: chap, verse: verse, text: body };
      verses.push(obj);
      lastVerse = obj;
      continue;
    }
    // fallback: attach to last verse text
    if (lastVerse) {
      lastVerse.text = (lastVerse.text + ' ' + text).trim();
    } else {
      // anonymous paragraph, push standalone
      verses.push({ book: currentBook || null, text });
    }
  }
  return verses;
}

function normalizeKJV(items) {
  // The KJV docx used as a facsimile may contain only page images and metadata.
  // Attempt to find lines like "Book 1:1 ..." but otherwise return empty.
  const verseRe = /^(?:([A-Za-z]+)\s+)?(\d+):(\d+)\s*(.*)$/;
  const verses = [];
  let last = null;
  for (const it of items) {
    const t = (it.text || '').trim();
    if (!t) continue;
    const m = t.match(verseRe);
    if (m) {
      const book = m[1] || null;
      const chap = Number(m[2]);
      const verse = Number(m[3]);
      const body = m[4].trim();
      const obj = { book, chapter: chap, verse, text: body };
      verses.push(obj);
      last = obj;
    } else {
      if (last) last.text = (last.text + ' ' + t).trim();
    }
  }
  return verses;
}

function main() {
  const base = path.resolve(__dirname, '..');
  const inGreek = path.join(base, 'data', 'greek_from_docx.json');
  const inKjv = path.join(base, 'data', 'kjv_from_docx.json');
  const outGreek = path.join(base, 'data', 'greek.json');
  const outKjv = path.join(base, 'data', 'kjv_from_docx_normalized.json');

  if (fs.existsSync(inGreek)) {
    console.log('Normalizing Greek file...');
    const items = loadJson(inGreek);
    const verses = normalizeGreek(items);
    saveJson(outGreek, verses);
    console.log(`Wrote ${verses.length} Greek items to ${outGreek}`);
  } else {
    console.log('No Greek input file found at', inGreek);
  }

  if (fs.existsSync(inKjv)) {
    console.log('Attempting to normalize KJV file...');
    const items = loadJson(inKjv);
    const verses = normalizeKJV(items);
    if (verses.length) {
      saveJson(outKjv, verses);
      console.log(`Wrote ${verses.length} KJV items to ${outKjv}`);
    } else {
      console.log('KJV file contains no discernible verse lines; wrote none.');
    }
  } else {
    console.log('No KJV input file found at', inKjv);
  }
}

if (require.main === module) main();
