import fs from 'fs';
import path from 'path';

export type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

const bookFiles = [
  'kjv_matthew.json',
  'kjv_mark.json',
  'kjv_luke.json',
  'kjv_john.json',
  'kjv_acts.json',
  'kjv_romans.json',
  'kjv_1_corinthians.json',
  'kjv_2_corinthians.json',
  'kjv_galatians.json',
  'kjv_ephesians.json',
  'kjv_philippians.json',
  'kjv_colossians.json',
  'kjv_1_thessalonians.json',
  'kjv_2_thessalonians.json',
  'kjv_1_timothy.json',
  'kjv_2_timothy.json',
  'kjv_titus.json',
  'kjv_philemon.json',
  'kjv_hebrews.json',
  'kjv_james.json',
  'kjv_1_peter.json',
  'kjv_2_peter.json',
  'kjv_1_john.json',
  'kjv_2_john.json',
  'kjv_3_john.json',
  'kjv_jude.json',
  'kjv_revelation.json'
];

let cachedVerses: BibleVerse[] | null = null;

function normalizeVerse(verse: any): BibleVerse | null {
  if (!verse || !verse.book || typeof verse.chapter !== 'number' || typeof verse.verse !== 'number' || !verse.text) {
    return null;
  }

  return {
    book: String(verse.book),
    chapter: Number(verse.chapter),
    verse: Number(verse.verse),
    text: String(verse.text).replace(/\s+/g, ' ').trim()
  };
}

function loadBookFile(fileName: string): BibleVerse[] {
  const filePath = path.join(process.cwd(), 'data', fileName);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(normalizeVerse)
    .filter((verse): verse is BibleVerse => verse !== null);
}

export function getAllVerses(): BibleVerse[] {
  if (cachedVerses) return cachedVerses;

  cachedVerses = bookFiles
    .flatMap(loadBookFile)
    .sort((a, b) => {
      if (a.book !== b.book) return a.book.localeCompare(b.book);
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

  return cachedVerses;
}

export function getVerse(book: string, chapter: number, verse: number): BibleVerse | undefined {
  return getAllVerses().find(
    (item) => item.book === book && item.chapter === chapter && item.verse === verse
  );
}

export function getChapter(book: string, chapter: number): BibleVerse[] {
  return getAllVerses()
    .filter((item) => item.book === book && item.chapter === chapter)
    .sort((a, b) => a.verse - b.verse);
}

export function getAvailableBooks(): string[] {
  return Array.from(new Set(getAllVerses().map((verse) => verse.book)));
}

export function getAvailableChapters(book: string): number[] {
  return Array.from(
    new Set(
      getAllVerses()
        .filter((verse) => verse.book === book)
        .map((verse) => verse.chapter)
    )
  ).sort((a, b) => a - b);
}