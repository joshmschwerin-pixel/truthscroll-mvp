#!/usr/bin/env node
// Simple DOCX -> verse-level JSON converter using mammoth
// Usage: node scripts/convert_docx.js input.docx output.json

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const REF_RE = /^(\d?\s?[A-Za-z]+(?:[\sA-Za-z\-'.]*?)?)\s+(\d+):(\d+)\b/;

async function extract(inputPath) {
  const result = await mammoth.extractRawText({ path: inputPath });
  const raw = result.value || '';
  // Split into paragraphs by blank lines (preserve ordering)
  const paragraphs = raw.split(/\n\s*\n|\r\n\s*\r\n|\r\s*\r/).map(s => s.trim()).filter(Boolean);

  const verses = [];
  let lastKey = null;
  for (const p of paragraphs) {
    const line = p.replace(/\r?\n/g, ' ').trim();
    const m = line.match(REF_RE);
    if (m) {
      const book = m[1].trim();
      const chapter = m[2];
      const verse = m[3];
      const text = line.slice(m[0].length).trim();
      const key = `${book} ${chapter}:${verse}`;
      verses.push({ book, chapter: Number(chapter), verse: Number(verse), text });
      lastKey = key;
    } else {
      // Attach to last verse if exists, otherwise create anonymous entry
      if (lastKey && verses.length) {
        verses[verses.length - 1].text += ' ' + line;
      } else {
        verses.push({ text: line });
      }
    }
  }

  // Optionally, collapse consecutive anonymous entries into one
  return verses;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/convert_docx.js input.docx output.json');
    process.exit(2);
  }
  const input = args[0];
  const out = args[1];
  if (!fs.existsSync(input)) {
    console.error('Input not found:', input);
    process.exit(2);
  }
  try {
    const items = await extract(input);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(items, null, 2), 'utf-8');
    console.log(`Wrote ${items.length} items to ${out}`);
  } catch (err) {
    console.error('Error converting:', err);
    process.exit(1);
  }
}

if (require.main === module) main();
