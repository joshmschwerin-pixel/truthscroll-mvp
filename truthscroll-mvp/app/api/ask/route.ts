import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { bibleScholarSystemPrompt, verseStudyPrompt } from '@/lib/prompts';

function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY?.trim() || '';
  return key !== '' && !key.toLowerCase().includes('your_openai_api_key') && key.length > 20;
}

function buildMockAnswer(question: string) {
  const lowerQuestion = question.toLowerCase();
  const verseMatch = question.match(/([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?/);
  const topicMatch = question.match(/(?:about|regarding|on|why|what|how|explain)\s+(.+)$/i);

  const target = verseMatch ? verseMatch[0] : topicMatch ? topicMatch[1].trim() : question.trim();
  const verseRef = verseMatch
    ? `${verseMatch[1].trim()} ${verseMatch[2]}:${verseMatch[3]}${verseMatch[4] ? `-${verseMatch[4]}` : ''}`
    : '';
  const theme = lowerQuestion.includes('love')
    ? 'love'
    : lowerQuestion.includes('faith')
    ? 'faith'
    : lowerQuestion.includes('grace')
    ? 'grace'
    : lowerQuestion.includes('truth')
    ? 'truth'
    : lowerQuestion.includes('hope')
    ? 'hope'
    : 'the passage';

  const plain = verseMatch
    ? `For ${verseRef}, the strongest answer is that the passage anchors ${theme} in the person and work of Christ, not in abstract ideas.`
    : `Your question about “${target}” points to how scripture wants the Christian body to live ${theme} in real relationships, not just as doctrine.`;

  const original = verseMatch
    ? `In the original Greek, the language around ${theme} is precise and often richer than a single English translation, which is why ${verseRef} calls readers to respond in both belief and practice.`
    : `A closer reading of the original language would show how the phrase “${target}” carries nuance that shapes the way we apply ${theme} to our daily lives.`;

  const crossRefs = verseMatch
    ? [verseRef, 'John 3:16', 'Romans 12:9', 'Hebrews 4:12']
    : ['John 1:14', 'Romans 12:9', 'Hebrews 4:12'];

  const views: string[] = [];
  if (verseMatch) {
    views.push(`Orthodox doctrinal view: ${verseRef} is read by the church as a statement about God’s character and the gospel truth that the body of Christ unites around.`);
    views.push(`Evangelical discipleship view: the passage calls believers to trust ${theme} in everyday choices, so it becomes a decision point for personal faith and obedience.`);
    views.push(`Communal church view: believers should use ${verseRef} as a shared guide for how the Christian body reflects ${theme} together through worship, service, and witness.`);

    if (/john\s*1:1/i.test(question)) {
      views[0] = 'Orthodox doctrinal view: John 1:1 affirms that the Word existed before creation and is fully God, so the church reads this as the foundation of Christ-centered worship.';
      views[1] = 'Evangelical discipleship view: this verse calls believers to let Christ be their starting point for truth and identity, not just a moral example.';
      views[2] = 'Communal church view: the body of Christ shares this verse as a reminder that the same Word who was with God is now present among us through the church and its witness.';
    }

    if (/romans\s*5:1/i.test(question)) {
      views[0] = 'Orthodox doctrinal view: Romans 5:1 teaches justification by faith, so the church affirms that our right standing before God is a gift, not a reward.';
      views[1] = 'Evangelical discipleship view: it urges believers to live from peace with God instead of striving under guilt.';
      views[2] = 'Communal church view: the Christian body is called to encourage one another around the peace that comes through faith, not performance.';
    }

    if (/john\s*3:16/i.test(question)) {
      views[0] = 'Orthodox doctrinal view: John 3:16 centers the gospel on God’s giving of his Son and promises eternal life through belief.';
      views[1] = 'Evangelical discipleship view: it calls believers to trust God’s love and to share that message with others.';
      views[2] = 'Communal church view: the body of Christ is called to demonstrate God’s love publicly, reflecting the gospel to those around them.';
    }
  } else {
    views.push(`Scripture-centered view: this question is answered by returning to the Bible’s teaching and asking how ${theme} is rooted in scripture rather than personal opinion.`);
    views.push(`Discipleship view: the Christian body uses the answer to shape one concrete habit or attitude, not merely to know a truth.`);
    views.push(`Community witness view: the body of Christ applies this answer together, using it to build stronger relationships and shared mission.`);

    if (lowerQuestion.includes('faith')) {
      views[0] = 'Scripture-centered view: faith is understood as trust in God’s promises and the work of Christ, not a checklist of good deeds.';
      views[1] = 'Discipleship view: the church uses this truth to encourage one another to live out trust in hard places.';
      views[2] = 'Community witness view: faith is shown in acts of service and in how the Christian body supports one another.';
    }

    if (lowerQuestion.includes('love')) {
      views[0] = 'Scripture-centered view: love is the defining command of Jesus and the mark of his followers.';
      views[1] = 'Discipleship view: the church uses this understanding to make love a practical pattern in relationships, especially with the vulnerable.';
      views[2] = 'Community witness view: love becomes the way the body of Christ shows the gospel to neighbors and the broader world.';
    }
  }

  const application = verseMatch
    ? `Apply ${verseRef} by choosing one concrete response: identify the key idea the verse makes about ${theme}, then ask how it changes one decision today—your prayer, the way you speak to someone, or how you serve. For the Christian body, that means letting the passage shape both your personal faith and the way you encourage others.`
    : `Apply this question by naming one practical response to ${theme}: what specific change will you make in your attitude, conversation, or actions this week because of the passage? Then use that choice to strengthen your own faith and to bless someone else in the body of Christ.`;

  return {
    plain,
    original,
    crossRefs,
    views,
    application,
    confidence: 0.6
  };
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ error: 'Question is required.' }, { status: 400 });

    // Dev mock: if no OpenAI key is configured, return a question-specific mock response
    if (!hasOpenAIKey()) {
      return NextResponse.json({ answer: buildMockAnswer(question) });
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json({ answer: buildMockAnswer(question) });
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
