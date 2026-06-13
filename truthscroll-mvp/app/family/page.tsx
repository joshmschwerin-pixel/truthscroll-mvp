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
          <p><strong>Age range:</strong> {lesson.ageRange}</p>

          <h3>Opening question</h3>
          <p><em>{lesson.openingQuestion}</em></p>

          <h3>Scripture passage</h3>
          <p><strong>{lesson.passageRef}</strong></p>
          {lesson.passageText && (
            <div style={{ marginTop: 8, padding: 12, borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#f9f9f9', lineHeight: 1.7, fontSize: 14 }}>
              {lesson.passageText}
            </div>
          )}

          <h3>Explanation</h3>
          <p>{lesson.explanation}</p>

          {Array.isArray(lesson.discussionQuestions) && lesson.discussionQuestions.length > 0 && (
            <>
              <h3>Discussion questions</h3>
              <ul>
                {lesson.discussionQuestions.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}

          <h3>Activity</h3>
          <p>{typeof lesson.activity === 'string' ? lesson.activity : Array.isArray(lesson.activity) ? lesson.activity.join(' ') : ''}</p>

          <h3>Memory verse</h3>
          <p><strong>{lesson.memoryVerse}</strong></p>

          <h3>Prayer</h3>
          <p><em>{lesson.prayer}</em></p>

          <h3>Parent teaching notes</h3>
          <p>{lesson.parentNotes}</p>

          <h3>Materials needed</h3>
          <p>{Array.isArray(lesson.materials) ? lesson.materials.join(', ') : ''}</p>

          <p style={{ marginTop: 16 }}>
            <strong>Duration:</strong> {lesson.durationMinutes} minutes
          </p>
        </section>
      )}
    </main>
  );
}