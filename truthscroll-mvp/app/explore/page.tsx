"use client";
import { useEffect, useMemo, useState } from 'react';
import bible from '@/data/kjv.json';

const books = Array.from(new Set((bible as any[]).map((verse) => verse.book)));
const bookChapterMap = books.reduce((map: Record<string, number[]>, book) => {
  const chapters = Array.from(
    new Set(
      (bible as any[])
        .filter((verse) => verse.book === book)
        .map((verse) => verse.chapter)
    )
  ).sort((a, b) => a - b);
  map[book] = chapters;
  return map;
}, {} as Record<string, number[]>);

const otConnections: Record<string, string[]> = {
  'John 1:1': ['Genesis 1:1', 'Proverbs 8:22-30', 'Psalm 33:6'],
  'Matthew 1:1': ['Genesis 12:3', '2 Samuel 7:12-16'],
  'Matthew 5:17': ['Isaiah 42:21', 'Jeremiah 31:31-34'],
  'Romans 5:12': ['Genesis 3:17-19', 'Psalm 51:5'],
  'John 3:16': ['Deuteronomy 7:9', 'Isaiah 53:5'],
  'Hebrews 1:1': ['Psalm 89:1', 'Joel 2:28-29'],
  'Hebrews 4:12': ['Psalm 119:105', 'Isaiah 55:11'],
  'Matthew 2:15': ['Hosea 11:1'],
  'John 12:41': ['Isaiah 6:1-5'],
  'Romans 8:3': ['Isaiah 53:6', 'Psalm 51:5'],
  'Genesis 1:1': ['Psalm 33:6', 'Proverbs 8:22-30'],
  'Psalm 22:1': ['Exodus 3:14', 'Isaiah 53:3-4']
};

function getVerseText(reference: string) {
  const match = reference.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const [, book, chapter, verseStart, verseEnd] = match;
  const chapterNum = Number(chapter);
  const start = Number(verseStart);
  const end = verseEnd ? Number(verseEnd) : start;

  const verses = (bible as any[])
    .filter(
      (item) =>
        item.book.toLowerCase() === book.toLowerCase() &&
        item.chapter === chapterNum &&
        item.verse >= start &&
        item.verse <= end
    )
    .sort((a, b) => a.verse - b.verse);

  if (!verses.length) return null;
  return verses.map((item) => item.text).join(' ');
}

function getFallbackOldTestamentConnections(currentKey: string) {
  const book = currentKey.split(' ')[0].toLowerCase();
  if (['matthew', 'mark', 'luke', 'john'].includes(book)) {
    return ['Isaiah 53:5', 'Psalm 22:1', 'Genesis 12:3'];
  }
  if (['romans', 'corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', 'thessalonians', 'timothy', 'titus', 'philemon', 'hebrews', 'james', 'peter', 'john', 'jude'].includes(book)) {
    return ['Deuteronomy 6:5', 'Micah 6:8', 'Psalm 51:10'];
  }
  if (['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'].includes(book)) {
    return ['Genesis 12:3', 'Deuteronomy 6:5', 'Psalm 110:1'];
  }
  if (['isaiah', 'jeremiah', 'ezekiel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi'].includes(book)) {
    return ['Psalm 2:7', 'Isaiah 9:6', 'Jeremiah 31:31'];
  }
  if (['psalm', 'proverbs', 'ecclesiastes', 'song'].includes(book)) {
    return ['Psalm 110:1', 'Proverbs 3:5-6', 'Isaiah 55:11'];
  }
  return ['Deuteronomy 31:6', 'Psalm 119:105'];
}

