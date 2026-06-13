import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { bibleScholarSystemPrompt, verseStudyPrompt } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });

    // Dev mock: if no OpenAI key is configured, return a canned JSON response
    if (!process.env.OPENAI_API_KEY) {
      const mock = {
        plain: 'John 1:1 affirms the preexistent Word who is identified with God; literally it states the Word existed in the beginning and was both with God and was God.',
        original: 'Greek phrase Ἐν ἀρχῇ indicates temporal start; λόγος (logos) carries semantic range: word, reason, or divine self-expression.',
        crossRefs: ['Genesis 1:1', 'Colossians 1:16', 'Hebrews 1:2'],
        views: ['Traditional Trinitarian reading: identifies the Word with the second Person of the Trinity.', 'Functional/logical interpretation: Logos as God\'s agent or reason active in creation.'],
        application: 'Recognize the divine identity and creative role of Christ; reflect on the incarnation and worship.',
        confidence: 0.85
      };
      return NextResponse.json({ answer: mock });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: bibleScholarSystemPrompt },
        { role: 'user', content: verseStudyPrompt(question) }
      ]
    });

    const text = completion.choices[0]?.message?.content || '';
    // Try to parse JSON produced by the model. If parsing fails, return raw text.
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ answer: parsed });
    } catch (err) {
      return NextResponse.json({ answer: text });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI request failed.' }, { status: 500 });
  }
}
