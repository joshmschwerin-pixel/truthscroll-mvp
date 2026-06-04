import { NextResponse } from 'next/server';
import bible from '@/data/kjv.json';
import fs from 'fs';
import path from 'path';

type InterlinearToken = {
  eng: string;
  orig: string;
  translit?: string;
  strong?: string;
  gloss?: string;
};

type InterlinearVerse = {
  book: string;
  chapter: number;
  verse: number;
  tokens: InterlinearToken[];
};

function loadInterlinear(): InterlinearVerse[] | null {
  const p1 = path.join(process.cwd(), 'data', 'interlinear_kjv.json');
  const p2 = path.join(process.cwd(), 'data', 'interlinear_nt.json');
  const p3 = path.join(process.cwd(), 'data', 'interlinear_full.json');
  const pEnriched = path.join(process.cwd(), 'data', 'interlinear_enriched.json');
  // Prefer enriched interlinear if available
  const file = fs.existsSync(pEnriched) ? pEnriched : fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : fs.existsSync(p3) ? p3 : null;
  if (!file) return null;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw) as InterlinearVerse[];
  } catch (err) {
    console.error('Failed to parse interlinear file', err);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qRaw = (searchParams.get('q') || '').trim();
  const q = qRaw.toLowerCase();

  if (!q) return NextResponse.json({ results: [] });

  const interlinear = loadInterlinear();
  // try to load strongs dictionary for richer metadata
  let strongs: Record<string, any> = {};
  try {
    const sp = path.join(process.cwd(), 'data', 'strongs.json');
    if (fs.existsSync(sp)) strongs = JSON.parse(fs.readFileSync(sp, 'utf8'));
  } catch (err) {
    strongs = {};
  }

  if (!interlinear) {
    // Fallback: simple text search when interlinear dataset is not available
    const results = (bible as any[]).filter((v) => {
      const text = String(v.text || '').toLowerCase();
      const book = String(v.book || '').toLowerCase();
      return text.includes(q) || book.includes(q);
    });
    return NextResponse.json({ results, interlinearAvailable: false, message: 'Interlinear dataset not found. To enable original-language mapping, provide data/interlinear_kjv.json with word-level tokens.' });
  }

  // Build indices
  const engIndex: Record<string, { book: string; chapter: number; verse: number; token: InterlinearToken }[]> = {};
  const origInfo: Record<string, { translit?: string; strong?: string; gloss?: string; translations: Record<string, string[]> }> = {};

  for (const v of interlinear) {
    for (const t of v.tokens || []) {
      const engKey = String(t.eng || '').toLowerCase();
      if (!engKey) continue;
      engIndex[engKey] = engIndex[engKey] || [];
      engIndex[engKey].push({ book: v.book, chapter: v.chapter, verse: v.verse, token: t });

      const orig = t.orig || t.eng;
      const strongEntry = strongs[orig] || null;
      if (!origInfo[orig]) origInfo[orig] = { translit: t.translit || (strongEntry && strongEntry.translit), strong: t.strong || (strongEntry && strongEntry.strong), gloss: t.gloss || (strongEntry && strongEntry.gloss), translations: {} };
      const trans = String(t.eng || '').toLowerCase();
      origInfo[orig].translations[trans] = origInfo[orig].translations[trans] || [];
      origInfo[orig].translations[trans].push(`${v.book} ${v.chapter}:${v.verse}`);
    }
  }

  const matched = engIndex[q] || [];

  // Map verses with KJV text and matched tokens
  const results = matched.map((m) => {
    const verse = (bible as any[]).find((v) => v.book === m.book && v.chapter === m.chapter && v.verse === m.verse);
    return {
      book: m.book,
      chapter: m.chapter,
      verse: m.verse,
      text: verse?.text || '',
      matchedEnglish: m.token.eng,
      original: m.token.orig,
      translit: m.token.translit,
      strong: m.token.strong,
      gloss: m.token.gloss
    };
  });

  // Build original-language groups for the matched originals
  const originals: Record<string, any> = {};
  for (const m of matched) {
    const orig = m.token.orig || m.token.eng;
    if (!originals[orig]) {
      const info = origInfo[orig] || { translit: m.token.translit, strong: m.token.strong, gloss: m.token.gloss, translations: {} };
      const strongEntry = strongs[orig] || null;
      originals[orig] = {
        orig,
        translit: info.translit,
        strong: info.strong,
        strongEntry: strongEntry || null,
        gloss: info.gloss,
        translations: Object.entries(info.translations).map(([eng, refs]) => ({ eng, refs }))
      };
    }
  }

  // Alternate translation results: find verses where same original appears but with a different English rendering
  const alternates: Record<string, any> = {};
  for (const orig of Object.keys(originals)) {
    alternates[orig] = [];
    // For each translation form, include verse refs
    const info = origInfo[orig];
    for (const [eng, refs] of Object.entries(info.translations)) {
      alternates[orig].push({ eng, refs });
    }
  }

  return NextResponse.json({ results, originals, alternates, interlinearAvailable: true });
}
