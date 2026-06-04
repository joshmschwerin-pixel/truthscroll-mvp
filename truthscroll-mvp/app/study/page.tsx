"use client";
import { useEffect, useMemo, useState } from 'react';
import kjv from '@/data/kjv.json';
import greekData from '@/data/greek_nt.json';
import greekSamples from '@/data/greekSamples.json';

const strongTranslations: Record<string, { weak: string; strong: string; explanation: string }> = {
  'δίκαιος': {
    weak: 'righteous',
    strong: 'righteous/just',
    explanation: 'Defining moral posture and covenant obedience, not just a passive declaration.'
  },
  'λόγος': {
    weak: 'Word',
    strong: 'Word/divine expression',
    explanation: 'Points to Jesus as God’s living self-expression, not merely spoken language.'
  },
  'ἀγάπη': {
    weak: 'love',
    strong: 'love/covenant loyalty',
    explanation: 'A committed love that reflects God’s faithful character rather than mere feeling.'
  },
  'χάρις': {
    weak: 'grace',
    strong: 'grace/favor',
    explanation: 'God’s active kindness and unearned gift, not only an abstract concept.'
  },
  'πνεῦμα': {
    weak: 'Spirit',
    strong: 'Spirit/breath',
    explanation: 'The life-giving presence of God, not just an abstract force.'
  },
  'χριστός': {
    weak: 'Christ',
    strong: 'Christ/Messiah',
    explanation: 'Names Jesus as the promised anointed King and Savior.'
  },
  'σωτήρ': {
    weak: 'Savior',
    strong: 'Savior/deliverer',
    explanation: 'Emphasizes rescue from sin and restoration of relationship with God.'
  }
};

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

function matchStrongTranslation(greekText: string) {
  for (const term of Object.keys(strongTranslations)) {
    if (greekText.includes(term)) {
      const entry = strongTranslations[term];
      return `Strong: ${term} = ${entry.strong}; ${entry.explanation}`;
    }
  }
  return '';
}

function translateGreekText(greekText: string) {
  if (!greekText || greekText === 'Greek text not available') {
    return 'Greek translation is not available for this verse.';
  }

  let translation = greekText;
  const replacements: Record<string, string> = {
    'ὁ λόγος': 'the Word/divine expression',
    'λόγος': 'Word/divine expression',
    'ἀγάπη': 'love/covenant loyalty',
    'χάρις': 'grace/favor',
    'πνεῦμα': 'Spirit/breath',
    'χριστός': 'Christ/Messiah',
    'σωτήρ': 'Savior/deliverer',
    'δίκαιος': 'righteous/just'
  };

  for (const [term, replacement] of Object.entries(replacements)) {
    if (translation.includes(term)) {
      translation = translation.replace(new RegExp(term, 'g'), replacement);
    }
  }

  if (translation !== greekText) {
    return `Strong translation sense: ${translation}`;
  }

  if (/ὁ λόγος/.test(greekText)) {
    return 'The Greek phrase “ὁ λόγος” renders best as “the Word/divine expression.”';
  }

  return 'A strong translation would preserve the Greek nuance more than the KJV wording; exact wording is not yet mapped for this verse.';
}

