"use client";

import { useEffect, useMemo, useState } from 'react';

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

type StudyClientProps = {
  availableBooks: string[];
  studyData: StudyData;
  initialSelection: {
    book: string;
    chapter: number;
    verse: number;
  };
};

function getFirstChapter(bookData?: StudyBookData) {
  return bookData?.chapters[0]?.chapter ?? 1;
}

function getFirstVerse(chapterData?: StudyChapterData) {
  return chapterData?.verses[0] ?? 1;
}

export default function StudyClient({ availableBooks, studyData, initialSelection }: StudyClientProps) {
  const [selectedBook, setSelectedBook] = useState(initialSelection.book);
  const [selectedChapter, setSelectedChapter] = useState(initialSelection.chapter);
  const [selectedVerse, setSelectedVerse] = useState(initialSelection.verse);

  const selectedBookData = useMemo(() => studyData[selectedBook], [selectedBook, studyData]);

  const availableChapters = useMemo(
    () => selectedBookData?.chapters.map((chapter) => chapter.chapter) ?? [],
    [selectedBookData]
  );

  const selectedChapterData = useMemo(
    () => selectedBookData?.chapters.find((chapter) => chapter.chapter === selectedChapter),
    [selectedBookData, selectedChapter]
  );

  const availableVerses = useMemo(
    () => selectedChapterData?.verses ?? [],
    [selectedChapterData]
  );

  const selectedVerseDetails = useMemo(
    () => selectedChapterData?.verseDetails[selectedVerse],
    [selectedChapterData, selectedVerse]
  );

  useEffect(() => {
    const bookData = studyData[selectedBook];
    const chapters = bookData?.chapters ?? [];
    const hasSelectedChapter = chapters.some((chapter) => chapter.chapter === selectedChapter);

    if (!hasSelectedChapter) {
      const nextChapter = getFirstChapter(bookData);
      setSelectedChapter(nextChapter);

      const nextChapterData = chapters.find((chapter) => chapter.chapter === nextChapter);
      setSelectedVerse(getFirstVerse(nextChapterData));
      return;
    }

    const chapterData = chapters.find((chapter) => chapter.chapter === selectedChapter);
    const verses = chapterData?.verses ?? [];
    const hasSelectedVerse = verses.includes(selectedVerse);

    if (!hasSelectedVerse) {
      setSelectedVerse(getFirstVerse(chapterData));
    }
  }, [selectedBook, selectedChapter, selectedVerse, studyData]);

  const handleBookChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextBook = event.target.value;
    const nextBookData = studyData[nextBook];
    const nextChapter = getFirstChapter(nextBookData);
    const nextChapterData = nextBookData?.chapters.find((chapter) => chapter.chapter === nextChapter);
    const nextVerse = getFirstVerse(nextChapterData);

    setSelectedBook(nextBook);
    setSelectedChapter(nextChapter);
    setSelectedVerse(nextVerse);
  };

  const handleChapterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextChapter = Number(event.target.value);
    const nextChapterData = selectedBookData?.chapters.find((chapter) => chapter.chapter === nextChapter);
    const nextVerse = getFirstVerse(nextChapterData);

    setSelectedChapter(nextChapter);
    setSelectedVerse(nextVerse);
  };

  const handleVerseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVerse(Number(event.target.value));
  };

  return (
    <>
      <section className="card">
        <div className="grid" style={{ gap: 16 }}>
          <div>
            <label>Book</label>
            <select value={selectedBook} onChange={handleBookChange}>
              {availableBooks.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Chapter</label>
            <select value={String(selectedChapter)} onChange={handleChapterChange}>
              {availableChapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Verse</label>
            <select value={String(selectedVerse)} onChange={handleVerseChange}>
              {availableVerses.map((verse) => (
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
          <p>{selectedVerseDetails?.kjvText || 'KJV text is not available yet for this verse.'}</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Greek text in Greek letters</h3>
          <p>{selectedVerseDetails?.greekText || selectedVerseDetails?.noOriginalLanguageMessage || 'Greek text is not available yet for this verse.'}</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Legible Greek / transliteration</h3>
          <p>
            {selectedVerseDetails?.isOldTestament && !selectedVerseDetails?.hasOriginalLanguageData
              ? 'Original-language data for this Old Testament verse is not available yet.'
              : selectedVerseDetails?.transliteration || 'Transliteration is not available yet for this verse.'}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Literal Greek-to-English rendering</h3>
          <p>
            {selectedVerseDetails?.isOldTestament && !selectedVerseDetails?.hasOriginalLanguageData
              ? 'Original-language data for this Old Testament verse is not available yet.'
              : selectedVerseDetails?.literalRendering || 'A literal rendering is not available yet for this verse.'}
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Translation notes</h3>
          {selectedVerseDetails?.isOldTestament && !selectedVerseDetails?.hasOriginalLanguageData ? (
            <p>Original-language data for this Old Testament verse is not available yet.</p>
          ) : selectedVerseDetails?.translationNotes?.length ? (
            <ul>
              {selectedVerseDetails.translationNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : (
            <p>Translation notes are not available yet for this verse.</p>
          )}
        </div>
      </section>
    </>
  );
}