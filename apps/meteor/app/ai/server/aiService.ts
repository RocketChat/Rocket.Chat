import { settings } from '../../../settings/server';

export const generateAIResponse = async (prompt: string) => {
  try {
    // ✅ Get API key dynamically
    const OPENAI_API_KEY = settings.get('AI_OpenAI_Key');

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not set');
    }

    // ✅ Timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant inside Rocket.Chat.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // ✅ HTTP error handling
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return data?.choices?.[0]?.message?.content || 'No response';
  } catch (error: any) {
    console.error('AI Error:', error);

    // ✅ Handle timeout separately
    if (error?.name === 'AbortError') {
      return 'AI request timed out';
    }

    return 'Error generating response';
  }
};