import { emojiParser } from '../emoji/emojiParser';

export const renderMessageEmoji = (html: string) => emojiParser(html);
