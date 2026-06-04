#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { createWorker } = require('tesseract.js');

async function extractImagesFromDocx(docxPath, outDir) {
  const zip = new AdmZip(docxPath);
  const entries = zip.getEntries();
  fs.mkdirSync(outDir, { recursive: true });
  const imgEntries = entries.filter(e => e.entryName.startsWith('word/media/'));
  for (const e of imgEntries) {
    const outPath = path.join(outDir, path.basename(e.entryName));
    fs.writeFileSync(outPath, e.getData());
  }
  return imgEntries.map(e => path.join(outDir, path.basename(e.entryName)));
}

function parseVersesFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const verses = [];
  const re = /^(?:([1-3]?\s?[A-Za-z]+)\s+)?(\d+):(\d+)\s*(.*)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const book = m[1] ? m[1].trim() : null;
      const chap = Number(m[2]);
      const verse = Number(m[3]);
      const body = m[4].trim();
      verses.push({ book, chapter: chap, verse, text: body });
    }
  }
  return verses;
}

async function ocrImages(imgPaths) {
  const worker = await createWorker({ logger: m => {} });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const allText = [];
  for (const img of imgPaths) {
    try {
      const { data: { text } } = await worker.recognize(img);
      allText.push(text);
    } catch (e) {
      console.error('OCR error for', img, e.message || e);
    }
  }
  await worker.terminate();
  return allText.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/ocr_docx_kjv.js input.docx [out.json]');
    process.exit(2);
  }
  const input = args[0];
  const out = args[1] || 'data/kjv_ocr.json';
  if (!fs.existsSync(input)) {
    console.error('Input not found:', input);
    process.exit(2);
  }
  const tmpDir = path.join('tmp', 'docx_media');
  const imgs = await extractImagesFromDocx(input, tmpDir);
  if (!imgs.length) {
    console.log('No images found inside DOCX; OCR not performed.');
    process.exit(0);
  }
  console.log('Found', imgs.length, 'images; running OCR (this may take a while)...');
  const fullText = await ocrImages(imgs);
  const verses = parseVersesFromText(fullText);
  fs.writeFileSync(out, JSON.stringify(verses, null, 2), 'utf-8');
  console.log(`Wrote ${verses.length} OCR-extracted verse-like items to ${out}`);
}

if (require.main === module) main();
