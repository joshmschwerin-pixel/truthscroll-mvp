import OpenAI from 'openai';

let client: OpenAI | null = null;

export const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
};

export default getOpenAI;
