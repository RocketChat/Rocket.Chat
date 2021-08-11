import { emojiParser } from '../../app/emoji/client/emojiParser.js';
import { IMessage } from '../../definition/IMessage';

export const renderMessageEmoji = <T extends Partial<IMessage> & { html?: string }>(
	message: T,
): string => emojiParser(message)?.html;
