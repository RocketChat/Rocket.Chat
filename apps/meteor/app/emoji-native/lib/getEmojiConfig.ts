import type { EmojiEntry } from './generateEmojiData';
import { getEmojiData } from './generateEmojiData';
import { legacyEmojioneMap } from './legacyEmojioneMap';
import { shortnameToUnicode } from './shortnameToUnicode';

const emojiCategories = [
	{ key: 'people', i18n: 'Smileys_and_People' },
	{ key: 'nature', i18n: 'Animals_and_Nature' },
	{ key: 'food', i18n: 'Food_and_Drink' },
	{ key: 'activity', i18n: 'Activity' },
	{ key: 'travel', i18n: 'Travel_and_Places' },
	{ key: 'objects', i18n: 'Objects' },
	{ key: 'symbols', i18n: 'Symbols' },
	{ key: 'flags', i18n: 'Flags' },
];

// Build a reverse mapping from unicode emoji to shortcode for detection
let unicodeToShortcodeMap: Map<string, string> | null = null;
let emojiRegex: RegExp | null = null;

function getUnicodeToShortcodeMap(): Map<string, string> {
	if (!unicodeToShortcodeMap) {
		const { emojiList } = getEmojiData();
		unicodeToShortcodeMap = new Map();

		for (const [shortcode, entry] of Object.entries(emojiList)) {
			const emojiEntry = entry;
			if (emojiEntry.unicode && !unicodeToShortcodeMap.has(emojiEntry.unicode)) {
				unicodeToShortcodeMap.set(emojiEntry.unicode, shortcode);
			}
		}
	}
	return unicodeToShortcodeMap;
}

function getEmojiRegex(): RegExp {
	if (!emojiRegex) {
		const unicodeMap = getUnicodeToShortcodeMap();
		// Sort emojis by length (longest first) to match multi-codepoint emojis correctly
		const unicodeEmojis = [...unicodeMap.keys()].sort((a, b) => b.length - a.length);
		const unicodePattern = unicodeEmojis.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
		// Combine shortcode and unicode emoji patterns
		emojiRegex = new RegExp(`(:([a-zA-Z0-9_+-]+):)|(${unicodePattern})`, 'g');
	}
	return emojiRegex;
}

function renderEmoji(text: string): string {
	const { emojiList } = getEmojiData();
	const unicodeMap = getUnicodeToShortcodeMap();
	const pattern = getEmojiRegex();

	return text.replace(pattern, (match, shortcodeGroup, shortcodeName, unicodeGroup) => {
		// If it's a shortcode pattern (:emoji:)
		if (shortcodeGroup) {
			const key = `:${shortcodeName}:`;
			const emoji = emojiList[key] as EmojiEntry | undefined;
			if (emoji?.unicode) {
				return `<span class="emoji" title="${shortcodeGroup}">${emoji.unicode}</span>`;
			}

			// Fallback to legacy emojione shortcodes for backward compatibility
			const legacy = legacyEmojioneMap[shortcodeName];
			if (legacy) {
				return `<span class="emoji" title="${shortcodeGroup}">${legacy}</span>`;
			}

			return match;
		}

		// If it's a unicode emoji character (unicodeGroup will be defined)
		if (unicodeGroup) {
			const shortcode = unicodeMap.get(unicodeGroup);
			if (shortcode) {
				return `<span class="emoji" title="${shortcode}">${unicodeGroup}</span>`;
			}
		}

		return match;
	});
}

function renderPicker(emojiToRender: string): string | undefined {
	const { emojiList } = getEmojiData();
	const emoji = emojiList[emojiToRender] as EmojiEntry | undefined;
	if (!emoji?.unicode) return undefined;

	return `<span class="emoji" title="${emojiToRender}">${emoji.unicode}</span>`;
}

export const getEmojiConfig = () => {
	const { emojiList, emojisByCategory, toneList } = getEmojiData();

	return {
		emojiList,
		emojisByCategory,
		emojiCategories,
		toneList,
		render: renderEmoji,
		renderPicker,
		sprites: false,
		shortnameToUnicode,
	};
};