function describeTranslationDifference(reference: string, greekText: string, kjvText: string) {
  if (sampleNotes[reference]) {
    return sampleNotes[reference];
  }

  if (!greekText || greekText === 'Greek text not available') {
    return 'Greek source text is not available for this verse, so the note is based on the KJV wording alone. When Greek data is present, this section will compare the original phrase to the KJV rendering and explain how it affects meaning.';
  }

  const notes: string[] = [];
  const impacts: string[] = [];

  const comparisons = [
    {
      term: 'ὁ λόγος',
      label: 'ὁ λόγος',
      kjv: 'Word',
      strong: 'Word/divine expression',
      explanation: 'This Greek phrase presents Christ as the timeless divine self-expression, not merely a spoken term.',
      impact: 'Understanding Jesus as the eternal divine expression deepens the doctrine of his preexistence and active role in creation.'
    },
    {
      term: 'λόγος',
      label: 'λόγος',
      kjv: 'Word',
      strong: 'Word/divine reason',
      explanation: 'The Greek term can mean reason, message, and divine expression together, which is richer than the English noun alone.',
      impact: 'It encourages readers to see Jesus not only as a title but as God’s active, rational presence in the world.'
    },
    {
      term: 'ἀγάπη',
      label: 'ἀγάπη',
      kjv: 'love',
      strong: 'love/covenant loyalty',
      explanation: 'This word points to faithful, committed love rather than a simple emotional affection.',
      impact: 'This shifts understanding toward lasting, covenantal devotion instead of only sentimental feeling.'
    },
    {
      term: 'χάρις',
      label: 'χάρις',
      kjv: 'grace',
      strong: 'grace/favor',
      explanation: 'The Greek term emphasizes God’s active gift and kindness, not just a passive state.',
      impact: 'It makes the gospel feel more like an offered rescue from God’s initiative than a vague blessing.'
    },
    {
      term: 'πνεῦμα',
      label: 'πνεῦμα',
      kjv: 'Spirit',
      strong: 'Spirit/breath',
      explanation: 'This word can mean spirit, breath, or life-force, highlighting the living presence of God.',
      impact: 'It helps readers grasp the Spirit as life-giving presence rather than an abstract force.'
    },
    {
      term: 'χριστός',
      label: 'χριστός',
      kjv: 'Christ',
      strong: 'Christ/Messiah',
      explanation: 'The Greek term names Jesus as the promised anointed Savior and King.',
      impact: 'It reinforces the expectation of fulfillment and God’s covenant promise rather than a mere personal name.'
    },
    {
      term: 'σωτήρ',
      label: 'σωτήρ',
      kjv: 'Savior',
      strong: 'Savior/deliverer',
      explanation: 'The word carries the sense of rescue and deliverance from danger or sin.',
      impact: 'It emphasizes salvation as deliverance and restoration, not just forgiveness in abstraction.'
    },
    {
      term: 'δίκαιος',
      label: 'δίκαιος',
      kjv: 'righteous',
      strong: 'righteous/just',
      explanation: 'The Greek term often includes covenant faithfulness and upright living.',
      impact: 'It can deepen understanding of righteousness as relational obedience, not merely legal correctness.'
    }
  ];

  for (const comparison of comparisons) {
    if (greekText.includes(comparison.term)) {
      notes.push(`Greek ${comparison.label} often means ${comparison.strong}. The KJV renders this as ${comparison.kjv}. ${comparison.explanation}`);
      impacts.push(comparison.impact);
    }
  }

  if (notes.length > 0) {
    return `${notes.join(' ')} ${impacts.join(' ')}`;
  }

  if (/righteous|just|love|grace|spirit|savior|messiah/i.test(kjvText)) {
    return `The KJV wording uses familiar English terms, while the Greek phrase ${greekText} can carry more specific theological nuance. This difference may influence readers by making the English appear broader or less precise than the original.`;
  }

  return `Greek text: ${greekText}. KJV text: "${kjvText}". The Greek is often more compact and precise, and the KJV may expand it for readability. This can impact understanding by shifting emphasis from the original nuance to a smoother English phrasing.`;
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
      setSelectedChapter(chapters[0]);
    }
  }, [chapters, selectedChapter]);

  const greekVerseMap = useMemo(() => getGreekVerseMap(selectedBook, selectedChapter), [selectedBook, selectedChapter]);

  const chapterVerses = useMemo(
    () =>
      (kjv as any[])
        .filter((verse) => verse.book === selectedBook && verse.chapter === selectedChapter)
        .sort((a, b) => a.verse - b.verse)
        .map((verse) => {
          const greekText = greekVerseMap[verse.verse] || 'Greek text not available';
          return {
            ...verse,
            greekText,
            greekTranslation: translateGreekText(greekText),
            note: describeTranslationDifference(
              `${verse.book} ${verse.chapter}:${verse.verse}`,
              greekText,
              verse.text
            )
          };
        }),
    [selectedBook, selectedChapter, greekVerseMap]
  );

  return (
    <main className="page">
      <h1>Study: All Books with Greek translation insight</h1>
      <p>Choose any Bible book and chapter. The study view shows the KJV text, Greek wording when available, and stronger translation notes to help you know God and Jesus more clearly.</p>

      <div className="panel" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        <div>
          <label>Book</label>
          <select value={selectedBook} onChange={(event) => setSelectedBook(event.target.value)}>
            {studyBooks.map((book) => (
              <option key={book} value={book}>{book}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Chapter</label>
          <select value={selectedChapter} onChange={(event) => setSelectedChapter(Number(event.target.value))}>
            {chapters.map((chapter) => (
              <option key={`${selectedBook}-${chapter}`} value={chapter}>{chapter}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2>Strong translation examples</h2>
        <ul>
          {Object.entries(strongTranslations).map(([term, info]) => (
            <li key={term}>
              <strong>{term}</strong>: Weak = {info.weak} ; Strong = {info.strong} — {info.explanation}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid">
        {chapterVerses.map((verse) => (
          <article className="card" key={`${verse.book}-${verse.chapter}-${verse.verse}`}>
            <h3>{verse.book} {verse.chapter}:{verse.verse}</h3>
            <p><strong>KJV:</strong> {verse.text}</p>
            <p><strong>Greek:</strong> {verse.greekText}</p>
            <p><strong>Greek translation:</strong> {verse.greekTranslation}</p>
            <p><strong>Translation note:</strong> {verse.note}</p>
          </article>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>Why this matters</h2>
        <p>
          Studying original-language nuance helps us see how the Bible presents Jesus, God, and Christian life with greater precision. Stronger translation notes point to God-centered meaning rather than only literal English wording.
        </p>
      </section>
    </main>
  );
}
