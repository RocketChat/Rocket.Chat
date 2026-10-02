import { asciiList } from '@rocket.chat/message-parser';
import { escapeHTML, escapeRegExp, unescapeHTML } from '@rocket.chat/tools';

import { countryFlagSpriteCodes } from './countryFlagSprites';
import { getEmojiData } from './generateEmojiData';
import type { EmojiEntry } from './generateEmojiData';
import { legacyEmojioneMap } from './legacyEmojioneMap';
import { shortnameToUnicode } from './shortnameToUnicode';
import type { EmojiPackages } from '../emoji';

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
		const { emojiList, bareAliases } = getEmojiData();
		unicodeToShortcodeMap = new Map();

		for (const [shortcode, entry] of Object.entries(emojiList)) {
			const emojiEntry = entry;
			if (emojiEntry.unicode && !unicodeToShortcodeMap.has(emojiEntry.unicode)) {
				unicodeToShortcodeMap.set(emojiEntry.unicode, shortcode);
			}
		}

		for (const [bare, shortcode] of bareAliases) {
			if (!unicodeToShortcodeMap.has(bare)) {
				unicodeToShortcodeMap.set(bare, shortcode);
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

function getCountryFlagClass(unicode: string): string | undefined {
	const codepoints = [...unicode].flatMap((character) => {
		const codepoint = character.codePointAt(0);
		return codepoint === undefined ? [] : [codepoint];
	});
	if (codepoints.length !== 2 || codepoints.some((codepoint) => codepoint < 0x1f1e6 || codepoint > 0x1f1ff)) {
		return undefined;
	}

	const code = codepoints.map((codepoint) => codepoint.toString(16)).join('-');
	if (!countryFlagSpriteCodes.has(code)) {
		return undefined;
	}

	return `emoji--flag _${code}`;
}

function renderNativeEmoji(emoji: EmojiEntry, title: string): string {
	const flagClass = getCountryFlagClass(emoji.unicode);
	const className = flagClass ? `emoji ${flagClass}` : 'emoji';
	return `<span class="${className}" title="${title}">${emoji.unicode}</span>`;
}

// HTML-escaped variants are needed because the renderer receives escaped HTML (e.g. `>:(` arrives as `&gt;:(`)
const asciiPattern = [...new Set(Object.keys(asciiList).flatMap((ascii) => [escapeHTML(ascii), ascii]))]
	.sort((a, b) => b.length - a.length)
	.map(escapeRegExp)
	.join('|');

// `>` and `<` count as boundaries so emoticons touching tags still convert (e.g. `<p>hello :D</p>`)
const asciiRegex = new RegExp(
	`<object[^>]*>.*?</object>|<span[^>]*>.*?</span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(?<=^|\\s|>)(${asciiPattern})(?=\\s|$|[!,.?<])`,
	'g',
);

function renderAsciiEmoji(text: string): string {
	return text.replace(asciiRegex, (entire, ascii) => {
		if (ascii === undefined) {
			return entire;
		}

		const unescaped = unescapeHTML(ascii);
		const unicode = asciiList[unescaped];
		if (!unicode) {
			return entire;
		}

		return `<span class="emoji" title="${escapeHTML(unescaped)}">${unicode}</span>`;
	});
}

function renderEmoji(text: string, emojiPackages: EmojiPackages): string {
	const { emojiList } = getEmojiData();
	const unicodeMap = getUnicodeToShortcodeMap();
	const pattern = getEmojiRegex();

	const rendered = text.replace(pattern, (match, shortcodeGroup, shortcodeName, unicodeGroup) => {
		// If it's a shortcode pattern (:emoji:)
		if (shortcodeGroup) {
			if (emojiPackages.list[`:${shortcodeName}:`]?.emojiPackage === 'emojiCustom') {
				return match; // Don't render custom emojis as native
			}
			const key = `:${shortcodeName}:`;
			const emoji = emojiList[key] as EmojiEntry | undefined;
			if (emoji?.unicode) {
				return renderNativeEmoji(emoji, shortcodeGroup);
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
				const emoji = emojiList[shortcode] as EmojiEntry | undefined;
				if (emoji?.unicode) {
					return renderNativeEmoji({ ...emoji, unicode: unicodeGroup }, shortcode);
				}
			}
		}

		return match;
	});

	return emojiPackages.packages.native?.ascii ? renderAsciiEmoji(rendered) : rendered;
}

function renderPicker(emojiToRender: string): string | undefined {
	const { emojiList } = getEmojiData();
	const emoji = emojiList[emojiToRender] as EmojiEntry | undefined;
	if (!emoji?.unicode) return undefined;

	return renderNativeEmoji(emoji, emojiToRender);
}

export const getEmojiConfig = (emojiPackages: EmojiPackages) => {
	const { emojiList, emojisByCategory, toneList } = getEmojiData();

	return {
		emojiList,
		emojisByCategory,
		emojiCategories,
		toneList,
		render: (text: string) => renderEmoji(text, emojiPackages),
		renderPicker,
		sprites: false,
		shortnameToUnicode,
	};
};
