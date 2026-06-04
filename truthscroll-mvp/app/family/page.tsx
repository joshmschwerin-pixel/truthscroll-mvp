'use client';
import { useState } from 'react';

export default function FamilyPage() {
  const [topic, setTopic] = useState('faith when afraid');
  const [age, setAge] = useState('8-12');
  const [lesson, setLesson] = useState<any>(null);

  async function generate() {
    const res = await fetch('/api/family', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ topic, age }) });
    const data = await res.json();
    setLesson(data.lesson || data.error);
  }

  return (
    <main className="container">
      <h1>Family Discipleship</h1>
      <label>Topic</label><input value={topic} onChange={(e) => setTopic(e.target.value)} />
      <label>Age range</label><input value={age} onChange={(e) => setAge(e.target.value)} />
      <button onClick={generate}>Generate Lesson</button>
      {lesson && typeof lesson === 'string' && <pre>{lesson}</pre>}
      {lesson && typeof lesson === 'object' && !lesson.error && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>{lesson.title}</h2>
          <p><strong>Age:</strong> {lesson.ageRange}</p>
          <h3>Opening question</h3>
          <p>{lesson.openingQuestion}</p>
          <h3>Passage</h3>
          <p><strong>{lesson.passageRef}</strong></p>
          {lesson.passageText && <div style={{ whiteSpace: 'pre-wrap', marginTop: 8, padding: 8, border: '1px solid #eee' }}>{lesson.passageText}</div>}
          <h3>Explanation</h3>
          <p>{lesson.explanation}</p>
          <h3>Memory verse</h3>
          <p>{lesson.memoryVerse}</p>
          <h3>Activity</h3>
          <ul>{(lesson.activity || []).map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
          <h3>Prayer</h3>
          <p>{lesson.prayer}</p>
          <h3>Parent notes</h3>
          <p>{lesson.parentNotes}</p>
          <h4>Materials</h4>
          <p>{(lesson.materials || []).join(', ')}</p>
          <p><strong>Duration:</strong> {lesson.durationMinutes} minutes</p>
        </section>
      )}
    </main>
  );
}
