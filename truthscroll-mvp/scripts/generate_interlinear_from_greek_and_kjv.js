const fs = require('fs');
const path = require('path');

const kjvPath = path.join(__dirname, '..', 'data', 'kjv.json');
const greekPath = path.join(__dirname, '..', 'data', 'greek_nt.json');
const strongsPath = path.join(__dirname, '..', 'data', 'strongs.json');
const lemmaOverridesPath = path.join(__dirname, '..', 'data', 'greek_lemma_overrides.json');
const outPath = path.join(__dirname, '..', 'data', 'interlinear_full.json');

function splitEnglishWords(text) {
  if (!text) return [];
  // crude split: keep words letters and apostrophes
  const m = text.match(/[A-Za-z']+/g);
  return m ? m.map(s => s.trim()) : [];
}

function splitGreekWords(text) {
  if (!text) return [];
  // split on spaces and remove punctuation-like characters
  return text.split(/\s+/).map(s => s.replace(/[.,;:\uFEFF\u200B\u200C\u2060\u202A-\u202E\[\]⸂⸃⸀⸁\u200E\u200F"“”«»]/g,'').trim()).filter(Boolean);
}

function stripDiacritics(s) {
  if (!s) return '';
  return s.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; }
}

const kjv = loadJSON(kjvPath) || [];
const greek = loadJSON(greekPath) || [];
let strongs = loadJSON(strongsPath) || {};
let lemmaOverrides = loadJSON(lemmaOverridesPath) || {};
const greekLemmasPath = path.join(__dirname, '..', 'data', 'greek_lemmas.json');
const greekLemmas = loadJSON(greekLemmasPath) || {};
// Optional external Greek lemmatizer (install via `npm run install-lemmatizer`)
let lemmatizer = null;
try {
  // try common package name; if not installed, this will fail silently
  lemmatizer = require('greek-lemmatizer');
  if (!lemmatizer || typeof lemmatizer.lemmatize !== 'function') {
    // some packages export a different API
    if (lemmatizer && typeof lemmatizer.getLemma === 'function') {
      lemmatizer.lemmatize = lemmatizer.getLemma;
    } else {
      lemmatizer = null;
    }
  }
} catch (e) {
  lemmatizer = null;
}

// Build a quick map for greek verses
const greekMap = {};
for (const v of greek) {
  if (!v || !v.book) continue;
  greekMap[`${v.book}||${v.chapter}||${v.verse}`] = v.text;
}

function guessLemma(form) {
  if (!form) return form;
  const f = stripDiacritics(form).toLowerCase();
  // prefer generated lemma map
  if (greekLemmas[form]) return greekLemmas[form];
  if (greekLemmas[f]) return greekLemmas[f];
  if (lemmaOverrides[f]) return lemmaOverrides[f];
  // heuristic: common suffixes
  const suffixes = ['ουσιν','ουσι','οντας','ωντες','ουμαι','ου','ει','ειν','ειται','ειτε','η','ης','ος','ον','ων','ου','αι','ας','α','εν','θησεται','θησε','θην','θη','σας','σε','σθε','σθε','μαι','μεθα','μεν'];
  for (const s of suffixes) {
    if (f.endsWith(s)) {
      const candidate = f.slice(0, -s.length);
      if (candidate.length >= 2) return candidate;
    }
  }
  return f;
}

const interlinear = [];
let count = 0;
for (const v of kjv) {
  const key = `${v.book}||${v.chapter}||${v.verse}`;
  const gtext = greekMap[key];
  if (!gtext) continue;
  const engWords = splitEnglishWords(v.text || '');
  const gWords = splitGreekWords(gtext || '');
  const tokens = [];

  for (let i = 0; i < engWords.length; i++) {
    const eng = engWords[i];
    const gIndex = Math.min(i, gWords.length - 1);
    let orig = gWords[gIndex] || '';
    const origStripped = stripDiacritics(orig).toLowerCase();
    // attempt direct lookup
    let strongEntry = strongs[orig] || strongs[origStripped] || null;
    // if external lemmatizer is available, try to lemmatize the Greek form
    if (!strongEntry && lemmatizer) {
      try {
        const lemma = lemmatizer.lemmatize(orig) || lemmatizer.lemmatize(origStripped) || null;
        if (lemma) {
          const lemmaKey = Array.isArray(lemma) ? lemma[0] : lemma;
          strongEntry = strongs[lemmaKey] || strongs[stripDiacritics(lemmaKey)] || null;
          if (strongEntry) orig = lemmaKey;
        }
      } catch (e) {
        // ignore lemmatizer errors
      }
    }
    if (!strongEntry) {
      // try lemma guess
      const lemma = guessLemma(orig);
      strongEntry = strongs[lemma] || strongs[stripDiacritics(lemma)] || null;
      if (strongEntry) orig = lemma;
    }
    tokens.push({ eng, orig, translit: strongEntry ? strongEntry.translit : '', strong: strongEntry ? strongEntry.strong : undefined, gloss: strongEntry ? strongEntry.gloss : undefined });
  }

  interlinear.push({ book: v.book, chapter: v.chapter, verse: v.verse, tokens });
  count++;
}

fs.writeFileSync(outPath, JSON.stringify(interlinear, null, 2), 'utf8');
console.log(`Wrote ${count} interlinear entries to ${outPath}`);
