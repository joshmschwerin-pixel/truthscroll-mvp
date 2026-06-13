"use client";
import { bible } from "../../data/bible";
import { useEffect, useMemo, useState } from 'react';
import getSupabaseClient from '@/lib/supabaseClient';

const chapterOptions = [
  { book: 'John', chapter: 1 },
  { book: 'Matthew', chapter: 1 }
];

export default function ReadClient({ initialNotes = {}, initialHighlights = {} }: { initialNotes?: Record<string,string>, initialHighlights?: Record<string,boolean> }) {
  const [selectedChapter, setSelectedChapter] = useState(chapterOptions[0]);
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes || {});
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>(initialHighlights || {});
  const [activeNoteVerse, setActiveNoteVerse] = useState('');
  const [noteText, setNoteText] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle'|'syncing'|'synced'|'error'>('idle');
  const [lastError, setLastError] = useState<string>('');

  const verses = useMemo(
    () => bible.filter((v) => v.book === selectedChapter.book && v.chapter === selectedChapter.chapter),
    [selectedChapter]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedNotes = window.localStorage.getItem('truthscroll-notes');
    const savedHighlights = window.localStorage.getItem('truthscroll-highlights');
    if (!Object.keys(initialNotes || {}).length && savedNotes) setNotes(JSON.parse(savedNotes));
    if (!Object.keys(initialHighlights || {}).length && savedHighlights) setHighlighted(JSON.parse(savedHighlights));
  }, [initialHighlights, initialNotes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('truthscroll-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('truthscroll-highlights', JSON.stringify(highlighted));
  }, [highlighted]);

  useEffect(() => {
    if (!activeNoteVerse) {
      setNoteText('');
      return;
    }

    setNoteText(notes[activeNoteVerse] || '');
  }, [activeNoteVerse, notes]);

  async function syncLocalToServer() {
    setSyncStatus('syncing');
    setLastError('');
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const token = sessionData?.session?.access_token;
      if (!token) {
        setSyncStatus('error');
        setLastError('No session token');
        return;
      }

      for (const [verseId, note] of Object.entries(notes)) {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ verseId, note })
        });
      }

      for (const verseId of Object.keys(highlighted).filter((key) => highlighted[key])) {
        await fetch('/api/highlights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ verseId, color: 'yellow' })
        });
      }

      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Sync error', err);
      setSyncStatus('error');
      setLastError(err?.message || String(err));
    }
  }

  return (
    <main className="page">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Read Scripture</h1>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:12, color:'#94a3b8'}}>Sync status: <strong>{syncStatus}</strong></div>
          {lastError && <div style={{color:'#ffb4b4'}}>{lastError}</div>}
          <div style={{marginTop:8}}>
            <button onClick={syncLocalToServer}>Sync Now</button>
          </div>
        </div>
      </div>

      <p>Choose a public-domain passage, read the text, and see cross-reference highlights.</p>

      <div className="panel">
        <label>Passage</label>
        <select
          value={`${selectedChapter.book}-${selectedChapter.chapter}`}
          onChange={(event) => {
            const [book, chapter] = event.target.value.split('-');
            setSelectedChapter({ book, chapter: Number(chapter) });
          }}
        >
          {chapterOptions.map((option) => (
            <option key={`${option.book}-${option.chapter}`} value={`${option.book}-${option.chapter}`}>
              {option.book} {option.chapter}
            </option>
          ))}
        </select>
      </div>

      <section className="card">
        <h2>{selectedChapter.book} {selectedChapter.chapter}</h2>
        {verses.map((verse) => {
          const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
          const themesText = Array.isArray(verse.themes) ? verse.themes.join(' • ') : '';
          const crossRefsText = Array.isArray(verse.crossRefs) ? verse.crossRefs.join(', ') : '';

          return (
            <article key={verseKey} className={`verse-card ${highlighted[verseKey] ? 'highlighted' : ''}`}>
              <div className="verse-header">
                <span className="verse-label">{verse.verse}</span>
                <span className="verse-themes">{themesText}</span>
              </div>
              <p>{verse.text}</p>
              <div className="verse-actions">
                <button
                  type="button"
                  onClick={async () => {
                    const newValue = !highlighted[verseKey];
                    setHighlighted((prev) => ({ ...prev, [verseKey]: newValue }));

                    try {
                      const supabase = getSupabaseClient();
                      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
                      const token = sessionData?.session?.access_token;
                      if (token && newValue) {
                        const res = await fetch('/api/highlights', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ verseId: verseKey, color: 'yellow' })
                        });
                        if (!res.ok) throw new Error('Highlight save failed');
                      }
                      if (token && !newValue) {
                        const res = await fetch('/api/highlights', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ verseId: verseKey })
                        });
                        if (!res.ok) throw new Error('Highlight delete failed');
                      }
                      setSyncStatus('synced');
                    } catch (err: any) {
                      console.error('Highlight save failed', err);
                      setSyncStatus('error');
                      setLastError(err?.message || String(err));
                    }
                  }}
                >
                  {highlighted[verseKey] ? 'Unhighlight' : 'Highlight'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveNoteVerse(verseKey);
                  }}
                >
                  Note
                </button>
              </div>
              <div className="verse-meta">
                <strong>Cross refs:</strong> {crossRefsText}
              </div>
              {highlighted[verseKey] && <div className="highlight-pill">Highlighted</div>}
              {notes[verseKey] && <div className="note-pill">Note saved</div>}
            </article>
          );
        })}
      </section>

      {activeNoteVerse && (
        <section className="card note-panel">
          <h2>Note for {activeNoteVerse.replace(/-/g, ' ')}</h2>
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={6} />
          <div className="button-row">
            <button
              type="button"
              onClick={async () => {
                setNotes((prev) => ({ ...prev, [activeNoteVerse]: noteText }));
                setActiveNoteVerse('');

                try {
                  const supabase = getSupabaseClient();
                  const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
                  const token = sessionData?.session?.access_token;
                  if (token) {
                    const res = await fetch('/api/notes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ verseId: activeNoteVerse, note: noteText })
                    });
                    if (!res.ok) throw new Error('Note save failed');
                  }
                  setSyncStatus('synced');
                } catch (err: any) {
                  console.error('Note save failed', err);
                  setSyncStatus('error');
                  setLastError(err?.message || String(err));
                }
              }}
            >
              Save Note
            </button>
            <button
              type="button"
              onClick={() => setActiveNoteVerse('')}
              className="secondary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const supabase = getSupabaseClient();
                  const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
                  const token = sessionData?.session?.access_token;
                  if (token) {
                    const res = await fetch('/api/notes', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ verseId: activeNoteVerse })
                    });
                    if (!res.ok) throw new Error('Note delete failed');
                  }
                  setNotes((prev) => {
                    const copy = { ...prev };
                    delete copy[activeNoteVerse];
                    return copy;
                  });
                  setActiveNoteVerse('');
                  setSyncStatus('synced');
                } catch (err: any) {
                  console.error('Note delete failed', err);
                  setSyncStatus('error');
                  setLastError(err?.message || String(err));
                }
              }}
            >
              Delete Note
            </button>
          </div>
        </section>
      )}
    </main>
  );
}