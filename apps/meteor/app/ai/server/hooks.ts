import { callbacks } from '@rocket.chat/core-services';
import { generateAIResponse } from './aiService';
import { sendMessage } from '../../../lib/server';
import { Messages } from '../../../models/server';
import { settings } from '../../../settings/server';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';

// 🔒 Rate limiter
const userLastRequest = new Map<string, number>();
const COOLDOWN = 5000;

// 🤖 Bot user
const botUser = {
  _id: 'ai-bot',
  username: 'ai.bot',
  name: 'AI Bot',
};

callbacks.add(
  'afterSaveMessage',
  async (message, { room }) => {
    try {
      // ❌ Ignore bot itself
      if (message?.u?.username === botUser.username) {
        return message;
      }

      // ❌ Feature disabled
      if (!settings.get('AI_Enable')) {
        return message;
      }

      // ❌ Invalid message
      if (!message?.msg || !message?.u?._id) {
        return message;
      }

      // ✅ Detect @ai
      const isMentioningAI =
        message.msg.includes('@ai') ||
        message.mentions?.some((u) => u.username === 'ai');

      if (!isMentioningAI) return message;

      // ✅ Rate limiting (safe)
      const userId = message.u._id;
      const now = Date.now();
      const last = userLastRequest.get(userId) ?? 0;

      if (now - last < COOLDOWN) {
        return message;
      }

      userLastRequest.set(userId, now);

      // ✅ Clean prompt
      const prompt = message.msg.replace(/@ai/gi, '').trim();
      if (!prompt) return message;

      // =========================
      // 🧠 CONTEXT
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
      // ⏳ Thinking message
      // =========================
      const tempMessage = await sendMessage(
        botUser,
        {
          msg: '🤖 Thinking...',
          rid: message.rid,
        },
        room
      );

      let aiReply = '';

      try {
        // =========================
        // 🤖 Call AI
        // =========================
        aiReply = await generateAIResponse(finalPrompt);
      } catch (err) {
        console.error('AI generation failed:', err);
        aiReply = '⚠️ Failed to generate AI response';
      }

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

      // ✅ Notify clients (IMPORTANT)
      await notifyOnMessageChange({ id: tempMessage._id });

      return message;
    } catch (err) {
      console.error('AI Hook Error:', err);
      return message;
    }
  },
  'ai-bot-listener'
);