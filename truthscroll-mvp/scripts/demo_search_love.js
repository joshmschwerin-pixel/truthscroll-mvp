const fs = require('fs');
const path = require('path');

const kjv = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','kjv.json'),'utf8'));
const inter = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','interlinear_full.json'),'utf8'));

const term = 'love';

// Direct English matches: find tokens with eng === term (case-insensitive)
const direct = [];
const originals = {};

for (const v of inter) {
  for (const t of v.tokens || []) {
    if (!t.eng) continue;
    if (t.eng.toLowerCase() === term.toLowerCase()) {
      // find kjv verse text
      const verse = kjv.find(x=>x.book===v.book && x.chapter===v.chapter && x.verse===v.verse);
      direct.push({ book: v.book, chapter: v.chapter, verse: v.verse, text: verse ? verse.text : '', matchedEnglish: t.eng, original: t.orig, translit: t.translit, strong: t.strong, gloss: t.gloss });
      const orig = t.orig || t.eng;
      originals[orig] = originals[orig] || { orig, translit: t.translit, strong: t.strong, gloss: t.gloss, translations: {} };
      const engKey = t.eng.toLowerCase();
      originals[orig].translations[engKey] = originals[orig].translations[engKey] || [];
      originals[orig].translations[engKey].push(`${v.book} ${v.chapter}:${v.verse}`);
    }
  }
}

// Build alternates: for each orig, collect other eng translations and their refs
const alternates = {};
for (const v of inter) {
  for (const t of v.tokens || []) {
    const orig = t.orig || t.eng;
    if (Object.keys(originals).includes(orig)) {
      const engKey = (t.eng || '').toLowerCase();
      alternates[orig] = alternates[orig] || {};
      alternates[orig][engKey] = alternates[orig][engKey] || [];
      alternates[orig][engKey].push(`${v.book} ${v.chapter}:${v.verse}`);
    }
  }
}

console.log('\n=== Direct English Matches ===\n');
for (const d of direct.slice(0,20)) {
  console.log(`${d.book} ${d.chapter}:${d.verse} - ${d.text}`);
  console.log(`  Matched: ${d.matchedEnglish} -> ${d.original} ${d.translit || ''} ${d.strong || ''} ${d.gloss || ''}`);
}

console.log('\n=== Original-Language Word Groups ===\n');
for (const [orig, info] of Object.entries(originals)) {
  console.log(`${orig} ${info.translit || ''} ${info.strong || ''} ${info.gloss || ''}`);
  for (const [eng, refs] of Object.entries(info.translations)) {
    console.log(`  ${eng}: ${refs.join(', ')}`);
  }
  console.log('');
}

console.log('\n=== Alternate Translations ===\n');
for (const [orig, forms] of Object.entries(alternates)) {
  console.log(orig);
  for (const [eng, refs] of Object.entries(forms)) {
    console.log(`  ${eng}: ${refs.slice(0,10).join(', ')}${refs.length>10?'...':''}`);
  }
  console.log('');
}
