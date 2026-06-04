import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { bibleScholarSystemPrompt, familyLessonPrompt } from '@/lib/prompts';

async function fetchVerseTextOnline(reference: string) {
  try {
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.text || '').trim() || null;
  } catch (e) {
    return null;
  }
}

function pickPassageForTopic(topic: string) {
  const t = (topic || '').toLowerCase();
  if (t.includes('love')) return '1 Corinthians 13:4-7';
  if (t.includes('faith')) return 'Hebrews 11:1';
  if (t.includes('grace')) return 'Ephesians 2:8-9';
  if (t.includes('fear') || t.includes('afraid')) return 'Psalm 56:3';
  if (t.includes('forgiveness')) return 'Matthew 18:21-22';
  if (t.includes('identity') || t.includes('who am i')) return 'Galatians 2:20';
  return 'Psalm 23:1';
}

async function generateLessonMock(topic: string, age: string) {
  const passage = pickPassageForTopic(topic);
  const passageText = (await fetchVerseTextOnline(passage)) || '';

  const lesson = {
    title: `Family lesson: ${topic} — age ${age}`,
    openingQuestion: `When have you felt ${topic} and what did you do?`,
    passageRef: passage,
    passageText,
    explanation: `Explain ${passage} in age-appropriate language: ${topic} is addressed here because... (tailor for ${age}). Provide 2-3 clear points that caregivers can expand on.`,
    memoryVerse: passage,
    activity: [
      'Read the passage aloud together.',
      'Ask the opening question and let each person answer briefly.',
      'Do a short role-play or drawing activity that practices the passage idea.'
    ],
    prayer: `Short family prayer asking God to help you live out ${topic}.`,
    parentNotes: `Tips for parents: keep explanations simple, ask follow-up questions, model the behavior, and pray together. Adapt examples to ${age}.`,
    materials: ['Bible (or Bible app)', 'paper and crayons', 'quiet place'],
    durationMinutes: 20,
    ageRange: age
  };

  return lesson;
}

function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY?.trim() || '';
  return key !== '' && !key.toLowerCase().includes('your_openai_api_key') && key.length > 20;
}

export async function POST(req: Request) {
  try {
    const { topic, age } = await req.json();
    if (!topic || !age) return NextResponse.json({ error: 'Topic and age are required.' }, { status: 400 });

    // Dev/mock fallback when OpenAI key is not configured
    if (!hasOpenAIKey()) {
      const lesson = await generateLessonMock(topic, age);
      return NextResponse.json({ lesson });
    }

    // Ask the model to return a JSON object with a clear schema
    const userPrompt = `${familyLessonPrompt(topic, age)}\n\nReturn a single valid JSON object with the keys: title, openingQuestion, passageRef, passageText, explanation, memoryVerse, activity (array of strings), prayer, parentNotes, materials (array), durationMinutes (number), ageRange. Do not include extra commentary or markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: bibleScholarSystemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const text = completion.choices[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ lesson: parsed });
    } catch (err) {
      // If model didn't return JSON, fall back to a server-generated lesson
      const lesson = await generateLessonMock(topic, age);
      return NextResponse.json({ lesson });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lesson generation failed.' }, { status: 500 });
  }
}
