import fs from 'fs';
import path from 'path';
import StudyClient from './StudyClient';
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

type StudyVerseDetails = {
  kjvText: string;
  greekText: string;
  transliteration: string;
  literalRendering: string;
  translationNotes: string[];
  noOriginalLanguageMessage: string;
  isOldTestament: boolean;
  hasOriginalLanguageData: boolean;
};

type StudyChapterData = {
  chapter: number;
  verses: number[];
  verseDetails: Record<number, StudyVerseDetails>;
};

type StudyBookData = {
  chapters: StudyChapterData[];
};

type StudyData = Record<string, StudyBookData>;

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

  const interlinear = loadJsonFile<InterlinearVerse[]>('interlinear_kjv.json', []);
  const strongs = loadJsonFile<Record<string, StrongsEntry>>('strongs.json', {});

  const newTestamentStartIndex = availableBooks.indexOf('Matthew');

  const studyData: StudyData = Object.fromEntries(
    availableBooks.map((book) => {
      const chapters = getAvailableChapters(book).map((chapter) => {
        const verses = getAvailableVerses(book, chapter);

        const verseDetails = Object.fromEntries(
          verses.map((verse) => {
            const kjvVerse = getVerse(book, chapter, verse);
            const greekVerse = interlinear.find(
              (item) => item.book === book && item.chapter === chapter && item.verse === verse
            );

            const greekText = greekVerse?.tokens?.map((token) => token.orig).filter(Boolean).join(' ') || '';
            const transliteration = greekVerse?.tokens
              ?.map((token) => token.translit || strongs[token.orig]?.translit || '')
              .filter(Boolean)
              .join(' ') || '';
            const literalRendering = greekVerse ? buildLiteralRendering(greekVerse.tokens || [], strongs) : '';
            const translationNotes = greekVerse
              ? buildTranslationNotes(greekVerse.tokens || [], strongs, kjvVerse?.text || '')
              : [];

            const isOldTestament = newTestamentStartIndex === -1 || availableBooks.indexOf(book) < newTestamentStartIndex;
            const noOriginalLanguageMessage = isOldTestament
              ? 'Original-language data for this Old Testament verse is not available yet.'
              : 'Greek text is not available yet for this verse.';

            return [
              verse,
              {
                kjvText: kjvVerse?.text || '',
                greekText,
                transliteration,
                literalRendering,
                translationNotes,
                noOriginalLanguageMessage,
                isOldTestament,
                hasOriginalLanguageData: Boolean(greekVerse)
              }
            ];
          })
        );

        return [
          chapter,
          {
            chapter,
            verses,
            verseDetails
          }
        ];
      });

      return [
        book,
        {
          chapters: chapters.map(([, chapterData]) => chapterData)
        }
      ];
    })
  );

  return (
    <main className="page">
      <h1>Original Language Study</h1>
      <p>Choose a verse to view the KJV text and original-language study details from local data.</p>

      <StudyClient
        availableBooks={availableBooks}
        studyData={studyData}
        initialSelection={{
          book: selectedBook,
          chapter: selectedChapter,
          verse: selectedVerse
        }}
      />
    </main>
  );
}