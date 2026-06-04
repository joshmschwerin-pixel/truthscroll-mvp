const fs = require('fs');
const path = require('path');

const kjv = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','kjv.json'),'utf8'));
const inter = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','interlinear_full.json'),'utf8'));

const terms = process.argv.slice(2);
if (terms.length === 0) terms.push('love','grace','word','spirit','christ');

function runTerm(term) {
  const direct = [];
  const originals = {};

  for (const v of inter) {
    for (const t of v.tokens || []) {
      if (!t.eng) continue;
      if (t.eng.toLowerCase() === term.toLowerCase()) {
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

  return { term, direct, originals, alternates };
}

for (const term of terms) {
  const out = runTerm(term);
  const filename = path.join(__dirname,'..','data',`demo_search_${term.replace(/\s+/g,'_').toLowerCase()}.json`);
  fs.writeFileSync(filename, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', filename, 'directMatches:', out.direct.length);
}
