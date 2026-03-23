import fetch from 'node-fetch';

import { settings } from '../../../settings/server';

const OPENAI_API_KEY = settings.get('AI_OpenAI_Key');


export const generateAIResponse = async (prompt: string) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant inside Rocket.Chat.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await response.json();

    return data.choices?.[0]?.message?.content || 'No response';
  } catch (error) {
    console.error('AI Error:', error);
    return 'Error generating response';
  }
};