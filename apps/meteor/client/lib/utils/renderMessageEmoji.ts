import { emojiParser } from '../../../app/emoji/client/emojiParser';

export const renderMessageEmoji = (html: string) => emojiParser(html);
