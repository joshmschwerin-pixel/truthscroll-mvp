import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
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
  
  // Parse age group
  const ageNum = parseInt(age.split('-')[0]) || 8;
  const ageGroup = ageNum <= 5 ? 'toddler' : ageNum <= 8 ? 'early' : ageNum <= 12 ? 'middle' : 'teen';

  let title = '';
  let openingQuestion = '';
  let explanation = '';
  let discussionQuestions: string[] = [];
  let activity = '';
  let prayer = '';
  let parentNotes = '';

  // Age 3-5 content: very simple, concrete, very short
  if (ageGroup === 'toddler') {
    title = `Jesus loves me: ${topic}`;
    openingQuestion = `Do you know that Jesus loves you very much? What makes you feel happy?`;
    explanation = `Jesus loves us so much! Even when we feel sad or scared, Jesus is with us. He helps us and keeps us safe. We can talk to Jesus and ask Him to help us every day.`;
    discussionQuestions = [
      'How do you feel when someone loves you?',
      'What is Jesus\'s name?',
      'Can you ask Jesus to help you?'
    ];
    activity = `Make a simple drawing of something Jesus loves (a flower, a puppy, a heart). Talk about how Jesus loves all of it.`;
    prayer = `Dear Jesus, thank you for loving me. Help me feel your love today. Amen.`;
    parentNotes = `Keep it very simple. Use concrete words. Sing or show pictures. Let them draw or play while you talk. Your calm, loving presence teaches them about God's love. Repeat these ideas often—toddlers learn through repetition.`;
  }
  // Age 6-8 content: simple with short examples
  else if (ageGroup === 'early') {
    title = `Learning about ${topic} from the Bible`;
    openingQuestion = `Have you ever ${topic.includes('afraid') ? 'felt scared' : topic.includes('love') ? 'shown someone you care about them' : 'needed help'}? Today we\'re learning what the Bible says about ${topic}.`;
    explanation = `The Bible teaches us about ${topic}. In ${passage}, God shows us that ${topic.includes('faith') ? 'we can trust Jesus even when things are hard' : topic.includes('love') ? 'real love means caring about others and showing it through our actions' : topic.includes('afraid') ? 'Jesus is with us and we don\'t have to be scared alone' : 'God loves us and wants to help us'}. We can learn this by reading the Bible together and talking about what it means.`;
    discussionQuestions = [
      `What does ${topic} mean to you?`,
      `How does Jesus show ${topic}?`,
      `When might you need to remember this lesson?`
    ];
    activity = `Act out a simple scene showing ${topic} (for example, if the topic is helping, act out helping a friend pick up toys, or if it's kindness, act out sharing a snack). Talk about how Jesus wants us to act this way.`;
    prayer = `Jesus, help me to understand about ${topic}. Show me how to ${topic.includes('love') ? 'love others' : topic.includes('faith') ? 'trust you' : 'feel brave with you'}. Amen.`;
    parentNotes = `Use short sentences. Give simple, real-life examples your child understands. Let them ask questions. Practice the lesson during the week—when a teaching moment comes up, remind them of the Bible story.`;
  }
  // Age 9-12 content: deeper questions, real-life application
  else if (ageGroup === 'middle') {
    title = `Understanding ${topic} — a Bible study for kids`;
    openingQuestion = `Think of a time when you had to ${topic.includes('faith') ? 'trust someone even though you were worried' : topic.includes('love') ? 'do something kind even though it was hard' : topic.includes('afraid') ? 'feel afraid or worried' : 'help someone'}. What happened? That's what we\'re exploring today.`;
    explanation = `${passage} teaches us about ${topic}. The passage shows that ${topic.includes('faith') ? 'faith means trusting God\'s promises even when we can\'t see how things will work out. Real faith changes how we act and what we do' : topic.includes('love') ? 'love isn\'t just a feeling—it\'s a choice to care about someone else\'s good, even when it\'s hard or when they don\'t deserve it' : topic.includes('afraid') ? 'fear is normal, but we don\'t have to let it control us. God\'s presence and His promises give us courage' : 'God is with us and cares about what we\'re going through. We can trust Him and ask Him for help'}. This changes how we live.`;
    discussionQuestions = [
      `Why do you think the Bible teaches about ${topic}?`,
      `How is ${topic} different from what our culture says about it?`,
      `Can you think of someone who shows real ${topic}? What do they do?`,
      `What would change if you really believed this?`
    ];
    activity = `Create a poster or write a short story about ${topic}. Show a situation where someone faces ${topic} and show how they could respond based on what the Bible teaches. Present it to your family.`;
    prayer = `God, I want to really understand and live out ${topic}. Help me when this is hard. Give me courage to follow Jesus even when it's not easy. Amen.`;
    parentNotes = `Ask follow-up questions that make them think: "Why do you think that?" and "What would happen if...?" Help them see how the Bible's teaching differs from what they hear from friends or media. Share a real story from your own life where you learned this lesson. Encourage them to practice during the week and report back.`;
  }
  // Teen content: identity, faith, choices, pressure, obedience
  else {
    title = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Living it out as a young Christian`;
    openingQuestion = `${topic.includes('identity') ? 'Who do you think you are? Who does Jesus say you are?' : topic.includes('pressure') ? 'What kind of pressure are you facing right now from friends, school, or social media?' : topic.includes('obedience') ? 'When is obedience hard for you? Why?' : 'How is your understanding of ' + topic + ' being challenged or shaped right now?'} We\'re going to explore what the Bible really says.`;
    explanation = `In ${passage}, we see that ${topic.includes('identity') ? 'your deepest identity isn\'t based on grades, looks, popularity, or what others think. Jesus defines who you are: loved, chosen, redeemed, called to purpose. This identity is the foundation for everything else' : topic.includes('pressure') ? 'pressure to compromise is real. Friends, culture, and circumstances push you to choose comfort over conviction. But Jesus calls you to stand firm on what\'s true, even when it costs' : topic.includes('obedience') ? 'obedience isn\'t about blind rule-following. It\'s about trust. Jesus asks you to obey because He loves you and knows what\'s best. Obedience is an act of worship' : 'the Bible speaks directly to your situation. God\'s word is relevant, powerful, and life-giving. It calls you not just to believe but to live it out'}. This is countercultural. This requires courage and faith.`;
    discussionQuestions = [
      `What's one way the Bible's teaching on ${topic} contradicts what you see around you?`,
      `Why is this hard? What would it cost you to live this out fully?`,
      `Who do you know who\'s living this out? What do you admire about them?`,
      `What's one specific way you\'re going to practice this this week?`,
      `What support or accountability do you need?`
    ];
    activity = `Write a personal reflection or create a video where you explain ${topic} to a friend your age using the Bible and your own words. Or identify one concrete way you\'re going to live this out this week and report back to your parent how it went.`;
    prayer = `Jesus, this is hard. ${topic.includes('pressure') ? 'Give me courage to stand firm even when my friends don\'t understand' : topic.includes('obedience') ? 'Help me trust you even when obedience feels restrictive' : 'Help me believe and live out what you\'re teaching me'}. Shape my values and choices. I want to follow you fully. Amen.`;
    parentNotes = `Treat your teen as someone capable of serious spiritual thought. Don\'t just tell them what to believe—ask them what they think. Listen to their doubts and questions. Share how you\'ve struggled with this and what you\'ve learned. Be honest about the cost of following Jesus. Offer specific support and accountability. Model the faith you\'re asking them to develop. Pray with them and for them.`;
  }

  return {
    title,
    ageRange: age,
    openingQuestion,
    passageRef: passage,
    passageText,
    explanation,
    discussionQuestions,
    activity,
    prayer,
    parentNotes,
    memoryVerse: passage,
    materials: ageGroup === 'toddler' 
      ? ['Bible storybook or picture', 'paper and crayons', 'stuffed animals']
      : ageGroup === 'early'
      ? ['Bible', 'paper', 'crayons or markers', 'optional: props for acting']
      : ageGroup === 'middle'
      ? ['Bible', 'notebook or paper', 'markers or art supplies', 'optional: device for research']
      : ['Bible', 'journal', 'optional: online resources or commentary'],
    durationMinutes: ageGroup === 'toddler' ? 15 : ageGroup === 'early' ? 20 : ageGroup === 'middle' ? 30 : 45
  };
}

function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY?.trim() || '';
  return key !== '' && !key.toLowerCase().includes('your_openai_api_key') && key.length > 20;
}

export async function POST(req: Request) {
  try {
    const { topic, age } = await req.json();
    if (!topic || !age) {
      return NextResponse.json({ error: 'Topic and age are required.' }, { status: 400 });
    }

    if (!hasOpenAIKey()) {
      const lesson = await generateLessonMock(topic, age);
      return NextResponse.json({ lesson });
    }

    const openai = getOpenAI();
    if (!openai) {
      const lesson = await generateLessonMock(topic, age);
      return NextResponse.json({ lesson });
    }

    const userPrompt = `${familyLessonPrompt(topic, age)}\n\nReturn a single valid JSON object with the keys: title, openingQuestion, passageRef, passageText, explanation, memoryVerse, activity (array of strings), prayer, parentNotes, materials (array), durationMinutes (number), ageRange. Do not include extra commentary or markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: bibleScholarSystemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({ lesson: parsed });
    } catch {
      const lesson = await generateLessonMock(topic, age);
      return NextResponse.json({ lesson });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lesson generation failed.' }, { status: 500 });
  }
}


