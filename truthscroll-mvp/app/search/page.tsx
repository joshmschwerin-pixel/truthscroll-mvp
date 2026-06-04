"use client";
import { useState } from 'react';

type ResultVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  matchedEnglish?: string;
  greek?: string;
  translit?: string;
  gloss?: string;
  alternates?: string[];
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultVerse[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setStatus('searching');
    setError('');
    setResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed.');
        setStatus('error');
        return;
      }

      setResults(data.results || []);
      setStatus('done');
    } catch (err: any) {
      setError(err?.message || 'Search failed.');
      setStatus('error');
    }
  }

  function verseLink(v: ResultVerse) {
    return `/read?book=${encodeURIComponent(v.book)}&chapter=${v.chapter}#verse-${encodeURIComponent(v.book)}-${v.chapter}-${v.verse}`;
  }

  return (
    <main className="page">
      <h1>Bible Search</h1>
      <p>Search the Bible by word or phrase. Results show KJV text with Greek original language information when available.</p>

      <div className="panel" style={{ marginBottom: 24 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a word or phrase..."
          style={{ width: '100%', padding: '10px', fontSize: 16 }}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
        />
        <button onClick={search} style={{ marginTop: 12 }} disabled={status === 'searching'}>
          {status === 'searching' ? 'Searching…' : 'Search'}
        </button>
      </div>

      {status === 'error' && <div className="card" style={{ color: '#c92a2a' }}>{error}</div>}
      {status === 'done' && results.length === 0 && <div className="card">No results found for &quot;{query}&quot;.</div>}

      {status === 'done' && results.length > 0 && (
        <section>
          <h2>Results for &quot;{query}&quot; ({results.length} verses)</h2>

          <section className="grid">
            {results.map((verse) => (
              <article className="card" key={`${verse.book}-${verse.chapter}-${verse.verse}`}>
                <h4><a href={verseLink(verse)}>{verse.book} {verse.chapter}:{verse.verse}</a></h4>
                <p style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: String(verse.text).replace(new RegExp(`(${query})`, 'ig'), '<mark>$1</mark>') }} />
                
                {verse.greek && (
                  <div style={{ marginTop: 12, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Greek:</strong> {verse.greek}
                    </div>
                    {verse.translit && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>Transliteration:</strong> {verse.translit}
                      </div>
                    )}
                    {verse.gloss && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>Literal translation:</strong> {verse.gloss}
                      </div>
                    )}
                    {verse.alternates && verse.alternates.length > 0 && (
                      <div>
                        <strong>Alternate renderings:</strong>
                        <ul>
                          {verse.alternates.map((alt, i) => (
                            <li key={i}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </section>
        </section>
      )}

      {status === 'idle' && <div className="card">Enter a search term and click Search to begin.</div>}
    </main>
  );
}
