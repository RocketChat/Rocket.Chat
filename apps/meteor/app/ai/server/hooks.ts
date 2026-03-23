import { callbacks } from '@rocket.chat/core-services';
import { generateAIResponse } from './aiService';
import { sendMessage } from '../../../lib/server';
import { Messages } from '../../../models/server';
import { settings } from '../../../settings/server';

// 🔒 Rate limiter (per user)
const userLastRequest = new Map<string, number>();
const COOLDOWN = 5000; // 5 sec

callbacks.add(
  'afterSaveMessage',
  async (message, { room }) => {
    try {
      // ❌ Ignore bot itself (prevent infinite loop)
      if (message.u?.username === 'ai.bot') {
        return message;
      }
      if (!settings.get('AI_Enable')) {
        return message;
     }

      // ❌ Ignore system/bot messages
      if (!message.msg) {
        return message;
      }

      // ✅ Detect @ai mention
      const isMentioningAI =
        message.msg.includes('@ai') ||
        message.mentions?.some((u) => u.username === 'ai');

      if (!isMentioningAI) return message;

      // ✅ Rate limiting
      const now = Date.now();
      const last = userLastRequest.get(message.u._id) || 0;

      if (now - last < COOLDOWN) {
        return message;
      }

      userLastRequest.set(message.u._id, now);

      // ✅ Clean prompt (remove @ai)
      const prompt = message.msg.replace(/@ai/gi, '').trim();

      if (!prompt) {
        return message;
      }

      // =========================
      // 🧠 CONTEXT (last 10 msgs)
      // =========================
      const history = await Messages.find(
        { rid: message.rid },
        { sort: { ts: -1 }, limit: 10 }
      ).toArray();

      const context = history
        .reverse()
        .map((m) => `${m.u?.username || 'user'}: ${m.msg}`)
        .join('\n');

      const finalPrompt = `
Conversation:
${context}

User: ${prompt}
AI:
`;

      // =========================
      // ⏳ Send "Thinking..."
      // =========================
      const tempMessage = await sendMessage(
        {
          msg: '🤖 Thinking...',
          u: {
            _id: 'ai-bot',
            username: 'ai.bot',
          },
          rid: message.rid,
        },
        { _id: 'ai-bot' }
      );

      // =========================
      // 🤖 Call AI
      // =========================
      const aiReply = await generateAIResponse(finalPrompt);

      // =========================
      // ✏️ Update message
      // =========================
      await Messages.update(
        { _id: tempMessage._id },
        {
          $set: {
            msg: aiReply,
          },
        }
      );

      return message;
    } catch (err) {
      console.error('AI Hook Error:', err);
      return message;
    }
  },
  'ai-bot-listener'
);