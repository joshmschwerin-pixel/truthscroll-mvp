"use client";
import { useEffect, useMemo, useState } from 'react';
import kjv from '@/data/kjv.json';
import greekData from '@/data/greek_nt.json';
import greekSamples from '@/data/greekSamples.json';

const sampleNotes = Object.fromEntries(
  (greekSamples as any[]).map((item) => [item.reference, item.notes])
) as Record<string, string>;

const studyBooks = (kjv as any[]).reduce((books: string[], verse: any) => {
  if (!books.includes(verse.book)) books.push(verse.book);
  return books;
}, [] as string[]);

function getGreekChapterVerses(book: string, chapter: number) {
  return (greekData as any[])
    .filter((verse) => verse.book === book && verse.chapter === chapter)
    .sort((a, b) => a.verse - b.verse);
}

function getGreekVerseMap(book: string, chapter: number) {
  return getGreekChapterVerses(book, chapter).reduce(
    (acc: Record<number, string>, verse: any) => {
      acc[verse.verse] = verse.text;
      return acc;
    },
    {} as Record<number, string>
  );
}

function getTranslationNotes(reference: string, greekText: string, kjvText: string): string {
  // Use pre-mapped notes if available
  if (sampleNotes[reference]) {
    return sampleNotes[reference];
  }

  // Generate contextual notes based on Greek structure
  if (!greekText || greekText === 'Greek text not available') {
    return 'Greek source text is not available for detailed translation analysis.';
  }

  const hasKeyTerms = {
    logos: greekText.includes('λόγος'),
    agape: greekText.includes('ἀγάπη'),
    charis: greekText.includes('χάρις'),
    pneuma: greekText.includes('πνεῦμα'),
    christos: greekText.includes('χριστός'),
    dikaios: greekText.includes('δίκαιος'),
    soter: greekText.includes('σωτήρ')
  };

  const notes: string[] = [];

  if (hasKeyTerms.logos) {
    notes.push('The Greek λόγος (Word) conveys divine self-expression and reason. The KJV renders it as "Word," capturing the meaning but not fully conveying the theological weight of Christ as God\'s active expression. A literal rendering would preserve "the Word/Reason" to emphasize the active dimension.');
  }
  if (hasKeyTerms.agape) {
    notes.push('The Greek ἀγάπη (agape) emphasizes covenant loyalty and faithful, committed love—not mere emotional affection. The KJV translation as "love" is correct but benefits from understanding its covenantal dimension. Alternate: "faithful love" or "covenant love."');
  }
  if (hasKeyTerms.charis) {
    notes.push('The Greek χάρις (charis/grace) points to God\'s active kindness and unearned favor. It is more than a passive concept—it is God\'s dynamic blessing and strength at work. Alternate renderings: "favor," "kindness," or "gracious gift."');
  }
  if (hasKeyTerms.pneuma) {
    notes.push('The Greek πνεῦμα (pneuma/spirit) literally means "breath" and conveys the life-giving presence of God—not merely an abstract force but an active, personal reality. A literal translation would say "Spirit/breath" to preserve this sense of life-giving presence.');
  }
  if (hasKeyTerms.christos) {
    notes.push('The Greek χριστός (Christos) means "Anointed One" or "Messiah," emphasizing Jesus as the fulfillment of Old Testament hopes for God\'s anointed King and deliverer. While the KJV uses "Christ" as a name, the literal meaning is "Messiah/Anointed."');
  }
  if (hasKeyTerms.dikaios) {
    notes.push('The Greek δίκαιος (dikaios/righteous) defines a moral posture aligned with God\'s character and covenant—beyond mere external propriety. It indicates right relationship with God. Alternate: "just" or "righteous/just."');
  }
  if (hasKeyTerms.soter) {
    notes.push('The Greek σωτήρ (soter/Savior) emphasizes active rescue and deliverance from sin and danger. It conveys God\'s initiative in salvation, not just a passive state of being saved. Alternate: "Deliverer" or "Rescuer."');
  }

  return notes.length > 0 ? notes.join(' ') : 'The Greek is compact and precise. The KJV may expand or smooth the wording for readability. This can shift emphasis from the original nuance to a more familiar English phrasing.';
}

export default function StudyPage() {
  const [selectedBook, setSelectedBook] = useState(studyBooks[0]);
  const chapters = useMemo(
    () =>
      Array.from(
        new Set(
          (kjv as any[])
            .filter((verse) => verse.book === selectedBook)
            .map((verse) => verse.chapter)
        )
      ).sort((a, b) => a - b),
    [selectedBook]
  );
  const [selectedChapter, setSelectedChapter] = useState(chapters[0] || 1);

  useEffect(() => {
    if (chapters.length > 0 && !chapters.includes(selectedChapter)) {
      Promise.resolve().then(() => {
        setSelectedChapter(chapters[0]);
      });
    }
  }, [chapters, selectedChapter]);

  const greekVerseMap = useMemo(() => getGreekVerseMap(selectedBook, selectedChapter), [selectedBook, selectedChapter]);

  const chapterVerses = useMemo(
    () =>
      (kjv as any[])
        .filter((verse) => verse.book === selectedBook && verse.chapter === selectedChapter)
        .sort((a, b) => a.verse - b.verse),
    [selectedBook, selectedChapter]
  );

  return (
    <main className="page">
      <h1>Study</h1>
      <p>Study individual Bible passages with Greek text, literal translation, and translation analysis.</p>

      <div className="panel">
        <label>Book</label>
        <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}>
          {studyBooks.map((book) => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>

        <label>Chapter</label>
        <select value={selectedChapter} onChange={(e) => setSelectedChapter(Number(e.target.value))}>
          {chapters.map((ch) => (
            <option key={`${selectedBook}-${ch}`} value={ch}>{ch}</option>
          ))}
        </select>
      </div>

      <section>
        <h2>{selectedBook} {selectedChapter}</h2>

        {chapterVerses.map((verse) => {
          const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
          const greekText = greekVerseMap[verse.verse] || null;
          const notes = getTranslationNotes(reference, greekText || '', verse.text);

          return (
            <article className="card" key={`${verse.book}-${verse.chapter}-${verse.verse}`} style={{ marginBottom: 20 }}>
              <h3>{reference}</h3>

              <div style={{ marginBottom: 12 }}>
                <strong>KJV:</strong> {verse.text}
              </div>

              {greekText && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Greek:</strong> <span style={{ fontSize: 14 }}>{greekText}</span>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <strong>Translation Notes:</strong> {notes}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
