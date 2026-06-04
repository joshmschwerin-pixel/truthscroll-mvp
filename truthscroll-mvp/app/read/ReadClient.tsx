"use client";
import bible from '../../data/kjv.json';
import { useEffect, useMemo, useState } from 'react';
import getSupabaseClient from '@/lib/supabaseClient';

type NotesMap = Record<string, string>;
type HighlightsMap = Record<string, boolean>;

type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  themes?: string[];
  crossRefs?: string[];
};

const books = Array.from(new Set((bible as any[]).map((v) => v.book)));
const bookChapterMap = books.reduce((map: Record<string, number[]>, book) => {
  const chapters = Array.from(
    new Set(
      (bible as any[])
        .filter((v) => v.book === book)
        .map((v) => v.chapter)
    )
  ).sort((a, b) => a - b);
  map[book] = chapters;
  return map;
}, {} as Record<string, number[]>);

export default function ReadClient() {
  const [selectedBook, setSelectedBook] = useState(books[0] || 'John');
  const [selectedChapter, setSelectedChapter] = useState(bookChapterMap[books[0]]?.[0] || 1);
  const [notes, setNotes] = useState<NotesMap>({});
  const [highlighted, setHighlighted] = useState<HighlightsMap>({});
  const [activeNoteVerse, setActiveNoteVerse] = useState('');
  const [noteText, setNoteText] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastError, setLastError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loadingServerData, setLoadingServerData] = useState(false);

  const chapterOptions = bookChapterMap[selectedBook] || [1];

  const verses = useMemo(
    () =>
      (bible as any[]).filter(
        (v) => v.book === selectedBook && v.chapter === selectedChapter
      ) as BibleVerse[],
    [selectedBook, selectedChapter]
  );

  useEffect(() => {
    // Read query params and hash from the browser URL on client side
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const qb = params.get('book');
        const qc = Number(params.get('chapter') || '0') || undefined;
        if (qb && books.includes(qb)) {
          setSelectedBook(qb);
          setSelectedChapter(qc || bookChapterMap[qb]?.[0] || 1);
        }
      } catch (e) {
        // ignore
      }
    }

    if (typeof window === 'undefined') return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // Scroll to hash if present after render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedNotes = window.localStorage.getItem('truthscroll-notes');
    const savedHighlights = window.localStorage.getItem('truthscroll-highlights');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedHighlights) setHighlighted(JSON.parse(savedHighlights));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('truthscroll-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('truthscroll-highlights', JSON.stringify(highlighted));
  }, [highlighted]);

  useEffect(() => {
    const loadServerData = async () => {
      if (!session?.access_token) return;
      setLoadingServerData(true);
      setLastError('');

      try {
        const [notesRes, highlightsRes] = await Promise.all([
          fetch('/api/notes', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }),
          fetch('/api/highlights', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          })
        ]);

        const notesJson = await notesRes.json();
        const highlightsJson = await highlightsRes.json();

        if (!notesRes.ok) throw new Error(notesJson.error || 'Notes fetch failed');
        if (!highlightsRes.ok) throw new Error(highlightsJson.error || 'Highlights fetch failed');

        const serverNotes: NotesMap = {};
        (notesJson.notes || []).forEach((item: any) => {
          serverNotes[item.verse_id] = item.note;
        });

        const serverHighlights: HighlightsMap = {};
        (highlightsJson.highlights || []).forEach((item: any) => {
          serverHighlights[item.verse_id] = true;
        });

        setNotes((prev) => ({ ...prev, ...serverNotes }));
        setHighlighted((prev) => ({ ...prev, ...serverHighlights }));
      } catch (err: any) {
        setLastError(err.message || String(err));
      } finally {
        setLoadingServerData(false);
      }
    };

    loadServerData();
  }, [session]);

  const token = session?.access_token;

  const syncLocalToServer = async () => {
    setSyncStatus('syncing');
    setLastError('');
    if (!token) {
      setSyncStatus('error');
      setLastError('Sign in to sync notes and highlights.');
      return;
    }

    try {
      for (const [verseId, note] of Object.entries(notes)) {
        await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ verseId, note })
        });
      }

      for (const verseId of Object.keys(highlighted).filter((key) => highlighted[key])) {
        await fetch('/api/highlights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ verseId, color: 'yellow' })
        });
      }

      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Sync error', err);
      setSyncStatus('error');
      setLastError(err?.message || String(err));
    }
  };

  const saveNote = async (verseKey: string, note: string) => {
    setNotes((prev) => ({ ...prev, [verseKey]: note }));
    if (!token) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verseId: verseKey, note })
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to save note');
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Note save failed', err);
      setSyncStatus('error');
      setLastError(err?.message || String(err));
    }
  };

  const removeNote = async (verseKey: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[verseKey];
      return next;
    });
    if (!token) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verseId: verseKey })
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete note');
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Note delete failed', err);
      setSyncStatus('error');
      setLastError(err?.message || String(err));
    }
  };

  const toggleHighlight = async (verseKey: string, newValue: boolean) => {
    setHighlighted((prev) => ({ ...prev, [verseKey]: newValue }));
    if (!token) return;

    try {
      const res = await fetch('/api/highlights', {
        method: newValue ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verseId: verseKey, color: 'yellow' })
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update highlight');
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Highlight update failed', err);
      setSyncStatus('error');
      setLastError(err?.message || String(err));
    }
  };

  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Read Scripture</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Sync status: <strong>{syncStatus}</strong>
          </div>
          {lastError && <div style={{ color: '#ffb4b4' }}>{lastError}</div>}
          <div style={{ marginTop: 8 }}>
            <button onClick={syncLocalToServer}>Sync Now</button>
          </div>
        </div>
      </div>

      <p>Choose a public-domain passage, read the text, and see cross-reference highlights.</p>

      <div className="panel">
        <label>Book</label>
        <select
          value={selectedBook}
          onChange={(event) => {
            const book = event.target.value;
            setSelectedBook(book);
            setSelectedChapter(bookChapterMap[book]?.[0] || 1);
          }}
        >
          {books.map((book) => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>

        <label>Chapter</label>
        <select value={selectedChapter} onChange={(event) => setSelectedChapter(Number(event.target.value))}>
          {chapterOptions.map((chapter) => (
            <option key={`${selectedBook}-${chapter}`} value={chapter}>
              {chapter}
            </option>
          ))}
        </select>
      </div>

      <section className="card">
        <h2>{selectedBook} {selectedChapter}</h2>
        {loadingServerData && <p>Loading saved notes and highlights...</p>}
        {verses.map((verse) => {
          const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
          const anchorId = `verse-${verse.book}-${verse.chapter}-${verse.verse}`;
          return (
            <article id={anchorId} key={verseKey} className={`verse-card ${highlighted[verseKey] ? 'highlighted' : ''}`}>
              <div className="verse-header">
                <span className="verse-label">{verse.verse}</span>
                {Array.isArray(verse.themes) && verse.themes.length > 0 && (
                  <span className="verse-themes">{verse.themes.join(' • ')}</span>
                )}
              </div>
              <p>{verse.text}</p>
              <div className="verse-actions">
                <button type="button" onClick={() => toggleHighlight(verseKey, !highlighted[verseKey])}>
                  {highlighted[verseKey] ? 'Unhighlight' : 'Highlight'}
                </button>
                <button type="button" onClick={() => {
                  setActiveNoteVerse(verseKey);
                  setNoteText(notes[verseKey] || '');
                }}>
                  Note
                </button>
              </div>
              {Array.isArray(verse.crossRefs) && verse.crossRefs.length > 0 && (
                <div className="verse-meta">
                  <strong>Cross refs:</strong> {verse.crossRefs.join(', ')}
                </div>
              )}
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
              onClick={() => {
                saveNote(activeNoteVerse, noteText);
                setActiveNoteVerse('');
              }}
            >
              Save Note
            </button>
            <button type="button" onClick={() => setActiveNoteVerse('')} className="secondary">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                removeNote(activeNoteVerse);
                setActiveNoteVerse('');
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