export default function ExplorePage() {
  const [selectedBook, setSelectedBook] = useState(books[0] || 'Matthew');
  const [selectedChapter, setSelectedChapter] = useState(bookChapterMap[books[0]]?.[0] || 1);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);

  const verses = useMemo(
    () =>
      (bible as any[]).filter(
        (verse) => verse.book === selectedBook && verse.chapter === selectedChapter
      ),
    [selectedBook, selectedChapter]
  );

  const verseNumbers = useMemo(() => verses.map((verse) => verse.verse), [verses]);

  const selectedVerse = useMemo(() => {
    if (!verses.length) return null;
    if (selectedVerseNumber !== null) {
      return verses.find((verse) => verse.verse === selectedVerseNumber) || verses[0];
    }
    return verses[0];
  }, [verses, selectedVerseNumber]);

  const currentKey = selectedVerse ? `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}` : '';
  const [hydratedTexts, setHydratedTexts] = useState<Record<string, string | null>>({});

  const refs = useMemo(() => {
    if (!currentKey) return [];
    return (otConnections[currentKey] || getFallbackOldTestamentConnections(currentKey)).map((ref) => ({
      ref,
      text: getVerseText(ref)
    }));
  }, [currentKey]);

  const connections = useMemo(
    () => refs.map((connection) => ({
      ...connection,
      text: connection.text ?? hydratedTexts[connection.ref] ?? null
    })),
    [refs, hydratedTexts]
  );

  async function fetchVerseTextOnline(reference: string) {
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.text?.trim() || null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    async function hydrateTexts() {
      const updated = await Promise.all(
        refs.map(async (connection) => {
          if (connection.text) return connection;
          const text = await fetchVerseTextOnline(connection.ref);
          return { ...connection, text };
        })
      );

      if (!active) return;
      setHydratedTexts((prev) => ({
        ...prev,
        ...Object.fromEntries(updated.map((connection) => [connection.ref, connection.text]))
      }));
    }

    hydrateTexts();
    return () => {
      active = false;
    };
  }, [refs]);

  return (
    <main className="page">
      <h1>Passage Explorer</h1>
      <p>Browse the Bible by book and chapter using the complete public-domain text.</p>

      <div className="panel">
        <label>Book</label>
        <select
          value={selectedBook}
          onChange={(event) => {
            const book = event.target.value;
            setSelectedBook(book);
            setSelectedChapter(bookChapterMap[book]?.[0] || 1);
            setSelectedVerseNumber(null);
          }}
        >
          {books.map((book) => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>

        <label>Chapter</label>
        <select
          value={selectedChapter}
          onChange={(event) => {
            setSelectedChapter(Number(event.target.value));
            setSelectedVerseNumber(null);
          }}
        >
          {bookChapterMap[selectedBook]?.map((chapter) => (
            <option key={`${selectedBook}-${chapter}`} value={chapter}>{chapter}</option>
          ))}
        </select>

        <label>Verse</label>
        <select
          value={selectedVerse?.verse ?? verseNumbers[0] ?? 1}
          onChange={(event) => setSelectedVerseNumber(Number(event.target.value))}
        >
          {verseNumbers.map((verse) => (
            <option key={`${selectedBook}-${selectedChapter}-${verse}`} value={verse}>{verse}</option>
          ))}
        </select>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>{selectedBook} {selectedChapter}</h2>
        <p>{verses.length} verses</p>
      </section>

      {selectedVerse && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2>Selected passage</h2>
          <h3>{selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}</h3>
          <div style={{ marginTop: 8, padding: 12, borderRadius: 6, border: '1px solid #ddd', lineHeight: 1.6 }}>
            {selectedVerse.text}
          </div>
          {connections.length > 0 && (
            <>
              <h4 style={{ marginTop: 16, marginBottom: 12 }}>Old Testament connections</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                {connections.map((connection) => (
                  <div key={connection.ref} style={{ padding: 12, borderRadius: 6, border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
                    <strong style={{ fontSize: 16 }}>{connection.ref}</strong>
                    {connection.text && (
                      <div style={{ marginTop: 8, lineHeight: 1.6, fontSize: 15 }}>
                        {connection.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="grid">
        {verses.map((verse) => {
          const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
          return (
            <article
              key={verseKey}
              className="card"
              onClick={() => setSelectedVerseNumber(verse.verse)}
              style={{
                cursor: 'pointer',
                borderColor: selectedVerse?.verse === verse.verse ? '#0070f3' : undefined,
                borderWidth: selectedVerse?.verse === verse.verse ? 2 : 1
              }}
            >
              <h3>{verse.chapter}:{verse.verse}</h3>
              <p>{verse.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
