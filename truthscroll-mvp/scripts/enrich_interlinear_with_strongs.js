const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const interPath = path.join(dataDir, 'interlinear_full.json');
const lemmasPath = path.join(dataDir, 'greek_lemmas.json');
const strongsPath = path.join(dataDir, 'strongs.json');
const outPath = path.join(dataDir, 'interlinear_enriched.json');

if (!fs.existsSync(interPath)) {
  console.error('interlinear_full.json not found');
  process.exit(1);
}
const inter = JSON.parse(fs.readFileSync(interPath, 'utf8'));
const lemmas = fs.existsSync(lemmasPath) ? JSON.parse(fs.readFileSync(lemmasPath, 'utf8')) : {};
const strongs = fs.existsSync(strongsPath) ? JSON.parse(fs.readFileSync(strongsPath, 'utf8')) : {};

function stripDiacritics(s) {
  if (!s) return s;
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

let enrichedCount = 0;
for (const v of inter) {
  for (const t of v.tokens || []) {
    // prefer existing strong if already present
    if (t.strong) continue;
    const orig = t.orig || t.eng || '';
    const lemma = lemmas[orig] || lemmas[stripDiacritics(orig)] || lemmas[stripDiacritics(orig).toLowerCase()];
    const strongEntry = (lemma && strongs[lemma]) || strongs[orig] || strongs[stripDiacritics(orig)];
    if (strongEntry) {
      t.strong = strongEntry.strong || t.strong;
      if (!t.translit && strongEntry.translit) t.translit = strongEntry.translit;
      if (!t.gloss && strongEntry.gloss) t.gloss = strongEntry.gloss;
      enrichedCount++;
    }
  }
}

fs.writeFileSync(outPath, JSON.stringify(inter, null, 2), 'utf8');
console.log('Wrote', outPath, 'with', enrichedCount, 'tokens enriched');
