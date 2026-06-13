"use client";
import { useMemo, useState } from 'react';
import { bible } from '@/data/bible';

const themes = Array.from(
  new Set(
    bible.flatMap((verse) => (Array.isArray(verse.themes) ? verse.themes : []))
  )
);

export default function ExplorePage() {
  const [selectedTheme, setSelectedTheme] = useState(themes[0] || '');
  const related = useMemo(
    () =>
      bible.filter((verse) =>
        Array.isArray(verse.themes) ? verse.themes.includes(selectedTheme) : false
      ),
    [selectedTheme]
  );

  return (
    <main className="page">
      <h1>Visual Theme Explorer</h1>
      <p>Browse themes and see verses, cross-references, and original-language connections.</p>

      <div className="panel">
        <label>Theme</label>
        <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
          {themes.map((theme) => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </select>
      </div>

      <section className="grid">
        {related.map((verse) => (
          <div className="card" key={verse.id}>
            <h2>{verse.book} {verse.chapter}:{verse.verse}</h2>
            <p>{verse.text}</p>
            <p><strong>Greek:</strong> {verse.greek}</p>
            <p><strong>Cross refs:</strong> {Array.isArray(verse.crossRefs) ? verse.crossRefs.join(', ') : ''}</p>
          </div>
        ))}
      </section>
    </main>
  );
}