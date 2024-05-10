import type { IMessage } from '@rocket.chat/core-typings';

import { emojiParser } from '../../../app/emoji/client/emojiParser.js';

export const renderMessageEmoji = <T extends Partial<IMessage> & { html?: string }>(message: T): string => emojiParser(message)?.html;
