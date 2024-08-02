import { emojiParser } from '../../../app/emoji/client/emojiParser';

export const renderMessageEmoji = ({ html }: { html: string }): string => emojiParser({ html }).html;
