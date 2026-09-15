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

      // ✅ Strict mention detection
      const mentionRegex = /(^|\s)@ai(\s|$)/i;

      const isMentioningAI =
        mentionRegex.test(message.msg) ||
        message.mentions?.some((u) =>
          ['ai', 'ai.bot'].includes(u.username)
        );

      if (!isMentioningAI) return message;

      // ✅ Clean prompt FIRST (fix for cooldown bug)
      const prompt = message.msg
        .replace(/(^|\s)@(?:ai|ai\.bot)(?=\s|$)/gi, ' ')
        .trim();

      if (!prompt) {
        return message;
      }

      // ✅ Rate limiting AFTER prompt validation
      const userId = message.u._id;
      const now = Date.now();
      const last = userLastRequest.get(userId) ?? 0;

      if (now - last < COOLDOWN) {
        return message;
      }

      userLastRequest.set(userId, now);

      // =========================
      // 🧠 CONTEXT (thread-aware)
      // =========================
      const query: any = message.tmid
        ? { tmid: message.tmid }
        : { rid: message.rid };

      const history = await Messages.find(query, {
        sort: { ts: -1 },
        limit: 10,
      }).toArray();

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
          tmid: message.tmid,
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

      // ✅ Notify clients
      await notifyOnMessageChange({ id: tempMessage._id });

      return message;
    } catch (err) {
      console.error('AI Hook Error:', err);
      return message;
    }
  },
  'ai-bot-listener'
);