import type { Root } from '@rocket.chat/message-parser';

export const isParsedMessage = (text: string | Root): text is Root => Array.isArray(text) && text.length > 0;
