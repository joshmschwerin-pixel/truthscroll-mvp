'use client';
import { useState } from 'react';

export default function AskPage() {
  const [question, setQuestion] = useState('Explain John 1:1 literally and theologically.');
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setAnswer(null);
    const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
    const data = await res.json();
    setAnswer(data.answer || { error: data.error || 'No answer returned.' });
    setLoading(false);
  }

  return (
    <main className="container">
      <h1>Ask</h1>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} />
      <button onClick={ask} disabled={loading}>{loading ? 'Studying...' : 'Ask TruthScroll'}</button>
      {answer && (
        <section className="card" style={{ marginTop: 16 }}>
          {typeof answer === 'string' && <pre>{answer}</pre>}
          {typeof answer === 'object' && !answer.error && (
            <div>
              <h2>Answer</h2>
              <p>{answer.plain}</p>

              <h3>Original language</h3>
              <p>{answer.original}</p>

              <h3>Cross references</h3>
              <ul>{(answer.crossRefs || []).map((r: string) => <li key={r}>{r}</li>)}</ul>

              <h3>Major views</h3>
              <ul>{(answer.views || []).map((v: string, i: number) => <li key={i}>{v}</li>)}</ul>

              <h3>Application</h3>
              <p>{answer.application}</p>

              <h4>Confidence</h4>
              <p>{typeof answer.confidence === 'number' ? answer.confidence.toFixed(2) : String(answer.confidence)}</p>
            </div>
          )}
          {answer.error && <pre>{answer.error}</pre>}
        </section>
      )}
    </main>
  );
}
