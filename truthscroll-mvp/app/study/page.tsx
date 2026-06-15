import fs from 'fs';
import path from 'path';
import {
  getAvailableBooks,
  getAvailableChapters,
  getAvailableVerses,
  getVerse
} from '@/lib/bibleData.server';

type StudyPageProps = {
  searchParams?: {
    book?: string;
    chapter?: string;
    verse?: string;
  };
};

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

type StrongsEntry = {
  strong?: string;
  translit?: string;
  gloss?: string;
};

function loadJsonFile<T>(fileName: string, fallback: T): T {
  const filePath = path.join(process.cwd(), 'data', fileName);
  if (!fs.existsSync(filePath)) return fallback;

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function buildLiteralRendering(tokens: InterlinearToken[], strongs: Record<string, StrongsEntry>) {
  const parts = tokens
    .map((token) => {
      const strongEntry = strongs[token.orig] || {};
      return token.gloss || strongEntry.gloss || '';
    })
    .filter(Boolean);

  return parts.length ? parts.join(' ') : '';
}

function buildTranslationNotes(tokens: InterlinearToken[], strongs: Record<string, StrongsEntry>, kjvText: string) {
  const notes: string[] = [];
  const lowerKjv = kjvText.toLowerCase();

  for (const token of tokens) {
    const strongEntry = strongs[token.orig] || {};
    const gloss = token.gloss || strongEntry.gloss;
    const translit = token.translit || strongEntry.translit;
    const english = token.eng;

    if (!gloss || !english) continue;

    const normalizedEnglish = english.toLowerCase();
    const normalizedGloss = gloss.toLowerCase();

    if (normalizedGloss !== normalizedEnglish && lowerKjv.includes(normalizedEnglish)) {
      const note = translit
        ? `${english} reflects ${token.orig} (${translit}), which more literally means “${gloss}.”`
        : `${english} reflects ${token.orig}, which more literally means “${gloss}.”`;

      if (!notes.includes(note)) {
        notes.push(note);
      }
    }
  }

  return notes;
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const availableBooks = getAvailableBooks();
  const defaultBook = availableBooks.includes('John') ? 'John' : availableBooks[0] || '';
  const selectedBook = searchParams?.book && availableBooks.includes(searchParams.book) ? searchParams.book : defaultBook;

  const availableChapters = selectedBook ? getAvailableChapters(selectedBook) : [];
  const defaultChapter = availableChapters.includes(1) ? 1 : availableChapters[0] || 1;
  const requestedChapter = Number(searchParams?.chapter);
  const selectedChapter = availableChapters.includes(requestedChapter) ? requestedChapter : defaultChapter;

  const availableVerseNumbers = selectedBook ? getAvailableVerses(selectedBook, selectedChapter) : [];
  const defaultVerse = availableVerseNumbers[0] || 1;
  const requestedVerse = Number(searchParams?.verse);
  const selectedVerse = availableVerseNumbers.includes(requestedVerse) ? requestedVerse : defaultVerse;

  const kjvVerse = selectedBook ? getVerse(selectedBook, selectedChapter, selectedVerse) : undefined;

  const interlinear = loadJsonFile<InterlinearVerse[]>('interlinear_kjv.json', []);
  const strongs = loadJsonFile<Record<string, StrongsEntry>>('strongs.json', {});
  const greekVerse = interlinear.find(
    (item) => item.book === selectedBook && item.chapter === selectedChapter && item.verse === selectedVerse
  );

  const greekText = greekVerse?.tokens?.map((token) => token.orig).filter(Boolean).join(' ') || '';
  const transliteration = greekVerse?.tokens
    ?.map((token) => token.translit || strongs[token.orig]?.translit || '')
    .filter(Boolean)
    .join(' ') || '';
  const literalRendering = greekVerse ? buildLiteralRendering(greekVerse.tokens || [], strongs) : '';
  const translationNotes = greekVerse ? buildTranslationNotes(greekVerse.tokens || [], strongs, kjvVerse?.text || '') : [];

  const isOldTestament = selectedBook ? !availableBooks.slice(availableBooks.indexOf('Matthew')).includes(selectedBook) : false;
  const noOriginalLanguageMessage = isOldTestament
    ? 'Original-language data for this Old Testament verse is not available yet.'
    : 'Greek text is not available yet for this verse.';

  return (
    <main className="page">
      <h1>Original Language Study</h1>
      <p>Choose a verse to view the KJV text and original-language study details from local data.</p>

      <section className="card">
        <div className="grid" style={{ gap: 16 }}>
          <div>
            <label>Book</label>
            <select
              value={selectedBook}
              onChange={(event) => {
                window.location.href = `/study?book=${encodeURIComponent(event.target.value)}&chapter=1&verse=1`;
              }}
            >
              {availableBooks.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Chapter</label>
            <select
              value={String(selectedChapter)}
              onChange={(event) => {
                window.location.href = `/study?book=${encodeURIComponent(selectedBook)}&chapter=${event.target.value}&verse=1`;
              }}
            >
              {availableChapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Verse</label>
            <select
              value={String(selectedVerse)}
              onChange={(event) => {
                window.location.href = `/study?book=${encodeURIComponent(selectedBook)}&chapter=${selectedChapter}&verse=${event.target.value}`;
              }}
            >
              {availableVerseNumbers.map((verse) => (
                <option key={verse} value={verse}>
                  {verse}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>
          {selectedBook} {selectedChapter}:{selectedVerse}
        </h2>

        <div style={{ marginTop: 16 }}>
          <h3>King James Version</h3>
          <p>{kjvVerse?.text || 'KJV text is not available yet for this verse.'}</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Greek text in Greek letters</h3>
          <p>{greekText || noOriginalLanguageMessage}</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Legible Greek / transliteration</h3>
          <p>
            {isOldTestament && !greekVerse
              ? 'Original-language data for this Old Testament verse is not available yet.'
              : transliteration || 'Transliteration is not available yet for this verse.'}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Literal Greek-to-English rendering</h3>
          <p>
            {isOldTestament && !greekVerse
              ? 'Original-language data for this Old Testament verse is not available yet.'
              : literalRendering || 'A literal rendering is not available yet for this verse.'}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Translation notes</h3>
          {isOldTestament && !greekVerse ? (
            <p>Original-language data for this Old Testament verse is not available yet.</p>
          ) : translationNotes.length ? (
            <ul>
              {translationNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : (
            <p>Translation notes are not available yet for this verse.</p>
          )}
        </div>
      </section>
    </main>
  );
}