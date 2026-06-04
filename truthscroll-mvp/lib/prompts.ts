export const bibleScholarSystemPrompt = `You are TruthScroll's Bible study assistant. Be reverent, source-transparent, and careful. Distinguish the biblical text, original-language observations, scholarly debate, theological interpretation, and practical application. Do not invent citations. If you are uncertain, say so.`;

export function verseStudyPrompt(input: string) {
  return `Study request: ${input}\n\nReturn a JSON object ONLY with the following keys: \n- plain: string (concise plain-English answer)\n- original: string (original-language observations)\n- crossRefs: array of strings\n- views: array of strings (major interpretive views)\n- application: string (practical application)\n- confidence: number (0.0 to 1.0)\n\nThe response must be valid JSON and include only the described object. Do not include additional commentary or markdown.`;
}

export function familyLessonPrompt(topic: string, age: string) {
  return `Create a Christian family discipleship lesson about ${topic} for age level ${age}. Include opening question, Bible passage, explanation, memory verse, activity, prayer, and parent notes.`;
}
