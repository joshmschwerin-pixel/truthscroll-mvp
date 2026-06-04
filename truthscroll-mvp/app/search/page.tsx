"use client";
import { useState } from 'react';

type ResultVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  matchedEnglish?: string;
  original?: string;
  translit?: string;
  strong?: string;
  gloss?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('love');
  const [results, setResults] = useState<ResultVerse[]>([]);
  const [originals, setOriginals] = useState<any>({});
  const [alternates, setAlternates] = useState<any>({});
  const [interlinearAvailable, setInterlinearAvailable] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'searching' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function search() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setStatus('searching');
    setError('');
    setResults([]);
    setOriginals({});
    setAlternates({});

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed.');
        setStatus('error');
        return;
      }

      setInterlinearAvailable(Boolean(data.interlinearAvailable));
      setResults(data.results || []);
      setOriginals(data.originals || {});
      setAlternates(data.alternates || {});
      if (!data.interlinearAvailable && data.message) setError(data.message);
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
      <p>Search the public-domain Bible text by verse or book name. When an interlinear dataset is available, original-language mappings and alternate translations will appear.</p>

      <div className="panel" style={{ marginBottom: 24 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a word..."
          style={{ width: '100%', padding: '10px', fontSize: 16 }}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
        />
        <button onClick={search} style={{ marginTop: 12 }}>
          {status === 'searching' ? 'Searching…' : 'Search'}
        </button>
      </div>

      {status === 'error' && <div className="card" style={{ color: '#c92a2a' }}>{error}</div>}
      {status === 'done' && results.length === 0 && <div className="card">No results found.</div>}

      {status === 'done' && (
        <section>
          <h2>Search term: "{query}"</h2>

          <h3>A. Direct English Matches</h3>
          <section className="grid">
            {results.map((verse) => (
              <article className="card" key={`${verse.book}-${verse.chapter}-${verse.verse}`}>
                <h4><a href={verseLink(verse)}>{verse.book} {verse.chapter}:{verse.verse}</a></h4>
                <p dangerouslySetInnerHTML={{ __html: String(verse.text).replace(new RegExp(`(${query})`, 'ig'), '<mark>$1</mark>') }} />
                {verse.original && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Original:</strong> {verse.original} {verse.translit ? ` / ${verse.translit}` : ''} {verse.strong ? ` (Strong's ${verse.strong})` : ''} {verse.gloss ? ` — ${verse.gloss}` : ''}
                  </div>
                )}
              </article>
            ))}
          </section>

          <h3>B. Original-Language Word Groups</h3>
          {Object.keys(originals).length === 0 && <div className="card">No original-language groups available.</div>}
          {Object.entries(originals).map(([orig, info]: any) => (
            <section className="card" key={orig}>
              <h4>{orig} {info.translit ? ` / ${info.translit}` : ''} {info.strong ? ` (Strong's ${info.strong})` : ''}</h4>
              <div>{info.gloss}</div>
              <h5>English translations and references</h5>
              <ul>
                {info.translations.map((t: any) => (
                  <li key={t.eng}>
                    <strong>{t.eng}</strong>: {t.refs.join(', ')}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <h3>C. Alternate Translation Results</h3>
          {Object.entries(alternates).map(([orig, forms]: any) => (
            <section className="card" key={`alt-${orig}`}>
              <h4>{orig}</h4>
              <ul>
                {forms.map((f: any) => (
                  <li key={`${orig}-${f.eng}`}>
                    <strong>{f.eng}</strong>: {f.refs.map((r: string, i: number) => (
                      <span key={r}><a href={`/read?book=${encodeURIComponent(r.split(' ')[0])}&chapter=${r.split(' ')[1].split(':')[0]}#verse-${encodeURIComponent(r.split(' ')[0])}-${r.split(' ')[1].split(':')[0]}-${r.split(':')[1]}`}>{r}</a>{i < f.refs.length - 1 ? ', ' : ''}</span>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      )}
    </main>
  );
}
