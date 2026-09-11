import type { EmojiEntry } from './generateEmojiData';
import { getEmojiData } from './generateEmojiData';
import { legacyEmojioneMap } from './legacyEmojioneMap';

export function shortnameToUnicode(text: string): string {
	const { emojiList } = getEmojiData();

	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, shortcode) => {
		const key = `:${shortcode}:`;
		const emoji = emojiList[key] as EmojiEntry | undefined;
		if (emoji?.unicode) return emoji.unicode;

		// Fallback to legacy emojione shortcodes for backward compatibility
		const legacy = legacyEmojioneMap[shortcode];
		if (legacy) return legacy;

		return match;
	});
}
