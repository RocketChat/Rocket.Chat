import type { EmojiEntry } from './generateEmojiData';
import { getEmojiData } from './generateEmojiData';
import { legacyEmojioneMap } from './legacyEmojioneMap';

/**
 * Replaces emoji shortnames (e.g. `:smile:`) in `text` with their native unicode emoji, leaving unknown shortnames as they are.
 *
 * @param text The text to replace shortnames
 * @param transform Lets the caller claim a shortname before native resolution, e.g. to keep custom emoji that shadow a native one.
 * It receives the shortname with colons; returning a string uses it as the replacement, returning `undefined` defers to native resolution.
 */
export function shortnameToUnicode(text: string, transform: (key: string) => string | undefined = () => undefined): string {
	const { emojiList } = getEmojiData();

	return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, shortcode) => {
		const key = `:${shortcode}:`;

		const transformedEmoji = transform(key);
		if (typeof transformedEmoji === 'string') return transformedEmoji;

		const emoji = emojiList[key] as EmojiEntry | undefined;
		if (emoji?.unicode) return emoji.unicode;

		// Fallback to legacy emojione shortcodes for backward compatibility
		const legacy = legacyEmojioneMap[shortcode];
		if (legacy) return legacy;

		return match;
	});
}
