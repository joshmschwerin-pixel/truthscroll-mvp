import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { bibleScholarSystemPrompt, verseStudyPrompt } from '@/lib/prompts';

function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY?.trim() || '';
  return key !== '' && !key.toLowerCase().includes('your_openai_api_key') && key.length > 20;
}

function buildMockAnswer(question: string) {
  const lowerQuestion = question.toLowerCase();
  
  // Extract verse reference if present
  const verseMatch = question.match(/([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?/);
  const verseRef = verseMatch
    ? `${verseMatch[1].trim()} ${verseMatch[2]}:${verseMatch[3]}${verseMatch[4] ? `-${verseMatch[4]}` : ''}`
    : '';

  // Identify key themes
  const themes = {
    love: lowerQuestion.includes('love'),
    faith: lowerQuestion.includes('faith'),
    grace: lowerQuestion.includes('grace'),
    truth: lowerQuestion.includes('truth'),
    hope: lowerQuestion.includes('hope'),
    salvation: lowerQuestion.includes('salvation') || lowerQuestion.includes('save'),
    forgiveness: lowerQuestion.includes('forgiv'),
    sin: lowerQuestion.includes('sin'),
    repentance: lowerQuestion.includes('repent'),
    kingdom: lowerQuestion.includes('kingdom'),
    christ: lowerQuestion.includes('christ') || lowerQuestion.includes('jesus'),
    spirit: lowerQuestion.includes('spirit') || lowerQuestion.includes('holy ghost'),
    prayer: lowerQuestion.includes('prayer') || lowerQuestion.includes('pray'),
    suffering: lowerQuestion.includes('suffer') || lowerQuestion.includes('trial') || lowerQuestion.includes('pain'),
    obedience: lowerQuestion.includes('obey') || lowerQuestion.includes('command'),
    covenant: lowerQuestion.includes('covenant') || lowerQuestion.includes('promise')
  };

  let plain = '';
  let original = '';
  let crossRefs: string[] = [];
  let views: string[] = [];
  let application = '';

  // Love-focused responses
  if (themes.love) {
    plain = verseRef 
      ? `${verseRef} teaches that love is not an emotion but a choice to prioritize the wellbeing of another as Christ did. In context, love is the fulfillment of all Scripture's commands.`
      : `Scripture presents love as sacrificial commitment rooted in God's character, not sentiment. It is the evidence of genuine faith and the response to Christ's redemptive work.`;
    
    original = verseRef
      ? `The Greek agapē in this context emphasizes covenant loyalty and self-giving love, reflecting God's faithful character. This love is an act of will aligned with God's purpose, not dependent on feeling.`
      : `The Greek agapē distinguishes committed, faithful love (agapē) from mere affection (philia) or romantic love (eros). Scripture uses agapē to describe both God's love for humanity and the love Christians are called to show.`;
    
    crossRefs = ['John 13:34-35', '1 Corinthians 13:4-7', '1 John 4:7-8', 'Deuteronomy 6:5'];
    
    views.push('Theological view: Love is grounded in the nature of God and made possible through Christ\'s redemptive work. It transcends human emotion and is a fruit of the Holy Spirit.');
    views.push('Moral application: Love is the central command and measure of Christian obedience. It unifies all other biblical commands.');
    views.push('Relational view: Love is lived out in concrete acts of service, forgiveness, and sacrifice within the Christian community and toward the world.');
    
    application = `Identify one person or group toward whom you struggle to love sacrificially. Study how Christ loved them (his enemies, the poor, the accused). Then choose one concrete act of love this week—service, forgiveness, encouragement, or sacrifice. Let this action reshape your understanding of love and deepen your relationship with Christ.`;
  }
  
  // Faith-focused responses
  else if (themes.faith) {
    plain = verseRef
      ? `${verseRef} calls believers to trust God's character and promises despite circumstances. Faith is not blind but is grounded in who God is and what He has already demonstrated.`
      : `Biblical faith is trust in God's person and promises, demonstrated through obedience and perseverance. It is the foundation of salvation and the means by which believers live.`;
    
    original = `The Greek pistis (faith/trust) goes deeper than intellectual assent—it means to surrender control and trust one's future to God. It involves both belief and active commitment.`;
    
    crossRefs = ['Hebrews 11:1', 'Romans 10:17', 'James 2:26', 'Habakkuk 2:4'];
    
    views.push('Reformation view: Faith is the instrument through which God\'s grace is received. It is not earned but is a gift that produces obedience.');
    views.push('Perseverance view: Faith is not just initial belief but sustained trust through trials, proving its reality through endurance.');
    views.push('Practical view: Faith is demonstrated in obedience, choices that honor God even when outcomes are uncertain.');
    
    application = `Name one area where your faith is being tested—fear, doubt, circumstance, or relationship. Find a Scripture that addresses this directly. Commit to one action this week that demonstrates trust in God despite uncertainty—it might be prayer, a difficult conversation, or a sacrificial choice.`;
  }
  
  // Grace-focused responses
  else if (themes.grace) {
    plain = verseRef
      ? `${verseRef} reveals that grace is God's unearned favor and active power enabling salvation and transformation. It is not merited but freely given through Christ.`
      : `Grace is God's active, undeserved kindness that initiates salvation, sustains believers, and empowers obedience. It is both a status (justified) and an experience (strengthened).`;
    
    original = `The Greek charis (grace) literally means "favor" and includes the ideas of beauty, elegance, and strength. God's grace is both the forgiveness of sin and the power to live righteously.`;
    
    crossRefs = ['Ephesians 2:8-9', 'Titus 2:11-12', 'Romans 6:1-2', '2 Corinthians 12:9'];
    
    views.push('Theological view: Grace is the fundamental character of God\'s relationship with humanity. It is the basis of redemption and cannot be earned.');
    views.push('Pastoral view: Grace is proclaimed to counteract shame and performance-based religion. It calls believers to rest in Christ\'s work, not their own effort.');
    views.push('Transformational view: Grace is not mere forgiveness but active power that changes desires, produces fruit, and enables growth.');
    
    application = `Identify one area where you feel you must earn God's approval or acceptance. Study a passage about grace in that context. Then practice receiving grace—confession without self-condemnation, rest without guilt, or service motivated by gratitude rather than obligation.`;
  }
  
  // Sin/repentance-focused responses
  else if (themes.sin || themes.repentance) {
    plain = verseRef
      ? `${verseRef} addresses sin's reality and the necessity of repentance. Sin is not merely wrong actions but rebellion against God that requires turning and restoration.`
      : `Sin separates humanity from God and requires both recognition and repentance. Repentance is not self-help but a Spirit-enabled turning that involves confession, sorrow, and reorientation toward God.`;
    
    original = `The Greek metanoia (repentance) means a complete change of mind and direction, not merely regret. It involves both internal transformation and external action.`;
    
    crossRefs = ['Romans 3:23', '1 John 1:9', '2 Corinthians 7:10', 'Acts 3:19'];
    
    views.push('Judicial view: Sin is lawbreaking that incurs God\'s judgment. Repentance acknowledges guilt and receives the legal pardon Christ offers.');
    views.push('Relational view: Sin damages relationship with God and others. Repentance restores the relationship through confession and changed behavior.');
    views.push('Transformational view: Sin hardens the heart against God. Repentance opens the heart to the Holy Spirit\'s renewing work.');
    
    application = `Confess one sin that the Holy Spirit is currently revealing. Not general sinfulness, but one specific pattern or action. Name how it affects your relationship with God and others. Then ask the Spirit for the power to turn—changed thinking, new choices, and restitution where needed.`;
  }
  
  // Hope-focused responses
  else if (themes.hope) {
    plain = verseRef
      ? `${verseRef} establishes hope as confidence in God's character and promises, especially concerning future restoration and redemption through Christ.`
      : `Biblical hope is not wishful thinking but confident assurance in God's sovereign purpose and Christ's return. It sustains believers through present suffering and shapes present behavior.`;
    
    original = `The Greek elpis (hope) carries the sense of confident expectation based on God's character and past faithfulness.`;
    
    crossRefs = ['Romans 15:4', 'Colossians 1:27', '1 Peter 1:3-4', 'Titus 2:13'];
    
    views.push('Eschatological view: Hope is grounded in the resurrection of Christ and the promise of His return and final restoration of all things.');
    views.push('Perseverance view: Hope enables believers to endure present hardship by fixing attention on God\'s promised future.');
    views.push('Missional view: Hope in God\'s future gives believers courage to live distinctly and witness to Christ in the present.');
    
    application = `Identify one circumstance where you lack hope or confidence in God's faithfulness. Study a Scripture about God's promised future (resurrection, return, restoration, kingdom). Let that truth reshape your present perspective. Choose one way this week to live as if God's promise is true—it might be through prayer, changed attitude, or service.`;
  }
  
  // Salvation-focused responses
  else if (themes.salvation) {
    plain = verseRef
      ? `${verseRef} explains salvation as deliverance from sin and judgment through Christ's death and resurrection, received by faith.`
      : `Salvation is God's comprehensive rescue of sinners from judgment through Christ's work. It includes justification (legal standing), reconciliation (restored relationship), and sanctification (ongoing transformation).`;
    
    original = `The Greek soteria (salvation) means rescue, deliverance, and wholeness. It is both instantaneous (faith) and ongoing (growth).`;
    
    crossRefs = ['John 3:16', 'Romans 10:9', 'Ephesians 2:8-9', '1 Peter 1:18-19'];
    
    views.push('Forensic view: Salvation is God declaring sinners righteous through Christ\'s substitutionary death. The legal verdict is accomplished and secure.');
    views.push('Relational view: Salvation is reconciliation with God through Christ. The broken relationship is healed through His mediation.');
    views.push('Transformational view: Salvation begins justification but continues through sanctification as the Holy Spirit reshapes the believer toward Christ\'s image.');
    
    application = `If uncertain about your own salvation: Confess Christ as Lord and trust His death for your sins. If assured: Study how your salvation provides grounds for confidence, perseverance, and witness. Choose one way this week to respond to the gospel—deepened repentance, prayer of commitment, or testimony to another.`;
  }

  // Suffering/trial-focused responses
  else if (themes.suffering) {
    plain = verseRef
      ? `${verseRef} addresses suffering in light of God's character and purpose. Suffering is real and significant but is neither meaningless nor a sign of God's abandonment.`
      : `Scripture does not deny suffering but reframes it in light of God's sovereignty, Christ's example, and the Spirit's comfort. Suffering can deepen faith and refine character.`;
    
    original = `The Greek pathema (suffering) refers to both passive experience and active endurance. Christians are called to endure with perseverance (hupomone) grounded in hope.`;
    
    crossRefs = ['Romans 5:3-4', '1 Peter 4:12-13', '2 Corinthians 1:3-4', 'Hebrews 12:1-2'];
    
    views.push('Redemptive view: Suffering, while difficult, can produce spiritual maturity, deepen dependence on God, and provide ministry to others.');
    views.push('Eschatological view: Suffering is temporary in light of Christ\'s resurrection and the promise of future restoration without pain.');
    views.push('Participatory view: Believers share Christ\'s sufferings, which paradoxically unites them with Him and proves the reality of their faith.');
    
    application = `Acknowledge your suffering to God with honesty. Study how Christ experienced suffering and was sustained by the Father. Identify one way your suffering might deepen your faith or equip you to comfort others. Commit to honest prayer about your trial, not pretending it away.`;
  }

  // Obedience-focused responses
  else if (themes.obedience) {
    plain = verseRef
      ? `${verseRef} teaches that obedience to God's commands is both possible and expected, flowing from faith and love rather than external pressure.`
      : `Obedience is the appropriate response to God's authority and love. It is enabled by grace, motivated by gratitude, and produces blessing.`;
    
    original = `The Greek hupakoe (obedience) means listening to and responding to God's voice. It implies both humility and active response.`;
    
    crossRefs = ['John 14:15', '1 Samuel 15:22', 'Romans 6:16-18', 'Hebrews 5:8-9'];
    
    views.push('Covenantal view: Obedience is the proper response to God\'s covenant. It expresses commitment and receives blessing.');
    views.push('Relational view: Obedience is how believers show love for Christ and deepen intimacy with Him.');
    views.push('Transformational view: Obedience is not mere compliance but an alignment of the will with God\'s purposes that gradually reshapes identity and desires.');
    
    application = `Identify one clear command from Scripture that you have been avoiding or delaying. Ask why—fear, shame, conflicting desire, or uncertainty. Study why God gives this command (His character, your good, others' good). Commit to one act of obedience this week, trusting that God\'s command reflects His love.`;
  }

  // Default: general theological response
  else {
    plain = `Scripture addresses this question by pointing to God's character, Christ's work, and the Spirit's power. The answer involves both doctrinal understanding and personal transformation.`;
    original = `Original-language study often reveals nuance in biblical terms that English translation smooths over. This deeper understanding can enrich your grasp of God's truth.`;
    crossRefs = ['John 1:1', 'Romans 8:28', 'Colossians 1:15-17', 'Hebrews 1:1-3'];
    views.push('The question is best answered by studying the biblical text directly, especially in context of the covenant narrative from Genesis through Revelation.');
    views.push('Theological tradition, scholarly study, and pastoral wisdom can help illuminate the text, but Scripture must be the final authority.');
    application = `Study the relevant Scripture passage(s) directly. Consider: What is God revealing about His character? What does this mean for Christ and His work? How should I respond in belief and obedience?`;
  }

  return {
    plain,
    original,
    crossRefs,
    views,
    application,
    confidence: 0.7
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
