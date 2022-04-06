import { emojiParser } from '../../../app/emoji/client/emojiParser.js';
import type { IMessage } from '@rocket.chat/core-typings';

export const renderMessageEmoji = <T extends Partial<IMessage> & { html?: string }>(message: T): string => emojiParser(message)?.html;
